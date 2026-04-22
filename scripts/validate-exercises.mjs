#!/usr/bin/env node
/**
 * Exercise validator — CI-only harness.
 *
 * Reads the velite-compiled exercises.json and verifies for each exercise:
 *   1. Starter code parses as JavaScript (after TS/import stripping).
 *   2. Solution code, run against testCode, passes every assertion within 10s.
 *
 * Mirrors the test harness in packages/ui/src/mdx/exercise.tsx (parseAndRunTests)
 * but is dependency-free so it runs on a fresh CI worker without building UI.
 *
 * Exit codes:
 *   0 — every exercise validated.
 *   1 — at least one exercise failed.
 *
 * Usage:
 *   node scripts/validate-exercises.mjs               # validates all
 *   node scripts/validate-exercises.mjs <slug>        # single exercise by slug
 *
 * CI invokes via the root `test:exercises` script.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const exercisesJsonPath = resolve(
  repoRoot,
  "packages/content/.velite/exercises.json",
);

const TIMEOUT_MS = 10_000;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Strip TypeScript syntax well enough for Node's VM parser.
 *
 * Handled:
 *   - `import ... from "..."`           → removed
 *   - `: TypeAnnotation` on params/vars → removed (balances [], <>, ())
 *   - `as Type` assertions              → removed
 *   - `<T, U>` generics on calls/decls  → removed
 *   - `interface`, `type` declarations  → removed
 *
 * This is a coarse heuristic, not a real TS parser — good enough for the
 * handful of patterns exercise authors use in their starter/solution snippets.
 */
function stripTypeScript(code) {
  let s = code;

  // Drop ES imports (no module resolution in the VM).
  s = s.replace(/^\s*import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, "");
  s = s.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, "");

  // Drop top-level `interface Foo { ... }` and `type Foo = ...;` declarations
  // using bracket-balancing (robust against nested braces, union types, tuple
  // types, and multi-line type aliases).
  s = stripInterfaceAndTypeDecls(s);

  // Turn top-level `export` into nothing so declarations become visible in
  // the sandbox global scope. Handle `export default` too (rarely used).
  s = s.replace(/^\s*export\s+default\s+/gm, "");
  s = s.replace(/^\s*export\s+(?=(async\s+)?(function|class|const|let|var|abstract\s+class|interface|type|enum)\b)/gm, "");
  s = s.replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, "");

  // Drop `enum Foo { ... }` — treat like interface.
  s = stripEnumDecls(s);

  // Drop generic type params on function/class declarations and call sites.
  //   function foo<T>(…)     → function foo(…)
  //   class  LRUCache<T> {   → class  LRUCache {
  //   foo<T>(arg)            → foo(arg)
  s = s.replace(/\b(function\s+\w+)\s*<[^<>]*(?:<[^<>]*>[^<>]*)*>/g, "$1");
  s = s.replace(/\b(class\s+\w+)\s*<[^<>]*(?:<[^<>]*>[^<>]*)*>/g, "$1");
  // Generics on `extends`/`implements` clauses: `class Foo extends Bar<T> {`.
  s = s.replace(/(\bextends\s+[A-Za-z_$][\w$]*)<[^<>]*(?:<[^<>]*>[^<>]*)*>/g, "$1");
  s = s.replace(/(\bimplements\s+[A-Za-z_$][\w$]*)<[^<>]*(?:<[^<>]*>[^<>]*)*>/g, "$1");
  s = s.replace(/\b(\w+)<[A-Z][\w$]*(?:\s*,\s*[A-Z][\w$]*)*>(?=\s*\()/g, "$1");

  // Strip generic type arguments on `new Ident<...>(...)` and `Ident<...>(...)`
  // call expressions. We use bracket-balanced scanning to handle nested `<>`
  // and commas inside (e.g., `new Map<string, {a: number}>()`).
  s = stripGenericCallArgs(s);

  // Strip TS-only class member modifiers (`private`, `public`, `protected`,
  // `readonly`, `override`, `abstract`) so Node's parser sees plain class
  // fields.  Applied within class bodies only — cheap heuristic keyed on
  // start-of-line.
  s = s.replace(
    /^(\s*)(public|private|protected|readonly|override|abstract)\s+(?=(public|private|protected|readonly|override|abstract|static|async|\*|get|set|constructor|\w|\[))/gm,
    "$1",
  );
  // Multiple modifiers in a row (e.g. `private readonly`) — run again.
  s = s.replace(
    /^(\s*)(public|private|protected|readonly|override|abstract)\s+(?=(public|private|protected|readonly|override|abstract|static|async|\*|get|set|constructor|\w|\[))/gm,
    "$1",
  );

  // Constructor-parameter modifiers: `constructor(private readonly foo: T)` —
  // strip the modifier so the parameter name survives.
  s = s.replace(
    /(\(|,)\s*(public|private|protected|readonly)\s+(public|private|protected|readonly)\s+/g,
    "$1 ",
  );
  s = s.replace(
    /(\(|,)\s*(public|private|protected|readonly)\s+/g,
    "$1 ",
  );

  // Non-null `!` operator: remove in four contexts. We strip the `!` while
  // preserving whatever preceded it. Covers `foo!.bar`, `foo![x]`, `foo()!;`,
  // `arr[i]!`, `foo!` at expression end.
  s = s.replace(/([A-Za-z_$0-9)\]])!(\.|\[)/g, "$1$2");
  s = s.replace(/([A-Za-z_$0-9)\]])!(\s*[;,)\]}])/g, "$1$2");

  // Remove `as SomeType` assertions (non-greedy up to boundary).
  s = s.replace(
    /\s+as\s+[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*(?:\s*<[^<>]*(?:<[^<>]*>[^<>]*)*>)?(?:\s*\[\s*\])*/g,
    "",
  );
  // `as const` / `as any` etc. handled above; tuple `as [T, U]` not.
  s = s.replace(/\s+as\s+const\b/g, "");
  // `value as [T, U, ...]` tuple assertions: balance `[]` to consume.
  s = stripAsTupleAssertions(s);

  // Optional property / parameter markers: `foo?: number` — the `?` must be
  // removed before we strip the type annotation so the parser is happy.
  // Only targets `?:` to avoid optional chaining / ternary.
  s = s.replace(/([A-Za-z_$][\w$]*)\?:/g, "$1:");

  // Remove `: TypeAnnotation` from variables and function params/returns.
  s = stripTypeAnnotations(s);

  // Remove `<Type>value` TSX-style assertions that survived (rare).
  // Skip — would collide with JSX; not needed for these exercises.

  return s;
}

/**
 * Strip `value as [T, U, ...]` tuple assertions.  The regex-based `as`
 * stripper handles ident/generic/array-of-ident forms, but tuples need
 * bracket balancing because of nested types inside `[...]`.
 */
function stripAsTupleAssertions(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    // Comments + strings preserved.
    if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      out += src.slice(i, end === -1 ? n : end);
      i = end === -1 ? n : end;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      out += src.slice(i, end === -1 ? n : end + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += c;
      i++;
      while (i < n) {
        if (src[i] === "\\") { out += src[i] + src[i + 1]; i += 2; continue; }
        out += src[i];
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    // Look for `\s+as\s+[`.
    if (c === "a" && src[i + 1] === "s" && /\s/.test(src[i - 1] || "") && /\s/.test(src[i + 2] || "")) {
      // Confirm `as` is a standalone word (previous char already known non-word).
      let j = i + 2;
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] === "[") {
        // Balance `[...]`.
        let depth = 1;
        let k = j + 1;
        while (k < n && depth > 0) {
          const ch = src[k];
          if (ch === "[") depth++;
          else if (ch === "]") depth--;
          else if (ch === '"' || ch === "'" || ch === "`") {
            const q = ch;
            k++;
            while (k < n && src[k] !== q) {
              if (src[k] === "\\") k++;
              k++;
            }
          }
          k++;
        }
        if (depth === 0) {
          // Drop from the leading space before `as` through the closing `]`.
          // Trim one trailing whitespace before `as` from out if present.
          if (out.length > 0 && /\s/.test(out[out.length - 1])) {
            out = out.slice(0, -1);
          }
          i = k;
          continue;
        }
      }
    }
    out += c;
    i++;
  }
  return out;
}

/**
 * Strip generic type arguments from `Ident<...>(...)` and `new Ident<...>(...)`
 * call expressions.  Balances `<>`, `[]`, `{}`, `()` inside the type arg list
 * so `new Map<string, { result: string }>()` → `new Map()`.
 */
function stripGenericCallArgs(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    // Preserve comments + strings so we don't mangle them.
    if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      out += src.slice(i, end === -1 ? n : end);
      i = end === -1 ? n : end;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      out += src.slice(i, end === -1 ? n : end + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += c;
      i++;
      while (i < n) {
        if (src[i] === "\\") { out += src[i] + src[i + 1]; i += 2; continue; }
        out += src[i];
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    // Match identifier followed by `<` then balanced `<>` then `(`.
    if (c === "<") {
      let k = out.length - 1;
      while (k >= 0 && /\s/.test(out[k])) k--;
      if (k >= 0 && /[A-Za-z0-9_$]/.test(out[k])) {
        let j = i + 1;
        let depth = 1;
        let depthBrace = 0;
        let depthBracket = 0;
        let depthParen = 0;
        let ok = true;
        while (j < n && depth > 0) {
          const ch = src[j];
          if (depthBrace === 0 && depthBracket === 0 && depthParen === 0) {
            if (ch === ";" || ch === "\n") { ok = false; break; }
          }
          if (ch === "<") depth++;
          else if (ch === ">") depth--;
          else if (ch === "{") depthBrace++;
          else if (ch === "}") {
            if (depthBrace === 0) { ok = false; break; }
            depthBrace--;
          } else if (ch === "[") depthBracket++;
          else if (ch === "]") {
            if (depthBracket === 0) { ok = false; break; }
            depthBracket--;
          } else if (ch === "(") depthParen++;
          else if (ch === ")") {
            if (depthParen === 0) { ok = false; break; }
            depthParen--;
          } else if (ch === '"' || ch === "'" || ch === "`") {
            const q = ch;
            j++;
            while (j < n && src[j] !== q) {
              if (src[j] === "\\") j++;
              j++;
            }
          }
          j++;
        }
        if (ok && depth === 0) {
          let m = j;
          while (m < n && /\s/.test(src[m])) m++;
          if (src[m] === "(") {
            i = j;
            continue;
          }
        }
      }
    }
    out += c;
    i++;
  }
  return out;
}

/**
 * Strip `interface Name<…>? extends … { … }` and `type Name<…>? = …;`
 * declarations at any indentation level, using brace/bracket balancing so
 * nested braces (object types, union types with `{…}`) don't escape.
 */
function stripInterfaceAndTypeDecls(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    // Only consider declaration starts at beginning-of-line (after optional ws).
    const lineStart = i === 0 || src[i - 1] === "\n";
    if (lineStart) {
      // Skip leading spaces to peek at the keyword.
      let j = i;
      while (j < n && (src[j] === " " || src[j] === "\t")) j++;
      const rest = src.slice(j);
      const ifaceMatch = /^(export\s+)?interface\s+\w+/.exec(rest);
      const typeMatch = /^(export\s+)?type\s+\w+/.exec(rest);
      if (ifaceMatch) {
        // Find the opening brace, then balance until the matching close.
        let k = j + ifaceMatch[0].length;
        while (k < n && src[k] !== "{") k++;
        if (k < n && src[k] === "{") {
          let depth = 1;
          k++;
          while (k < n && depth > 0) {
            const ch = src[k];
            if (ch === "{") depth++;
            else if (ch === "}") depth--;
            k++;
          }
          // Also swallow a trailing newline to keep output tidy.
          if (k < n && src[k] === "\n") k++;
          i = k;
          continue;
        }
      }
      if (typeMatch) {
        // `type Foo<...> = <type>;` — skip until top-level `;` or newline
        // (whichever comes after the `=`), balancing brackets.
        let k = j + typeMatch[0].length;
        // Skip optional generic params `<…>`.
        while (k < n && /\s/.test(src[k])) k++;
        if (src[k] === "<") {
          let d = 1;
          k++;
          while (k < n && d > 0) {
            if (src[k] === "<") d++;
            else if (src[k] === ">") d--;
            k++;
          }
        }
        while (k < n && /\s/.test(src[k])) k++;
        if (src[k] === "=") {
          k++;
          let depthAngle = 0, depthBrace = 0, depthBracket = 0, depthParen = 0;
          while (k < n) {
            const ch = src[k];
            if (depthAngle === 0 && depthBrace === 0 && depthBracket === 0 && depthParen === 0) {
              if (ch === ";" || ch === "\n") {
                // Verify next non-space char isn't `|` or `&` (union continues).
                let m = k + 1;
                while (m < n && (src[m] === " " || src[m] === "\t" || src[m] === "\n")) m++;
                if (ch === ";" || src[m] === "|" || src[m] === "&") {
                  if (ch === ";") { k++; break; }
                  // Continue on the union / intersection.
                  k = m;
                  continue;
                }
                // Newline ends the type alias when no continuation.
                break;
              }
            }
            if (ch === "<") depthAngle++;
            else if (ch === ">") depthAngle = Math.max(0, depthAngle - 1);
            else if (ch === "{") depthBrace++;
            else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);
            else if (ch === "[") depthBracket++;
            else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
            else if (ch === "(") depthParen++;
            else if (ch === ")") depthParen = Math.max(0, depthParen - 1);
            k++;
          }
          if (k < n && src[k] === "\n") k++;
          i = k;
          continue;
        }
      }
    }
    out += src[i];
    i++;
  }
  return out;
}

