// Generated from the existing production exercise runner. Run build.cjs to refresh.

// packages/ui/src/mdx/exercise-fit-recording.mjs
var FIT_RECORDING_SOURCE = String.raw`(function(tf) {
  var records = [];
  function snapshot(value) {
    if (!(value instanceof tf.Tensor)) return null;
    var complete = value.size <= 8192;
    return Object.freeze({
      shape: Object.freeze(value.shape.slice()),
      values: complete ? Object.freeze(Array.from(value.dataSync())) : null,
      complete: complete
    });
  }
  return {
    reset: function() { records = []; },
    read: function() { return Object.freeze(records.slice()); },
    wrap: function(fit) {
      return function(x, y, options) {
        var runRecords = records;
        var params = options || {};
        var callbacks = Array.isArray(params.callbacks) ? params.callbacks : [params.callbacks];
        var entry = runRecords.length < 16 ? {
          x: snapshot(x), y: snapshot(y), history: null,
          callbacks: Object.freeze(callbacks.filter(Boolean).map(function(c) {
            return Object.freeze({ monitor: c.monitor, patience: c.patience, minDelta: c.minDelta });
          }))
        } : null;
        // Reserve a bounded slot before asynchronous fits can overlap.
        var index = entry ? runRecords.push(null) - 1 : -1;
        return Promise.resolve(fit.apply(this, arguments)).then(function(history) {
          if (entry) { entry.history = history; runRecords[index] = Object.freeze(entry); }
          return history;
        }, function(error) {
          if (entry) runRecords[index] = Object.freeze(entry);
          throw error;
        });
      };
    }
  };
})`;

