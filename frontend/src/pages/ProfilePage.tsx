import { useEffect, useState } from "react";
import { CalendarDays, Check, Dumbbell, Pencil, X } from "lucide-react";
import { useRoute } from "wouter";
import { deletePost } from "../api/posts";
import { getUser, getUserPosts, updateDisplayName } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import type { Post } from "../types/post";
import type { UserProfile } from "../types/user";

export default function ProfilePage() {
  const [, routeParams] = useRoute("/profile/:username");
  const username = routeParams?.username ?? "";
  const { user: signedInUser, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);

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

  return (
    <section className="page-column profile-page">
      <header className="profile-header">
        {profile && <Avatar username={profile.username} displayName={profile.display_name} image={profile.profile_image} size="large" />}
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
            </>
          ) : <p className="eyebrow">ATHLETE PROFILE</p>}
          {joinedDate && <span className="profile-joined"><CalendarDays size={14} /> Member since {joinedDate}</span>}
        </div>
      </header>
      {profile && <div className="profile-stats"><div><strong>{profile.post_count}</strong><span>POSTS</span></div><div><strong>TRAINING</strong><span>IN GOOD COMPANY</span></div></div>}
      <div className="profile-post-heading"><span className="eyebrow">SESSION LOG</span><span>{profile?.username === signedInUser?.username ? "YOUR POSTS" : "POSTS"}</span></div>
      {loading && <div className="state-message">Loading profile<span className="loading-dots">...</span></div>}
      {!loading && error && <div className="state-message state-error" role="alert">{error}</div>}
      {!loading && deleteError && <div className="state-message state-error" role="alert">{deleteError}</div>}
      {!loading && !error && posts.length === 0 && <div className="profile-empty"><Dumbbell size={20} /><span>No sessions posted yet.</span></div>}
      {!loading && !error && posts.length > 0 && <div className="post-list">{posts.map((post) => <PostCard post={post} key={post.id} onDelete={isOwnProfile ? () => void handleDeletePost(post.id) : undefined} isDeleting={deletingPostId === post.id} deleteDisabled={deletingPostId !== null} />)}</div>}
    </section>
  );
}