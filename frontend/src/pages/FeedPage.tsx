import { useEffect, useState } from "react";
import { ArrowUpRight, RotateCw } from "lucide-react";
import { Link } from "wouter";
import { getPosts } from "../api/posts";
import { getUsers } from "../api/users";
import PostCard from "../components/PostCard";
import type { Post } from "../types/post";
import type { User } from "../types/user";

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPosts() {
    setError("");
    setLoading(true);
    try {
      const [nextPosts, nextMembers] = await Promise.all([getPosts(), getUsers()]);
      setPosts(nextPosts);
      setMembers(nextMembers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The feed could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPosts(); }, []);

  const liftCount = posts.reduce((total, post) => total + post.lifts.length, 0);

  return (
    <section className="page-column feed-page">
      <header className="page-heading feed-heading">
        <div><p className="eyebrow">THE INNER CIRCLE</p><h1>FYP<span className="heading-period">.</span></h1></div>
        <button className="icon-button refresh-button" type="button" onClick={() => void loadPosts()} aria-label="Refresh feed" title="Refresh feed">
          <RotateCw size={17} />
        </button>
      </header>

      {!loading && !error && <div className="feed-summary" aria-label="Feed snapshot">
        <div className="feed-metric"><span>SESSIONS</span><strong>{String(posts.length).padStart(2, "0")}</strong></div>
        <div className="feed-metric"><span>MEMBERS</span><strong>{String(members.length).padStart(2, "0")}</strong></div>
        <div className="feed-metric"><span>LIFTS LOGGED</span><strong>{String(liftCount).padStart(2, "0")}</strong></div>
      </div>}

      {loading ? <div className="state-message">Gathering the latest sessions<span className="loading-dots">...</span></div> : null}
      {!loading && error && <div className="state-message state-error" role="alert">{error}<button className="text-button" type="button" onClick={() => void loadPosts()}>Try again</button></div>}
      {!loading && !error && posts.length === 0 && (
        <div className="empty-state">
          <div className="empty-mark"><span /></div>
          <p className="eyebrow">A CLEAR START</p>
          <h2>The next session<br />starts here.</h2>
          <Link className="button button-secondary" href="/create">Share a post <ArrowUpRight size={16} /></Link>
        </div>
      )}
      {!loading && !error && posts.length > 0 && <div className="post-list">{posts.map((post) => <PostCard post={post} key={post.id} />)}</div>}
    </section>
  );
}