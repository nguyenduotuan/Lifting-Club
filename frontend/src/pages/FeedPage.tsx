import { useEffect, useState } from "react";
import { ArrowUpRight, RotateCw } from "lucide-react";
import { Link } from "wouter";
import { getPosts } from "../api/posts";
import PostCard from "../components/PostCard";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import type { Post } from "../types/post";

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPosts(options?: { background?: boolean }) {
    setError("");
    if (!options?.background) setLoading(true);
    try {
      setPosts(await getPosts());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The feed could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPosts(); }, []);

  const { pullDistance, refreshing, triggerDistance } = usePullToRefresh(() => loadPosts({ background: true }));

  return (
    <section className="page-column feed-page">
      {(pullDistance > 0 || refreshing) && (
        <div className="pull-refresh-indicator" style={{ height: refreshing ? 46 : pullDistance }}>
          <RotateCw
            size={17}
            className={refreshing ? "pull-refresh-icon pull-refresh-spinning" : "pull-refresh-icon"}
            style={refreshing ? undefined : { opacity: Math.min(pullDistance / triggerDistance, 1), transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}
      <header className="page-heading feed-heading">
        <div><p className="eyebrow">THE INNER CIRCLE</p><h1>FYP<span className="heading-period">.</span></h1></div>
        <button className="icon-button refresh-button" type="button" onClick={() => void loadPosts()} aria-label="Refresh feed" title="Refresh feed">
          <RotateCw size={17} />
        </button>
      </header>

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