// packages/ui/src/mdx/strip-typescript.ts
var MASK_SENTINEL = String.fromCharCode(1);
var MASK_TOKEN_RE = new RegExp(MASK_SENTINEL + "(\\d+)" + MASK_SENTINEL, "g");
function maskLiterals(code) {
  const chunks = [];
  const n = code.length;
  let out = "";
  let i = 0;
  const push = (text) => {
    chunks.push(text);
    return MASK_SENTINEL + (chunks.length - 1) + MASK_SENTINEL;
  };
  const regexAllowedAt = (pos) => {
    let j = pos - 1;
    while (j >= 0 && /\s/.test(code[j])) j--;
    if (j < 0) return true;
    if (/[(,=:[!&|?{};+\-*%<>~^]/.test(code[j])) return true;
    return /(?:^|[^\w$])(return|typeof|case|in|of|do|else|void|throw|new|delete)$/.test(
      code.slice(Math.max(0, j - 7), j + 1)
    );
  };
  const skipQuoted = (start, q) => {
    let j = start + 1;
    while (j < n && code[j] !== q && code[j] !== "\n") {
      if (code[j] === "\\") j++;
      j++;
    }
    return j;
  };
  while (i < n) {
    const c = code[i];
    const c2 = code[i + 1];
    if (c === "/" && c2 === "/") {
      const end = code.indexOf("\n", i);
      const stop = end === -1 ? n : end;
      out += "//" + push(code.slice(i + 2, stop));
      i = stop;
      continue;
    }
    if (c === "/" && c2 === "*") {
      const end = code.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end;
      out += "/*" + push(code.slice(i + 2, stop)) + (end === -1 ? "" : "*/");
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      const j = skipQuoted(i, c);
      const closed = code[j] === c;
      out += c + push(code.slice(i + 1, j)) + (closed ? c : "");
      i = closed ? j + 1 : j;
      continue;
    }
    if (c === "`") {
      out += "`";
      let j = i + 1;
      let text = "";
      while (j < n && code[j] !== "`") {
        if (code[j] === "\\") {
          text += code[j] + (code[j + 1] || "");
          j += 2;
          continue;
        }
        if (code[j] === "$" && code[j + 1] === "{") {
          out += push(text);
          text = "";
          let depth = 1;
          let k = j + 2;
          while (k < n && depth > 0) {
            const d = code[k];
            if (d === "'" || d === '"') {
              k = skipQuoted(k, d) + 1;
              continue;
            }
            if (d === "`") {
              let m = k + 1;
              while (m < n && code[m] !== "`") {
                if (code[m] === "\\") m++;
                m++;
              }
              k = m + 1;
              continue;
            }
            if (d === "{") depth++;
            else if (d === "}") depth--;
            k++;
          }
          out += code.slice(j, k);
          j = k;
          continue;
        }
        text += code[j];
        j++;
      }
      out += push(text) + (code[j] === "`" ? "`" : "");
      i = code[j] === "`" ? j + 1 : j;
      continue;
    }
    if (c === "/" && regexAllowedAt(i)) {
      let j = i + 1;
      let inClass = false;
      while (j < n && code[j] !== "\n") {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code[j] === "[") inClass = true;
        else if (code[j] === "]") inClass = false;
        else if (code[j] === "/" && !inClass) break;
        j++;
      }
      if (code[j] === "/") {
        let k = j + 1;
        while (k < n && /[a-z]/.test(code[k])) k++;
        out += "/" + push(code.slice(i + 1, j)) + code.slice(j, k);
        i = k;
        continue;
      }
    }
    out += c;
    i++;
  }
  return { masked: out, chunks };
}
function restoreLiterals(masked, chunks) {
  return masked.replace(MASK_TOKEN_RE, (_, k) => chunks[Number(k)]);
}
function stripTypeScript(code) {
  const { masked, chunks } = maskLiterals(code);
  return restoreLiterals(stripTypeScriptUnmasked(masked), chunks);
}
function stripTypeScriptUnmasked(code) {
  let s = code;
  s = s.replace(/^\s*import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, "");
  s = s.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, "");
  s = stripInterfaceAndTypeDecls(s);
  s = s.replace(/^\s*export\s+default\s+/gm, "");
  s = s.replace(
    /^\s*export\s+(?=(async\s+)?(function|class|const|let|var|abstract\s+class|interface|type|enum)\b)/gm,
    ""
  );
  s = s.replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, "");
  s = stripEnumDecls(s);
  s = s.replace(/\b(function\s+\w+)\s*<[^<>]*(?:<[^<>]*>[^<>]*)*>/g, "$1");
  s = s.replace(/\b(class\s+\w+)\s*<[^<>]*(?:<[^<>]*>[^<>]*)*>/g, "$1");
  s = s.replace(
    /(\bextends\s+[A-Za-z_$][\w$]*)<[^<>]*(?:<[^<>]*>[^<>]*)*>/g,
    "$1"
  );
  s = s.replace(
    /(\bimplements\s+[A-Za-z_$][\w$]*)<[^<>]*(?:<[^<>]*>[^<>]*)*>/g,
    "$1"
  );
  s = s.replace(/\b(\w+)<[A-Z][\w$]*(?:\s*,\s*[A-Z][\w$]*)*>(?=\s*\()/g, "$1");
  s = stripGenericCallArgs(s);
  s = s.replace(
    /^(\s*)(public|private|protected|readonly|override|abstract)\s+(?=(public|private|protected|readonly|override|abstract|static|async|\*|get|set|constructor|\w|\[))/gm,
    "$1"
  );
  s = s.replace(
    /^(\s*)(public|private|protected|readonly|override|abstract)\s+(?=(public|private|protected|readonly|override|abstract|static|async|\*|get|set|constructor|\w|\[))/gm,
    "$1"
  );
  s = s.replace(
    /(\(|,)\s*(public|private|protected|readonly)\s+(public|private|protected|readonly)\s+/g,
    "$1 "
  );
  s = s.replace(/(\(|,)\s*(public|private|protected|readonly)\s+/g, "$1 ");
  s = s.replace(/([A-Za-z_$0-9)\]])!(\.|\[)/g, "$1$2");
  s = s.replace(/([A-Za-z_$0-9)\]])!(\s*[;,)\]}])/g, "$1$2");
  s = s.replace(
    /\s+as\s+[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*(?:\s*<[^<>]*(?:<[^<>]*>[^<>]*)*>)?(?:\s*\[\s*\])*/g,
    ""
  );
  s = s.replace(/\s+as\s+const\b/g, "");
  s = stripAsTupleAssertions(s);
  s = s.replace(/([A-Za-z_$][\w$]*)\?:/g, "$1:");
  s = stripTypeAnnotations(s);
  return s;
}
function stripAsTupleAssertions(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
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
        if (src[i] === "\\") {
          out += src[i] + src[i + 1];
          i += 2;
          continue;
        }
        out += src[i];
        if (src[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === "a" && src[i + 1] === "s" && /\s/.test(src[i - 1] || "") && /\s/.test(src[i + 2] || "")) {
      let j = i + 2;
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] === "[") {
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
function stripGenericCallArgs(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
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
        if (src[i] === "\\") {
          out += src[i] + src[i + 1];
          i += 2;
          continue;
        }
        out += src[i];
        if (src[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
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
            if (ch === ";" || ch === "\n") {
              ok = false;
              break;
            }
          }
          if (ch === "<") depth++;
          else if (ch === ">") depth--;
          else if (ch === "{") depthBrace++;
          else if (ch === "}") {
            if (depthBrace === 0) {
              ok = false;
              break;
            }
            depthBrace--;
          } else if (ch === "[") depthBracket++;
          else if (ch === "]") {
            if (depthBracket === 0) {
              ok = false;
              break;
            }
            depthBracket--;
          } else if (ch === "(") depthParen++;
          else if (ch === ")") {
            if (depthParen === 0) {
              ok = false;
              break;
            }
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
function stripInterfaceAndTypeDecls(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const lineStart = i === 0 || src[i - 1] === "\n";
    if (lineStart) {
      let j = i;
      while (j < n && (src[j] === " " || src[j] === "	")) j++;
      const rest = src.slice(j);
      const ifaceMatch = /^(export\s+)?interface\s+\w+/.exec(rest);
      const typeMatch = /^(export\s+)?type\s+\w+/.exec(rest);
      if (ifaceMatch) {
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
          if (k < n && src[k] === "\n") k++;
          i = k;
          continue;
        }
      }
      if (typeMatch) {
        let k = j + typeMatch[0].length;
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
                let m = k + 1;
                while (m < n && (src[m] === " " || src[m] === "	" || src[m] === "\n"))
                  m++;
                if (ch === ";" || src[m] === "|" || src[m] === "&") {
                  if (ch === ";") {
                    k++;
                    break;
                  }
                  k = m;
                  continue;
                }
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
      while (j < n && (src[j] === " " || src[j] === "	")) j++;
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
  const braceStack = [];
  let parenDepth = 0;
  let bracketDepth = 0;
  let ternaryDepth = 0;
  function detectBraceKind() {
    let last = out.length - 1;
    while (last >= 0 && /\s/.test(out[last])) last--;
    if (last < 0) return "block";
    const prev = out[last];
    if (prev === ")") return "block";
    if (prev === "}") return "block";
    if (prev === "{") return "block";
    if (prev === ";") return "block";
    if (prev === ">" && last > 0 && out[last - 1] === "=") return "block";
    if ("=([,:?".includes(prev)) return "obj";
    if ("+-*/%&|!~".includes(prev)) return "obj";
    if (/[a-zA-Z_$0-9]/.test(prev)) {
      let k = last;
      while (k >= 0 && /[\w$]/.test(out[k])) k--;
      const word = out.slice(k + 1, last + 1);
      const exprKeywords = /* @__PURE__ */ new Set([
        "return",
        "typeof",
        "in",
        "of",
        "throw",
        "yield",
        "await",
        "instanceof",
        "void",
        "delete",
        "new",
        "case",
        "default"
      ]);
      if (exprKeywords.has(word)) return "obj";
      return "block";
    }
    return "block";
  }
  while (i < n) {
    const c = src[i];
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
    if (c === "/" && src[i + 1] !== "/" && src[i + 1] !== "*") {
      let last = out.length - 1;
      while (last >= 0 && /\s/.test(out[last])) last--;
      const prev = last >= 0 ? out[last] : null;
      const divisionContext = prev !== null && /[A-Za-z0-9_$)\]]/.test(prev);
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
            while (i < n && /[a-z]/.test(src[i])) {
              out += src[i];
              i++;
            }
            break;
          } else if (ch === "\n") break;
          out += ch;
          i++;
        }
        continue;
      }
    }
    if (c === "{") {
      braceStack.push({
        kind: detectBraceKind(),
        enterParen: parenDepth,
        enterBracket: bracketDepth
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
    if (c === "(") {
      parenDepth++;
      out += c;
      i++;
      continue;
    }
    if (c === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      out += c;
      i++;
      continue;
    }
    if (c === "[") {
      bracketDepth++;
      out += c;
      i++;
      continue;
    }
    if (c === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      out += c;
      i++;
      continue;
    }
    if (c === "?") {
      if (src[i + 1] === ".") {
        out += c;
        i++;
        continue;
      }
      if (src[i + 1] === "?") {
        out += "??";
        i += 2;
        continue;
      }
      if (src[i + 1] === ":") {
        out += c;
        i++;
        continue;
      }
      ternaryDepth++;
      out += c;
      i++;
      continue;
    }
    if (c === ":") {
      if (ternaryDepth > 0) {
        ternaryDepth--;
        out += c;
        i++;
        continue;
      }
      const topBrace = braceStack.length > 0 ? braceStack[braceStack.length - 1] : null;
      const inObject = topBrace && topBrace.kind === "obj" && parenDepth === topBrace.enterParen && bracketDepth === topBrace.enterBracket;
      if (inObject) {
        out += c;
        i++;
        continue;
      }
      const prev = lastNonSpace(out);
      const isAnnotationContext = prev === ")" || prev === "]" || /[A-Za-z0-9_$?]/.test(prev ?? "");
      let j = i + 1;
      while (j < n && /\s/.test(src[j])) j++;
      const next = src.slice(j, j + 80);
      const looksLikeType = /^(number|string|boolean|any|unknown|void|never|object|bigint|symbol|null|undefined|this|Array|Promise|Map|Set|Record|Readonly|Partial|Required|Pick|Omit|[A-Z][\w$]*)\b/.test(
        next
      ) || /^[a-z][\w$]*\.[A-Z]/.test(next) || // namespaced: tf.Tensor, React.FC (capital after dot)
      /^\(/.test(next) || // (a: number) => b  arrow type
      /^\{/.test(next) || // { x: number }  object type
      /^\[/.test(next) || // [number, number] tuple type
      /^['"]/.test(next);
      if (isAnnotationContext && looksLikeType) {
        i = j;
        let depthAngle = 0;
        let depthBracket = 0;
        let depthParen = 0;
        let depthBrace = 0;
        const startsWithObject = src[j] === "{";
        const startsWithParen = src[j] === "(";
        const startsWithBracket = src[j] === "[";
        if (startsWithObject) {
          depthBrace++;
          i++;
        } else if (startsWithParen) {
          depthParen++;
          i++;
        } else if (startsWithBracket) {
          depthBracket++;
          i++;
        }
        while (i < n) {
          const ch = src[i];
          const balanced = depthAngle === 0 && depthBracket === 0 && depthParen === 0 && depthBrace === 0;
          if (balanced) {
            if (ch === "=" && src[i + 1] === ">") {
              if (startsWithParen) {
                i += 2;
                while (i < n && /\s/.test(src[i])) i++;
                if (src[i] === "{") {
                  depthBrace++;
                  i++;
                }
                continue;
              }
              break;
            }
            if (ch === "," || ch === ")" || ch === "=" || ch === ";" || ch === "\n" || ch === "{") {
              if (ch === "\n") {
                let m = i + 1;
                while (m < n && (src[m] === " " || src[m] === "	")) m++;
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
        continue;
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

// packages/ui/src/mdx/exercise-runner.ts
var HARNESS = `
  var __results = [];
  var __pending = [];
  var __currentDescribe = '';

  function describe(name, fn) {
    var prev = __currentDescribe;
    // Hooks are describe-scoped (mirrors the CI grader + vitest): siblings
    // must not inherit each other's beforeEach/afterEach registrations.
    var savedBE = __beforeEach.slice();
    var savedAE = __afterEach.slice();
    __currentDescribe = name;
    var ret;
    try { ret = fn(); } catch(e) {
      // A throw in a describe BODY silently dropped every later it() and
      // the UI then read the surviving green subset as "All tests passed!"
      // (fresh-eyes rerun \xA76). Record it as a failing result so a
      // partially-defined suite can never present as a pass.
      __results.push({
        name: name + ' > (suite body threw before defining all tests)',
        passed: false,
        error: (e && e.message) || String(e)
      });
    }
    if (ret && typeof ret.then === 'function') {
      __pending.push(ret.catch(function(){}).then(function(){
        __currentDescribe = prev;
        __beforeEach = savedBE;
        __afterEach = savedAE;
      }));
    } else {
      __currentDescribe = prev;
      __beforeEach = savedBE;
      __afterEach = savedAE;
    }
  }

  var __beforeEach = [];
  var __afterEach = [];

  // beforeAll runs immediately (describe bodies register it before any it()
  // callback executes, since its run on microtasks). Async setups are queued
  // so __awaitPending drains them before results are read.
  function beforeAll(fn) {
    try {
      var r = fn && fn();
      if (r && typeof r.then === 'function') __pending.push(Promise.resolve(r).catch(function(){}));
    } catch (e) { /* setup errors surface as failing assertions */ }
  }
  function afterAll(fn) {
    __pending.push(Promise.resolve().then(function() { return fn && fn(); }).catch(function(){}));
  }
  function beforeEach(fn) { __beforeEach.push(fn); }
  function afterEach(fn) { __afterEach.push(fn); }

  function it(name, fn) {
    var fullName = __currentDescribe ? __currentDescribe + ' > ' + name : name;
    var beSnapshot = __beforeEach.slice();
    var aeSnapshot = __afterEach.slice();
    var p = Promise.resolve().then(async function() {
      for (var i = 0; i < beSnapshot.length; i++) await beSnapshot[i]();
      await fn();
      for (var j = 0; j < aeSnapshot.length; j++) await aeSnapshot[j]();
    }).then(
      function() { __results.push({ name: fullName, passed: true }); },
      function(e) { __results.push({ name: fullName, passed: false, error: e.message || String(e) }); }
    );
    __pending.push(p);
  }
  var test = it;
  it.skip = function(){};
  it.only = it;
  test.skip = function(){};
  test.only = it;
  describe.skip = function(){};
  describe.only = describe;

  async function __awaitPending() {
    // Drain the queue, pending it()s may schedule more work.
    while (__pending.length > 0) {
      var batch = __pending.splice(0, __pending.length);
      await Promise.all(batch);
    }
  }

  /* --- shared-assertions: kept byte-identical (modulo whitespace) between
     packages/ui/src/mdx/exercise-runner.ts, the harness a learner runs in the
     browser, and scripts/validate-exercises.mjs, the harness CI grades with.
     assertHarnessParity() in the validator compares every function marked
     below, and assertAssertionParity() runs a fixture suite through both
     harnesses and compares every resulting failure string, because a
     divergence here lets a submission pass in one harness and fail in the
     other.

     FAILURE-TEXT RULE, which exercise authors follow when they write a
     message of their own:

     1. A failure never prints the expected side of an equality or closeness
        check when that value is a number, or an array or object holding a
        number. Those are graded answers. The results panel opens on the
        first Run of the untouched starter, so printing them hands over the
        answer for one click, and unlike the hint ladder it is not recorded
        as a reveal.
     2. In place of the answer the message reports three things: the value
        the learner produced, the direction of the miss (too high, too low)
        or the position of the first difference, and the rule the check
        enforces (its tolerance, its required length, its required shape).
     3. Strings, booleans, null, undefined, regexes, constructor names,
        lengths and shapes ARE printed. They name an API choice or a
        structure rather than a computed answer, and withholding them turns
        a typo into a guessing game.
     4. A threshold is a rule, not an answer, so toBeGreaterThan and its
        siblings keep naming the bar the value has to clear.
     5. The teaching half comes from the author: expect takes an optional
        second argument, and whatever it says is printed above the
        discrepancy. Write why the failure means what it means.
            expect(loss, 'A rising loss means the step went uphill.')
              .toBeLessThan(previous);
  --- */

  function __tcDefaultPrecision() {
    // Deliberately tighter than the vitest default of 2, because these
    // exercises grade numeric ML output where 2 decimals would accept a
    // wrong answer. Authors who want a looser bar pass precision
    // explicitly; the validator prints an advisory for every site that
    // leaves it out.
    return 5;
  }

  function __tcTolerance(p) {
    // Printed, not compared: Math.pow(10, -5) / 2 is 0.0000049999999999999996
    // in binary floating point, and that tail is noise in a failure message.
    var limit = Math.pow(10, -p) / 2;
    return String(Number(limit.toPrecision(2)));
  }

  function __tcMessage(why, detail) {
    var d = detail == null ? '' : String(detail);
    if (why === undefined || why === null || why === '') return d;
    if (!d) return String(why);
    return String(why) + '\\n' + d;
  }

  // Realm-safe RegExp test. Test code runs in its own realm (a vm context in

  // CI, the worker body in the browser), so a regex literal written in an

  // exercise is NOT an instanceof this realm's RegExp. Duck-typing via the

  // toString tag is the only check that holds across both harnesses; an

  // instanceof here silently degrades every regex assertion into a substring

  // search for the regex's own source text.

  function __tcIsRe(p) {

    return Object.prototype.toString.call(p) === '[object RegExp]';

  }

  function __tcShow(v) {
    // JSON.stringify turns NaN and Infinity into 'null', which would report
    // a failed calculation as a missing value.
    if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
    var s;
    try {
      s = JSON.stringify(v);
    } catch (e) {
      s = null;
    }
    if (s === undefined || s === null) s = String(v);
    return s.length > 140 ? s.slice(0, 137) + '...' : s;
  }

  function __tcType(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    // v !== v is true only for NaN, and needs no global helper.
    if (typeof v === 'number' && v !== v) return 'NaN';
    return typeof v;
  }

  function __tcNamed(v) {
    // 'null (null)' and 'undefined (undefined)' read as a stutter, so name
    // the type once when the type IS the whole value.
    var t = __tcType(v);
    var shown = __tcShow(v);
    return shown === t ? t : t + ' (' + shown + ')';
  }

  function __tcHasNumber(v) {
    if (typeof v === 'number') return true;
    if (v === null || typeof v !== 'object') return false;
    if (Array.isArray(v)) {
      for (var i = 0; i < v.length; i++) if (__tcHasNumber(v[i])) return true;
      return false;
    }
    for (var k in v) if (__tcHasNumber(v[k])) return true;
    return false;
  }

  function __tcListOf(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object' && typeof v.length === 'number') {
      return Array.prototype.slice.call(v);
    }
    return null;
  }

  function __tcNumberMiss(actual, expected) {
    if (typeof expected !== 'number') return __tcStructureMiss(actual, expected);
    if (typeof actual !== 'number') {
      return 'Got ' + __tcNamed(actual) + ' where a number was required.';
    }
    if (actual !== actual) return 'Got NaN, so the calculation produced no number.';
    return 'Got ' + actual + ', which is too ' + (actual > expected ? 'high' : 'low') + '.';
  }

  function __tcStructureMiss(actual, expected) {
    if (Array.isArray(expected)) {
      var a = __tcListOf(actual);
      if (a === null) {
        return 'Got ' + __tcNamed(actual) + ' where a list of ' + expected.length + ' was required.';
      }
      if (a.length !== expected.length) {
        return 'Your list has ' + a.length + ' entries; ' + expected.length + ' were required.';
      }
      var first = -1;
      var n = 0;
      for (var i = 0; i < expected.length; i++) {
        if (JSON.stringify(a[i]) !== JSON.stringify(expected[i])) {
          n++;
          if (first < 0) first = i;
        }
      }
      if (n === 0) {
        if (!Array.isArray(actual)) {
          return 'Your values match entry by entry, but the container is a ' + (actual && actual.constructor && actual.constructor.name ? actual.constructor.name : __tcType(actual)) + ' where a plain array was required. Array.from converts it.';
        }
        return 'Your list matches entry by entry but is not the same object.';
      }
      return 'Your list is the right length. ' + n + ' of ' + expected.length + ' entries differ, the first at index ' + first + ' (yours: ' + __tcShow(a[first]) + ').';
    }
    if (expected !== null && typeof expected === 'object') {
      if (actual === null || typeof actual !== 'object') {
        return 'Got ' + __tcNamed(actual) + ' where an object was required.';
      }
      var keys = Object.keys(expected);
      var missing = [];
      var differ = [];
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        if (!(key in actual)) missing.push(key);
        else if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) differ.push(key);
      }
      if (missing.length) {
        return 'Your object has no ' + missing[0] + ' key (' + missing.length + ' of the ' + keys.length + ' required keys are missing).';
      }
      if (differ.length) {
        return 'Your ' + differ[0] + ' is ' + __tcShow(actual[differ[0]]) + ', which this check rejects (' + differ.length + ' of ' + keys.length + ' keys differ).';
      }
      return 'Your object carries the ' + keys.length + ' required keys plus extras this check rejects.';
    }
    return 'Got ' + __tcShow(actual) + '.';
  }

  function __tcJest() {
    var jestStub = {
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
        f.mockReturnValue = function(v) { impl = function() { return v; }; return f; };
        f.mockResolvedValue = function(v) { impl = function() { return Promise.resolve(v); }; return f; };
        f.mockImplementation = function(i) { impl = i; return f; };
        f.mockClear = function() { calls.length = 0; instances.length = 0; };
        return f;
      },
      spyOn: function(obj, method) {
        var original = obj[method];
        var spy = jestStub.fn(original);
        obj[method] = spy;
        spy.mockRestore = function() { obj[method] = original; };
        return spy;
      },
      clearAllMocks: function() {},
      resetAllMocks: function() {},
      useFakeTimers: function() {},
      useRealTimers: function() {},
    };
    return jestStub;
  }

  function __tcInstallStatics(fn) {
    fn.closeTo = function(expected, precision) {
      var p = precision === undefined ? 2 : precision;
      return {
        asymmetricMatch: function(actual) {
          return Math.abs(actual - expected) < Math.pow(10, -p) / 2;
        },
      };
    };
    fn.any = function(ctor) {
      return {
        asymmetricMatch: function(a) {
          var name = String(ctor && ctor.name).toLowerCase();
          return a != null && (typeof a === name || a instanceof ctor);
        },
      };
    };
    fn.anything = function() {
      return {
        asymmetricMatch: function(a) { return a != null; },
      };
    };
    fn.stringContaining = function(s) {
      return {
        asymmetricMatch: function(a) { return typeof a === 'string' && a.indexOf(s) !== -1; },
      };
    };
    fn.stringMatching = function(re) {
      return {
        asymmetricMatch: function(a) {
          return typeof a === 'string' && (__tcIsRe(re) ? re : new RegExp(re)).test(a);
        },
      };
    };
    return fn;
  }

  function __tcMatchers(actual, __why) {
    function fail(detail) {
      throw new Error(__tcMessage(__why, detail));
    }
    function contains(needle) {
      if (typeof actual === 'string') return actual.indexOf(String(needle)) !== -1;
      var list = __tcListOf(actual);
      if (list === null) return null;
      return Array.prototype.indexOf.call(list, needle) !== -1 || (needle !== needle && list.some(function(v) { return v !== v; }));
    }
    return {
      toBe: function(expected) {
        if (actual === expected) return;
        if (__tcHasNumber(expected)) fail(__tcNumberMiss(actual, expected));
        fail('Expected ' + __tcShow(expected) + ' but got ' + __tcShow(actual) + '.');
      },
      toEqual: function(expected) {
        if (JSON.stringify(actual) === JSON.stringify(expected)) return;
        if (__tcHasNumber(expected)) fail(__tcNumberMiss(actual, expected));
        fail('Expected ' + __tcShow(expected) + ' but got ' + __tcShow(actual) + '.');
      },
      toBeDefined: function() {
        if (actual === undefined || actual === null) {
          fail('Nothing came back here: the value is ' + String(actual) + '.');
        }
      },
      toBeNull: function() {
        if (actual !== null) fail('Expected null, got ' + __tcNamed(actual) + '.');
      },
      toBeTruthy: function() {
        if (!actual) fail('Expected a truthy value, got ' + __tcShow(actual) + '.');
      },
      toBeFalsy: function() {
        if (actual) fail('Expected a falsy value, got ' + __tcShow(actual) + '.');
      },
      toBeGreaterThan: function(expected) {
        if (!(actual > expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires a value greater than ' + __tcShow(expected) + '.');
        }
      },
      toBeLessThan: function(expected) {
        if (!(actual < expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires a value less than ' + __tcShow(expected) + '.');
        }
      },
      toBeGreaterThanOrEqual: function(expected) {
        if (!(actual >= expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires at least ' + __tcShow(expected) + '.');
        }
      },
      toBeLessThanOrEqual: function(expected) {
        if (!(actual <= expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires at most ' + __tcShow(expected) + '.');
        }
      },
      toContain: function(expected) {
        var inside = contains(expected);
        if (inside === null) {
          fail('toContain needs a string or a list, got ' + __tcType(actual) + '.');
        }
        if (inside) return;
        if (typeof actual === 'string') {
          fail('Your text does not contain ' + __tcShow(expected) + '. Yours: ' + __tcShow(actual) + '.');
        }
        if (__tcHasNumber(expected)) {
          fail('Your list is missing a value this check requires. Yours: ' + __tcShow(actual) + '.');
        }
        fail('Your list does not contain ' + __tcShow(expected) + '. Yours: ' + __tcShow(actual) + '.');
      },
      toHaveLength: function(expected) {
        if (actual == null || typeof actual.length !== 'number') {
          fail('Got ' + __tcNamed(actual) + ', which has no length.');
        }
        if (actual.length !== expected) {
          fail('Your value has length ' + actual.length + '; ' + expected + ' was required.');
        }
      },
      toThrow: function(expected) {
        if (typeof actual !== 'function') {
          fail('toThrow needs a function to call, got ' + __tcType(actual) + '.');
        }
        var threw = false;
        var caught = null;
        try { actual(); } catch (e) { threw = true; caught = e; }
        if (!threw) fail('This call was required to throw, and it returned instead.');
        if (expected !== undefined) {
          var msg = caught && caught.message ? String(caught.message) : String(caught);
          var ok = __tcIsRe(expected) ? expected.test(msg) : msg.indexOf(String(expected)) !== -1;
          if (!ok) {
            fail('It threw, but the message was ' + __tcShow(msg) + ' and this check requires ' + __tcShow(String(expected)) + '.');
          }
        }
      },
      toBeCloseTo: function(expected, precision) {
        var p = precision === undefined ? __tcDefaultPrecision() : precision;
        var limit = Math.pow(10, -p) / 2;
        var diff = Math.abs(actual - expected);
        // NaN-safe: a non-numeric actual makes diff NaN, and NaN < limit is
        // false, so the negated form fails instead of silently passing.
        if (diff < limit) return;
        if (typeof actual !== 'number') {
          fail('Got ' + __tcNamed(actual) + ' where a number was required.');
        }
        if (actual !== actual) fail('Got NaN, so the calculation produced no number.');
        fail('Got ' + actual + ', which is too ' + (actual > expected ? 'high' : 'low') + '. This check allows a difference of at most ' + __tcTolerance(p) + ' (precision ' + p + ').');
      },
      toHaveProperty: function(key, expected) {
        var path = String(key).split('.');
        var cur = actual;
        for (var i = 0; i < path.length; i++) {
          var reachable = cur !== null && (typeof cur === 'object' || typeof cur === 'function');
          if (!reachable || !(path[i] in cur)) {
            fail('Expected a property named ' + __tcShow(key) + ', which is not there.');
          }
          cur = cur[path[i]];
        }
        if (arguments.length > 1 && JSON.stringify(cur) !== JSON.stringify(expected)) {
          if (__tcHasNumber(expected)) fail('Property ' + key + ': ' + __tcNumberMiss(cur, expected));
          fail('Property ' + key + ' expected ' + __tcShow(expected) + ' but got ' + __tcShow(cur) + '.');
        }
      },
      toMatch: function(pattern) {
        var s = String(actual);
        var ok = __tcIsRe(pattern) ? pattern.test(s) : s.indexOf(String(pattern)) !== -1;
        if (!ok) {
          fail('Your text does not match ' + (__tcIsRe(pattern) ? String(pattern) : __tcShow(String(pattern))) + '. Yours: ' + __tcShow(s) + '.');
        }
      },
      toMatchObject: function(expected) {
        function match(a, e) {
          if (e === null || typeof e !== 'object') return a === e;
          if (Array.isArray(e)) {
            if (!Array.isArray(a) || a.length < e.length) return false;
            for (var i = 0; i < e.length; i++) if (!match(a[i], e[i])) return false;
            return true;
          }
          for (var k in e) if (!match(a && a[k], e[k])) return false;
          return true;
        }
        if (!match(actual, expected)) {
          fail('Your object does not carry the required fields. Yours: ' + __tcShow(actual) + '.');
        }
      },
      toBeInstanceOf: function(ctor) {
        if (!(actual instanceof ctor)) {
          fail('Expected an instance of ' + String(ctor && ctor.name) + ', got ' + __tcType(actual) + '.');
        }
      },
      toHaveBeenCalled: function() {
        if (!actual || !actual.mock || actual.mock.calls.length === 0) {
          fail('This function was never called.');
        }
      },
      toHaveBeenCalledTimes: function(n) {
        if (!actual || !actual.mock) fail('Expected a mock function here.');
        if (actual.mock.calls.length !== n) {
          fail('This function was called ' + actual.mock.calls.length + ' time(s); ' + n + ' was required.');
        }
      },
      toHaveBeenCalledWith: function() {
        if (!actual || !actual.mock) fail('Expected a mock function here.');
        var expectedArgs = Array.prototype.slice.call(arguments);
        var ok = actual.mock.calls.some(function(c) {
          return JSON.stringify(c) === JSON.stringify(expectedArgs);
        });
        if (!ok) {
          fail('No call matched the required arguments. Calls seen: ' + __tcShow(actual.mock.calls) + '.');
        }
      },
      resolves: {
        toBe: function(expected) {
          return Promise.resolve(actual).then(function(v) {
            return __tcMatchers(v, __why).toBe(expected);
          });
        },
        toEqual: function(expected) {
          return Promise.resolve(actual).then(function(v) {
            return __tcMatchers(v, __why).toEqual(expected);
          });
        },
      },
      rejects: {
        toThrow: function(msgOrRegex) {
          if (!actual || typeof actual.then !== 'function') {
            fail('Expected a promise here, got ' + __tcType(actual) + '.');
          }
          return actual.then(
            function() { fail('This promise was required to reject, and it resolved instead.'); },
            function(err) {
              if (msgOrRegex === undefined || msgOrRegex === null) return;
              var msg = (err && err.message) || String(err);
              var ok = __tcIsRe(msgOrRegex) ? msgOrRegex.test(msg) : msg.indexOf(String(msgOrRegex)) !== -1;
              if (!ok) {
                fail('It rejected, but the message was ' + __tcShow(msg) + ' and this check requires ' + __tcShow(String(msgOrRegex)) + '.');
              }
            }
          );
        },
        toEqual: function(expected) {
          if (!actual || typeof actual.then !== 'function') {
            fail('Expected a promise here, got ' + __tcType(actual) + '.');
          }
          return actual.then(
            function() { fail('This promise was required to reject, and it resolved instead.'); },
            function(err) { return __tcMatchers(err, __why).toEqual(expected); }
          );
        },
      },
      not: {
        toBe: function(expected) {
          if (actual === expected) fail('This value must not be ' + __tcShow(expected) + ', and it is.');
        },
        toEqual: function(expected) {
          if (JSON.stringify(actual) === JSON.stringify(expected)) {
            fail('This value must not equal ' + __tcShow(expected) + ', and it does.');
          }
        },
        toBeDefined: function() {
          if (actual !== undefined && actual !== null) {
            fail('This value must be undefined, and it is ' + __tcShow(actual) + '.');
          }
        },
        toBeNull: function() {
          if (actual === null) fail('This value must not be null, and it is.');
        },
        toBeTruthy: function() {
          if (actual) fail('This value must be falsy, and it is ' + __tcShow(actual) + '.');
        },
        toBeFalsy: function() {
          if (!actual) fail('This value must be truthy, and it is ' + __tcShow(actual) + '.');
        },
        toContain: function(expected) {
          if (contains(expected) === true) {
            fail('Your value must not contain ' + __tcShow(expected) + ', and it does.');
          }
        },
        toMatch: function(pattern) {
          var s = String(actual);
          var matched = __tcIsRe(pattern) ? pattern.test(s) : s.indexOf(String(pattern)) !== -1;
          if (matched) {
            fail('Your text must not match ' + (__tcIsRe(pattern) ? String(pattern) : __tcShow(String(pattern))) + ', and it does.');
          }
        },
        toHaveProperty: function(key) {
          var path = String(key).split('.');
          var cur = actual;
          for (var i = 0; i < path.length; i++) {
            var reachable = cur !== null && (typeof cur === 'object' || typeof cur === 'function');
            if (!reachable || !(path[i] in cur)) return;
            cur = cur[path[i]];
          }
          fail('This value must not have a property named ' + __tcShow(key) + ', and it does.');
        },
        toHaveBeenCalled: function() {
          if (actual && actual.mock && actual.mock.calls.length > 0) {
            fail('This function must not have been called, and it was called ' + actual.mock.calls.length + ' time(s).');
          }
        },
        toBeCloseTo: function(expected, precision) {
          var p = precision === undefined ? __tcDefaultPrecision() : precision;
          var limit = Math.pow(10, -p) / 2;
          if (Math.abs(actual - expected) < limit) {
            fail('This value must not sit within ' + __tcTolerance(p) + ' of that target, and it does.');
          }
        },
      },
    };
  }

  function expect(actual, why) {
    return __tcMatchers(actual, why);
  }
  __tcInstallStatics(expect);
  var jest = __tcJest();
  /* --- end shared-assertions --- */
`;
function userCodeSyntaxError(cleanUserCode = "") {
  try {
    new Function("return (async function() {\n" + cleanUserCode + "\n});");
    return null;
  } catch (err) {
    const raised = Object(err);
    return typeof raised.message === "string" ? raised.message : String(err);
  }
}
function userSyntaxErrorResult(parserMessage = "") {
  return {
    name: "Your code has a syntax error",
    passed: false,
    error: "JavaScript could not parse your code, so no test ran. The parser said: " + parserMessage + ". An unclosed or extra brace is the usual cause: check that every opening brace has a partner."
  };
}
function buildFullCode(userCode, testCode) {
  const cleanCode = stripTypeScript(userCode);
  const cleanTestCode = stripTypeScript(testCode);
  return `${HARNESS}
return (async function() {
${cleanCode}
${cleanTestCode}
await __awaitPending();
return __results;
})();`;
}
var WORKER_BODY = `
  var createFitRecorder = ${FIT_RECORDING_SOURCE};
  var fitRecorder;
(function() {
  // Seal Math.random before anything else runs (round 7, 2026-09-13). The
  // grader's run-time draws and tf's own generator both read it, so a
  // submission that reassigned it turned every drawn fixture into a constant.
  // Per-run seed from the original generator, then the property is made
  // non-writable and non-configurable: a reassignment is ignored in sloppy
  // code and throws in strict code. The Math binding itself is locked the
  // same way, since globalThis.Math = copyWithRandomPinned walked around
  // the property seal (round 7b, 2026-09-14). Mirrors sealedMath() and the
  // host lock in scripts/validate-exercises.mjs.
  (function() {
    var seed = (Math.random() * 0x100000000) >>> 0;
    var random = function() {
      seed = (seed + 0x6d2b79f5) >>> 0;
      var t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    try { Object.defineProperty(Math, 'random', { value: random, writable: false, configurable: false }); } catch (e) {}
    try { Object.defineProperty(globalThis, 'Math', { value: Math, writable: false, configurable: false }); } catch (e) {}
  })();
  var isNode = typeof process !== 'undefined' && process.versions && process.versions.node && typeof importScripts === 'undefined';
  var post, listen;
  if (isNode) {
    var wt = require('node:worker_threads');
    var parent = wt.parentPort;
    post = function(m) { parent.postMessage(m); };
    listen = function(cb) { parent.on('message', cb); };
  } else {
    post = function(m) { postMessage(m); };
    listen = function(cb) { addEventListener('message', function(e) { cb(e.data); }); };
  }

  // Backend pin for the browser worker (2026-09-20). Left to itself, tfjs
  // picks WebGL inside a Chromium worker (OffscreenCanvas is available), and
  // on a machine without a GPU, CI runners included, that WebGL is
  // SwiftShader, a software rasterizer that turns each of a training loop's
  // small kernels into a slow round trip. build-autoencoder (400 epochs),
  // training-loop-exercise (up to 500) and simple-network (50) blew the
  // 30-second execution budget on every CI push that way. The models in
  // this course are small enough that the cpu backend wins on per-op
  // overhead, and it is the backend the graded reference (the Node branch
  // below, exercise-runner-node.ts) already runs on, so the learner's
  // numbers now come from the same arithmetic as the grader's. Guarded: a
  // rejected or refused setBackend leaves tfjs's own choice in place, and
  // tf.ready() is awaited either way so backend start-up is charged to the
  // load phase rather than to the learner's budget. Nothing here can reject.
  function pinCpuBackend() {
    var tf = globalThis.tf;
    if (!tf || typeof tf.setBackend !== 'function') return Promise.resolve();
    var pinned;
    try {
      pinned = Promise.resolve(tf.setBackend('cpu'));
    } catch (e) {
      pinned = Promise.resolve(false);
    }
    return pinned.then(function() {}, function() {}).then(function() {
      return typeof tf.ready === 'function' ? tf.ready() : undefined;
    }).then(function() {}, function() {});
  }

  // Load real @tensorflow/tfjs into global scope as 'tf'.
  var tfReady;
  if (isNode) {
    try {
      globalThis.tf = require('@tensorflow/tfjs');
      tfReady = Promise.resolve();
    } catch (e) {
      tfReady = Promise.reject(new Error('Failed to load @tensorflow/tfjs in Node worker: ' + e.message));
    }
  } else {
    try {
      // Same-origin vendored copy first (no CDN dependency, no third-party
      // CSP entry needed; version-locked to the grader's node_modules copy).
      // Blob workers inherit the page origin, so self.location.origin
      // resolves to the app host.
      importScripts(self.location.origin + '/vendor/tfjs-4.22.0.min.js');
      tfReady = pinCpuBackend();
    } catch (eLocal) {
      try {
        importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
        tfReady = pinCpuBackend();
      } catch (e) {
        tfReady = Promise.reject(new Error('Failed to importScripts TFJS in worker (local: ' + eLocal.message + '; cdn: ' + e.message + ')'));
      }
    }
  }

  // Tell the host the runtime is up. The host uses this to stop measuring
  // download time against the learner's execution budget: importScripts above
  // pulls a ~1.4 MB bundle, which on a slow connection alone exceeds the 10s
  // timeout and produced "Timed out after 10 seconds" for code that never ran.
  // Resolution (not rejection) is what matters here - a failed load is
  // reported through the normal error path when the run is attempted.
  try {
    Promise.resolve(tfReady).then(function () {
      post({ ready: true });
    }, function () {});
  } catch (e) {}

  // Lesson-test compatibility shims. Real TFJS is the source of truth, but a
  // handful of lesson tests assume API niceties that TFJS doesn't expose
  // directly (model.inputShape on sequential models, network-loadable
  // models, ONNX runtime global, performance.mark in workers). These shims
  // close the gap without weakening grader truthfulness.
  function applyShims() {
    var tf = globalThis.tf;
    if (!tf) return;
    if (!fitRecorder) fitRecorder = createFitRecorder(tf);

    // Part of the call spy above: tensor METHODS (a.add(b), x.matMul(w),
    // t.sum().dataSync()) are prototype calls the proxy cannot see, so the
    // prototype is patched once and counts into the run's live counter object
    // as 'tensor.<name>'. A grader that exists to teach a tensor op reads
    // these; the CI validator patches the same list.
    var TENSOR_METHODS = ['add', 'sub', 'mul', 'div', 'matMul', 'dot', 'transpose', 'sum', 'mean', 'square', 'sqrt', 'max', 'min', 'argMax', 'norm', 'exp', 'log', 'sigmoid', 'softmax', 'reshape', 'concat', 'dataSync', 'data', 'arraySync', 'dispose'];
    if (tf.Tensor && tf.Tensor.prototype && !tf.Tensor.prototype.__tcSpied) {
      TENSOR_METHODS.forEach(function(name) {
        var real = tf.Tensor.prototype[name];
        if (typeof real !== 'function') return;
        tf.Tensor.prototype[name] = function() {
          var c = globalThis.__tcCalls;
          if (c) c['tensor.' + name] = (c['tensor.' + name] || 0) + 1;
          return real.apply(this, arguments);
        };
      });
      tf.Tensor.prototype.__tcSpied = true;
    }
    if (tf.LayersModel && tf.LayersModel.prototype && !tf.LayersModel.prototype.__tcSpied) {
      var realSave = tf.LayersModel.prototype.save;
      tf.LayersModel.prototype.save = function() {
        var c = globalThis.__tcCalls;
        if (c) c['model.save'] = (c['model.save'] || 0) + 1;
        return realSave.apply(this, arguments);
      };
      // One count per predict call, Sequential or functional; same rule as
      // the validator.
      var realPredict = tf.LayersModel.prototype.predict;
      tf.LayersModel.prototype.predict = function() {
        var c = globalThis.__tcCalls;
        if (c) c['model.predict'] = (c['model.predict'] || 0) + 1;
        return realPredict.apply(this, arguments);
      };
      // The host terminates a worker whose budget ran out and cannot look
      // inside it first, so the worker tells the host when a recorded fit
      // starts and when the last one in flight settles. The host reads that
      // flag only at the deadline, to name a training loop that did not
      // finish instead of printing the generic timeout (2026-09-20). The
      // wrapper passes the recorder's own promise value through, so the
      // history a learner awaits is the same object tf.__fits holds.
      var recordedFit = fitRecorder.wrap(tf.LayersModel.prototype.fit);
      tf.LayersModel.prototype.fit = function() {
        var pending = recordedFit.apply(this, arguments);
        if (++fitsInFlight === 1) post({ fit: true });
        function settled() {
          if (fitsInFlight > 0 && --fitsInFlight === 0) post({ fit: false });
        }
        return pending.then(
          function(history) { settled(); return history; },
          function(error) { settled(); throw error; }
        );
      };
      tf.LayersModel.prototype.__tcSpied = true;
    }
    // Lock the spied methods and the read path after the spy has wrapped
    // them, and freeze tf.util: the namespace proxy refuses writes to tf's
    // own properties, but tf.Tensor.prototype.arraySync = () => 'P' poisoned
    // every grader's read path before this (round 7b, 2026-09-14). Identical
    // block in the validator.
    (function() {
      function lockMethods(target, names) {
        if (!target) return;
        names.forEach(function(name) {
          var d = Object.getOwnPropertyDescriptor(target, name);
          if (d && typeof d.value === 'function' && d.configurable) {
            d.writable = false; d.configurable = false;
            Object.defineProperty(target, name, d);
          }
        });
      }
      lockMethods(tf.Tensor && tf.Tensor.prototype, TENSOR_METHODS.concat(['data', 'array', 'dataSync', 'arraySync']));
      lockMethods(tf.LayersModel && tf.LayersModel.prototype, ['predict', 'save', 'fit']);
      if (tf.util && typeof tf.util === 'object') { try { Object.freeze(tf.util); } catch (e) {} }
    })();

    // The tf namespace is frozen, so we can't reassign tf.sequential or
    // tf.loadLayersModel. Patch the Sequential prototype + intercept via
    // Function.prototype-style replacement by creating a fresh sequential
    // factory and re-binding it through a Proxy-like approach that the
    // exercise code uses indirectly via tf access.

    // 1. Patch LayersModel + Sequential + Container prototypes to expose
    //    inputShape derived from inputs/layers (real TFJS leaves this
    //    undefined). Sequential extends LayersModel extends Container, so
    //    walk the chain and patch each level once.
    try {
      var sampleSeq = tf.sequential();
      sampleSeq.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      var protos = [];
      var p = sampleSeq;
      while (p && p !== Object.prototype) {
        var proto = Object.getPrototypeOf(p);
        if (!proto || proto === Object.prototype) break;
        if (protos.indexOf(proto) === -1) protos.push(proto);
        p = proto;
      }
      protos.forEach(function(proto) {
        if (!Object.getOwnPropertyDescriptor(proto, 'inputShape')) {
          Object.defineProperty(proto, 'inputShape', {
            configurable: true,
            get: function() {
              if (this.inputs && this.inputs[0]) return this.inputs[0].shape;
              var first = this.layers && this.layers[0];
              return first && first.batchInputShape;
            },
          });
        }
      });
      sampleSeq.dispose && sampleSeq.dispose();
    } catch (e) { /* ignore */ }

    // 2. tf.loadLayersModel can't reach the network from a worker. Stub it
    //    to return a model whose architecture is DERIVED FROM THE URL, so
    //    lessons that load a saved model still pass shape and metadata
    //    assertions while no submission can clear one by hardcoding a
    //    memorised shape triple. Before 2026-09-08 this returned a fixed
    //    4 -> 8 -> 1 stack while the CI validator returned a fixed
    //    10 -> 8 -> 4 one, so the same hardcode passed in one harness and
    //    failed in the other.

    // --- stub-arch-derivation: kept byte-identical (modulo whitespace) with
    // the copy in scripts/validate-exercises.mjs, whose assertHarnessParity()
    // reads this block out of this file and fails CI if the two drift. ---
    function stubArchFromUrl(url) {
      // FNV-1a over the url, via Math.imul so the 32-bit multiply stays exact.
      var h = 0x811c9dc5;
      var s = String(url == null ? "" : url);
      for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      var inputDim = 4 + (h % 13);
      var hidden = 4 + ((h >>> 5) % 13);
      var outputUnits = 1 + ((h >>> 11) % 4);
      var deep = (h >>> 17) % 2 === 1;
      return {
        inputDim: inputDim,
        hidden: hidden,
        outputUnits: outputUnits,
        hiddenTwo: deep ? Math.max(2, hidden >> 1) : 0,
        layerCount: deep ? 3 : 2,
      };
    }
    // --- end stub-arch-derivation ---

    function stubLoadLayers(url) {
      var a = stubArchFromUrl(url);
      var stub = tf.sequential();
      stub.add(tf.layers.dense({ units: a.hidden, activation: 'relu', inputShape: [a.inputDim] }));
      if (a.hiddenTwo) {
        stub.add(tf.layers.dense({ units: a.hiddenTwo, activation: 'relu' }));
      }
      stub.add(tf.layers.dense({
        units: a.outputUnits,
        activation: a.outputUnits === 1 ? 'sigmoid' : 'softmax',
      }));
      return Promise.resolve(stub);
    }
    function stubLoadGraph(url) {
      var a = stubArchFromUrl(url);
      var layers = [];
      for (var i = 0; i < a.layerCount; i++) layers.push({});
      function out(x) {
        var batch = (x && x.shape && x.shape[0]) || 1;
        return tf.zeros([batch, a.outputUnits]);
      }
      return Promise.resolve({
        predict: out,
        execute: out,
        inputs: [{ shape: [null, a.inputDim] }],
        outputs: [{ shape: [null, a.outputUnits] }],
        layers: layers,
        dispose: function() {},
      });
    }
    // tf exports are non-writable + non-configurable read-only ESM
    // bindings, so direct assign and defineProperty both fail. Stash the
    // stubs on globalThis; the worker passes them via a Proxy wrapper
    // (built below the shim) as the tf argument to user code.
    globalThis.__tcStubs = {
      loadLayersModel: stubLoadLayers,
      loadGraphModel: stubLoadGraph,
    };

    // (Removed earlier InputSpec.shape getter, conflicted with TFJS's
    // own writes to spec.shape on subclasses. Lessons that read
    // layer.inputSpec[0].shape[N] are corrected at the lesson level via
    // the tests-fix script instead.)

    // ONNX runtime global stub for lessons that compare TFJS vs ORT. The
    // session output is a function of the feed, not a constant, so an
    // exercise can grade the number a solution returns instead of only
    // spying on the call.

    // --- stub-onnx-derivation: kept byte-identical (modulo whitespace) with
    // the copy in scripts/validate-exercises.mjs, whose assertHarnessParity()
    // reads this block out of this file and fails CI if the two drift. ---
    function stubOnnxScore(feeds) {
      // Squash a position-weighted sum of the feed values into (0, 1). Any
      // deterministic function of the input works; what matters is that it IS a
      // function of the input, so returning a memorised constant is a wrong
      // answer. Before 2026-09-08 both shims returned 0.5 for every feed, which
      // made a plain "return 0.5" indistinguishable from running the session.
      var key = feeds ? Object.keys(feeds)[0] : null;
      var t = key ? feeds[key] : null;
      var data = t && t.data ? t.data : [];
      var acc = 0;
      for (var i = 0; i < data.length; i++) acc += (i + 1) * Number(data[i]);
      return 1 / (1 + Math.exp(-acc));
    }
    // --- end stub-onnx-derivation ---

    if (typeof globalThis.ort === 'undefined') {
      globalThis.ort = {
        InferenceSession: {
          create: function() {
            return Promise.resolve({
              inputNames: ['input'],
              outputNames: ['output'],
              run: function(feeds) {
                return Promise.resolve({
                  output: {
                    data: new Float32Array([stubOnnxScore(feeds)]),
                    dims: [1, 1],
                  },
                });
              },
              // Lifecycle no-ops the real library exposes (lesson 5 tells the
              // reader to release the session); kept in step with the
              // validator's stub.
              release: function() { return Promise.resolve(); },
            });
          },
        },
        Tensor: function(type, data, dims) { this.type = type; this.data = data; this.dims = dims; this.dispose = function() {}; },
      };
    }

    // performance.mark / measure shim, real perf API exists in Node 16+ but
    // some lessons mark from inside flagged code paths that don't run during
    // grading. Provide a relaxed implementation that always returns a measure.
    if (typeof globalThis.performance === 'undefined') globalThis.performance = {};
    var perf = globalThis.performance;
    var marks = {};
    var origMark = perf.mark;
    var origMeasure = perf.measure;
    perf.mark = function(name) {
      marks[name] = (typeof perf.now === 'function' ? perf.now() : Date.now());
      if (origMark) try { return origMark.call(perf, name); } catch (e) {}
    };
    perf.measure = function(name, start, end) {
      if (origMeasure) {
        try { return origMeasure.call(perf, name, start, end); } catch (e) {}
      }
      var s = marks[start] || 0;
      var e = marks[end] || (typeof perf.now === 'function' ? perf.now() : Date.now());
      return { name: name, duration: e - s, startTime: s };
    };
  }

  var logs = [];
  // Recorded fits still running in this run; see the fit wrapper in
  // applyShims and the { fit } reply it posts.
  var fitsInFlight = 0;
  function stringifyArg(a) {
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch (e) { return String(a); }
  }
  var capturedConsole = {
    log: function() { logs.push({ level: 'log', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
    warn: function() { logs.push({ level: 'warn', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
    error: function() { logs.push({ level: 'error', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
    info: function() { logs.push({ level: 'log', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
    debug: function() { logs.push({ level: 'log', message: Array.prototype.map.call(arguments, stringifyArg).join(' ') }); },
  };

  listen(function(msg) {
    var code = msg && msg.code;
    if (typeof code !== 'string') return;
    (async function() {
      try {
        await tfReady;
        applyShims();
        // Wrap tf in a Proxy so user-side tf.loadLayersModel(url) resolves
        // to the stub (real export is non-writable + non-configurable).
        var stubs = globalThis.__tcStubs || {};
        // CALL SPY (2026-09-13). tf reaches the submission as a read-only
        // namespace, so a grader cannot wrap tf.variableGrads or tf.io to see
        // whether the learner CALLED it; a submission that reproduces the
        // right numbers by other means (finite differences, a hand-assembled
        // artifact, a table) passed graders that exist to teach the call.
        // Counters live on tf.__calls: top-level entry points by name
        // ('variableGrads', 'sequential', ...), nested namespaces by
        // 'layers.dense', 'io.withSaveHandler', 'train.adam', and
        // LayersModel.prototype.save as 'model.save'. Fresh per run. The CI
        // validator (scripts/validate-exercises.mjs) implements the identical
        // spy, and the corpus parity test keeps them in step.
        var calls = Object.create(null);
        globalThis.__tcCalls = calls;
        if (fitRecorder) fitRecorder.reset();
        fitsInFlight = 0;
        var SPIED = { variableGrads: 1, grad: 1, grads: 1, valueAndGrad: 1, valueAndGrads: 1, customGrad: 1, sequential: 1, model: 1, tidy: 1, dispose: 1, keep: 1, matMul: 1, dot: 1, transpose: 1, add: 1, sub: 1, mul: 1, div: 1, sum: 1, mean: 1, moments: 1 };
        var NESTED = { layers: 1, io: 1, train: 1, losses: 1 };
        function bump(name) { calls[name] = (calls[name] || 0) + 1; }
        function spyNamespace(ns, prefix) {
          if (typeof Proxy !== 'function' || !ns) return ns;
          return new Proxy(ns, {
            get: function(target, prop) {
              var v = target[prop];
              if (typeof v === 'function' && typeof prop === 'string') {
                return function() { bump(prefix + '.' + prop); return v.apply(this === undefined ? target : this, arguments); };
              }
              return v;
            },
          });
        }
        var tfProxy = (typeof Proxy === 'function')
          ? new Proxy(globalThis.tf, {
              get: function(target, prop) {
                // A frozen snapshot, not the live object: a forged
                // tf.__calls['model.save'] = 1 cleared a grader before this
                // (round 7b, 2026-09-14). Same rule as the validator.
                if (prop === '__calls') return Object.freeze(Object.assign(Object.create(null), calls));
                if (prop === '__fits') return fitRecorder ? fitRecorder.read() : Object.freeze([]);
                if (stubs[prop]) return stubs[prop];
                var v = target[prop];
                if (SPIED[prop] && typeof v === 'function') {
                  return function() { bump(prop); return v.apply(target, arguments); };
                }
                // tf.train is a function with members hung off it, not a plain
                // object, so both shapes are wrapped.
                if (NESTED[prop] && v && (typeof v === 'object' || typeof v === 'function')) return spyNamespace(v, prop);
                return v;
              },
              // Read-only to the submission, same rule as the validator: a
              // reassigned tf.randomUniform would pin the grader's draws.
              set: function() { return false; },
              defineProperty: function() { return false; },
              deleteProperty: function() { return false; },
            })
          : globalThis.tf;
        var fn = new Function('console', 'tf', code);
        var results = await fn(capturedConsole, tfProxy);
        post({ ok: true, results: results, logs: logs });
      } catch (err) {
        post({ ok: false, error: (err && err.message) || String(err), logs: logs });
      }
    })();
  });
})();
`;
var RUNTIME_LOAD_TIMEOUT_MS = 6e4;
var WORKER_BODY_STRING = WORKER_BODY;
function defaultSpawnWorker() {
  if (typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    throw new Error(
      "Web Worker not available in this environment. Use the Node runner (exercise-runner-node.ts) for tests / SSR."
    );
  }
  const blob = new Blob([WORKER_BODY], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const w = new Worker(url);
  return Promise.resolve({
    send: (m) => w.postMessage(m),
    onReply: (cb) => {
      w.onmessage = (e) => cb(e.data);
    },
    terminate: () => {
      w.terminate();
      URL.revokeObjectURL(url);
    }
  });
}
async function parseAndRunTestsWith(spawn, userCode, testCode, timeoutMs = 1e4) {
  const syntaxError = userCodeSyntaxError(stripTypeScript(userCode));
  if (syntaxError) {
    return {
      results: [userSyntaxErrorResult(syntaxError)],
      logs: [],
      errored: true
    };
  }
  const code = buildFullCode(userCode, testCode);
  let handle;
  try {
    handle = await spawn();
  } catch (err) {
    return {
      results: [
        {
          name: "Code execution",
          passed: false,
          error: err instanceof Error ? err.message : String(err)
        }
      ],
      logs: []
    };
  }
  return await new Promise((resolve) => {
    let settled = false;
    let trainingInFlight = false;
    const finish = (outcome) => {
      if (settled) return;
      settled = true;
      if (timer !== void 0) clearTimeout(timer);
      clearTimeout(loadTimer);
      Promise.resolve(handle.terminate()).catch(() => {
      });
      resolve(outcome);
    };
    let timer;
    const startTimer = () => {
      if (timer !== void 0 || settled) return;
      timer = setTimeout(() => {
        const seconds = Math.round(timeoutMs / 1e3);
        finish({
          results: [
            {
              name: "Code execution",
              passed: false,
              // A fit that outlives the budget is the usual cause on the
              // training exercises, and "timed out" alone sent learners
              // hunting for a hang in code that was only slow.
              error: trainingInFlight ? `Training did not finish within the ${seconds}-second budget. Use fewer epochs or a larger batch size, then run again.` : `Timed out after ${seconds} seconds`
            }
          ],
          logs: [],
          errored: true
        });
      }, timeoutMs);
    };
    const loadTimer = setTimeout(() => {
      if (timer !== void 0 || settled) return;
      finish({
        results: [
          {
            name: "Runtime load",
            passed: false,
            error: "The TensorFlow.js runtime did not finish loading. This is usually a slow or blocked network, not a problem with your code. Check your connection and run the tests again."
          }
        ],
        logs: [],
        errored: true
      });
    }, RUNTIME_LOAD_TIMEOUT_MS);
    handle.onReply((reply) => {
      if ("ready" in reply) {
        clearTimeout(loadTimer);
        startTimer();
        return;
      }
      if ("fit" in reply) {
        trainingInFlight = reply.fit;
        return;
      }
      clearTimeout(loadTimer);
      startTimer();
      if (reply.ok) {
        finish({ results: reply.results, logs: reply.logs });
      } else {
        finish({
          results: [
            { name: "Code execution", passed: false, error: reply.error }
          ],
          logs: reply.logs,
          errored: true
        });
      }
    });
    handle.send({ code });
  });
}
async function parseAndRunTests(userCode, testCode, timeoutMs = 1e4) {
  return parseAndRunTestsWith(
    defaultSpawnWorker,
    userCode,
    testCode,
    timeoutMs
  );
}
export {
  WORKER_BODY_STRING,
  parseAndRunTests,
  parseAndRunTestsWith,
  stripTypeScript
};
