import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, CircleUserRound, Dumbbell, LogOut, Menu, Plus, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";

export default function Navigation() {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    setLocation("/login");
  }

  if (!user) return null;

  return (
    <>
      <header className="mobile-topbar">
        <Link href="/" className="brand-lockup" aria-label="Lift Club home">
          <span className="brand-symbol"><Dumbbell size={19} strokeWidth={1.7} /></span>
          <span className="brand-copy"><strong>LIFT CLUB</strong><small>PRIVATE TRAINING CLUB</small></span>
        </Link>
        <button className="icon-button mobile-menu-toggle" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="mobile-navigation" title="Open menu">
          <Menu size={21} />
        </button>
      </header>
      {menuOpen && <button className="mobile-menu-backdrop" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" />}
      <aside className={`side-nav${menuOpen ? " side-nav-open" : ""}`} id="mobile-navigation">
        <Link href="/" className="brand-lockup" aria-label="Lift Club home" onClick={() => setMenuOpen(false)}>
          <span className="brand-symbol"><Dumbbell size={20} strokeWidth={1.7} /></span>
          <span className="brand-copy"><strong>LIFT CLUB</strong><small>PRIVATE TRAINING CLUB</small></span>
        </Link>
        <button className="icon-button mobile-nav-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" title="Close menu">
          <X size={19} />
        </button>

        <nav className="primary-nav" aria-label="Main navigation">
          <Link href="/" className={`nav-item${location === "/" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Activity size={19} strokeWidth={1.8} /><span>FYP</span>
          </Link>
          <Link href="/create" className={`nav-item${location === "/create" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Plus size={19} strokeWidth={1.8} /><span>Create</span>
          </Link>
          <Link href={`/profile/${user.username}`} className={`nav-item${location.startsWith("/profile") ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <CircleUserRound size={19} strokeWidth={1.8} /><span>Profile</span>
          </Link>
        </nav>

        <div className="nav-account">
          <Avatar username={user.username} displayName={user.display_name} image={user.profile_image} />
          <div className="nav-account-copy"><strong>{user.display_name}</strong><span>@{user.username}</span></div>
          <button className="icon-button nav-logout" type="button" onClick={handleSignOut} aria-label="Log out" title="Log out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}