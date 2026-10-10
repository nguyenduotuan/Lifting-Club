import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Plus, RotateCw, Trophy } from "lucide-react";
import { Link } from "wouter";
import { getChallenges } from "../api/challenges";
import { getEvents } from "../api/events";
import { getPosts } from "../api/posts";
import EventCalendar from "../components/EventCalendar";
import PostCard from "../components/PostCard";
import { useAuth } from "../hooks/useAuth";
import CreatePostPage from "./CreatePostPage";
import type { Challenge } from "../types/challenge";
import type { ClubEvent } from "../types/event";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import type { Post } from "../types/post";

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<ClubEvent[]>([]);
  const [calendarChallenges, setCalendarChallenges] = useState<Challenge[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.allSettled([getEvents(), getChallenges()]).then(([eventsResult, challengesResult]) => {
      if (!active) return;
      const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];
      const challenges = challengesResult.status === "fulfilled" ? challengesResult.value : [];
      setCalendarEvents(events.filter((event) => event.participants.some((participant) => participant.user_id === user.id && participant.status === "accepted")));
      setCalendarChallenges(challenges.filter((challenge) => challenge.participants.some((participant) => participant.user_id === user.id && participant.status === "accepted")));
      setCalendarError(eventsResult.status === "rejected" && challengesResult.status === "rejected"
        ? "Your schedule could not be loaded."
        : eventsResult.status === "rejected" || challengesResult.status === "rejected"
          ? "Some scheduled items could not be loaded."
          : "");
      setCalendarLoading(false);
    });
    return () => { active = false; };
  }, [user?.id]);

  const { pullDistance, refreshing, triggerDistance } = usePullToRefresh(() => loadPosts({ background: true }));
  const now = Date.now();
  const upcomingEvents = calendarEvents.filter((event) => new Date(event.starts_at).getTime() >= now).slice(0, 4);
  const upcomingChallenges = calendarChallenges
    .filter((challenge) => challenge.deadline !== null && new Date(challenge.deadline).getTime() >= now)
    .slice(0, 4);

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
        <div><p className="eyebrow">THE INNER CIRCLE</p><h1>Posts<span className="heading-period">.</span></h1></div>
        <div className="posts-heading-actions">
          <button className="icon-button refresh-button" type="button" onClick={() => void loadPosts()} aria-label="Refresh posts" title="Refresh posts"><RotateCw size={17} /></button>
          <button className="button button-primary" type="button" onClick={() => setComposerOpen((open) => !open)}><Plus size={16} /> New post</button>
        </div>
      </header>
      <div className="feed-edition">
        <span className="feed-edition-mark">FIELD<br />NOTES</span>
        <div><strong>Training, in motion.</strong><span>Recent work from your circle, all in one place.</span></div>
        <span className="feed-edition-count">{posts.length} {posts.length === 1 ? "POST" : "POSTS"}</span>
      </div>
      <div className="feed-schedule-layout">
        <section className="feed-calendar-panel" aria-labelledby="feed-calendar-title">
          <header className="feed-calendar-header">
            <div><p className="eyebrow">YOUR SCHEDULE</p><h2 id="feed-calendar-title">Calendar</h2></div>
            {!calendarLoading && <span>{calendarEvents.length + calendarChallenges.filter((challenge) => challenge.deadline).length} DATED</span>}
          </header>
          {calendarLoading && <div className="state-message">Loading your schedule<span className="loading-dots">...</span></div>}
          {!calendarLoading && calendarError && <p className="feed-calendar-message" role="status">{calendarError}</p>}
          {!calendarLoading && <EventCalendar events={calendarEvents} challenges={calendarChallenges} />}
        </section>

        <section className="feed-category-card feed-events-card" aria-labelledby="feed-events-title">
          <header className="feed-category-header"><CalendarDays size={17} /><div><p className="eyebrow">ON THE CALENDAR</p><h2 id="feed-events-title">Upcoming events</h2></div></header>
          {calendarLoading && <p className="feed-category-empty">Loading events...</p>}
          {!calendarLoading && calendarError && <p className="feed-category-empty">{calendarError}</p>}
          {!calendarLoading && !calendarError && upcomingEvents.length === 0 && <p className="feed-category-empty">No upcoming events yet.</p>}
          {!calendarLoading && !calendarError && upcomingEvents.length > 0 && <div className="feed-schedule-tiles">{upcomingEvents.map((event) => <Link className="feed-schedule-tile" href="/events" key={event.id}>
            <time dateTime={event.starts_at}>{new Date(event.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {new Date(event.starts_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</time>
            <strong>{event.title}</strong>
            {event.location && <span><MapPin size={12} /> {event.location}</span>}
          </Link>)}</div>}
          <Link className="feed-category-link" href="/events">All events <span>↗</span></Link>
        </section>

        <section className="feed-category-card feed-challenges-card" aria-labelledby="feed-challenges-title">
          <header className="feed-category-header"><Trophy size={17} /><div><p className="eyebrow">KEEP THE STREAK</p><h2 id="feed-challenges-title">Challenge deadlines</h2></div></header>
          {calendarLoading && <p className="feed-category-empty">Loading challenges...</p>}
          {!calendarLoading && calendarError && <p className="feed-category-empty">{calendarError}</p>}
          {!calendarLoading && !calendarError && upcomingChallenges.length === 0 && <p className="feed-category-empty">No upcoming deadlines.</p>}
          {!calendarLoading && !calendarError && upcomingChallenges.length > 0 && <div className="feed-schedule-tiles">{upcomingChallenges.map((challenge) => <Link className="feed-schedule-tile feed-challenge-tile" href="/challenges" key={challenge.id}>
            <time dateTime={challenge.deadline ?? undefined}>DUE {new Date(challenge.deadline!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
            <strong>{challenge.title}</strong>
            {challenge.target_value !== null && <span>{challenge.target_value} {challenge.unit ?? ""} target</span>}
          </Link>)}</div>}
          <Link className="feed-category-link" href="/challenges">All challenges <span>↗</span></Link>
        </section>
      </div>

      <div className="feed-post-stream">
        {composerOpen && <CreatePostPage embedded onCancel={() => setComposerOpen(false)} onPosted={() => { setComposerOpen(false); void loadPosts(); }} />}

        {loading ? <div className="state-message">Gathering the latest sessions<span className="loading-dots">...</span></div> : null}
        {!loading && error && <div className="state-message state-error" role="alert">{error}<button className="text-button" type="button" onClick={() => void loadPosts()}>Try again</button></div>}
        {!loading && !error && posts.length === 0 && (
          <div className="empty-state">
            <div className="empty-mark"><span /></div>
            <p className="eyebrow">A CLEAR START</p>
            <h2>The next session<br />starts here.</h2>
            <button className="button button-secondary" type="button" onClick={() => setComposerOpen(true)}>Share a post <Plus size={16} /></button>
          </div>
        )}
        {!loading && !error && posts.length > 0 && <div className="post-list">{posts.map((post, index) => <PostCard post={post} key={post.id} featured={index === 0} />)}</div>}
      </div>
    </section>
  );
}