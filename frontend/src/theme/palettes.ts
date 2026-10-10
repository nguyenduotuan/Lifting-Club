// Every theme must define each token; the stylesheets consume them as var(--<token>).
const tokenNames = [
  "bg", "surface", "surface-raised", "surface-sunk", "surface-high",
  "line", "line-strong",
  "text", "muted", "quiet",
  "text-1", "text-2", "text-3", "text-4", "text-5", "text-6",
  "accent", "accent-strong", "accent-dark", "on-accent",
  "error", "error-rgb",
  // Bare "r, g, b" triplets so CSS can apply its own alpha: rgba(var(--ink-rgb), .1)
  "ink-rgb", "shade-rgb", "panel-rgb", "shadow-rgb",
  "tint-green-rgb", "tint-green-line-rgb", "tint-green-text",
  "tint-gold-rgb", "tint-gold-line-rgb", "tint-gold-text",
  "tint-blue-rgb", "tint-blue-line-rgb", "tint-blue-text",
  "tint-red-rgb", "tint-red-line-rgb", "tint-red-text",
  "glow",
] as const;

export type TokenName = (typeof tokenNames)[number];
export type Palette = Record<TokenName, string>;

const rgba = (rgb: string, alpha: number) => `rgba(${rgb}, ${alpha})`;

interface Tint { rgb: string; line: string; text: string }

function tint(name: "green" | "gold" | "blue" | "red", { rgb, line, text }: Tint) {
  return {
    [`tint-${name}-rgb`]: rgb,
    [`tint-${name}-line-rgb`]: line,
    [`tint-${name}-text`]: text,
  } as Pick<Palette, `tint-${typeof name}-rgb` | `tint-${typeof name}-line-rgb` | `tint-${typeof name}-text`>;
}

// Text ramp t1 (strongest) .. t6 (faintest), generated from one ink color per theme.
function textRamp(colors: [string, string, string, string, string, string]) {
  const [t1, t2, t3, t4, t5, t6] = colors;
  return { "text-1": t1, "text-2": t2, "text-3": t3, "text-4": t4, "text-5": t5, "text-6": t6 };
}

const noGlow = "0 0 0 transparent";

const original: Palette = {
  bg: "#11151d", surface: "#181d27", "surface-raised": "#202633", "surface-sunk": "#0d1118", "surface-high": "#424b5a",
  line: rgba("207, 216, 230", 0.12), "line-strong": rgba("207, 216, 230", 0.21),
  text: "#e9edf4", muted: "#a9b3c3", quiet: "#818b9b",
  ...textRamp(["#f3f5f8", "#e9edf4", "#d5dce7", "#b6c0d0", "#9aa5b6", "#7e899a"]),
  accent: "#aab5c5", "accent-strong": "#e3e9f2", "accent-dark": "#7c8a9e", "on-accent": "#11151d",
  error: "#e2a3a1", "error-rgb": "226, 163, 161",
  "ink-rgb": "207, 216, 230", "shade-rgb": "10, 14, 22", "panel-rgb": "24, 29, 39", "shadow-rgb": "0, 0, 0",
  ...tint("green", { rgb: "58, 94, 72", line: "139, 174, 148", text: "#a9c6b1" }),
  ...tint("gold", { rgb: "104, 78, 39", line: "191, 164, 112", text: "#d1bb8b" }),
  ...tint("blue", { rgb: "49, 70, 100", line: "124, 150, 183", text: "#a9bfd9" }),
  ...tint("red", { rgb: "106, 54, 52", line: "190, 129, 122", text: "#d5aaa4" }),
  glow: noGlow,
};

