import { useState, type FormEvent } from "react";
import { CalendarDays, ChevronDown, MessageCircle, Send, Timer, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { createComment, togglePostReaction } from "../api/posts";
import { useAuth } from "../hooks/useAuth";
import type { Post, PostReaction } from "../types/post";
import Avatar from "./Avatar";
import LiftList from "./LiftList";
import MediaDisplay from "./MediaDisplay";

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  isDeleting?: boolean;
  deleteDisabled?: boolean;
  featured?: boolean;
}

const reactionOptions: { emoji: PostReaction["emoji"]; label: string }[] = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "💪", label: "Strong" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🙌", label: "Celebrate" },
  { emoji: "😂", label: "Funny" },
];

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PostCard({ post, onDelete, isDeleting = false, deleteDisabled = false, featured = false }: PostCardProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState(post.comments ?? []);
  const [reactions, setReactions] = useState(post.reactions ?? []);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reactionError, setReactionError] = useState("");
  const [submittingReaction, setSubmittingReaction] = useState(false);
  const myReaction = reactions.find((reaction) => reaction.user_id === user?.id)?.emoji;
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const paceSeconds = post.pace_seconds_per_unit ?? 0;
  const pace = `${Math.floor(paceSeconds / 60)}:${String(Math.round(paceSeconds % 60)).padStart(2, "0")}`;

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = commentBody.trim();
    if (!body) return;
    setSubmittingComment(true);
    setCommentError("");
    try {
      const comment = await createComment(post.id, body);
      setComments((current) => [...current, comment]);
      setCommentBody("");
    } catch (submitError) {
      setCommentError(submitError instanceof Error ? submitError.message : "Comment could not be posted.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleReaction(emoji: PostReaction["emoji"]) {
    setSubmittingReaction(true);
    setReactionError("");
    try {
      const result = await togglePostReaction(post.id, emoji);
      setReactions(result.reactions);
    } catch (reactionFailure) {
      setReactionError(reactionFailure instanceof Error ? reactionFailure.message : "Reaction could not be saved.");
    } finally {
      setSubmittingReaction(false);
    }
  }

  return (
    <article className={`post-card${featured ? " post-card-featured" : ""}`}>
      <header className="post-header">
        <Avatar username={post.user.username} displayName={post.user.display_name} image={post.user.profile_image} linked />
        <div className="post-author">
          <Link href={`/profile/${post.user.username}`} className="post-author-name">{post.user.display_name}</Link>
          <span>@{post.user.username}</span>
        </div>
        <time className="post-date" dateTime={post.created_at}><CalendarDays size={14} />{date}</time>
        {onDelete && <button className="icon-button post-delete" type="button" onClick={onDelete} disabled={deleteDisabled} aria-label="Delete post" aria-busy={isDeleting} title={isDeleting ? "Deleting post" : "Delete post"}>
          <Trash2 size={16} />
        </button>}
      </header>
      {featured && <p className="post-featured-kicker">LATEST FROM THE CLUB</p>}
      {post.caption && <p className="post-caption">{post.caption}</p>}
      <MediaDisplay items={post.media} />
      <LiftList lifts={post.lifts} />
      {post.activity_name && post.distance && post.duration_seconds && <div className="activity-summary">
        <Timer size={17} />
        <div><strong>{post.activity_name}</strong><span>{post.distance} {post.distance_unit} · {formatDuration(post.duration_seconds)} total · {pace} / {post.distance_unit}</span></div>
      </div>}
      <div className="post-engagement">
        <div className="reaction-list" aria-label="React to post">
          {reactionOptions.map(({ emoji, label }) => {
            const count = reactions.filter((reaction) => reaction.emoji === emoji).length;
            return <button className={`reaction-button${myReaction === emoji ? " reaction-button-active" : ""}`} key={emoji} type="button" onClick={() => void handleReaction(emoji)} disabled={submittingReaction} aria-pressed={myReaction === emoji} aria-label={`React ${label.toLowerCase()}${count ? `, ${count} reactions` : ""}`} title={label}>
              <span>{emoji}</span>{count > 0 && <span className="reaction-count">{count}</span>}
            </button>;
          })}
        </div>
        <button className="comments-toggle" type="button" onClick={() => setCommentsExpanded((expanded) => !expanded)} aria-expanded={commentsExpanded}>
          <MessageCircle size={15} /><span>{comments.length} {comments.length === 1 ? "comment" : "comments"}</span><ChevronDown className={commentsExpanded ? "comments-chevron comments-chevron-open" : "comments-chevron"} size={15} />
        </button>
      </div>
      {reactionError && <p className="comment-error" role="alert">{reactionError}</p>}
      {commentsExpanded && <section className="post-comments" aria-label="Comments">
        {comments.length > 0 && <div className="comments-list">{comments.map((comment) => (
          <article className="comment-item" key={comment.id}>
            <Avatar username={comment.user.username} displayName={comment.user.display_name} image={comment.user.profile_image} linked />
            <div className="comment-content">
              <div className="comment-meta"><Link href={`/profile/${comment.user.username}`} className="comment-author">{comment.user.display_name}</Link><time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></div>
              <p>{comment.body}</p>
            </div>
          </article>
        ))}</div>}
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <input aria-label="Write a comment" placeholder="Add a comment..." value={commentBody} onChange={(event) => setCommentBody(event.target.value)} maxLength={1000} />
          <button className="icon-button" type="submit" aria-label="Post comment" title="Post comment" disabled={!commentBody.trim() || submittingComment}>
            <Send size={16} />
          </button>
        </form>
        {commentError && <p className="comment-error" role="alert">{commentError}</p>}
      </section>}
    </article>
  );
}