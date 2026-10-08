import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, CircleUserRound, Dumbbell, LogOut, Menu, Plus, Search, X } from "lucide-react";
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
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [memberQuery, setMemberQuery] = useState("");

  useEffect(() => {
    if (!menuOpen || membersLoaded) return;
    let active = true;
    setMembersError("");
    setMembersLoading(true);
    getUsers()
      .then((nextMembers) => {
        if (!active) return;
        setMembers(nextMembers);
        setMembersLoaded(true);
      })
      .catch((loadError) => {
        if (active) setMembersError(loadError instanceof Error ? loadError.message : "Members could not be loaded.");
      })
      .finally(() => active && setMembersLoading(false));
    return () => { active = false; };
  }, [menuOpen, membersLoaded]);

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

        <section className="member-search-section" aria-label="Find members">
          <label className="member-search-field">
            <Search size={15} aria-hidden="true" />
            <input type="search" value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="Search members" aria-label="Search members" />
          </label>
          <div className="member-search-results" aria-live="polite">
            {membersLoading && <p className="member-search-state">Loading members...</p>}
            {!membersLoading && membersError && <p className="member-search-state member-search-error">{membersError}</p>}
            {!membersLoading && !membersError && matchingMembers.map((member) => (
              <Link href={`/profile/${member.username}`} className="member-search-result" key={member.id} onClick={() => setMenuOpen(false)}>
                <Avatar username={member.username} displayName={member.display_name} image={member.profile_image} />
                <span className="member-search-copy"><strong>{member.display_name}</strong><small>@{member.username}</small></span>
              </Link>
            ))}
            {!membersLoading && !membersError && matchingMembers.length === 0 && <p className="member-search-state">No members found.</p>}
          </div>
        </section>

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