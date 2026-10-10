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

export const steel: Palette = {
  bg: "#16181c", surface: "#1f2227", "surface-raised": "#282b31", "surface-sunk": "#15171b", "surface-high": "#50535b",
  line: rgba("222, 223, 228", 0.11), "line-strong": rgba("222, 223, 228", 0.19),
  text: "#e9eaed", muted: "#a8abb3", quiet: "#7e828b",
  ...textRamp(["#f0f0f2", "#e4e5e9", "#d0d2d8", "#b4b6bc", "#9a9ca3", "#85878e"]),
  accent: "#c5c8cf", "accent-strong": "#eef0f3", "accent-dark": "#8b909a", "on-accent": "#191b20",
  error: "#e2a3a1", "error-rgb": "226, 163, 161",
  "ink-rgb": "222, 223, 228", "shade-rgb": "10, 11, 14", "panel-rgb": "30, 34, 37", "shadow-rgb": "0, 0, 0",
  ...tint("green", { rgb: "80, 112, 91", line: "177, 199, 183", text: "#b8d0c0" }),
  ...tint("gold", { rgb: "116, 84, 39", line: "215, 185, 130", text: "#d7c094" }),
  ...tint("blue", { rgb: "70, 98, 128", line: "163, 187, 211", text: "#b9d0e4" }),
  ...tint("red", { rgb: "115, 67, 58", line: "205, 157, 145", text: "#d7afa4" }),
  glow: noGlow,
};

const field: Palette = { ...steel, accent: "#a9c6ad", "accent-strong": "#e1f0e2", "accent-dark": "#708e76" };

const signal: Palette = { ...steel, accent: "#e6a18d", "accent-strong": "#ffe4d9", "accent-dark": "#a96554" };

const babyBlue: Palette = {
  bg: "#e3f1fb", surface: "#f3f9fe", "surface-raised": "#ffffff", "surface-sunk": "#d3e8f7", "surface-high": "#a8cfea",
  line: rgba("20, 60, 110", 0.14), "line-strong": rgba("20, 60, 110", 0.24),
  text: "#12304f", muted: "#4f6f8f", quiet: "#7a96b0",
  ...textRamp(["#0b2440", "#12304f", "#1d405f", "#3d5f80", "#58779a", "#7590ab"]),
  accent: "#2b8bd6", "accent-strong": "#7cc4f2", "accent-dark": "#1c6aa8", "on-accent": "#08233d",
  error: "#c2463d", "error-rgb": "194, 70, 61",
  "ink-rgb": "20, 60, 110", "shade-rgb": "232, 244, 253", "panel-rgb": "255, 255, 255", "shadow-rgb": "40, 90, 140",
  ...tint("green", { rgb: "58, 160, 205", line: "40, 120, 170", text: "#1d6f9c" }),
  ...tint("gold", { rgb: "96, 140, 225", line: "60, 100, 190", text: "#3558b0" }),
  ...tint("blue", { rgb: "60, 125, 210", line: "35, 95, 170", text: "#1f5fa6" }),
  ...tint("red", { rgb: "130, 120, 225", line: "95, 85, 190", text: "#5a4fb5" }),
  glow: noGlow,
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
  { id: "steel", name: "Steel", description: "The original Circuit look", swatch: "#c5c8cf", colorScheme: "dark", palette: steel },
  { id: "field", name: "Field", description: "A quieter, natural accent", swatch: "#a9c6ad", colorScheme: "dark", palette: field },
  { id: "signal", name: "Signal", description: "A warmer training-room accent", swatch: "#e6a18d", colorScheme: "dark", palette: signal },
  { id: "baby-blue", name: "Baby Blue", description: "A bright, airy light theme", swatch: "#89cff0", colorScheme: "light", palette: babyBlue },
  { id: "dracula", name: "Dracula", description: "Deep red with neon red highlights", swatch: "#ff1f3d", colorScheme: "dark", palette: dracula },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