const monochrome: Palette = {
  bg: "#f2f2f2", surface: "#fafafa", "surface-raised": "#ffffff", "surface-sunk": "#e8e8e8", "surface-high": "#d0d0d0",
  line: rgba("20, 20, 20", 0.12), "line-strong": rgba("20, 20, 20", 0.22),
  text: "#202020", muted: "#5e5e5e", quiet: "#858585",
  ...textRamp(["#111111", "#202020", "#383838", "#555555", "#737373", "#909090"]),
  accent: "#202020", "accent-strong": "#4a4a4a", "accent-dark": "#080808", "on-accent": "#ffffff",
  error: "#bd3d3d", "error-rgb": "189, 61, 61",
  "ink-rgb": "20, 20, 20", "shade-rgb": "230, 230, 230", "panel-rgb": "255, 255, 255", "shadow-rgb": "20, 20, 20",
  ...tint("green", { rgb: "74, 125, 91", line: "69, 125, 89", text: "#356344" }),
  ...tint("gold", { rgb: "157, 117, 49", line: "143, 103, 37", text: "#75531c" }),
  ...tint("blue", { rgb: "70, 105, 139", line: "62, 98, 134", text: "#345777" }),
  ...tint("red", { rgb: "151, 76, 76", line: "143, 65, 65", text: "#783838" }),
  glow: noGlow,
};

const whiteGold: Palette = {
  bg: "#f3f1eb", surface: "#faf9f5", "surface-raised": "#fffefa", "surface-sunk": "#e9e6dd", "surface-high": "#d3cbb9",
  line: rgba("44, 40, 31", 0.13), "line-strong": rgba("44, 40, 31", 0.24),
  text: "#28261f", muted: "#625d50", quiet: "#898272",
  ...textRamp(["#181713", "#28261f", "#403d34", "#625d50", "#7a7465", "#918a79"]),
  accent: "#a88c53", "accent-strong": "#d0bc8d", "accent-dark": "#78623a", "on-accent": "#17140e",
  error: "#6a5f4d", "error-rgb": "106, 95, 77",
  "ink-rgb": "38, 36, 30", "shade-rgb": "245, 243, 237", "panel-rgb": "250, 249, 245", "shadow-rgb": "31, 28, 21",
  ...tint("green", { rgb: "142, 130, 101", line: "155, 140, 104", text: "#675a3f" }),
  ...tint("gold", { rgb: "142, 130, 101", line: "155, 140, 104", text: "#675a3f" }),
  ...tint("blue", { rgb: "142, 130, 101", line: "155, 140, 104", text: "#675a3f" }),
  ...tint("red", { rgb: "142, 130, 101", line: "155, 140, 104", text: "#675a3f" }),
  glow: "0 0 14px rgba(168, 140, 83, 0.18)",
};

const darkWhiteGold: Palette = {
  bg: "#0c0c0b", surface: "#151514", "surface-raised": "#1f1f1d", "surface-sunk": "#070707", "surface-high": "#41403b",
  line: rgba("205, 196, 173", 0.13), "line-strong": rgba("205, 196, 173", 0.24),
  text: "#eeeae1", muted: "#b5b0a5", quiet: "#89857c",
  ...textRamp(["#fbf9f4", "#eeeae1", "#d9d5cb", "#b5b0a5", "#979287", "#77736a"]),
  accent: "#b49a65", "accent-strong": "#d0bc8d", "accent-dark": "#81704a", "on-accent": "#11100d",
  error: "#a39a89", "error-rgb": "163, 154, 137",
  "ink-rgb": "205, 196, 173", "shade-rgb": "8, 8, 7", "panel-rgb": "21, 21, 20", "shadow-rgb": "0, 0, 0",
  ...tint("green", { rgb: "94, 91, 80", line: "153, 146, 126", text: "#c1b89f" }),
  ...tint("gold", { rgb: "103, 88, 58", line: "183, 159, 111", text: "#d2c094" }),
  ...tint("blue", { rgb: "82, 83, 82", line: "151, 150, 145", text: "#c3c1ba" }),
  ...tint("red", { rgb: "100, 83, 76", line: "169, 146, 130", text: "#c9b8a6" }),
  glow: "0 0 14px rgba(180, 154, 101, 0.2)",
};

