import { useEffect, useState } from "react";
import { CalendarDays, Dumbbell } from "lucide-react";
import { useRoute } from "wouter";
import { getUser, getUserPosts } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import type { Post } from "../types/post";
import type { UserProfile } from "../types/user";

export default function ProfilePage() {
  const [, routeParams] = useRoute("/profile/:username");
  const username = routeParams?.username ?? "";
  const { user: signedInUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <section className="page-column profile-page">
      <header className="profile-header">
        {profile && <Avatar username={profile.username} displayName={profile.display_name} image={profile.profile_image} size="large" />}
        <div className="profile-identity">
          {profile ? <><p className="eyebrow">ATHLETE PROFILE</p><h1>{profile.display_name}</h1><span className="profile-handle">@{profile.username}</span></> : <p className="eyebrow">ATHLETE PROFILE</p>}
          {joinedDate && <span className="profile-joined"><CalendarDays size={14} /> Member since {joinedDate}</span>}
        </div>
      </header>
      {profile && <div className="profile-stats"><div><strong>{profile.post_count}</strong><span>POSTS</span></div><div><strong>TRAINING</strong><span>IN GOOD COMPANY</span></div></div>}
      <div className="profile-post-heading"><span className="eyebrow">SESSION LOG</span><span>{profile?.username === signedInUser?.username ? "YOUR POSTS" : "POSTS"}</span></div>
      {loading && <div className="state-message">Loading profile<span className="loading-dots">...</span></div>}
      {!loading && error && <div className="state-message state-error" role="alert">{error}</div>}
      {!loading && !error && posts.length === 0 && <div className="profile-empty"><Dumbbell size={20} /><span>No sessions posted yet.</span></div>}
      {!loading && !error && posts.length > 0 && <div className="post-list">{posts.map((post) => <PostCard post={post} key={post.id} />)}</div>}
    </section>
  );
}