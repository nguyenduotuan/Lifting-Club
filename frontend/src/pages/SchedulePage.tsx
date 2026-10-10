import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getChallenges } from "../api/challenges";
import { getEvents } from "../api/events";
import EventCalendar from "../components/EventCalendar";
import { useAuth } from "../hooks/useAuth";
import type { Challenge } from "../types/challenge";
import type { ClubEvent } from "../types/event";

export default function SchedulePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    Promise.allSettled([getEvents(), getChallenges()]).then(([eventsResult, challengesResult]) => {
      if (!active) return;
      const allEvents = eventsResult.status === "fulfilled" ? eventsResult.value : [];
      const allChallenges = challengesResult.status === "fulfilled" ? challengesResult.value : [];
      setEvents(allEvents.filter((event) => event.participants.some((participant) => participant.user_id === user.id && participant.status === "accepted")));
      setChallenges(allChallenges.filter((challenge) => challenge.participants.some((participant) => participant.user_id === user.id && participant.status === "accepted")));
      setError(eventsResult.status === "rejected" && challengesResult.status === "rejected"
        ? "Your schedule could not be loaded."
        : eventsResult.status === "rejected" || challengesResult.status === "rejected"
          ? "Some scheduled items could not be loaded."
          : "");
      setLoading(false);
    });
    return () => { active = false; };
  }, [user?.id]);

  const datedChallenges = challenges.filter((challenge) => challenge.deadline !== null).length;

  return <section className="page-column schedule-page">
    <header className="page-heading schedule-page-heading">
      <div><p className="eyebrow">YOUR TRAINING SCHEDULE</p><h1>Calendar<span className="heading-period">.</span></h1><p>Accepted events and challenge deadlines.</p></div>
      <Link className="button button-secondary" href="/">Home</Link>
    </header>
    <section className="schedule-calendar-panel" aria-label="Full schedule calendar">
      <div className="schedule-calendar-summary">
        <span>{events.length} {events.length === 1 ? "EVENT" : "EVENTS"}</span>
        <span>{datedChallenges} {datedChallenges === 1 ? "DEADLINE" : "DEADLINES"}</span>
      </div>
      {loading && <div className="state-message">Loading your schedule<span className="loading-dots">...</span></div>}
      {!loading && error && <p className="state-message state-error" role="status">{error}</p>}
      {!loading && <EventCalendar events={events} challenges={challenges} />}
    </section>
  </section>;
}