const kawaii: Palette = {
  bg: "#fff1f7", surface: "#fff8fb", "surface-raised": "#ffffff", "surface-sunk": "#f9dfeb", "surface-high": "#f1b9d3",
  line: rgba("170, 55, 105", 0.14), "line-strong": rgba("170, 55, 105", 0.25),
  text: "#51243c", muted: "#87516d", quiet: "#ad7994",
  ...textRamp(["#42172f", "#51243c", "#6b3552", "#87516d", "#a66d89", "#bd8ca4"]),
  accent: "#ec5b9b", "accent-strong": "#ff9ec7", "accent-dark": "#c73578", "on-accent": "#ffffff",
  error: "#c93454", "error-rgb": "201, 52, 84",
  "ink-rgb": "170, 55, 105", "shade-rgb": "255, 235, 244", "panel-rgb": "255, 250, 252", "shadow-rgb": "121, 45, 84",
  ...tint("green", { rgb: "70, 151, 112", line: "69, 144, 105", text: "#397c5a" }),
  ...tint("gold", { rgb: "204, 143, 48", line: "173, 113, 26", text: "#96600f" }),
  ...tint("blue", { rgb: "95, 137, 198", line: "74, 115, 174", text: "#3e659c" }),
  ...tint("red", { rgb: "210, 79, 111", line: "182, 55, 88", text: "#a93450" }),
  glow: "0 0 16px rgba(236, 91, 155, 0.24)",
};

const dracula: Palette = {
  bg: "#140306", surface: "#1f050a", "surface-raised": "#2c0810", "surface-sunk": "#0e0204", "surface-high": "#5a1420",
  line: rgba("255, 60, 85", 0.16), "line-strong": rgba("255, 60, 85", 0.3),
  text: "#ffe3e6", muted: "#c9848f", quiet: "#94525c",
  ...textRamp(["#fff1f2", "#ffdfe2", "#f7c2c8", "#e39aa4", "#c47580", "#a05560"]),
  accent: "#ff1f3d", "accent-strong": "#ff5c73", "accent-dark": "#b3001b", "on-accent": "#1a0004",
  error: "#ff8a97", "error-rgb": "255, 138, 151",
  "ink-rgb": "255, 110, 130", "shade-rgb": "8, 0, 2", "panel-rgb": "36, 6, 12", "shadow-rgb": "0, 0, 0",
  ...tint("green", { rgb: "170, 20, 45", line: "255, 95, 115", text: "#ff9aa6" }),
  ...tint("gold", { rgb: "200, 50, 30", line: "255, 120, 90", text: "#ff9d85" }),
  ...tint("blue", { rgb: "150, 10, 60", line: "255, 80, 130", text: "#ff8aa8" }),
  ...tint("red", { rgb: "220, 20, 40", line: "255, 70, 85", text: "#ff7d88" }),
  glow: "0 0 16px rgba(255, 31, 61, 0.45)",
};

export const themes = [
  { id: "original", name: "Original", description: "The original deep navy and graphite Circuit look", swatch: "#aab5c5", colorScheme: "dark", palette: original },
  { id: "monochrome", name: "Monochrome", description: "Crisp white, soft gray, and bold black", swatch: "#202020", colorScheme: "light", palette: monochrome },
  { id: "white-gold", name: "White Gold", description: "A Baroque-inspired ivory, gold, and charcoal palette", swatch: "#a88c53", colorScheme: "light", palette: whiteGold },
  { id: "dark-white-gold", name: "Dark White Gold", description: "Near-black charcoal with restrained antique gold", swatch: "#b49a65", colorScheme: "dark", palette: darkWhiteGold },
  { id: "kawaii", name: "Kawaii", description: "Cute, soft pink with a rosy glow", swatch: "#ec5b9b", colorScheme: "light", palette: kawaii },
  { id: "dracula", name: "Dracula", description: "Deep red with neon red highlights", swatch: "#ff1f3d", colorScheme: "dark", palette: dracula },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
