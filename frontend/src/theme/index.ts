import { themes, type ThemeId } from "./palettes";

export { themes, type ThemeId };

const STORAGE_KEY = "circuit-theme";
export const DEFAULT_THEME: ThemeId = "steel";

export function isThemeId(value: string | null): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}

export function getStoredTheme(): ThemeId {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return isThemeId(saved) ? saved : DEFAULT_THEME;
}

// Writes every palette token onto :root so switching themes never leaves stale values behind.
export function applyTheme(id: ThemeId): void {
  const theme = themes.find((candidate) => candidate.id === id)!;
  const root = document.documentElement;
  for (const [token, value] of Object.entries(theme.palette)) root.style.setProperty(`--${token}`, value);
  root.style.colorScheme = theme.colorScheme;
  root.dataset.theme = id;
  window.localStorage.setItem(STORAGE_KEY, id);
}

export function initTheme(): void {
  applyTheme(getStoredTheme());
}
