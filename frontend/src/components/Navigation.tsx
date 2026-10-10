import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, CalendarDays, Dumbbell, Flag, Home, LogOut, Menu, Plus, Settings2, Trophy, X } from "lucide-react";
import { getChallenges } from "../api/challenges";
import { getEvents } from "../api/events";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";

export default function Navigation() {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refreshNotifications = async () => {
      const [challengeResult, eventResult] = await Promise.allSettled([getChallenges(), getEvents()]);
      if (!active) return;
      const challengeInvites = challengeResult.status === "fulfilled"
        ? challengeResult.value.reduce((count, challenge) => count + challenge.participants.filter((person) => person.user_id === user.id && person.status === "invited").length, 0)
        : 0;
      const eventInvites = eventResult.status === "fulfilled"
        ? eventResult.value.reduce((count, event) => count + event.participants.filter((person) => person.user_id === user.id && person.status === "invited").length, 0)
        : 0;
      setUnreadCount(challengeInvites + eventInvites);
    };
    void refreshNotifications();
    const interval = window.setInterval(() => void refreshNotifications(), 60_000);
    window.addEventListener("focus", refreshNotifications);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshNotifications);
    };
  }, [location, user?.id]);

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

  const notificationLabel = unreadCount > 0 ? `Notifications, ${unreadCount} new` : "Notifications";
  const notificationBadge = unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>;

  return (
    <>
      <header className="mobile-topbar">
        <Link href="/" className="brand-lockup" aria-label="Circuit home">
          <span className="brand-symbol"><Dumbbell size={19} strokeWidth={1.7} /></span>
          <span className="brand-copy"><strong>CIRCUIT</strong><small>SHARED MILESTONES</small></span>
        </Link>
        <div className="mobile-topbar-actions">
          <Link href="/notifications" className={`mobile-notification-link${location === "/notifications" ? " mobile-notification-link-active" : ""}`} aria-label={notificationLabel} title={notificationLabel}>
            <Bell size={19} strokeWidth={1.8} />{notificationBadge}
          </Link>
          <button className="icon-button mobile-menu-toggle" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="mobile-navigation" title="Open menu"><Menu size={21} /></button>
        </div>
      </header>
      {menuOpen && <button className="mobile-menu-backdrop" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" />}
      <aside className={`side-nav${menuOpen ? " side-nav-open" : ""}`} id="mobile-navigation">
        <Link href="/" className="brand-lockup" aria-label="Circuit home" onClick={() => setMenuOpen(false)}>
          <span className="brand-symbol"><Dumbbell size={20} strokeWidth={1.7} /></span>
          <span className="brand-copy"><strong>CIRCUIT</strong><small>SHARED MILESTONES</small></span>
        </Link>
        <button className="icon-button mobile-nav-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" title="Close menu">
          <X size={19} />
        </button>

        <nav className="primary-nav" aria-label="Main navigation">
          <Link href="/" className={`nav-item${location === "/" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Home size={19} strokeWidth={1.8} /><span>Home</span>
          </Link>
          <Link href="/notifications" className={`nav-item${location === "/notifications" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)} aria-label={notificationLabel}>
            <Bell size={19} strokeWidth={1.8} /><span>Notifications</span>{notificationBadge}
          </Link>
          <Link href="/goals" className={`nav-item${location === "/goals" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Flag size={19} strokeWidth={1.8} /><span>Goals</span>
          </Link>
          <Link href="/challenges" className={`nav-item${location.startsWith("/challenges") ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Trophy size={19} strokeWidth={1.8} /><span>Challenges</span>
          </Link>
          <Link href="/events" className={`nav-item${location === "/events" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <CalendarDays size={19} strokeWidth={1.8} /><span>Events</span>
          </Link>
          <Link href="/posts" className={`nav-item nav-item-posts${location === "/posts" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Plus size={19} strokeWidth={1.8} /><span>Posts</span>
          </Link>
          <Link href="/settings" className={`nav-item${location === "/settings" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Settings2 size={19} strokeWidth={1.8} /><span>Application Settings</span>
          </Link>
        </nav>

        <div className="nav-account">
          <Link href={`/profile/${user.username}`} className="nav-account-profile" onClick={() => setMenuOpen(false)} aria-label={`View ${user.display_name}'s profile`}>
            <Avatar username={user.username} displayName={user.display_name} image={user.profile_image} />
            <span className="nav-account-copy"><strong>{user.display_name}</strong><span>@{user.username}</span></span>
          </Link>
          <button className="icon-button nav-logout" type="button" onClick={handleSignOut} aria-label="Log out" title="Log out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}