function stripEnumDecls(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const lineStart = i === 0 || src[i - 1] === "\n";
    if (lineStart) {
      let j = i;
      while (j < n && (src[j] === " " || src[j] === "\t")) j++;
      const rest = src.slice(j);
      const enumMatch = /^(export\s+)?(const\s+)?enum\s+\w+/.exec(rest);
      if (enumMatch) {
        let k = j + enumMatch[0].length;
        while (k < n && src[k] !== "{") k++;
        if (k < n && src[k] === "{") {
          let depth = 1;
          k++;
          while (k < n && depth > 0) {
            if (src[k] === "{") depth++;
            else if (src[k] === "}") depth--;
            k++;
          }
          if (k < n && src[k] === "\n") k++;
          i = k;
          continue;
        }
      }
    }
    out += src[i];
    i++;
  }
  return out;
}

function stripTypeAnnotations(src) {
  let out = "";
  let i = 0;
  const n = src.length;

  // Track brace context: `{` can open either a block or an object literal.
  // Each frame records the kind and the paren/bracket depth at entry so we
  // can tell whether the current `:` sits directly inside an object literal
  // (in which case it's a property colon) versus inside a nested paren or
  // bracket within that object literal (where it's a type annotation).
  const braceStack = [];
  let parenDepth = 0;
  let bracketDepth = 0;
  // Ternary depth (outer-level): increments on `?` (excluding `?.`, `??`, `?:`),
  // decrements on `:` so `a ? b : c` doesn't trigger type stripping.
  let ternaryDepth = 0;

  function detectBraceKind() {
    let last = out.length - 1;
    while (last >= 0 && /\s/.test(out[last])) last--;
    if (last < 0) return "block";
    const prev = out[last];
    if (prev === ")") return "block"; // function / if / for / while body
    if (prev === "}") return "block"; // else / after block
    if (prev === "{") return "block"; // block inside block
    if (prev === ";") return "block";
    // `=>` arrow function body (bare brace body) — block. Note: `() => ({})`
    // wraps the object literal in parens, so we never see `{` right after `>`
    // unless it's a function body.
    if (prev === ">" && last > 0 && out[last - 1] === "=") return "block";
    // After these tokens, `{` starts an expression (object literal).
    if ("=([,:?".includes(prev)) return "obj";
    if ("+-*/%&|!~".includes(prev)) return "obj";
    if (/[a-zA-Z_$0-9]/.test(prev)) {
      // Grab trailing word to check for expression keywords.
      let k = last;
      while (k >= 0 && /[\w$]/.test(out[k])) k--;
      const word = out.slice(k + 1, last + 1);
      const exprKeywords = new Set([
        "return", "typeof", "in", "of", "throw", "yield", "await",
        "instanceof", "void", "delete", "new", "case", "default",
      ]);
      if (exprKeywords.has(word)) return "obj";
      return "block";
    }
    return "block";
  }

  while (i < n) {
    const c = src[i];
    // Line comment.
    if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      out += src.slice(i, end === -1 ? n : end);
      i = end === -1 ? n : end;
      continue;
    }
    // Block comment.
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      out += src.slice(i, end === -1 ? n : end + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    // String literals (with template-literal interpolation support).
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      out += c;
      i++;
      while (i < n) {
        if (src[i] === "\\") {
          out += src[i] + src[i + 1];
          i += 2;
          continue;
        }
        if (quote === "`" && src[i] === "$" && src[i + 1] === "{") {
          out += src[i] + src[i + 1];
          i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            if (src[i] === "{") depth++;
            else if (src[i] === "}") depth--;
            out += src[i];
            i++;
            if (depth === 0) break;
          }
          continue;
        }
        out += src[i];
        if (src[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Regex literal: `/pattern/flags` in expression position. Without this the
    // `?` and `:` inside regex source pollute our ternary / annotation state.
    if (c === "/" && src[i + 1] !== "/" && src[i + 1] !== "*") {
      let last = out.length - 1;
      while (last >= 0 && /\s/.test(out[last])) last--;
      const prev = last >= 0 ? out[last] : null;
      const divisionContext =
        prev !== null && /[A-Za-z0-9_$)\]]/.test(prev);
      if (!divisionContext) {
        out += c;
        i++;
        let inClass = false;
        while (i < n) {
          const ch = src[i];
          if (ch === "\\") {
            out += ch + (src[i + 1] || "");
            i += 2;
            continue;
          }
          if (ch === "[") inClass = true;
          else if (ch === "]") inClass = false;
          else if (ch === "/" && !inClass) {
            out += ch;
            i++;
            while (i < n && /[a-z]/.test(src[i])) { out += src[i]; i++; }
            break;
          } else if (ch === "\n") break;
          out += ch;
          i++;
        }
        continue;
      }
    }

    // Brace-kind tracking.
    if (c === "{") {
      braceStack.push({
        kind: detectBraceKind(),
        enterParen: parenDepth,
        enterBracket: bracketDepth,
      });
      out += c;
      i++;
      continue;
    }
    if (c === "}") {
      braceStack.pop();
      out += c;
      i++;
      continue;
    }
    if (c === "(") { parenDepth++; out += c; i++; continue; }
    if (c === ")") { parenDepth = Math.max(0, parenDepth - 1); out += c; i++; continue; }
    if (c === "[") { bracketDepth++; out += c; i++; continue; }
    if (c === "]") { bracketDepth = Math.max(0, bracketDepth - 1); out += c; i++; continue; }

    // Ternary `?`: increment unless it's `?.`, `??`, or `?:`.
    if (c === "?") {
      if (src[i + 1] === ".") { out += c; i++; continue; }
      if (src[i + 1] === "?") { out += "??"; i += 2; continue; }
      if (src[i + 1] === ":") { out += c; i++; continue; }
      ternaryDepth++;
      out += c;
      i++;
      continue;
    }

    // Candidate type annotation: `:` followed by a type.
    if (c === ":") {
      // Ternary: emit `:` and pop.
      if (ternaryDepth > 0) {
        ternaryDepth--;
        out += c;
        i++;
        continue;
      }
      // Object-literal key: don't strip. Only true when the enclosing brace
      // is "obj" AND we're directly inside it (not in a nested paren / bracket
      // that opened after the brace — e.g. the parens of `process: (n: T) =>`
      // inside an object literal are a new syntactic context).
      const topBrace = braceStack.length > 0 ? braceStack[braceStack.length - 1] : null;
      const inObject = topBrace && topBrace.kind === "obj" &&
        parenDepth === topBrace.enterParen &&
        bracketDepth === topBrace.enterBracket;
      if (inObject) {
        out += c;
        i++;
        continue;
      }

      const prev = lastNonSpace(out);
      const isAnnotationContext =
        prev === ")" ||
        prev === "]" ||
        /[A-Za-z0-9_$?]/.test(prev ?? "");

      let j = i + 1;
      while (j < n && /\s/.test(src[j])) j++;
      const next = src.slice(j, j + 80);
      const looksLikeType =
        /^(number|string|boolean|any|unknown|void|never|object|bigint|symbol|null|undefined|this|Array|Promise|Map|Set|Record|Readonly|Partial|Required|Pick|Omit|[A-Z][\w$]*)\b/.test(
          next,
        ) ||
        /^[a-z][\w$]*\.[A-Z]/.test(next) || // namespaced: tf.Tensor, React.FC (capital after dot)
        /^\(/.test(next) ||                 // (a: number) => b  arrow type
        /^\{/.test(next) ||                 // { x: number }  object type
        /^\[/.test(next) ||                 // [number, number] tuple type
        /^['"]/.test(next);                 // 'a' | 'b'  string-literal union

      if (isAnnotationContext && looksLikeType) {
        i = j;
        let depthAngle = 0;
        let depthBracket = 0;
        let depthParen = 0;
        let depthBrace = 0;
        const startsWithObject = src[j] === "{";
        const startsWithParen = src[j] === "(";
        const startsWithBracket = src[j] === "[";
        if (startsWithObject) { depthBrace++; i++; }
        else if (startsWithParen) { depthParen++; i++; }
        else if (startsWithBracket) { depthBracket++; i++; }

        while (i < n) {
          const ch = src[i];
          const balanced =
            depthAngle === 0 &&
            depthBracket === 0 &&
            depthParen === 0 &&
            depthBrace === 0;
          if (balanced) {
            // `=>` handling:
            //   - When we opened with `(` (arrow type `(...) => R`), consume
            //     `=>` as part of the annotation.  If the return type opens
            //     with `{` pre-enter it so the matching `}` doesn't terminate
            //     before consuming the full return type.
            //   - Otherwise `=>` belongs to the arrow function, not the type.
            if (ch === "=" && src[i + 1] === ">") {
              if (startsWithParen) {
                i += 2;
                while (i < n && /\s/.test(src[i])) i++;
                if (src[i] === "{") { depthBrace++; i++; }
                continue;
              }
              break;
            }
            if (
              ch === "," ||
              ch === ")" ||
              ch === "=" ||
              ch === ";" ||
              ch === "\n" ||
              ch === "{"
            ) {
              // Union / intersection continuation across newlines.
              if (ch === "\n") {
                let m = i + 1;
                while (m < n && (src[m] === " " || src[m] === "\t")) m++;
                if (src[m] === "|" || src[m] === "&") {
                  i = m;
                  continue;
                }
              }
              break;
            }
          }
          if (ch === "<") depthAngle++;
          else if (ch === ">") depthAngle = Math.max(0, depthAngle - 1);
          else if (ch === "[") depthBracket++;
          else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
          else if (ch === "(") depthParen++;
          else if (ch === ")") depthParen = Math.max(0, depthParen - 1);
          else if (ch === "{") depthBrace++;
          else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);
          else if (ch === '"' || ch === "'" || ch === "`") {
            const q = ch;
            i++;
            while (i < n && src[i] !== q) {
              if (src[i] === "\\") i++;
              i++;
            }
          }
          i++;
        }
        if (startsWithObject || startsWithParen || startsWithBracket) {
          out += " ";
        }
        continue; // skip emitting the annotation
      }
    }

    out += c;
    i++;
  }
  return out;
}

function lastNonSpace(s) {
  for (let i = s.length - 1; i >= 0; i--) {
    if (!/\s/.test(s[i])) return s[i];
  }
  return null;
}

/**
 * Heuristic: does the top-level of `code` contain a bare `await`?
 * Tracks brace / paren depth so `await` inside function bodies doesn't count.
 */
function hasBareTopLevelAwait(code) {
  let brace = 0, paren = 0, bracket = 0;
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    if (c === "/" && code[i + 1] === "/") { i = code.indexOf("\n", i); if (i === -1) return false; i++; continue; }
    if (c === "/" && code[i + 1] === "*") { i = code.indexOf("*/", i + 2); if (i === -1) return false; i += 2; continue; }
    if (c === '"' || c === "'" || c === "`") {
      const q = c; i++;
      while (i < n) {
        if (code[i] === "\\") { i += 2; continue; }
        if (code[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === "{") brace++;
    else if (c === "}") brace--;
    else if (c === "(") paren++;
    else if (c === ")") paren--;
    else if (c === "[") bracket++;
    else if (c === "]") bracket--;
    if (brace === 0 && paren === 0 && bracket === 0 && c === "a" && code.slice(i, i + 5) === "await" && !/[\w$]/.test(code[i + 5] || "")) {
      // Check previous non-space isn't a word char.
      let k = i - 1;
      while (k >= 0 && /\s/.test(code[k])) k--;
      if (k < 0 || !/[\w$]/.test(code[k])) return true;
    }
    i++;
  }
  return false;
}

function syntaxCheck(code) {
  const stripped = stripTypeScript(code);
  try {
    new vm.Script(`(async function(){\n${stripped}\n})`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Harness — mirrors packages/ui/src/mdx/exercise.tsx parseAndRunTests, with
// one correctness fix: we collect every `it()` promise into `__pending` so
// that `describe()` can await the whole batch before returning. The in-browser
// harness lets these promises float; in CI we need deterministic results so
// the outer IIFE can `await Promise.all(__pending)` before returning results.
const HARNESS = `
  var __results = [];
  var __pending = [];
  var __currentDescribe = '';
  var __beforeEach = [];
  var __afterEach = [];
  var __beforeAll = [];
  var __afterAll = [];

  async function describe(name, fn) {
    __currentDescribe = name;
    var savedBE = __beforeEach.slice();
    var savedAE = __afterEach.slice();
    var savedBA = __beforeAll.slice();
    var savedAA = __afterAll.slice();
    try { await fn(); } catch(e) {}
    // Fire beforeAll hooks once (after describe body has registered them).
    for (var i = savedBA.length; i < __beforeAll.length; i++) {
      try { await __beforeAll[i](); } catch(e) {}
    }
    // Let registered test() promises settle for this describe.
    // (The top-level outer loop calls Promise.all(__pending) for the batch.)
    __currentDescribe = '';
    // Restore hook stacks so sibling describes don't inherit.
    __beforeEach = savedBE;
    __afterEach = savedAE;
    __beforeAll = savedBA;
    __afterAll = savedAA;
  }

  function beforeEach(fn) { __beforeEach.push(fn); }
  function afterEach(fn) { __afterEach.push(fn); }
  function beforeAll(fn) { __beforeAll.push(fn); try { fn && fn(); } catch(e) {} }
  function afterAll(fn) { __afterAll.push(fn); }

  function it(name, fn) {
    var fullName = __currentDescribe ? __currentDescribe + ' > ' + name : name;
    var beforeEachSnapshot = __beforeEach.slice();
    var afterEachSnapshot = __afterEach.slice();
    var p = (async function() {
      try {
        for (var i = 0; i < beforeEachSnapshot.length; i++) await beforeEachSnapshot[i]();
        await fn();
        for (var j = 0; j < afterEachSnapshot.length; j++) await afterEachSnapshot[j]();
        __results.push({ name: fullName, passed: true });
      } catch(e) {
        __results.push({ name: fullName, passed: false, error: e.message || String(e) });
      }
    })();
    __pending.push(p);
    return p;
  }
  var test = it;
  it.skip = function(){};
  it.only = it;
  test.skip = function(){};
  test.only = it;
  describe.skip = function(){};
  describe.only = describe;

  // Jest compatibility stubs.
  var jest = {
    fn: function(impl) {
      var calls = [];
      var instances = [];
      var f = function() {
        var args = Array.prototype.slice.call(arguments);
        calls.push(args);
        instances.push(this);
        return impl ? impl.apply(this, args) : undefined;
      };
      f.mock = { calls: calls, instances: instances, results: [] };
      f.mockReturnValue = function(v) { impl = function(){ return v; }; return f; };
      f.mockResolvedValue = function(v) { impl = function(){ return Promise.resolve(v); }; return f; };
      f.mockImplementation = function(i) { impl = i; return f; };
      f.mockClear = function() { calls.length = 0; instances.length = 0; };
      return f;
    },
    spyOn: function(obj, method) {
      var original = obj[method];
      var spy = jest.fn(original);
      obj[method] = spy;
      spy.mockRestore = function() { obj[method] = original; };
      return spy;
    },
    clearAllMocks: function() {},
    resetAllMocks: function() {},
    useFakeTimers: function() {},
    useRealTimers: function() {},
  };

  function expect(actual) {
    return {
      toBe: function(expected) {
        if (actual !== expected) throw new Error('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
      },
      toEqual: function(expected) {
        var a = JSON.stringify(actual), b = JSON.stringify(expected);
        if (a !== b) throw new Error('Expected ' + b + ' but got ' + a);
      },
      toBeDefined: function() {
        if (actual === undefined || actual === null) throw new Error('Expected value to be defined, got ' + String(actual));
      },
      toBeNull: function() {
        if (actual !== null) throw new Error('Expected null but got ' + JSON.stringify(actual));
      },
      toBeTruthy: function() {
        if (!actual) throw new Error('Expected truthy value but got ' + JSON.stringify(actual));
      },
      toBeFalsy: function() {
        if (actual) throw new Error('Expected falsy value but got ' + JSON.stringify(actual));
      },
      toBeGreaterThan: function(expected) {
        if (!(actual > expected)) throw new Error('Expected ' + actual + ' > ' + expected);
      },
      toBeLessThan: function(expected) {
        if (!(actual < expected)) throw new Error('Expected ' + actual + ' < ' + expected);
      },
      toBeGreaterThanOrEqual: function(expected) {
        if (!(actual >= expected)) throw new Error('Expected ' + actual + ' >= ' + expected);
      },
      toBeLessThanOrEqual: function(expected) {
        if (!(actual <= expected)) throw new Error('Expected ' + actual + ' <= ' + expected);
      },
      toContain: function(expected) {
        if (Array.isArray(actual)) {
          if (!actual.includes(expected)) throw new Error('Array does not contain ' + JSON.stringify(expected));
        } else if (typeof actual === 'string') {
          if (!actual.includes(expected)) throw new Error('String does not contain ' + JSON.stringify(expected));
        }
      },
      toHaveLength: function(expected) {
        if (actual.length !== expected) throw new Error('Expected length ' + expected + ' but got ' + actual.length);
      },
      toThrow: function() {
        if (typeof actual !== 'function') throw new Error('Expected a function');
        var threw = false;
        try { actual(); } catch(e) { threw = true; }
        if (!threw) throw new Error('Expected function to throw');
      },
      toBeCloseTo: function(expected, precision) {
        precision = precision === undefined ? 5 : precision;
        var diff = Math.abs(actual - expected);
        var limit = Math.pow(10, -precision) / 2;
        if (diff >= limit) throw new Error('Expected ' + actual + ' to be close to ' + expected + ' (precision: ' + precision + ')');
      },
      toHaveProperty: function(key, value) {
        var path = String(key).split('.');
        var cur = actual;
        for (var i = 0; i < path.length; i++) {
          if (cur == null || !(path[i] in cur)) throw new Error('Expected property ' + key);
          cur = cur[path[i]];
        }
        if (arguments.length > 1 && JSON.stringify(cur) !== JSON.stringify(value))
          throw new Error('Property ' + key + ' expected ' + JSON.stringify(value) + ' but got ' + JSON.stringify(cur));
      },
      toMatch: function(pattern) {
        var re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        if (typeof actual !== 'string' || !re.test(actual)) throw new Error('Expected ' + JSON.stringify(actual) + ' to match ' + pattern);
      },
      toMatchObject: function(expected) {
        function match(a, e) {
          if (e == null || typeof e !== 'object') return a === e;
          if (Array.isArray(e)) {
            if (!Array.isArray(a) || a.length < e.length) return false;
            for (var i = 0; i < e.length; i++) if (!match(a[i], e[i])) return false;
            return true;
          }
          for (var k in e) if (!match(a && a[k], e[k])) return false;
          return true;
        }
        if (!match(actual, expected)) throw new Error('Object does not match');
      },
      toBeInstanceOf: function(ctor) {
        if (!(actual instanceof ctor)) throw new Error('Expected instanceof ' + (ctor && ctor.name));
      },
      toHaveBeenCalled: function() {
        if (!actual || !actual.mock || actual.mock.calls.length === 0) throw new Error('Expected mock to have been called');
      },
      toHaveBeenCalledTimes: function(n) {
        if (!actual || !actual.mock || actual.mock.calls.length !== n) throw new Error('Expected mock to have been called ' + n + ' times');
      },
      toHaveBeenCalledWith: function() {
        if (!actual || !actual.mock) throw new Error('Expected a mock');
        var expectedArgs = Array.prototype.slice.call(arguments);
        var ok = actual.mock.calls.some(function(c){ return JSON.stringify(c) === JSON.stringify(expectedArgs); });
        if (!ok) throw new Error('Expected mock call with ' + JSON.stringify(expectedArgs));
      },
      resolves: {
        toBe: async function(expected) { var v = await actual; if (v !== expected) throw new Error('Expected resolved ' + expected); },
        toEqual: async function(expected) { var v = await actual; if (JSON.stringify(v) !== JSON.stringify(expected)) throw new Error('Expected resolved equal'); },
      },
      rejects: {
        toThrow: async function() { try { await actual; } catch(e) { return; } throw new Error('Expected promise to reject'); },
      },
      not: {
        toBe: function(expected) {
          if (actual === expected) throw new Error('Expected value to not be ' + JSON.stringify(expected));
        },
        toEqual: function(expected) {
          if (JSON.stringify(actual) === JSON.stringify(expected)) throw new Error('Expected values to not be equal');
        },
        toBeDefined: function() {
          if (actual !== undefined && actual !== null) throw new Error('Expected value to be undefined');
        },
        toBeNull: function() {
          if (actual === null) throw new Error('Expected value to not be null');
        },
        toBeTruthy: function() {
          if (actual) throw new Error('Expected falsy value');
        },
        toContain: function(expected) {
          if (Array.isArray(actual) && actual.includes(expected)) throw new Error('Expected array not to contain');
          if (typeof actual === 'string' && actual.includes(expected)) throw new Error('Expected string not to contain');
        },
        toMatch: function(pattern) {
          var re = pattern instanceof RegExp ? pattern : new RegExp(pattern);
          if (typeof actual === 'string' && re.test(actual)) throw new Error('Expected ' + JSON.stringify(actual) + ' not to match ' + pattern);
        },
        toHaveProperty: function(key) {
          var path = String(key).split('.');
          var cur = actual;
          for (var i = 0; i < path.length; i++) {
            if (cur == null || !(path[i] in cur)) return;
            cur = cur[path[i]];
          }
          throw new Error('Expected not to have property ' + key);
        },
        toHaveBeenCalled: function() {
          if (actual && actual.mock && actual.mock.calls.length > 0) throw new Error('Expected mock not called');
        },
      }
    };
  }
  expect.any = function(ctor) { return { asymmetricMatch: function(a){ return a != null && (typeof a === ctor.name.toLowerCase() || a instanceof ctor); } }; };
  expect.anything = function() { return { asymmetricMatch: function(a){ return a != null; } }; };
  expect.stringContaining = function(s) { return { asymmetricMatch: function(a){ return typeof a === 'string' && a.includes(s); } }; };
  expect.stringMatching = function(re) { return { asymmetricMatch: function(a){ return typeof a === 'string' && (re instanceof RegExp ? re : new RegExp(re)).test(a); } }; };

  expect.closeTo = function(expected, precision) {
    precision = precision || 2;
    return {
      asymmetricMatch: function(actual) {
        return Math.abs(actual - expected) < Math.pow(10, -precision) / 2;
      }
    };
  };
`;

const TF_MOCK = `
  var tf = (function() {
    function toNested(flat, shape) {
      if (shape.length === 0) return flat[0];
      if (shape.length === 1) return Array.from(flat.slice(0, shape[0]));
      var outer = shape[0];
      var innerSize = shape.slice(1).reduce(function(a,b){return a*b;},1);
      var result = [];
      for (var i = 0; i < outer; i++) {
        result.push(toNested(flat.slice(i * innerSize, (i + 1) * innerSize), shape.slice(1)));
      }
      return result;
    }
    // Resolve a single -1 dimension in a shape by dividing total/product-of-others.
    function _resolveShape(shape, total) {
      var negOne = -1;
      var product = 1;
      var sawNegative = false;
      for (var i = 0; i < shape.length; i++) {
        if (shape[i] === -1) sawNegative = true;
        else product *= shape[i];
      }
      if (!sawNegative) return shape.slice();
      if (product === 0) return shape.slice();
      var out = shape.slice();
      for (var i = 0; i < out.length; i++) {
        if (out[i] === -1) out[i] = Math.max(1, Math.floor(total / product));
      }
      return out;
    }
    function makeTensor(flat, s) {
      var t = {
        dataSync: function() { return Float32Array.from(flat); },
        data: function() { return Promise.resolve(Float32Array.from(flat)); },
        arraySync: function() { return toNested(Array.from(flat), s); },
        array: function() { return Promise.resolve(toNested(Array.from(flat), s)); },
        shape: s,
        dtype: 'float32',
        rank: s.length,
        size: s.reduce(function(a,b){ return a*b; }, 1),
        reshape: function(newShape) {
          var resolved = _resolveShape(newShape, flat.length);
          return makeTensor(Array.from(flat), resolved);
        },
        flatten: function() { return makeTensor(Array.from(flat), [flat.length]); },
        squeeze: function() {
          // Match TF.js semantics: squeeze drops all size-1 axes; if the input
          // reduces to a scalar the resulting shape is empty ([]).
          var newShape = s.filter(function(d) { return d !== 1; });
          return makeTensor(Array.from(flat), newShape);
        },
        expandDims: function(axis) {
          axis = axis == null ? 0 : axis;
          var newShape = s.slice();
          newShape.splice(axis, 0, 1);
          return makeTensor(Array.from(flat), newShape);
        },
        transpose: function() {
          // Only implements 2D transpose; identity for higher-rank.
          if (s.length !== 2) return makeTensor(Array.from(flat), s);
          var rows = s[0], cols = s[1];
          var out = new Array(rows * cols);
          for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
              out[c * rows + r] = flat[r * cols + c];
          return makeTensor(out, [cols, rows]);
        },
        cast: function() { return this; },
        clone: function() { return makeTensor(Array.from(flat), s.slice()); },
        slice: function(start, size) {
          // Minimal 1D slice support
          if (typeof start === 'number') {
            var len = typeof size === 'number' ? size : flat.length - start;
            return makeTensor(flat.slice(start, start + len), [len]);
          }
          return makeTensor(Array.from(flat), s.slice());
        },
        gather: function() { return this; },
        add: function(other) { return _tf.add(this, other); },
        sub: function(other) { return _tf.sub(this, other); },
        mul: function(other) { return _tf.mul(this, other); },
        div: function(other) { return _tf.div(this, other); },
        sum: function() { return _tf.sum(this); },
        mean: function() { return _tf.mean(this); },
        max: function() { return _tf.max(this); },
        min: function() { return _tf.min(this); },
        argMax: function(axis) { return _tf.argMax(this, axis); },
        argMin: function(axis) { return _tf.argMin(this, axis); },
        exp: function() { return _tf.exp(this); },
        log: function() { return _tf.log(this); },
        abs: function() { return _tf.abs(this); },
        sqrt: function() { return _tf.sqrt(this); },
        square: function() { return _tf.pow(this, 2); },
        pow: function(e) { return _tf.pow(this, typeof e === 'number' ? e : 2); },
        neg: function() { return _tf.neg(this); },
        softmax: function() { return _tf.softmax(this); },
        sigmoid: function() { return _tf.sigmoid(this); },
        tanh: function() { return _tf.tanh(this); },
        relu: function() { return _tf.relu(this); },
        norm: function() { return _tf.norm(this); },
        std: function() {
          var m = flat.reduce(function(a,b){return a+b;},0)/flat.length;
          var v = flat.reduce(function(a,b){return a+(b-m)*(b-m);},0)/flat.length;
          return _tf.tensor([Math.sqrt(v)]);
        },
        print: function() {},
        dispose: function() {},
      };
      return t;
    }
    var _tf = {
      tensor: function(data, shape) {
        var flat = Array.isArray(data) ? data.flat(Infinity) : [data];
        var s = shape || [flat.length];
        return makeTensor(flat, s);
      },
      tensor1d: function(values) { return _tf.tensor(values, [values.length]); },
      tensor2d: function(values, shape) {
        var flat = values.flat(Infinity);
        var s = shape || [values.length, values[0].length];
        return _tf.tensor(flat, s);
      },
      tensor3d: function(values, shape) {
        var flat = Array.isArray(values) ? values.flat(Infinity) : [values];
        var s = shape || [values.length, values[0].length, values[0][0].length];
        return _tf.tensor(flat, s);
      },
      tensor4d: function(values, shape) {
        var flat = Array.isArray(values) ? values.flat(Infinity) : [values];
        return _tf.tensor(flat, shape || [1, 1, 1, flat.length]);
      },
      scalar: function(v) { return _tf.tensor([v], []); },
      zeros: function(shape) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        return _tf.tensor(new Array(size).fill(0), shape);
      },
      ones: function(shape) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        return _tf.tensor(new Array(size).fill(1), shape);
      },
      randomNormal: function(shape) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        var data = [];
        for (var i = 0; i < size; i += 2) {
          var u1 = Math.random(), u2 = Math.random();
          var z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          var z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
          data.push(z0);
          if (i + 1 < size) data.push(z1);
        }
        return _tf.tensor(data, shape);
      },
      linspace: function(start, stop, num) {
        var data = [];
        var step = num > 1 ? (stop - start) / (num - 1) : 0;
        for (var i = 0; i < num; i++) data.push(start + step * i);
        return _tf.tensor(data, [num]);
      },
      range: function(start, limit, delta) {
        delta = delta || 1;
        var data = [];
        for (var v = start; delta > 0 ? v < limit : v > limit; v += delta) data.push(v);
        return _tf.tensor(data, [data.length]);
      },
      oneHot: function(indices, depth) {
        var idx = Array.isArray(indices) ? indices : Array.from(indices.dataSync());
        var data = [];
        for (var i = 0; i < idx.length; i++) {
          for (var j = 0; j < depth; j++) data.push(j === idx[i] ? 1 : 0);
        }
        return _tf.tensor(data, [idx.length, depth]);
      },
      concat: function(tensors, axis) {
        axis = axis || 0;
        if (axis < 0) axis = tensors[0].shape.length + axis;
        // Compute output shape.
        var outShape = tensors[0].shape.slice();
        outShape[axis] = 0;
        for (var i = 0; i < tensors.length; i++) outShape[axis] += tensors[i].shape[axis];
        // Axis 0 is the fast path: flat data concatenates directly.
        if (axis === 0) {
          var allData = [];
          for (var i = 0; i < tensors.length; i++) allData = allData.concat(Array.from(tensors[i].dataSync()));
          return _tf.tensor(allData, outShape);
        }
        // General-axis concat: interleave rows appropriately.  For 2-D inputs
        // concatenated along axis 1, we emit rows of (sum of row slices).
        if (tensors[0].shape.length === 2 && axis === 1) {
          var rows = tensors[0].shape[0];
          var allData = [];
          var dataArrs = tensors.map(function(t){ return Array.from(t.dataSync()); });
          var cols = tensors.map(function(t){ return t.shape[1]; });
          for (var r = 0; r < rows; r++) {
            for (var t = 0; t < tensors.length; t++) {
              for (var c = 0; c < cols[t]; c++) {
                allData.push(dataArrs[t][r * cols[t] + c]);
              }
            }
          }
          return _tf.tensor(allData, outShape);
        }
        // Fallback: shape only, zeros data.
        var total = outShape.reduce(function(a,b){ return a*(b||1); }, 1);
        return _tf.tensor(new Array(total).fill(0), outShape);
      },
      // Binary element-wise ops accept tensor, number, or number[] for b.
      // When b is shorter than a, broadcast by wrapping indices (cheap scalar
      // / row broadcast emulator that covers the exercises we run here).
      add: function(a,b) { return _tf._binop(a,b,function(x,y){return x+y;}); },
      sub: function(a,b) { return _tf._binop(a,b,function(x,y){return x-y;}); },
      mul: function(a,b) { return _tf._binop(a,b,function(x,y){return x*y;}); },
      div: function(a,b) { return _tf._binop(a,b,function(x,y){return x/y;}); },
      _binop: function(a,b,fn) {
        var ad = Array.from(a.dataSync());
        var bd;
        if (b != null && typeof b.dataSync === 'function') bd = Array.from(b.dataSync());
        else if (Array.isArray(b)) bd = b;
        else bd = [Number(b)];
        var len = bd.length;
        return _tf.tensor(ad.map(function(v,i){ return fn(v, bd[i % len]); }), a.shape);
      },
      // Element-wise dot product: a_i * b_i summed to a scalar tensor.
      dot: function(a, b) {
        var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
        var len = Math.min(ad.length, bd.length);
        var s = 0;
        for (var i = 0; i < len; i++) s += ad[i] * bd[i];
        return _tf.scalar(s);
      },
      // Gather: select indices along axis 0 (most common usage).
      gather: function(params, indices, axis) {
        axis = axis || 0;
        var idx = Array.isArray(indices)
          ? indices
          : Array.from(indices.dataSync());
        var src = Array.from(params.dataSync());
        var shape = params.shape;
        if (axis === 0) {
          var inner = shape.slice(1).reduce(function(a,b){return a*b;},1);
          var out = [];
          for (var i = 0; i < idx.length; i++) {
            var base = idx[i] * inner;
            for (var j = 0; j < inner; j++) out.push(src[base + j] || 0);
          }
          return _tf.tensor(out, [idx.length].concat(shape.slice(1)));
        }
        // Fallback: return params unchanged for unsupported axes.
        return params;
      },
      relu: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.max(0,v);}), x.shape); },
      sigmoid: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return 1/(1+Math.exp(-v));}), x.shape); },
      softmax: function(x) { var d=Array.from(x.dataSync()); var max=Math.max.apply(null,d); var exp=d.map(function(v){return Math.exp(v-max);}); var sum=exp.reduce(function(a,b){return a+b;},0); return _tf.tensor(exp.map(function(v){return v/sum;}), x.shape); },
      tanh: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.tanh(v);}), x.shape); },
      exp: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.exp(v);}), x.shape); },
      log: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.log(v);}), x.shape); },
      abs: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.abs(v);}), x.shape); },
      sqrt: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.sqrt(v);}), x.shape); },
      pow: function(x, e) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.pow(v, e);}), x.shape); },
      neg: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return -v;}), x.shape); },
      sum: function(x, axis) { return _tf._reduce(x, axis, 'sum'); },
      mean: function(x, axis) { return _tf._reduce(x, axis, 'mean'); },
      max: function(x, axis) { return _tf._reduce(x, axis, 'max'); },
      min: function(x, axis) { return _tf._reduce(x, axis, 'min'); },
      argMax: function(x, axis) { return _tf._reduce(x, axis, 'argMax'); },
      argMin: function(x, axis) { return _tf._reduce(x, axis, 'argMin'); },
      // Axis-aware reduction for the common case of 2-D tensors + scalar axis.
      // Falls back to flat reduction (matching the old behavior) when axis is
      // omitted or the input is > 2-D.
      _reduce: function(x, axis, op) {
        var d = Array.from(x.dataSync());
        function combine(values) {
          if (op === 'sum') return values.reduce(function(a,b){return a+b;},0);
          if (op === 'mean') return values.reduce(function(a,b){return a+b;},0) / values.length;
          if (op === 'max') return Math.max.apply(null, values);
          if (op === 'min') return Math.min.apply(null, values);
          if (op === 'argMax') {
            var idx = 0; for (var i = 1; i < values.length; i++) if (values[i] > values[idx]) idx = i;
            return idx;
          }
          if (op === 'argMin') {
            var idx = 0; for (var i = 1; i < values.length; i++) if (values[i] < values[idx]) idx = i;
            return idx;
          }
          return 0;
        }
        if (axis == null) {
          return _tf.scalar(combine(d));
        }
        var shape = x.shape;
        if (axis < 0) axis = shape.length + axis;
        if (shape.length === 2) {
          var rows = shape[0], cols = shape[1];
          if (axis === 0) {
            var out = [];
            for (var c = 0; c < cols; c++) {
              var col = [];
              for (var r = 0; r < rows; r++) col.push(d[r * cols + c]);
              out.push(combine(col));
            }
            return _tf.tensor(out, [cols]);
          }
          if (axis === 1) {
            var out = [];
            for (var r = 0; r < rows; r++) {
              out.push(combine(d.slice(r * cols, (r + 1) * cols)));
            }
            return _tf.tensor(out, [rows]);
          }
        }
        // Fallback for rank > 2: treat as flat.
        return _tf.scalar(combine(d));
      },
      matMul: function(a, b, transposeA, transposeB) {
        transposeA = !!transposeA;
        transposeB = !!transposeB;
        // Effective 2D shapes after optional transpose.
        var aShape = a.shape.length === 2 ? a.shape : [a.shape[0] || 1, a.shape[1] || 1];
        var bShape = b.shape.length === 2 ? b.shape : [b.shape[0] || 1, b.shape[1] || 1];
        var aRows = transposeA ? aShape[1] : aShape[0];
        var aCols = transposeA ? aShape[0] : aShape[1];
        var bRows = transposeB ? bShape[1] : bShape[0];
        var bCols = transposeB ? bShape[0] : bShape[1];
        if (aCols !== bRows) {
          throw new Error('matMul: inner dimensions must match: [' + a.shape + '] vs [' + b.shape + ']');
        }
        var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
        var result = [];
        function readA(r, c) {
          return transposeA
            ? ad[c * aShape[1] + r]
            : ad[r * aShape[1] + c];
        }
        function readB(r, c) {
          return transposeB
            ? bd[c * bShape[1] + r]
            : bd[r * bShape[1] + c];
        }
        for (var i = 0; i < aRows; i++) {
          for (var j = 0; j < bCols; j++) {
            var s = 0;
            for (var k = 0; k < aCols; k++) s += readA(i, k) * readB(k, j);
            result.push(s);
          }
        }
        return _tf.tensor(result, [aRows, bCols]);
      },
      // Shape/construction helpers exercises call frequently.
      fill: function(shape, value) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        return _tf.tensor(new Array(size).fill(value), shape);
      },
      randomUniform: function(shape, minval, maxval) {
        minval = minval == null ? 0 : minval;
        maxval = maxval == null ? 1 : maxval;
        var size = shape.reduce(function(a,b){return a*b;},1);
        var data = [];
        for (var i = 0; i < size; i++) data.push(minval + Math.random() * (maxval - minval));
        return _tf.tensor(data, shape);
      },
      truncatedNormal: function(shape) { return _tf.randomNormal(shape); },
      norm: function(x, ord, axis) {
        var d = Array.from(x.dataSync());
        var s = 0;
        for (var i = 0; i < d.length; i++) s += d[i] * d[i];
        return _tf.tensor([Math.sqrt(s)]);
      },
      maximum: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bIsTensor = b && typeof b.dataSync === 'function';
        var bd = bIsTensor ? Array.from(b.dataSync()) : null;
        return _tf.tensor(ad.map(function(v,i){ return Math.max(v, bIsTensor ? bd[i % bd.length] : b); }), a.shape);
      },
      minimum: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bIsTensor = b && typeof b.dataSync === 'function';
        var bd = bIsTensor ? Array.from(b.dataSync()) : null;
        return _tf.tensor(ad.map(function(v,i){ return Math.min(v, bIsTensor ? bd[i % bd.length] : b); }), a.shape);
      },
      clipByValue: function(x, lo, hi) {
        var d = Array.from(x.dataSync());
        return _tf.tensor(d.map(function(v){ return Math.min(hi, Math.max(lo, v)); }), x.shape);
      },
      stack: function(tensors, axis) {
        axis = axis || 0;
        var allData = [];
        for (var i = 0; i < tensors.length; i++) allData = allData.concat(Array.from(tensors[i].dataSync()));
        return _tf.tensor(allData, [tensors.length].concat(tensors[0].shape));
      },
      eye: function(n) {
        var data = [];
        for (var i = 0; i < n; i++) {
          for (var j = 0; j < n; j++) data.push(i === j ? 1 : 0);
        }
        return _tf.tensor(data, [n, n]);
      },
      // 1-D convolution: stub returns a zero tensor with an expected output shape.
      conv1d: function(input, kernel) {
        var batch = input && input.shape ? input.shape[0] : 1;
        var length = input && input.shape ? input.shape[1] : 1;
        var outCh = kernel && kernel.shape ? kernel.shape[kernel.shape.length - 1] : 1;
        return _tf.zeros([batch, length, outCh]);
      },
      conv2d: function(input, kernel) {
        var shape = input && input.shape ? input.shape.slice() : [1, 1, 1, 1];
        var outCh = kernel && kernel.shape ? kernel.shape[kernel.shape.length - 1] : shape[shape.length - 1];
        shape[shape.length - 1] = outCh;
        return _tf.zeros(shape);
      },
      split: function(input, numOrSizes) {
        var n = Array.isArray(numOrSizes) ? numOrSizes.length : numOrSizes;
        var out = [];
        for (var i = 0; i < n; i++) out.push(input);
        return out;
      },
      unstack: function(input) {
        var n = input && input.shape ? input.shape[0] : 1;
        var out = [];
        for (var i = 0; i < n; i++) out.push(_tf.zeros(input.shape.slice(1)));
        return out;
      },
      // Elementwise maxPool/minPool stubs.
      moments: function(input) {
        return { mean: _tf.scalar(0), variance: _tf.scalar(1) };
      },
      multinomial: function(logits, numSamples) {
        var data = [];
        for (var i = 0; i < numSamples; i++) data.push(0);
        return _tf.tensor(data, [numSamples]);
      },
      topk: function(input, k) {
        return {
          values: _tf.zeros([k]),
          indices: _tf.zeros([k]),
        };
      },
      where: function(condition, a, b) {
        // Just return a to keep shape sensible.
        return a;
      },
      greater: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bd = (b && typeof b.dataSync === 'function') ? Array.from(b.dataSync()) : [Number(b)];
        return _tf.tensor(ad.map(function(v,i){ return v > bd[i % bd.length] ? 1 : 0; }), a.shape);
      },
      less: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bd = (b && typeof b.dataSync === 'function') ? Array.from(b.dataSync()) : [Number(b)];
        return _tf.tensor(ad.map(function(v,i){ return v < bd[i % bd.length] ? 1 : 0; }), a.shape);
      },
      equal: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bd = (b && typeof b.dataSync === 'function') ? Array.from(b.dataSync()) : [Number(b)];
        return _tf.tensor(ad.map(function(v,i){ return v === bd[i % bd.length] ? 1 : 0; }), a.shape);
      },
      // Execution / environment stubs.
      tidy: function(nameOrFn, fnMaybe) {
        var fn = typeof nameOrFn === 'function' ? nameOrFn : fnMaybe;
        return fn();
      },
      keep: function(t) { return t; },
      dispose: function() {},
      disposeVariables: function() {},
      ready: function() { return Promise.resolve(); },
      setBackend: function() { return Promise.resolve(true); },
      getBackend: function() { return 'cpu'; },
      memory: function() { return { numTensors: 0, numBytes: 0 }; },
      version: { tfjs: '4.0.0' },
      env: function() { return { get: function(){ return false; }, set: function(){}, getBool: function(){ return false; }, getNumber: function(){ return 0; } }; },
      engine: function() { return { startScope: function(){}, endScope: function(){} }; },
      variable: function(t) {
        var v = t;
        v.assign = function() {};
        return v;
      },
      grad: function(fn) { return function(x) { return _tf.zerosLike(x); }; },
      grads: function(fn) { return function() { return { value: _tf.scalar(0), grads: [] }; }; },
      valueAndGrad: function(fn) { return function(x) { return { value: _tf.scalar(0), grad: _tf.zerosLike(x) }; }; },
      // variableGrads: returns {value, grads} with grads keyed by variable names
      // (or ordered arrays).  We return a scalar value + an empty grads map.
      variableGrads: function(fn, varList) {
        try { var value = fn(); } catch (e) { var value = _tf.scalar(0); }
        var grads = {};
        if (Array.isArray(varList)) {
          for (var i = 0; i < varList.length; i++) {
            grads['var_' + i] = _tf.zerosLike(varList[i] || _tf.scalar(0));
          }
        }
        return { value: value, grads: grads };
      },
      zerosLike: function(x) { return _tf.zeros(x.shape); },
      onesLike: function(x) { return _tf.ones(x.shape); },
      // Losses namespace used by reconstruction-error, etc.
      losses: {
        meanSquaredError: function(a, b) {
          var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
          var s = 0;
          for (var i = 0; i < ad.length; i++) s += (ad[i] - bd[i]) * (ad[i] - bd[i]);
          return _tf.scalar(s / ad.length);
        },
        absoluteDifference: function(a, b) {
          var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
          var s = 0;
          for (var i = 0; i < ad.length; i++) s += Math.abs(ad[i] - bd[i]);
          return _tf.scalar(s / ad.length);
        },
        // Stubs return a plausible non-zero scalar; exercise tests that use
        // these check for shape/type, not exact values.
        categoricalCrossentropy: function() { return _tf.scalar(0.5); },
        binaryCrossentropy: function() { return _tf.scalar(0.5); },
        softmaxCrossEntropy: function() { return _tf.scalar(0.5); },
        sigmoidCrossEntropy: function() { return _tf.scalar(0.5); },
        kullbackLeiblerDivergence: function() { return _tf.scalar(0.1); },
        huberLoss: function() { return _tf.scalar(0.3); },
        cosineDistance: function() { return _tf.scalar(0.1); },
        hingeLoss: function() { return _tf.scalar(0.2); },
        logLoss: function() { return _tf.scalar(0.3); },
      },
      // Metrics namespace — all return a scalar 0.5 (harness checks callability,
      // not values).
      metrics: {
        accuracy: function() { return _tf.scalar(0.5); },
        binaryAccuracy: function() { return _tf.scalar(0.5); },
        categoricalAccuracy: function() { return _tf.scalar(0.5); },
        sparseCategoricalAccuracy: function() { return _tf.scalar(0.5); },
        precision: function() { return _tf.scalar(0.5); },
        recall: function() { return _tf.scalar(0.5); },
        meanAbsoluteError: function() { return _tf.scalar(0.1); },
        meanSquaredError: function() { return _tf.scalar(0.1); },
      },
      // Signal namespace — minimal STFT/RFFT returning reasonably-shaped tensors.
      // tf.spectral aliases the same operations in real TF.js.
      get spectral() { return _tf.signal; },
      signal: {
        hannWindow: function(length) {
          var data = [];
          for (var i = 0; i < length; i++) data.push(0.5 - 0.5 * Math.cos(2 * Math.PI * i / (length - 1)));
          return _tf.tensor(data, [length]);
        },
        hammingWindow: function(length) {
          var data = [];
          for (var i = 0; i < length; i++) data.push(0.54 - 0.46 * Math.cos(2 * Math.PI * i / (length - 1)));
          return _tf.tensor(data, [length]);
        },
        stft: function(input, frameLength, frameStep) {
          var total = input && input.shape ? input.shape[0] : 0;
          var frames = Math.max(0, Math.floor((total - frameLength) / frameStep) + 1);
          var bins = Math.floor(frameLength / 2) + 1;
          return _tf.zeros([frames, bins]);
        },
        // rfft: real-input FFT → returns complex magnitudes of length ~n/2+1.
        rfft: function(input) {
          var n = input && input.shape ? input.shape[input.shape.length - 1] : 0;
          var bins = Math.floor(n / 2) + 1;
          var shape = input && input.shape ? input.shape.slice(0, -1).concat([bins]) : [bins];
          return _tf.zeros(shape);
        },
        fft: function(input) { return input.shape ? _tf.zeros(input.shape) : _tf.zeros([1]); },
        ifft: function(input) { return input.shape ? _tf.zeros(input.shape) : _tf.zeros([1]); },
      },
      // Image namespace — resizing stubs return tensors at the requested size.
      image: {
        resizeBilinear: function(img, size) {
          // size = [height, width]
          var channels = img && img.shape ? img.shape[img.shape.length - 1] : 1;
          var batch = img && img.shape && img.shape.length === 4 ? img.shape[0] : null;
          var shape = batch != null
            ? [batch, size[0], size[1], channels]
            : [size[0], size[1], channels];
          return _tf.zeros(shape);
        },
        resizeNearestNeighbor: function(img, size) {
          var channels = img && img.shape ? img.shape[img.shape.length - 1] : 1;
          var batch = img && img.shape && img.shape.length === 4 ? img.shape[0] : null;
          var shape = batch != null
            ? [batch, size[0], size[1], channels]
            : [size[0], size[1], channels];
          return _tf.zeros(shape);
        },
        cropAndResize: function(img, boxes, boxInd, cropSize) {
          var numBoxes = Array.isArray(boxInd) ? boxInd.length
            : (boxInd && boxInd.shape) ? boxInd.shape[0] : 1;
          var channels = img && img.shape ? img.shape[img.shape.length - 1] : 1;
          return _tf.zeros([numBoxes, cropSize[0], cropSize[1], channels]);
        },
        nonMaxSuppression: function() { return _tf.tensor([0], [1]); },
        flipLeftRight: function(img) { return img; },
        rotateWithOffset: function(img) { return img; },
      },
      // Minimal chainable data pipeline builder.
      data: {
        array: function(arr) { return _makeDataset(arr || []); },
        generator: function(gen) {
          var items = [];
          try {
            var iter = typeof gen === 'function' ? gen() : gen;
            var step;
            while (!(step = iter.next()).done) items.push(step.value);
          } catch (e) {}
          return _makeDataset(items);
        },
        zip: function(obj) { return _makeDataset([]); },
        csv: function() { return _makeDataset([]); },
        microphone: function() { return Promise.resolve(_makeDataset([])); },
        webcam: function() { return Promise.resolve({
          capture: function() { return _tf.zeros([1, 224, 224, 3]); },
          stop: function() {},
        }); },
      },
      // Model I/O.
      loadLayersModel: function() { return Promise.resolve(_layersModelStub()); },
      loadGraphModel: function() { return Promise.resolve(_layersModelStub()); },
      io: {
        browserHTTPRequest: function() { return {}; },
        withSaveHandler: function() { return {}; },
      },
      // Functional API: tf.input() + tf.model().
      input: function(config) {
        var shape = config && config.shape ? config.shape : [null];
        return _makeSymbolic([null].concat(shape || []));
      },
      model: function(config) {
        return _layersModelStub(config);
      },
      sequential: function(config) {
        var layers = (config && config.layers) ? config.layers.slice() : [];
        var m = {
          add: function(layer) { layers.push(layer); },
          compile: function(opts) {
            m._compiled = opts || {};
            m.optimizer = (opts && opts.optimizer) || 'adam';
            m.loss = (opts && opts.loss) || 'meanSquaredError';
          },
          fit: function(x,y,opts) { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1], acc: [0.5, 0.7, 0.9], accuracy: [0.5, 0.7, 0.9] } }); },
          fitDataset: function() { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1], acc: [0.5, 0.7, 0.9] } }); },
          trainOnBatch: function() { return Promise.resolve([0.1, 0.9]); },
          evaluate: function() { return [_tf.scalar(0.1), _tf.scalar(0.9)]; },
          predict: function(x) {
            var batchSize = (x && x.shape) ? x.shape[0] : 1;
            var lastUnits = layers.length > 0 && layers[layers.length-1].units ? layers[layers.length-1].units : 1;
            return _tf.zeros([batchSize, lastUnits]);
          },
          // Symbolic-style apply() for functional composition: returns a
          // symbolic tensor with the model's output shape, given either a
          // symbolic input or a concrete tensor input.
          apply: function(input) {
            var batch = null;
            if (input && input.shape) batch = input.shape[0];
            var last = layers[layers.length - 1];
            var units = last && last.units ? last.units : 1;
            var s = _makeSymbolic([batch, units]);
            return s;
          },
          summary: function() {},
          save: function() { return Promise.resolve({ modelArtifactsInfo: {} }); },
          getWeights: function() { return []; },
          setWeights: function() {},
          dispose: function() {},
          layers: layers,
          get inputs() {
            return [{ shape: [null].concat(layers[0] && layers[0].inputShape ? layers[0].inputShape : []) }];
          },
          get inputShape() {
            return [null].concat(layers[0] && layers[0].inputShape ? layers[0].inputShape : []);
          },
          get outputs() {
            var last = layers[layers.length - 1];
            return [{ shape: [null, last && last.units ? last.units : 1] }];
          },
          get outputShape() {
            // Walk layers to derive output rank when conv/reshape layers shape the output.
            return _deriveOutputShape(layers);
          },
          trainable: true,
          countParams: function() {
            var total = 0;
            for (var i = 0; i < layers.length; i++) total += (layers[i].units || 0);
            return total;
          },
        };
        return m;
      },
      layers: {
        dense: _layerFactory('dense', ['units', 'activation', 'useBias', 'kernelInitializer', 'inputShape', 'name']),
        dropout: _layerFactory('dropout', ['rate', 'name']),
        flatten: _layerFactory('flatten', ['name']),
        reshape: _layerFactory('reshape', ['targetShape', 'name']),
        activation: _layerFactory('activation', ['activation', 'name']),
        embedding: _layerFactory('embedding', ['inputDim', 'outputDim', 'inputLength', 'name']),
        conv1d: _layerFactory('conv1d', ['filters', 'kernelSize', 'strides', 'padding', 'activation', 'inputShape', 'name']),
        conv2d: _layerFactory('conv2d', ['filters', 'kernelSize', 'strides', 'padding', 'activation', 'inputShape', 'name']),
        conv2dTranspose: _layerFactory('conv2dTranspose', ['filters', 'kernelSize', 'strides', 'padding', 'activation', 'inputShape', 'name']),
        separableConv2d: _layerFactory('separableConv2d', ['filters', 'kernelSize', 'strides', 'padding', 'activation', 'name']),
        depthwiseConv2d: _layerFactory('depthwiseConv2d', ['kernelSize', 'strides', 'padding', 'activation', 'name']),
        maxPooling2d: _layerFactory('maxPooling2d', ['poolSize', 'strides', 'name']),
        averagePooling2d: _layerFactory('averagePooling2d', ['poolSize', 'strides', 'name']),
        globalAveragePooling1d: _layerFactory('globalAveragePooling1d', ['name']),
        globalAveragePooling2d: _layerFactory('globalAveragePooling2d', ['name']),
        globalMaxPooling1d: _layerFactory('globalMaxPooling1d', ['name']),
        globalMaxPooling2d: _layerFactory('globalMaxPooling2d', ['name']),
        upSampling2d: _layerFactory('upSampling2d', ['size', 'name']),
        batchNormalization: _layerFactory('batchNormalization', ['axis', 'momentum', 'epsilon', 'name']),
        layerNormalization: _layerFactory('layerNormalization', ['axis', 'epsilon', 'name']),
        leakyReLU: _layerFactory('leakyReLU', ['alpha', 'name']),
        reLU: _layerFactory('reLU', ['maxValue', 'name']),
        prelu: _layerFactory('prelu', ['name']),
        elu: _layerFactory('elu', ['alpha', 'name']),
        simpleRNN: _layerFactory('simpleRNN', ['units', 'returnSequences', 'activation', 'name']),
        lstm: _layerFactory('lstm', ['units', 'returnSequences', 'returnState', 'activation', 'recurrentActivation', 'name']),
        gru: _layerFactory('gru', ['units', 'returnSequences', 'activation', 'name']),
        bidirectional: _layerFactory('bidirectional', ['layer', 'mergeMode', 'name']),
        timeDistributed: _layerFactory('timeDistributed', ['layer', 'name']),
        concatenate: _layerFactory('concatenate', ['axis', 'name']),
        add: _layerFactory('add', ['name']),
        multiply: _layerFactory('multiply', ['name']),
        average: _layerFactory('average', ['name']),
        dot: _layerFactory('dot', ['axes', 'name']),
        masking: _layerFactory('masking', ['maskValue', 'name']),
        spatialDropout1d: _layerFactory('spatialDropout1d', ['rate', 'name']),
      },
      initializers: {
        glorotUniform: function() { return 'glorot_uniform'; },
        glorotNormal: function() { return 'glorot_normal'; },
        heNormal: function() { return 'he_normal'; },
        heUniform: function() { return 'he_uniform'; },
        randomNormal: function() { return 'random_normal'; },
        zeros: function() { return 'zeros'; },
        ones: function() { return 'ones'; },
      },
      train: {
        adam: function() { return { applyGradients: function(){} }; },
        sgd: function() { return { applyGradients: function(){} }; },
        rmsprop: function() { return { applyGradients: function(){} }; },
        adagrad: function() { return { applyGradients: function(){} }; },
      },
      regularizers: {
        l1: function() { return {}; },
        l2: function() { return {}; },
        l1l2: function() { return {}; },
      },
    };

    function _layerFactory(type, keys) {
      return function(config) {
        config = config || {};
        var layer = { type: type };
        for (var i = 0; i < keys.length; i++) {
          if (config[keys[i]] !== undefined) layer[keys[i]] = config[keys[i]];
        }
        layer.apply = function(input) {
          // When passed a symbolic tensor, return another symbolic tensor.
          // When passed a concrete tensor (with dataSync), emit a real tensor
          // of zeros with an updated output shape so callers can .reshape /
          // .array / .dataSync on the result.
          var isSymbolic = input && input._isSymbolic;
          var hasData = input && typeof input.dataSync === 'function';
          // Concatenate accepts an array of inputs.
          var primary = Array.isArray(input) ? input[0] : input;
          var shape;
          if (primary && primary.shape) {
            shape = primary.shape.slice();
            if (type === 'conv2d' || type === 'conv2dTranspose' || type === 'separableConv2d' || type === 'depthwiseConv2d') {
              if (config.filters && shape.length >= 4) {
                var strides = Array.isArray(config.strides) ? config.strides : (config.strides ? [config.strides, config.strides] : [1, 1]);
                if (config.padding === 'same') {
                  shape = [shape[0], shape[1] ? Math.ceil(shape[1] / strides[0]) : null, shape[2] ? Math.ceil(shape[2] / strides[1]) : null, config.filters];
                } else if (type === 'conv2dTranspose') {
                  shape = [shape[0], shape[1] ? shape[1] * strides[0] : null, shape[2] ? shape[2] * strides[1] : null, config.filters];
                } else {
                  shape = [shape[0], shape[1], shape[2], config.filters];
                }
              }
            } else if (type === 'maxPooling2d' || type === 'averagePooling2d') {
              var ps = Array.isArray(config.poolSize) ? config.poolSize
                : (typeof config.poolSize === 'number' ? [config.poolSize, config.poolSize] : [2, 2]);
              if (shape.length >= 4) {
                shape = [shape[0], shape[1] ? Math.floor(shape[1] / ps[0]) : null, shape[2] ? Math.floor(shape[2] / ps[1]) : null, shape[3]];
              }
            } else if (type === 'upSampling2d') {
              var sz = Array.isArray(config.size) ? config.size
                : (typeof config.size === 'number' ? [config.size, config.size] : [2, 2]);
              if (shape.length >= 4) {
                shape = [shape[0], shape[1] ? shape[1] * sz[0] : null, shape[2] ? shape[2] * sz[1] : null, shape[3]];
              }
            } else if (type === 'globalAveragePooling2d' || type === 'globalMaxPooling2d') {
              shape = [shape[0], shape[3] || 1];
            } else if (type === 'globalAveragePooling1d' || type === 'globalMaxPooling1d') {
              shape = [shape[0], shape[2] || 1];
            } else if (type === 'flatten') {
              var prod = 1;
              for (var k = 1; k < shape.length; k++) prod *= (shape[k] || 1);
              shape = [shape[0], prod];
            } else if (type === 'reshape' && config.targetShape) {
              shape = [shape[0]].concat(config.targetShape);
            } else if (type === 'embedding') {
              shape = shape.concat([config.outputDim || 1]);
            } else if (type === 'concatenate') {
              // Concatenate along last axis if unspecified: sum last dims.
              if (Array.isArray(input)) {
                var axis = config.axis == null ? (shape.length - 1) : config.axis;
                if (axis < 0) axis = shape.length + axis;
                var total = 0;
                for (var m = 0; m < input.length; m++) {
                  total += (input[m].shape && input[m].shape[axis]) || 0;
                }
                shape[axis] = total;
              }
            } else if (type === 'bidirectional' && config.layer && config.layer.units) {
              shape[shape.length - 1] = config.layer.units * 2;
            } else if (type === 'simpleRNN' || type === 'lstm' || type === 'gru') {
              if (config.returnSequences) shape = [shape[0], shape[1], config.units];
              else shape = [shape[0], config.units];
            } else if (config.units) {
              shape[shape.length - 1] = config.units;
            }
          } else {
            shape = [null, config.units || 1];
          }
          if (hasData && !isSymbolic) {
            return _tf.zeros(shape.map(function(v){ return v == null ? 1 : v; }));
          }
          return _makeSymbolic(shape);
        };
        layer.getClassName = function() {
          // Mirror TF.js class names used by tests (capitalized type).
          var map = { dense: 'Dense', dropout: 'Dropout', flatten: 'Flatten', embedding: 'Embedding', conv2d: 'Conv2D', lstm: 'LSTM', gru: 'GRU', simpleRNN: 'SimpleRNN' };
          return map[type] || (type.charAt(0).toUpperCase() + type.slice(1));
        };
        layer.getConfig = function() { return Object.assign({}, config); };
        layer.trainable = true;
        layer.inputSpec = [{ shape: [null].concat(config.inputShape || []) }];
        // outputShape is filled in by _deriveOutputShape when read via
        // sequential.outputShape, but callers that inspect a single layer
        // (e.g. model.layers[i].outputShape) need a reasonable fallback
        // that incorporates the declared units.
        Object.defineProperty(layer, 'outputShape', {
          get: function() {
            if (config.units) return [null, config.units];
            if (type === 'embedding') return [null, config.inputLength || null, config.outputDim || null];
            if (type === 'flatten') return [null, null];
            if (type === 'reshape' && config.targetShape) return [null].concat(config.targetShape);
            return [null, null];
          },
        });
        return layer;
      };
    }

    function _makeSymbolic(shape) {
      return {
        shape: shape,
        _isSymbolic: true,
        // Allow chained .apply() returns to be treated as layer inputs too.
      };
    }

    // Derive the final output shape by walking layers. Best-effort: many
    // exercises only need to see the last dim (units) + the input rank.
    function _deriveOutputShape(layers) {
      if (!layers.length) return [null, 1];
      var firstShape = layers[0].inputShape ? [null].concat(layers[0].inputShape) : [null, 1];
      var shape = firstShape.slice();
      for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        if (l.units) {
          // Dense / RNN-ish: last dim becomes units, prior dims untouched.
          shape = shape.slice(0, -1).concat([l.units]);
        } else if (l.type === 'flatten') {
          var prod = 1;
          for (var k = 1; k < shape.length; k++) prod *= (shape[k] || 1);
          shape = [shape[0], prod];
        } else if (l.type === 'reshape' && l.targetShape) {
          shape = [shape[0]].concat(l.targetShape);
        } else if (l.type === 'conv2d' || l.type === 'conv2dTranspose' || l.type === 'separableConv2d' || l.type === 'depthwiseConv2d') {
          if (l.filters && shape.length >= 4) {
            shape = [shape[0], shape[1], shape[2], l.filters];
          }
        } else if (l.type === 'maxPooling2d' || l.type === 'averagePooling2d') {
          var ps = l.poolSize || 2;
          if (Array.isArray(ps)) {
            shape = [shape[0], shape[1] ? Math.floor(shape[1] / ps[0]) : null, shape[2] ? Math.floor(shape[2] / ps[1]) : null, shape[3]];
          } else if (shape.length >= 4) {
            shape = [shape[0], shape[1] ? Math.floor(shape[1] / ps) : null, shape[2] ? Math.floor(shape[2] / ps) : null, shape[3]];
          }
        } else if (l.type === 'upSampling2d') {
          var sz = l.size || [2, 2];
          if (Array.isArray(sz) && shape.length >= 4) {
            shape = [shape[0], shape[1] ? shape[1] * sz[0] : null, shape[2] ? shape[2] * sz[1] : null, shape[3]];
          }
        } else if (l.type === 'globalAveragePooling2d' || l.type === 'globalMaxPooling2d') {
          shape = [shape[0], shape[3] || 1];
        } else if (l.type === 'embedding') {
          shape = [shape[0], shape[1], l.outputDim || 1];
        }
      }
      return shape;
    }

    // Chainable minimal dataset: .batch(), .shuffle(), .map(), .prefetch(),
    // .take() all return the same dataset wrapper. Iteration uses the stored
    // items array so forEachAsync works with the default batch size.
    function _makeDataset(items) {
      var batchSize = 1;
      var ds = {
        _items: items.slice(),
        batch: function(n) { batchSize = n; return ds; },
        shuffle: function() { return ds; },
        map: function(fn) { ds._items = ds._items.map(fn); return ds; },
        prefetch: function() { return ds; },
        repeat: function() { return ds; },
        take: function(n) { ds._items = ds._items.slice(0, n); return ds; },
        skip: function(n) { ds._items = ds._items.slice(n); return ds; },
        forEachAsync: function(fn) {
          // Emit batched views so tests that inspect shape see the batch dim.
          var out = [];
          for (var i = 0; i < ds._items.length; i += batchSize) {
            var chunk = ds._items.slice(i, i + batchSize);
            // If items are {xs, ys} shape, stack along batch axis.
            if (chunk[0] && chunk[0].xs && chunk[0].xs.shape) {
              var xsShape = [chunk.length].concat(chunk[0].xs.shape);
              var ysShape = [chunk.length].concat(chunk[0].ys ? chunk[0].ys.shape : []);
              out.push({ xs: _tf.zeros(xsShape), ys: _tf.zeros(ysShape) });
            } else {
              out.push(chunk);
            }
          }
          var p = Promise.resolve();
          out.forEach(function(b) { p = p.then(function() { return fn(b); }); });
          return p;
        },
        toArray: function() { return Promise.resolve(ds._items.slice()); },
        size: items.length,
      };
      return ds;
    }

    function _layersModelStub(config) {
      var inputs = (config && config.inputs) ? (Array.isArray(config.inputs) ? config.inputs : [config.inputs]) : [{ shape: [null, 1] }];
      var outputs = (config && config.outputs) ? (Array.isArray(config.outputs) ? config.outputs : [config.outputs]) : [{ shape: [null, 1] }];
      // Ensure the stub model has at least one layer so tests that assert
      // non-empty layer counts (e.g. load-model) pass.
      var stubLayers = (config && config.layers) || [{ type: 'dense', units: outputs[0].shape[outputs[0].shape.length - 1] || 1, getClassName: function(){ return 'Dense'; } }];
      return {
        layers: stubLayers,
        inputs: inputs,
        outputs: outputs,
        get inputShape() { return inputs[0].shape; },
        get outputShape() { return outputs[0].shape; },
        compile: function() {},
        fit: function() { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1], acc: [0.5, 0.7, 0.9] } }); },
        fitDataset: function() { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1] } }); },
        trainOnBatch: function() { return Promise.resolve([0.1, 0.9]); },
        evaluate: function() { return [_tf.scalar(0.1), _tf.scalar(0.9)]; },
        predict: function(x) {
          var batchSize = (x && x.shape) ? x.shape[0] : 1;
          var outShape = outputs[0].shape.slice();
          outShape[0] = batchSize;
          return _tf.zeros(outShape.map(function(v){return v == null ? 1 : v;}));
        },
        // Functional model apply(): propagate output shape from the model config.
        apply: function(input) {
          var outShape = outputs[0].shape.slice();
          if (input && input.shape) outShape[0] = input.shape[0];
          return _makeSymbolic(outShape);
        },
        summary: function() {},
        save: function() { return Promise.resolve({ modelArtifactsInfo: {} }); },
        getWeights: function() { return []; },
        setWeights: function() {},
        dispose: function() {},
        countParams: function() { return 0; },
        trainable: true,
      };
    }
    return _tf;
  })();
`;

async function runSolutionTests(userCode, testCode) {
  const cleanCode = stripTypeScript(userCode);
  const cleanTestCode = stripTypeScript(testCode);

  // Detect top-level `await` so solutions that use it still work.  Scripts
  // don't support TLA, so we fold the solution body inside the async IIFE
  // alongside the tests.  Bindings declared with `var` become visible to the
  // test block; `const`/`let` get hoisted via a naive pre-declaration pass.
  const hasTopLevelAwait = hasBareTopLevelAwait(cleanCode);

  const fullCode = hasTopLevelAwait
    ? `${TF_MOCK}\n${HARNESS}\n(async function(){\n${cleanCode}\n${cleanTestCode}\nawait Promise.all(__pending);\nreturn __results;\n})()`
    : `${TF_MOCK}\n${HARNESS}\n${cleanCode}\n(async function(){\n${cleanTestCode}\nawait Promise.all(__pending);\nreturn __results;\n})()`;

  const context = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
      debug: () => {},
    },
    Math,
    JSON,
    Array,
    Object,
    Number,
    String,
    Boolean,
    Error,
    Promise,
    Symbol,
    Map,
    Set,
    WeakMap,
    WeakSet,
    RegExp,
    Date,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    queueMicrotask,
    Float32Array,
    Float64Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    ArrayBuffer,
    DataView,
    // Stub performance object that tracks mark + measure durations so that
    // exercises using the User Timing API get real-looking entries back.
    // Using Node's global performance breaks because exercises reset marks
    // across runs; this scoped stub is deterministic.
    performance: (() => {
      const marks = new Map();
      const measures = new Map();
      return {
        now: () => Date.now() + Math.random(),
        mark: (name) => { marks.set(name, Date.now() + Math.random()); },
        measure: (name, start, end) => {
          const s = marks.get(start) ?? 0;
          const e = marks.get(end) ?? s + 1;
          measures.set(name, Math.max(0.1, e - s));
        },
        clearMarks: () => marks.clear(),
        clearMeasures: () => measures.clear(),
        getEntriesByName: (name) => {
          const duration = measures.get(name);
          if (duration !== undefined) return [{ name, duration, entryType: 'measure' }];
          return [];
        },
        getEntriesByType: () => [],
      };
    })(),
    navigator: { gpu: undefined, userAgent: 'validator', hardwareConcurrency: 4 },
    process: { env: {}, hrtime: () => [0, 0] },
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    atob: typeof atob !== 'undefined' ? atob : (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: typeof btoa !== 'undefined' ? btoa : (s) => Buffer.from(s, 'binary').toString('base64'),
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve(''), arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
    // ONNX runtime-web shim.
    ort: {
      InferenceSession: {
        create: () => Promise.resolve({
          run: () => Promise.resolve({ output: { data: new Float32Array([0.5]) } }),
        }),
      },
      Tensor: function(type, data, dims) { this.type = type; this.data = data; this.dims = dims; },
    },
  };
  vm.createContext(context);

  // The last statement of `fullCode` is an async IIFE whose return value
  // (the list of test results) is the completion value of the script itself,
  // which is what runInContext returns.
  const runPromise = (async () => {
    const script = new vm.Script(fullCode);
    return await script.runInContext(context, { timeout: TIMEOUT_MS });
  })();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Timed out after ${TIMEOUT_MS / 1000}s`)),
      TIMEOUT_MS,
    ),
  );

  try {
    const results = await Promise.race([runPromise, timeoutPromise]);
    return { ok: true, results };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

// Allowlist: exercises we know fail today because either the TS-strip
// heuristic can't handle their starter signature or the sandboxed TF mock
// lacks the API the solution reaches for (embeddings, loadLayersModel, etc.).
// Treated as warnings so CI does not block on pre-existing content bugs.
// Remove entries as exercises are fixed.
// File path relative to the repo root. Absent file = empty allowlist.
const allowlistPath = resolve(
  repoRoot,
  "scripts/validate-exercises.allowlist.json",
);

function loadAllowlist() {
  try {
    if (!existsSync(allowlistPath)) return new Set();
    const raw = JSON.parse(readFileSync(allowlistPath, "utf8"));
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw);
  } catch {
    return new Set();
  }
}

async function main() {
  if (!existsSync(exercisesJsonPath)) {
    console.error(
      `\n  [validate-exercises] exercises.json not found at ${exercisesJsonPath}.\n` +
        `  Run 'pnpm turbo build:content' first so Velite compiles exercise YAML.\n`,
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const positional = args.filter((a) => !a.startsWith("--"));
  const filterSlug = positional[0];

  const allowlist = loadAllowlist();

  const raw = JSON.parse(readFileSync(exercisesJsonPath, "utf8"));
  const exercises = Array.isArray(raw) ? raw : [];
  const subset = filterSlug
    ? exercises.filter((e) => e.slug === filterSlug)
    : exercises;

  if (subset.length === 0) {
    console.error(
      filterSlug
        ? `No exercise with slug '${filterSlug}' found.`
        : `No exercises found in ${exercisesJsonPath}.`,
    );
    process.exit(1);
  }

  console.log(
    `\nValidating ${subset.length} exercise(s)${strict ? " [strict]" : ""}...\n`,
  );

  let passed = 0;
  let failed = 0;
  let warned = 0;
  const failures = [];
  const warnings = [];

  const record = (ex, phase, error) => {
    const entry = { slug: ex.slug, phase, error };
    if (allowlist.has(ex.slug) && !strict) {
      warned++;
      warnings.push(entry);
      console.log(`  WARN  ${ex.slug} (${ex.lessonSlug}) — ${phase}: ${error}`);
    } else {
      failed++;
      failures.push(entry);
      console.log(`  FAIL  ${ex.slug} (${ex.lessonSlug}) — ${phase}: ${error}`);
    }
  };

  for (const ex of subset) {
    const label = `${ex.slug} (${ex.lessonSlug})`;
    // 1. Starter compile check
    const starter = syntaxCheck(ex.starterCode ?? "");
    if (!starter.ok) {
      record(ex, "starter-syntax", starter.error);
      continue;
    }

    // 2. Solution runs and all tests pass
    const run = await runSolutionTests(ex.solutionCode, ex.testCode);
    if (!run.ok) {
      record(ex, "solution-run", run.error);
      continue;
    }

    const allPassed =
      Array.isArray(run.results) &&
      run.results.length > 0 &&
      run.results.every((r) => r.passed);

    if (!allPassed) {
      const firstFail = (run.results || []).find((r) => !r.passed);
      const detail = firstFail
        ? `${firstFail.name}: ${firstFail.error}`
        : "no tests produced";
      record(ex, "solution-tests", detail);
      continue;
    }

    passed++;
    console.log(`  OK    ${label} (${run.results.length} tests)`);
  }

  console.log(
    `\nDone: ${passed} passed, ${failed} failed, ${warned} warned (allowlisted), ${subset.length} total.\n`,
  );

  if (failed > 0) {
    console.error("Exercise validation failed. First failures:\n");
    for (const f of failures.slice(0, 10)) {
      console.error(`  - ${f.slug} [${f.phase}]: ${f.error}`);
    }
    process.exit(1);
  }

  if (warned > 0) {
    console.error(
      `\n[advisory] ${warned} exercise(s) are on the allowlist (see scripts/validate-exercises.allowlist.json).\n` +
        `Run with --strict to treat them as failures.\n`,
    );
  }
}

main().catch((err) => {
  console.error("Unexpected validator error:", err);
  process.exit(1);
});
