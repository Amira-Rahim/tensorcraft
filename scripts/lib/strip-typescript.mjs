/**
 * TypeScript stripper: the single source of truth shared by the CI exercise
 * grader (scripts/validate-exercises.mjs) and mirrored, line for line, in the
 * shipped runtime (packages/ui/src/mdx/strip-typescript.ts). A parity test in
 * packages/ui asserts both produce identical output over the full exercise
 * corpus; edit BOTH copies together or that test fails.
 */
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

export { stripTypeScript };
