import { CalendarDays } from "lucide-react";
import { Link } from "wouter";
import type { Post } from "../types/post";
import Avatar from "./Avatar";
import LiftList from "./LiftList";
import MediaDisplay from "./MediaDisplay";

export default function PostCard({ post }: { post: Post }) {
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="post-card">
      <header className="post-header">
        <Avatar username={post.user.username} displayName={post.user.display_name} image={post.user.profile_image} linked />
        <div className="post-author">
          <Link href={`/profile/${post.user.username}`} className="post-author-name">{post.user.display_name}</Link>
          <span>@{post.user.username}</span>
        </div>
        <time className="post-date" dateTime={post.created_at}><CalendarDays size={14} />{date}</time>
      </header>
      {post.caption && <p className="post-caption">{post.caption}</p>}
      <MediaDisplay items={post.media} />
      <LiftList lifts={post.lifts} />
    </article>
  );
}