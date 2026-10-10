import { useState, type FormEvent } from "react";
import { ArrowUpRight, Dumbbell, LockKeyhole, UserRoundPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (mode === "register" && password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "register") {
        await signUp(username.trim(), displayName.trim(), password);
      } else {
        await signIn(username.trim(), password);
      }
      setLocation("/");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to continue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-sigil" aria-hidden="true"><span /></div>
      <div className="login-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <div className="login-layout">
        <section className="login-intro">
          <div className="login-brand"><span className="brand-symbol"><Dumbbell size={20} strokeWidth={1.7} /></span><span>CIRCUIT</span></div>
          <p className="eyebrow">MILESTONES, MADE TOGETHER</p>
          <h1>Make it count.<br /><em>Make it shared.</em></h1>
          <div className="login-rule"><span />A record of the events, challenges, and wins you share.</div>
        </section>

        <form className="login-panel" onSubmit={handleSubmit}>
          <div className="login-panel-top">
            <span className="login-lock">{mode === "login" ? <LockKeyhole size={17} /> : <UserRoundPlus size={17} />}</span>
            <span>{mode === "login" ? "MEMBER ACCESS" : "NEW ACCOUNT"}</span>
          </div>
          <div className="auth-mode-switch" role="group" aria-label="Account access">
            <button type="button" className={mode === "login" ? "auth-mode-active" : ""} aria-pressed={mode === "login"} onClick={() => { setMode("login"); setError(""); }}>Log in</button>
            <button type="button" className={mode === "register" ? "auth-mode-active" : ""} aria-pressed={mode === "register"} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
          </div>
          <h2>{mode === "login" ? "Welcome back" : "Join Circuit"}</h2>
          <p className="login-subtitle">{mode === "login" ? "Pick up where you left off." : "Make a place for your next session."}</p>
          {mode === "register" && <>
            <label className="field-label" htmlFor="display-name">Display name</label>
            <input id="display-name" name="name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} />
          </>}
          <label className="field-label" htmlFor="username">Username</label>
          <input id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required minLength={mode === "register" ? 3 : 1} maxLength={32} />
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === "register" ? 8 : 1} maxLength={128} />
          {mode === "register" && <>
            <label className="field-label" htmlFor="password-confirmation">Confirm password</label>
            <input id="password-confirmation" name="password-confirmation" type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required maxLength={128} />
          </>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary login-submit" type="submit" disabled={submitting}>
            <span>{submitting ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Log in" : "Create account")}</span><ArrowUpRight size={17} />
          </button>
          <p className="login-footnote">{mode === "login" ? "A small circle. A lasting record." : "Your training circle begins here."}</p>
        </form>
      </div>
      <div className="login-signature"><span>01</span><span>TRAIN TOGETHER</span><span>EST. ALWAYS IN PROGRESS</span></div>
    </main>
  );
}