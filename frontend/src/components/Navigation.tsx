import { Link, useLocation } from "wouter";
import { Activity, CircleUserRound, Dumbbell, LogOut, Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";

export default function Navigation() {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();

  async function handleSignOut() {
    await signOut();
    setLocation("/login");
  }

  if (!user) return null;

  return (
    <aside className="side-nav">
      <Link href="/" className="brand-lockup" aria-label="Lift Club home">
        <span className="brand-symbol"><Dumbbell size={20} strokeWidth={1.7} /></span>
        <span className="brand-copy"><strong>LIFT CLUB</strong><small>PRIVATE TRAINING CLUB</small></span>
      </Link>

      <nav className="primary-nav" aria-label="Main navigation">
        <Link href="/" className={`nav-item${location === "/" ? " nav-item-active" : ""}`}>
          <Activity size={19} strokeWidth={1.8} /><span>FYP</span>
        </Link>
        <Link href="/create" className={`nav-item${location === "/create" ? " nav-item-active" : ""}`}>
          <Plus size={19} strokeWidth={1.8} /><span>Create</span>
        </Link>
        <Link href={`/profile/${user.username}`} className={`nav-item${location.startsWith("/profile") ? " nav-item-active" : ""}`}>
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
  );
}