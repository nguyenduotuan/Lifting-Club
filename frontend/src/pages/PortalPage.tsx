import { useEffect, useState } from "react";
import { CalendarDays, Flame, MapPin, Trophy } from "lucide-react";
import { Link } from "wouter";
import { getChallenges, getPublicChallenges } from "../api/challenges";
import { getEvents } from "../api/events";
import EventCalendar from "../components/EventCalendar";
import { useAuth } from "../hooks/useAuth";
import { ChallengeCard } from "./ChallengesPage";
import type { Challenge } from "../types/challenge";
import type { ClubEvent } from "../types/event";

export default function PortalPage() {
  const { user } = useAuth();
  const [latest, setLatest] = useState<Challenge[]>([]);
  const [hot, setHot] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<ClubEvent[]>([]);
  const [calendarChallenges, setCalendarChallenges] = useState<Challenge[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");

  useEffect(() => {
    Promise.all([getPublicChallenges("newest"), getPublicChallenges("popular")])
      .then(([newChallenges, popularChallenges]) => { setLatest(newChallenges); setHot(popularChallenges); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Challenges could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

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

  const now = Date.now();
  const upcomingEvents = calendarEvents.filter((event) => new Date(event.starts_at).getTime() >= now).slice(0, 4);
  const upcomingChallenges = calendarChallenges
    .filter((challenge) => challenge.deadline !== null && new Date(challenge.deadline).getTime() >= now)
    .slice(0, 4);

  return (
    <section className="page-column portal-page">
      <header className="portal-heading">
        <p className="eyebrow">WHAT'S MOVING</p>
        <h1>Club pulse<span className="heading-period">.</span></h1>
        <p>Fresh challenges, popular pursuits, and updates from the club.</p>
      </header>

      <div className="portal-schedule-layout">
        <section className="portal-calendar-panel" aria-labelledby="portal-calendar-title">
          <header className="portal-calendar-header">
            <div><p className="eyebrow">YOUR SCHEDULE</p><h2 id="portal-calendar-title">Calendar</h2></div>
            {!calendarLoading && <span>{calendarEvents.length + calendarChallenges.filter((challenge) => challenge.deadline).length} DATED</span>}
          </header>
          {calendarLoading && <div className="state-message">Loading your schedule<span className="loading-dots">...</span></div>}
          {!calendarLoading && calendarError && <p className="portal-calendar-message" role="status">{calendarError}</p>}
          {!calendarLoading && <EventCalendar events={calendarEvents} challenges={calendarChallenges} />}
        </section>

        <section className="portal-category-card" aria-labelledby="portal-events-title">
          <header className="portal-category-header"><CalendarDays size={17} /><div><p className="eyebrow">ON THE CALENDAR</p><h2 id="portal-events-title">Upcoming events</h2></div></header>
          {calendarLoading && <p className="portal-category-empty">Loading events...</p>}
          {!calendarLoading && calendarError && <p className="portal-category-empty">{calendarError}</p>}
          {!calendarLoading && !calendarError && upcomingEvents.length === 0 && <p className="portal-category-empty">No upcoming events yet.</p>}
          {!calendarLoading && !calendarError && upcomingEvents.length > 0 && <div className="portal-schedule-tiles">{upcomingEvents.map((event) => <Link className="portal-schedule-tile" href="/events" key={event.id}>
            <time dateTime={event.starts_at}>{new Date(event.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {new Date(event.starts_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</time>
            <strong>{event.title}</strong>
            {event.location && <span><MapPin size={12} /> {event.location}</span>}
          </Link>)}</div>}
          <Link className="portal-category-link" href="/events">All events <span>↗</span></Link>
        </section>

        <section className="portal-category-card portal-challenges-card" aria-labelledby="portal-challenges-title">
          <header className="portal-category-header"><Trophy size={17} /><div><p className="eyebrow">KEEP THE STREAK</p><h2 id="portal-challenges-title">Challenge deadlines</h2></div></header>
          {calendarLoading && <p className="portal-category-empty">Loading challenges...</p>}
          {!calendarLoading && calendarError && <p className="portal-category-empty">{calendarError}</p>}
          {!calendarLoading && !calendarError && upcomingChallenges.length === 0 && <p className="portal-category-empty">No upcoming deadlines.</p>}
          {!calendarLoading && !calendarError && upcomingChallenges.length > 0 && <div className="portal-schedule-tiles">{upcomingChallenges.map((challenge) => <Link className="portal-schedule-tile portal-challenge-tile" href="/challenges" key={challenge.id}>
            <time dateTime={challenge.deadline ?? undefined}>DUE {new Date(challenge.deadline!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
            <strong>{challenge.title}</strong>
            {challenge.target_value !== null && <span>{challenge.target_value} {challenge.unit ?? ""} target</span>}
          </Link>)}</div>}
          <Link className="portal-category-link" href="/challenges">All challenges <span>↗</span></Link>
        </section>
      </div>

      <section className="portal-section" aria-labelledby="portal-latest-heading">
        <div className="portal-section-heading">
          <h2 id="portal-latest-heading"><Trophy size={17} /> New challenges</h2>
          <Link href="/challenges">Explore all</Link>
        </div>
        {loading && <div className="state-message">Finding the latest challenges<span className="loading-dots">...</span></div>}
        {!loading && error && <div className="state-message state-error">{error}</div>}
        {!loading && !error && latest.length === 0 && <p className="portal-empty">No public challenges yet.</p>}
        {!loading && !error && latest.length > 0 && <div className="goal-grid portal-challenge-grid">{latest.slice(0, 3).map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} />)}</div>}
      </section>

      <section className="portal-section" aria-labelledby="portal-hot-heading">
        <div className="portal-section-heading">
          <h2 id="portal-hot-heading"><Flame size={17} /> Hot right now</h2>
          <span>BY PARTICIPANTS</span>
        </div>
        {!loading && hot.length === 0 && <p className="portal-empty">Popular challenges will show here.</p>}
        {!loading && hot.length > 0 && <div className="goal-grid portal-challenge-grid">{hot.slice(0, 3).map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} />)}</div>}
      </section>

      <section className="portal-section" aria-labelledby="portal-news-heading">
        <div className="portal-section-heading">
          <h2 id="portal-news-heading">Club news</h2>
          <span>UPDATES</span>
        </div>
        <p className="portal-empty">No club updates yet.</p>
      </section>
    </section>
  );
}