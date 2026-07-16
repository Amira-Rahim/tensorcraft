/**
 * Custom Shiki theme for Tensorcraft code blocks.
 *
 * Designed for the dark brutalist aesthetic with the Deep Orbit
 * color palette as the default. Sits on #161616 (code-bg).
 *
 * Token colors are chosen for readability on dark backgrounds
 * while feeling native to Tensorcraft's design system.
 */
import type { ThemeRegistration } from "shiki";

export const tensorcraftTheme: ThemeRegistration = {
  name: "tensorcraft-dark",
  type: "dark",
  colors: {
    // Editor chrome
    "editor.background": "#161616",
    "editor.foreground": "#E0E0E0",
    "editorLineNumber.foreground": "#3A3A3A",
    "editorLineNumber.activeForeground": "#6BAA8A",
    "editor.selectionBackground": "#6BAA8A30",
    "editor.lineHighlightBackground": "#1E1E1E",

    // Bracket matching
    "editorBracketMatch.background": "#6BAA8A20",
    "editorBracketMatch.border": "#6BAA8A60",
  },
  tokenColors: [
    // Comments - muted. #6A7A6A read 3.96:1 on the #161616 code background,
    // under the 4.5:1 AA floor; every comment in every lesson failed, and the
    // axe gate never caught it because it only audited lesson step 0, which
    // has no code block. #788878 is the smallest change that clears AA (4.82:1)
    // while keeping the muted green-grey. Locked by tensorcraft-theme.test.ts.
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#788878", fontStyle: "italic" },
    },

    // Keywords - primary green (import, export, const, let, var, function, return, if, else, etc.)
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "storage.type",
        "storage.modifier",
      ],
      settings: { foreground: "#6BAA8A" },
    },

    // Strings - warm accent
    {
      scope: [
        "string",
        "string.quoted",
        "string.template",
        "punctuation.definition.string",
      ],
      settings: { foreground: "#C9A96E" },
    },

    // Numbers - soft green
    {
      scope: ["constant.numeric"],
      settings: { foreground: "#B5CEA8" },
    },

    // Constants (true, false, null, undefined) - soft blue
    {
      scope: [
        "constant.language",
        "constant.language.boolean",
        "constant.language.null",
        "constant.language.undefined",
      ],
      settings: { foreground: "#7096B0" },
    },

    // Functions/methods - warm yellow
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#DCDCAA" },
    },

    // Types, classes, interfaces - blue
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "support.type",
        "support.class",
        "entity.other.inherited-class",
      ],
      settings: { foreground: "#4A90D9" },
    },

    // Variables, parameters - clean text
    {
      scope: ["variable", "variable.other", "variable.parameter"],
      settings: { foreground: "#D4D4D4" },
    },

    // Properties/fields - light blue
    {
      scope: [
        "variable.other.property",
        "variable.other.object.property",
        "meta.object-literal.key",
      ],
      settings: { foreground: "#9CDCFE" },
    },

    // Operators - text color
    {
      scope: [
        "keyword.operator",
        "keyword.operator.assignment",
        "keyword.operator.arithmetic",
        "keyword.operator.comparison",
        "keyword.operator.logical",
      ],
      settings: { foreground: "#E0E0E0" },
    },

    // Punctuation - slightly dimmed
    {
      scope: [
        "punctuation",
        "meta.brace",
        "punctuation.definition.block",
        "punctuation.separator",
        "punctuation.terminator",
      ],
      settings: { foreground: "#B0B0B0" },
    },

    // Template literal expressions - primary
    {
      scope: [
        "punctuation.definition.template-expression",
        "string.template punctuation.definition.template-expression",
      ],
      settings: { foreground: "#6BAA8A" },
    },

    // Regex
    {
      scope: ["string.regexp"],
      settings: { foreground: "#D16969" },
    },

    // Decorators / annotations
    {
      scope: ["meta.decorator", "punctuation.decorator"],
      settings: { foreground: "#DCDCAA" },
    },

    // Tags (JSX/HTML)
    {
      scope: ["entity.name.tag", "punctuation.definition.tag"],
      settings: { foreground: "#6BAA8A" },
    },

    // Tag attributes
    {
      scope: ["entity.other.attribute-name"],
      settings: { foreground: "#9CDCFE" },
    },

    // JSON keys
    {
      scope: ["support.type.property-name.json"],
      settings: { foreground: "#9CDCFE" },
    },

    // Markdown headings
    {
      scope: ["markup.heading", "entity.name.section"],
      settings: { foreground: "#6BAA8A", fontStyle: "bold" },
    },

    // Markdown bold/italic
    {
      scope: ["markup.bold"],
      settings: { fontStyle: "bold" },
    },
    {
      scope: ["markup.italic"],
      settings: { fontStyle: "italic" },
    },

    // Python-specific: self, cls
    {
      scope: [
        "variable.language.special.self",
        "variable.parameter.function.language.special.self",
      ],
      settings: { foreground: "#7096B0", fontStyle: "italic" },
    },

    // Bash/shell
    {
      scope: [
        "variable.other.normal.shell",
        "punctuation.definition.variable.shell",
      ],
      settings: { foreground: "#9CDCFE" },
    },
  ],
};
