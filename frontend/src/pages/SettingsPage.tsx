import { useEffect, useState, type CSSProperties } from "react";
import { Check, Info, Palette } from "lucide-react";
import { applyTheme, getStoredTheme, themes, type ThemeId } from "../theme";

export default function SettingsPage() {
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme);

  useEffect(() => { applyTheme(theme); }, [theme]);

  return (
    <section className="page-column settings-page">
      <header className="page-heading">
        <div><p className="eyebrow">YOUR CIRCUIT</p><h1>Application Settings<span className="heading-period">.</span></h1></div>
      </header>

      <section className="settings-section" aria-labelledby="settings-themes-heading">
        <header className="settings-section-heading">
          <span className="settings-section-icon"><Palette size={18} /></span>
          <div><p className="eyebrow">APPEARANCE</p><h2 id="settings-themes-heading">Themes</h2></div>
        </header>
        <p className="settings-section-description">Choose a look for your Circuit experience.</p>
        <div className="theme-options" role="group" aria-label="Choose a theme">
          {themes.map((option) => (
            <button
              className={`theme-option${theme === option.id ? " theme-option-active" : ""}`}
              type="button"
              key={option.id}
              aria-pressed={theme === option.id}
              onClick={() => setTheme(option.id)}
            >
              <span className="theme-swatch" style={{ "--swatch-color": option.swatch } as CSSProperties}>
                {theme === option.id && <Check size={16} />}
              </span>
              <span className="theme-option-copy"><strong>{option.name}</strong><small>{option.description}</small></span>
              {theme === option.id && <span className="theme-current">CURRENT</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section settings-info" aria-labelledby="settings-info-heading">
        <header className="settings-section-heading">
          <span className="settings-section-icon"><Info size={18} /></span>
          <div><p className="eyebrow">THE IDEA</p><h2 id="settings-info-heading">About Circuit</h2></div>
        </header>
        <p>Circuit started with a simple idea: a place to post cool lifts with friends, celebrate each other’s progress, and stay motivated together.</p>
        <p>That idea is still at the heart of the app, and it’s still developing. Circuit is growing into a shared space for training and the people around it, with lift posts alongside goals, challenges, and plans to meet up. The aim is to make progress feel a little less solitary, one session and one shared milestone at a time.</p>
      </section>
    </section>
  );
}