import { useEffect, useState } from "react";
import { CalendarDays, Flame, MapPin, Newspaper, Pin, Trophy, Users } from "lucide-react";
import { Link } from "wouter";
import { getChallenges, getPublicChallenges } from "../api/challenges";
import { getEvents, getPublicEvents } from "../api/events";
import { getPosts } from "../api/posts";
import { useAuth } from "../hooks/useAuth";
import type { Challenge } from "../types/challenge";
import type { ClubEvent } from "../types/event";
import type { Post } from "../types/post";
import { getPinnedIds, pinnedFirst } from "../utils/pins";

export default function PortalPage() {
  const { user } = useAuth();
  const [latest, setLatest] = useState<Challenge[]>([]);
  const [hot, setHot] = useState<Challenge[]>([]);
  const [hotEvents, setHotEvents] = useState<ClubEvent[]>([]);
  const [clubNews, setClubNews] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<ClubEvent[]>([]);
  const [calendarChallenges, setCalendarChallenges] = useState<Challenge[]>([]);
  const [pinnedEvents, setPinnedEvents] = useState<ClubEvent[]>([]);
  const [pinnedChallenges, setPinnedChallenges] = useState<Challenge[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const [eventsError, setEventsError] = useState("");
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");

  useEffect(() => {
    Promise.all([getPublicChallenges("newest"), getPublicChallenges("popular")])
      .then(([newChallenges, popularChallenges]) => { setLatest(newChallenges); setHot(popularChallenges); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Challenges could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.allSettled([getEvents(), getChallenges(), getPublicEvents(), getPublicChallenges("newest", 50)]).then(([eventsResult, challengesResult, publicEventsResult, publicChallengesResult]) => {
      if (!active) return;
      const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];
      const challenges = challengesResult.status === "fulfilled" ? challengesResult.value : [];
      const publicEvents = publicEventsResult.status === "fulfilled" ? publicEventsResult.value : [];
      const publicChallenges = publicChallengesResult.status === "fulfilled" ? publicChallengesResult.value : [];
      setCalendarEvents(events.filter((event) => event.participants.some((participant) => participant.user_id === user.id && participant.status === "accepted")));
      setCalendarChallenges(challenges.filter((challenge) => challenge.participants.some((participant) => participant.user_id === user.id && participant.status === "accepted")));
      setPinnedEvents(Array.from(new Map([...events, ...publicEvents].map((event) => [event.id, event])).values()));
      setPinnedChallenges(Array.from(new Map([...challenges, ...publicChallenges].map((challenge) => [challenge.id, challenge])).values()));
      setHotEvents(publicEvents);
      setEventsError(publicEventsResult.status === "rejected" ? "Hot events could not be loaded." : "");
      setCalendarError(eventsResult.status === "rejected" && challengesResult.status === "rejected"
        ? "Your schedule could not be loaded."
        : eventsResult.status === "rejected" || challengesResult.status === "rejected"
          ? "Some scheduled items could not be loaded."
          : "");
      setCalendarLoading(false);
    });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    getPosts().then((posts) => { if (active) setClubNews(posts); })
      .catch((loadError) => { if (active) setNewsError(loadError instanceof Error ? loadError.message : "Club news could not be loaded."); })
      .finally(() => { if (active) setNewsLoading(false); });
    return () => { active = false; };
  }, []);

  const now = Date.now();
  const upcomingChallengeDeadlines = calendarChallenges.filter((challenge) => challenge.deadline !== null && new Date(challenge.deadline).getTime() >= now)
    .sort((left, right) => left.deadline!.localeCompare(right.deadline!)).slice(0, 2);
  const scheduleItems = [
    ...calendarEvents.map((event) => ({ id: `event-${event.id}`, title: event.title, date: event.starts_at, detail: event.location || "Club event", href: "/calendar", kind: "EVENT" })),
    ...calendarChallenges.filter((challenge) => challenge.deadline !== null).map((challenge) => ({
      id: `challenge-${challenge.id}`,
      title: challenge.title,
      date: challenge.deadline as string,
      detail: "Challenge deadline",
      href: "/calendar",
      kind: "DEADLINE",
    })),
  ].filter((item) => new Date(item.date).getTime() >= now).sort((left, right) => left.date.localeCompare(right.date)).slice(0, 2);
  const upcomingHotEvents = hotEvents.filter((event) => new Date(event.ends_at ?? event.starts_at).getTime() >= now)
    .sort((left, right) => right.participants.filter((participant) => participant.status === "accepted").length - left.participants.filter((participant) => participant.status === "accepted").length || left.starts_at.localeCompare(right.starts_at))
    .slice(0, 2);
  const pinnedEventIds = getPinnedIds(user?.id, "event");
  const pinnedChallengeIds = getPinnedIds(user?.id, "challenge");
  const pinnedItems = [
    ...pinnedFirst(pinnedEvents.filter((event) => pinnedEventIds.includes(event.id) && new Date(event.ends_at ?? event.starts_at).getTime() >= now), pinnedEventIds, (event) => event.id)
      .map((event) => ({ id: `event-${event.id}`, title: event.title, date: event.starts_at, href: `/events/${event.id}`, kind: "EVENT" })),
    ...pinnedFirst(pinnedChallenges.filter((challenge) => pinnedChallengeIds.includes(challenge.id) && (!challenge.deadline || new Date(challenge.deadline).getTime() >= now)), pinnedChallengeIds, (challenge) => challenge.id)
      .map((challenge) => ({ id: `challenge-${challenge.id}`, title: challenge.title, date: challenge.deadline, href: `/challenges/${challenge.id}`, kind: "CHALLENGE" })),
  ];

  return (
    <section className="page-column portal-page">
      <header className="portal-heading">
        <p className="eyebrow">WHAT'S MOVING</p>
        <h1>Club pulse<span className="heading-period">.</span></h1>
        <p>Fresh challenges, popular pursuits, and updates from the club.</p>
      </header>

      {(calendarLoading || pinnedItems.length > 0) && <section className="portal-pinned-block" aria-labelledby="portal-pinned-title">
        <header><Pin size={16} /><div><p className="eyebrow">YOUR SHORTLIST</p><h2 id="portal-pinned-title">Pinned activities</h2></div></header>
        {calendarLoading && pinnedItems.length === 0 && <p className="portal-card-empty">Loading pinned activities...</p>}
        {!calendarLoading && pinnedItems.length === 0 && <p className="portal-card-empty">No pinned activities yet.</p>}
        {pinnedItems.length > 0 && <div className="portal-pinned-list">{pinnedItems.map((item) => <Link className="portal-pinned-item" href={item.href} key={item.id}>
          <Pin size={13} /><span><strong>{item.title}</strong><small>{item.kind}{item.date ? ` · ${new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}</small></span>
        </Link>)}</div>}
      </section>}

      <div className="portal-overview-grid">
        <section className="portal-overview-card portal-card-calendar" aria-labelledby="portal-calendar-title">
          <header className="portal-card-header"><CalendarDays size={17} /><div><p className="eyebrow">YOUR SCHEDULE</p><h2 id="portal-calendar-title">Calendar</h2></div></header>
          {calendarLoading && <p className="portal-card-empty">Loading schedule...</p>}
          {!calendarLoading && calendarError && <p className="portal-card-empty">{calendarError}</p>}
          {!calendarLoading && !calendarError && scheduleItems.length === 0 && <p className="portal-card-empty">Nothing coming up. Your schedule will appear here.</p>}
          {!calendarLoading && !calendarError && scheduleItems.length > 0 && <div className="portal-card-list">{scheduleItems.map((item) => <Link className="portal-card-item" href={item.href} key={item.id}>
            <time dateTime={item.date}>{new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><span><strong>{item.title}</strong><small>{item.kind} · {item.detail}</small></span>
          </Link>)}</div>}
          <Link className="portal-card-action" href="/calendar">Open calendar <span>↗</span></Link>
        </section>

        <section className="portal-overview-card portal-card-events" aria-labelledby="portal-events-title">
          <header className="portal-card-header"><MapPin size={17} /><div><p className="eyebrow">MOST ATTENDED</p><h2 id="portal-events-title">Hot events</h2></div></header>
          {calendarLoading && <p className="portal-card-empty">Finding upcoming events...</p>}
          {!calendarLoading && eventsError && <p className="portal-card-empty">{eventsError}</p>}
          {!calendarLoading && !eventsError && upcomingHotEvents.length === 0 && <p className="portal-card-empty">No upcoming public events yet.</p>}
          {!calendarLoading && !eventsError && upcomingHotEvents.length > 0 && <div className="portal-card-list">{upcomingHotEvents.map((event) => <Link className="portal-card-item" href="/events?category=public" key={event.id}>
            <time dateTime={event.starts_at}>{new Date(event.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><span><strong>{event.title}</strong><small><Users size={11} /> {event.participants.filter((participant) => participant.status === "accepted").length} going{event.location ? ` · ${event.location}` : ""}</small></span>
          </Link>)}</div>}
          <Link className="portal-card-action" href="/events?category=public">Browse events <span>↗</span></Link>
        </section>

        <section className="portal-overview-card portal-card-deadlines" aria-labelledby="portal-deadlines-title">
          <header className="portal-card-header"><Trophy size={17} /><div><p className="eyebrow">KEEP THE STREAK</p><h2 id="portal-deadlines-title">Challenge deadlines</h2></div></header>
          {calendarLoading && <p className="portal-card-empty">Loading deadlines...</p>}
          {!calendarLoading && calendarError && <p className="portal-card-empty">{calendarError}</p>}
          {!calendarLoading && !calendarError && upcomingChallengeDeadlines.length === 0 && <p className="portal-card-empty">No upcoming challenge deadlines.</p>}
          {!calendarLoading && !calendarError && upcomingChallengeDeadlines.length > 0 && <div className="portal-card-list">{upcomingChallengeDeadlines.map((challenge) => <Link className="portal-card-item" href={`/challenges/${challenge.id}`} key={challenge.id}>
            <time dateTime={challenge.deadline ?? undefined}>{new Date(challenge.deadline!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><span><strong>{challenge.title}</strong><small>Challenge deadline</small></span>
          </Link>)}</div>}
          <Link className="portal-card-action" href="/challenges?category=public">Explore challenges <span>↗</span></Link>
        </section>

        <section className="portal-overview-card portal-card-new" aria-labelledby="portal-latest-heading">
          <header className="portal-card-header"><Trophy size={17} /><div><p className="eyebrow">JUST ADDED</p><h2 id="portal-latest-heading">New challenges</h2></div></header>
          {loading && <p className="portal-card-empty">Finding the latest challenges...</p>}
          {!loading && error && <p className="portal-card-empty">{error}</p>}
          {!loading && !error && latest.length === 0 && <p className="portal-card-empty">No public challenges yet.</p>}
          {!loading && !error && latest.length > 0 && <div className="portal-card-list">{latest.slice(0, 2).map((challenge) => <Link className="portal-card-item" href={`/challenges/${challenge.id}`} key={challenge.id}>
            <time>{challenge.deadline ? new Date(challenge.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "OPEN"}</time><span><strong>{challenge.title}</strong><small>{challenge.participants.filter((participant) => participant.status === "accepted").length} training together</small></span>
          </Link>)}</div>}
          <Link className="portal-card-action" href="/challenges?category=public">See new challenges <span>↗</span></Link>
        </section>

        <section className="portal-overview-card portal-card-hot" aria-labelledby="portal-hot-heading">
          <header className="portal-card-header"><Flame size={17} /><div><p className="eyebrow">BY PARTICIPANTS</p><h2 id="portal-hot-heading">Hot challenges</h2></div></header>
          {loading && <p className="portal-card-empty">Finding popular challenges...</p>}
          {!loading && error && <p className="portal-card-empty">{error}</p>}
          {!loading && !error && hot.length === 0 && <p className="portal-card-empty">Popular challenges will show here.</p>}
          {!loading && !error && hot.length > 0 && <div className="portal-card-list">{hot.slice(0, 2).map((challenge) => <Link className="portal-card-item" href={`/challenges/${challenge.id}`} key={challenge.id}>
            <time>{challenge.target_value ?? "GO"}</time><span><strong>{challenge.title}</strong><small>{challenge.participants.filter((participant) => participant.status === "accepted").length} training together</small></span>
          </Link>)}</div>}
          <Link className="portal-card-action" href="/challenges?category=public">See what's hot <span>↗</span></Link>
        </section>

        <section className="portal-overview-card portal-card-news" aria-labelledby="portal-news-heading">
          <header className="portal-card-header"><Newspaper size={17} /><div><p className="eyebrow">FROM YOUR CIRCLE</p><h2 id="portal-news-heading">Club news</h2></div></header>
          {newsLoading && <p className="portal-card-empty">Loading club news...</p>}
          {!newsLoading && newsError && <p className="portal-card-empty">{newsError}</p>}
          {!newsLoading && !newsError && clubNews.length === 0 && <p className="portal-card-empty">No club updates yet.</p>}
          {!newsLoading && !newsError && clubNews.length > 0 && <div className="portal-card-list">{clubNews.slice(0, 2).map((post) => <Link className="portal-card-item portal-news-item" href="/posts" key={post.id}>
            <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><span><strong>{post.caption || post.activity_name || "Training update"}</strong><small>By {post.user.display_name}</small></span>
          </Link>)}</div>}
          <Link className="portal-card-action" href="/posts">Open club news <span>↗</span></Link>
        </section>
      </div>
    </section>
  );
}