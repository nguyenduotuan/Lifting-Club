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

const blackGold: Palette = {
  bg: "#10100e", surface: "#191916", "surface-raised": "#24231e", "surface-sunk": "#0b0b09", "surface-high": "#51462b",
  line: rgba("226, 190, 112", 0.14), "line-strong": rgba("226, 190, 112", 0.28),
  text: "#f2eee3", muted: "#c0b89f", quiet: "#928a75",
  ...textRamp(["#fffdf6", "#f2eee3", "#ded7c4", "#c0b89f", "#a59b80", "#81775f"]),
  accent: "#d9b45b", "accent-strong": "#f5d88a", "accent-dark": "#a78332", "on-accent": "#17130a",
  error: "#e58b7f", "error-rgb": "229, 139, 127",
  "ink-rgb": "226, 190, 112", "shade-rgb": "8, 8, 6", "panel-rgb": "25, 25, 22", "shadow-rgb": "0, 0, 0",
  ...tint("green", { rgb: "37, 91, 64", line: "112, 176, 132", text: "#a4d1ae" }),
  ...tint("gold", { rgb: "112, 83, 27", line: "226, 190, 112", text: "#f0d58d" }),
  ...tint("blue", { rgb: "43, 71, 99", line: "111, 151, 188", text: "#a9c8e2" }),
  ...tint("red", { rgb: "102, 45, 38", line: "196, 112, 99", text: "#e2a79b" }),
  glow: "0 0 16px rgba(217, 180, 91, 0.28)",
};

const magenta: Palette = {
  bg: "#10091b", surface: "#1b102b", "surface-raised": "#28163d", "surface-sunk": "#0b0612", "surface-high": "#522b73",
  line: rgba("207, 126, 255", 0.16), "line-strong": rgba("207, 126, 255", 0.32),
  text: "#f5eaff", muted: "#c1a9d8", quiet: "#9278ad",
  ...textRamp(["#fff8ff", "#f5eaff", "#e3cef4", "#c6a8df", "#a587c0", "#80659b"]),
  accent: "#d946ff", "accent-strong": "#f09bff", "accent-dark": "#a51bd1", "on-accent": "#190821",
  error: "#ff829d", "error-rgb": "255, 130, 157",
  "ink-rgb": "207, 126, 255", "shade-rgb": "6, 2, 12", "panel-rgb": "27, 16, 43", "shadow-rgb": "5, 0, 12",
  ...tint("green", { rgb: "38, 112, 93", line: "105, 235, 190", text: "#9ff5d7" }),
  ...tint("gold", { rgb: "128, 82, 32", line: "255, 193, 89", text: "#ffd38a" }),
  ...tint("blue", { rgb: "54, 65, 153", line: "132, 153, 255", text: "#b2c1ff" }),
  ...tint("red", { rgb: "132, 32, 76", line: "255, 112, 165", text: "#ff9bc2" }),
  glow: "0 0 18px rgba(217, 70, 255, 0.38)",
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
  { id: "monochrome", name: "Monochrome", description: "Crisp white, soft gray, and bold black", swatch: "#202020", colorScheme: "light", palette: monochrome },
  { id: "white-gold", name: "White Gold", description: "A Baroque-inspired ivory, gold, and charcoal palette", swatch: "#a88c53", colorScheme: "light", palette: whiteGold },
  { id: "black-gold", name: "Black Gold", description: "Warm gold accents on a deep black finish", swatch: "#d9b45b", colorScheme: "dark", palette: blackGold },
  { id: "magenta", name: "Magenta", description: "Shiny violet neon on a deep night backdrop", swatch: "#d946ff", colorScheme: "dark", palette: magenta },
  { id: "kawaii", name: "Kawaii", description: "Cute, soft pink with a rosy glow", swatch: "#ec5b9b", colorScheme: "light", palette: kawaii },
  { id: "baby-blue", name: "Baby Blue", description: "A bright, airy light theme", swatch: "#89cff0", colorScheme: "light", palette: babyBlue },
  { id: "dracula", name: "Dracula", description: "Deep red with neon red highlights", swatch: "#ff1f3d", colorScheme: "dark", palette: dracula },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
