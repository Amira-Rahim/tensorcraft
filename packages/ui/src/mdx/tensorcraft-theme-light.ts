/**
 * Custom Shiki theme for Tensorcraft code blocks.
 *
 * Light-scheme sibling of ./tensorcraft-theme.ts (Task 12, light-mode
 * rollout, 2026-07-22). Sits on #F6F6F2 (light --tc-code-bg). Every
 * foreground below is darkened from the dark theme's hue until it clears
 * 4.5:1 WCAG AA against that background - see
 * docs/superpowers/plans/2026-07-22-light-mode.md Task 12 for the
 * dark->light derivation table. Scope lists are identical to the dark
 * file; only the colors change.
 */
import type { ThemeRegistration } from "shiki";

export const tensorcraftThemeLight: ThemeRegistration = {
  name: "tensorcraft-light",
  type: "light",
  colors: {
    // Editor chrome
    "editor.background": "#F6F6F2",
    "editor.foreground": "#2E2E2E",
    "editorLineNumber.foreground": "#B0B0AC",
    "editorLineNumber.activeForeground": "#467A60",
    "editor.selectionBackground": "#4A806430",
    "editor.lineHighlightBackground": "#EDEDE8",

    // Bracket matching
    "editorBracketMatch.background": "#4A806420",
    "editorBracketMatch.border": "#4A806460",
  },
  tokenColors: [
    // Comments - muted. Locked by tensorcraft-theme.test.ts.
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#667366", fontStyle: "italic" },
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
      settings: { foreground: "#467A60" },
    },

    // Strings - warm accent
    {
      scope: [
        "string",
        "string.quoted",
        "string.template",
        "punctuation.definition.string",
      ],
      settings: { foreground: "#896A33" },
    },

    // Numbers - soft green
    {
      scope: ["constant.numeric"],
      settings: { foreground: "#567844" },
    },

    // Constants (true, false, null, undefined) - soft blue
    {
      scope: [
        "constant.language",
        "constant.language.boolean",
        "constant.language.null",
        "constant.language.undefined",
      ],
      settings: { foreground: "#4E748E" },
    },

    // Functions/methods - warm yellow
    {
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: { foreground: "#72722F" },
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
      settings: { foreground: "#2871BE" },
    },

    // Variables, parameters - clean text
    {
      scope: ["variable", "variable.other", "variable.parameter"],
      settings: { foreground: "#3C3C3C" },
    },

    // Properties/fields - light blue
    {
      scope: [
        "variable.other.property",
        "variable.other.object.property",
        "meta.object-literal.key",
      ],
      settings: { foreground: "#0275B3" },
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
      settings: { foreground: "#2E2E2E" },
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
      settings: { foreground: "#6F6F6F" },
    },

    // Template literal expressions - primary
    {
      scope: [
        "punctuation.definition.template-expression",
        "string.template punctuation.definition.template-expression",
      ],
      settings: { foreground: "#467A60" },
    },

    // Regex
    {
      scope: ["string.regexp"],
      settings: { foreground: "#C54141" },
    },

    // Decorators / annotations
    {
      scope: ["meta.decorator", "punctuation.decorator"],
      settings: { foreground: "#72722F" },
    },

    // Tags (JSX/HTML)
    {
      scope: ["entity.name.tag", "punctuation.definition.tag"],
      settings: { foreground: "#467A60" },
    },

    // Tag attributes
    {
      scope: ["entity.other.attribute-name"],
      settings: { foreground: "#0275B3" },
    },

    // JSON keys
    {
      scope: ["support.type.property-name.json"],
      settings: { foreground: "#0275B3" },
    },

    // Markdown headings
    {
      scope: ["markup.heading", "entity.name.section"],
      settings: { foreground: "#467A60", fontStyle: "bold" },
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
      settings: { foreground: "#4E748E", fontStyle: "italic" },
    },

    // Bash/shell
    {
      scope: [
        "variable.other.normal.shell",
        "punctuation.definition.variable.shell",
      ],
      settings: { foreground: "#0275B3" },
    },
  ],
};
