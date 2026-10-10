import { useEffect, useState } from "react";
import { CalendarDays, Camera, Check, Dumbbell, Pencil, X } from "lucide-react";
import { useRoute } from "wouter";
import { deletePost } from "../api/posts";
import { getEvents } from "../api/events";
import { getUser, getUserPosts, updateDisplayName, updateProfileImage } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import EventCalendar from "../components/EventCalendar";
import PostCard from "../components/PostCard";
import type { ClubEvent } from "../types/event";
import type { Post } from "../types/post";
import type { UserProfile } from "../types/user";

export default function ProfilePage() {
  const [, routeParams] = useRoute("/profile/:username");
  const username = routeParams?.username ?? "";
  const { user: signedInUser, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<ClubEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "calendar">("posts");
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([getUser(username), getUserPosts(username)])
      .then(([nextProfile, nextPosts]) => {
        if (!active) return;
        setProfile(nextProfile);
        setPosts(nextPosts);
      })
      .catch((loadError) => active && setError(loadError instanceof Error ? loadError.message : "Profile could not be loaded."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [username]);

  useEffect(() => { setActiveTab("posts"); }, [username]);

  useEffect(() => {
    if (username !== signedInUser?.username) {
      setCalendarEvents([]);
      setCalendarLoading(false);
      return;
    }
    let active = true;
    setCalendarLoading(true);
    setCalendarError("");
    getEvents()
      .then((nextEvents) => active && setCalendarEvents(nextEvents))
      .catch((loadError) => active && setCalendarError(loadError instanceof Error ? loadError.message : "Calendar could not be loaded."))
      .finally(() => active && setCalendarLoading(false));
    return () => { active = false; };
  }, [username, signedInUser?.username]);

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "";
  const isOwnProfile = profile?.username === signedInUser?.username;

  async function handleDeletePost(postId: number) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setDeletingPostId(postId);
    setDeleteError("");
    try {
      await deletePost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
      setProfile((current) => current ? { ...current, post_count: Math.max(0, current.post_count - 1) } : current);
    } catch (deleteFailure) {
      setDeleteError(deleteFailure instanceof Error ? deleteFailure.message : "Post could not be deleted.");
    } finally {
      setDeletingPostId(null);
    }
  }

  function startEditingName() {
    setDisplayName(profile?.display_name ?? "");
    setNameError("");
    setEditingName(true);
  }

  function cancelEditingName() {
    setEditingName(false);
    setNameError("");
  }

  async function handleNameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = displayName.trim();
    if (!nextName) {
      setNameError("Display name cannot be empty.");
      return;
    }
    setSavingName(true);
    setNameError("");
    try {
      const updatedUser = await updateDisplayName(nextName);
      updateUser(updatedUser);
      setProfile((current) => current ? { ...current, display_name: updatedUser.display_name } : current);
      setEditingName(false);
    } catch (saveError) {
      setNameError(saveError instanceof Error ? saveError.message : "Display name could not be updated.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image) return;
    setSavingImage(true);
    setImageError("");
    try {
      const updatedUser = await updateProfileImage(image);
      updateUser(updatedUser);
      setProfile((current) => current ? { ...current, profile_image: updatedUser.profile_image } : current);
    } catch (saveError) {
      setImageError(saveError instanceof Error ? saveError.message : "Profile picture could not be updated.");
    } finally {
      setSavingImage(false);
    }
  }

  return (
    <section className="page-column profile-page">
      <header className="profile-header">
        {profile && (isOwnProfile ? <label className="profile-avatar-upload" aria-label="Change profile picture" title="Change profile picture">
          <Avatar username={profile.username} displayName={profile.display_name} image={profile.profile_image} size="large" />
          <span><Camera size={16} /></span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} disabled={savingImage} />
        </label> : <Avatar username={profile.username} displayName={profile.display_name} image={profile.profile_image} size="large" />)}
        <div className="profile-identity">
          {profile ? (
            <>
              <p className="eyebrow">ATHLETE PROFILE</p>
              {editingName ? (
                <form className="profile-name-form" onSubmit={handleNameSubmit}>
                  <input aria-label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoFocus />
                  <button className="icon-button" type="submit" aria-label="Save display name" title="Save display name" disabled={savingName}><Check size={16} /></button>
                  <button className="icon-button" type="button" onClick={cancelEditingName} aria-label="Cancel editing display name" title="Cancel" disabled={savingName}><X size={16} /></button>
                </form>
              ) : (
                <div className="profile-name-row">
                  <h1>{profile.display_name}</h1>
                  {isOwnProfile && <button className="icon-button" type="button" onClick={startEditingName} aria-label="Edit display name" title="Edit display name"><Pencil size={15} /></button>}
                </div>
              )}
              <span className="profile-handle">@{profile.username}</span>
              {nameError && <p className="profile-name-error" role="alert">{nameError}</p>}
              {imageError && <p className="profile-name-error" role="alert">{imageError}</p>}
            </>
          ) : <p className="eyebrow">ATHLETE PROFILE</p>}
          {joinedDate && <span className="profile-joined"><CalendarDays size={14} /> Member since {joinedDate}</span>}
        </div>
      </header>
      {profile && <div className="profile-stats"><div><strong>{profile.post_count}</strong><span>POSTS</span></div><div><strong>TRAINING</strong><span>IN GOOD COMPANY</span></div></div>}
      {profile && <div className="profile-tabs" role="tablist" aria-label="Profile sections">
        <button className={`profile-tab${activeTab === "posts" ? " profile-tab-active" : ""}`} type="button" role="tab" aria-selected={activeTab === "posts"} onClick={() => setActiveTab("posts")}>Posts <span>{profile.post_count}</span></button>
        {isOwnProfile && <button className={`profile-tab${activeTab === "calendar" ? " profile-tab-active" : ""}`} type="button" role="tab" aria-selected={activeTab === "calendar"} onClick={() => setActiveTab("calendar")}>Calendar <span>{calendarEvents.length}</span></button>}
      </div>}
      {loading && <div className="state-message">Loading profile<span className="loading-dots">...</span></div>}
      {!loading && error && <div className="state-message state-error" role="alert">{error}</div>}
      {!loading && !error && activeTab === "posts" && deleteError && <div className="state-message state-error" role="alert">{deleteError}</div>}
      {!loading && !error && activeTab === "posts" && posts.length === 0 && <div className="profile-empty"><Dumbbell size={20} /><span>No sessions posted yet.</span></div>}
      {!loading && !error && activeTab === "posts" && posts.length > 0 && <div className="post-list">{posts.map((post) => <PostCard post={post} key={post.id} onDelete={isOwnProfile ? () => void handleDeletePost(post.id) : undefined} isDeleting={deletingPostId === post.id} deleteDisabled={deletingPostId !== null} />)}</div>}
      {!loading && !error && activeTab === "calendar" && calendarLoading && <div className="state-message">Loading your calendar<span className="loading-dots">...</span></div>}
      {!loading && !error && activeTab === "calendar" && calendarError && <div className="state-message state-error" role="alert">{calendarError}</div>}
      {!loading && !error && activeTab === "calendar" && !calendarLoading && !calendarError && <EventCalendar events={calendarEvents} />}
    </section>
  );
}