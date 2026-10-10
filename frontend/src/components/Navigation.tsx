import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Bell, CalendarDays, CircleUserRound, Dumbbell, Flag, Home, LogOut, Menu, Plus, Search, Trophy, X } from "lucide-react";
import { getUsers } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import type { User } from "../types/user";
import Avatar from "./Avatar";

export default function Navigation() {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [membersRetry, setMembersRetry] = useState(0);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [memberQuery, setMemberQuery] = useState("");

  useEffect(() => {
    if (membersLoaded) return;
    let active = true;
    setMembersError("");
    setMembersLoading(true);
    getUsers()
      .then((nextMembers) => {
        if (!active) return;
        setMembers(nextMembers.some((member) => member.id === user?.id) || !user ? nextMembers : [...nextMembers, user]);
        setMembersLoaded(true);
      })
      .catch((loadError) => {
        if (active) setMembersError(loadError instanceof Error ? loadError.message : "Members could not be loaded.");
      })
      .finally(() => active && setMembersLoading(false));
    return () => { active = false; };
  }, [membersLoaded, membersRetry]);

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

  const normalizedQuery = memberQuery.trim().toLocaleLowerCase();
  const matchingMembers = members.filter((member) =>
    `${member.display_name} ${member.username}`.toLocaleLowerCase().includes(normalizedQuery),
  );

  return (
    <>
      <header className="mobile-topbar">
        <Link href="/" className="brand-lockup" aria-label="Circuit home">
          <span className="brand-symbol"><Dumbbell size={19} strokeWidth={1.7} /></span>
          <span className="brand-copy"><strong>CIRCUIT</strong><small>SHARED MILESTONES</small></span>
        </Link>
        <button className="icon-button mobile-menu-toggle" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="mobile-navigation" title="Open menu">
          <Menu size={21} />
        </button>
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
          <Link href="/feed" className={`nav-item${location === "/feed" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Activity size={19} strokeWidth={1.8} /><span>FYP</span>
          </Link>
          <Link href="/create" className={`nav-item${location === "/create" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Plus size={19} strokeWidth={1.8} /><span>Post</span>
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
          <Link href="/notifications" className={`nav-item${location === "/notifications" ? " nav-item-active" : ""}`} onClick={() => setMenuOpen(false)}>
            <Bell size={19} strokeWidth={1.8} /><span>Notifications</span>
          </Link>
        </nav>

        <section className="member-search-section" aria-label="Find members">
          <label className="member-search-field">
            <Search size={15} aria-hidden="true" />
            <input type="search" value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="Search members" aria-label="Search members" />
          </label>
          <div className="member-search-results" aria-live="polite">
            {membersLoading && <p className="member-search-state">Loading members...</p>}
            {!membersLoading && membersError && <p className="member-search-state member-search-error">{membersError} <button className="text-button" type="button" onClick={() => setMembersRetry((attempt) => attempt + 1)}>Try again</button></p>}
            {!membersLoading && !membersError && matchingMembers.map((member) => (
              <Link href={`/profile/${member.username}`} className="member-search-result" key={member.id} onClick={() => setMenuOpen(false)}>
                <Avatar username={member.username} displayName={member.display_name} image={member.profile_image} />
                <span className="member-search-copy"><strong>{member.display_name}</strong><small>@{member.username}</small></span>
              </Link>
            ))}
            {!membersLoading && !membersError && matchingMembers.length === 0 && <p className="member-search-state">{members.length > 0 ? "No matching members." : "No members are available."}</p>}
          </div>
        </section>

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
      <nav className="mobile-bottom-nav" aria-label="Quick navigation">
        <Link href="/" className={`mobile-bottom-nav-item${location === "/" ? " mobile-bottom-nav-item-active" : ""}`}>
          <Home size={19} strokeWidth={1.8} /><span>Home</span>
        </Link>
        <Link href="/feed" className={`mobile-bottom-nav-item${location === "/feed" ? " mobile-bottom-nav-item-active" : ""}`}>
          <Activity size={19} strokeWidth={1.8} /><span>FYP</span>
        </Link>
        <Link href="/create" className={`mobile-bottom-nav-item${location === "/create" ? " mobile-bottom-nav-item-active" : ""}`}>
          <Plus size={21} strokeWidth={1.8} /><span>Post</span>
        </Link>
        <Link href="/events" className={`mobile-bottom-nav-item${location === "/events" ? " mobile-bottom-nav-item-active" : ""}`}>
          <CalendarDays size={18} strokeWidth={1.8} /><span>Events</span>
        </Link>
        <Link href="/challenges" className={`mobile-bottom-nav-item${location.startsWith("/challenges") ? " mobile-bottom-nav-item-active" : ""}`}>
          <Trophy size={18} strokeWidth={1.8} /><span>Challenges</span>
        </Link>
        <Link href={`/profile/${user.username}`} className={`mobile-bottom-nav-item${location.startsWith("/profile") ? " mobile-bottom-nav-item-active" : ""}`}>
          <CircleUserRound size={19} strokeWidth={1.8} /><span>Profile</span>
        </Link>
      </nav>
    </>
  );
}