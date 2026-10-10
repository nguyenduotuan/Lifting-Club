import { useEffect, useState } from "react";
import { Bell, CalendarDays, Check, Clock3, X } from "lucide-react";
import { Link } from "wouter";
import { getChallenges, respondToChallenge } from "../api/challenges";
import { getEvents, respondToEvent } from "../api/events";
import { useAuth } from "../hooks/useAuth";
import type { Challenge } from "../types/challenge";
import type { ClubEvent } from "../types/event";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getChallenges(), getEvents()])
      .then(([nextChallenges, nextEvents]) => { setChallenges(nextChallenges); setEvents(nextEvents); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Notifications could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const invitations = challenges.filter((challenge) =>
    challenge.participants.some((participant) => participant.user_id === user?.id && participant.status === "invited"),
  );
  const eventInvitations = events.filter((event) =>
    event.participants.some((participant) => participant.user_id === user?.id && participant.status === "invited"),
  );

  async function respond(challenge: Challenge, action: "accept" | "decline") {
    setError("");
    setResponding(`challenge-${challenge.id}`);
    try {
      const updated = await respondToChallenge(challenge.id, action);
      setChallenges((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (respondError) {
      setError(respondError instanceof Error ? respondError.message : "Your response could not be saved.");
    } finally {
      setResponding(null);
    }
  }

  async function respondToEventInvite(event: ClubEvent, action: "accept" | "decline") {
    setError("");
    setResponding(`event-${event.id}`);
    try {
      const updated = await respondToEvent(event.id, action);
      setEvents((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (respondError) {
      setError(respondError instanceof Error ? respondError.message : "Your response could not be saved.");
    } finally {
      setResponding(null);
    }
  }

  return (
    <section className="page-column notifications-page">
      <header className="page-heading">
        <div><p className="eyebrow">YOUR CIRCLE</p><h1>Notifications<span className="heading-period">.</span></h1></div>
      </header>
      {loading && <div className="state-message">Checking for updates<span className="loading-dots">...</span></div>}
      {!loading && error && <div className="state-message state-error" role="alert">{error}<button className="text-button" type="button" onClick={() => window.location.reload()}>Try again</button></div>}
      {!loading && !error && invitations.length === 0 && eventInvitations.length === 0 && (
        <div className="goals-empty">
          <span className="goals-empty-mark"><Bell size={23} /></span>
          <p className="eyebrow">ALL CAUGHT UP</p>
          <h2>No new invitations.</h2>
          <p className="goals-intro">New challenge and event invitations will show up here.</p>
          <div className="notification-browse-actions">
            <Link className="button button-secondary" href="/events">Browse events</Link>
            <Link className="button button-secondary" href="/challenges">Browse challenges</Link>
          </div>
        </div>
      )}
      {!loading && (invitations.length > 0 || eventInvitations.length > 0) && <div className="notification-list">
        {eventInvitations.map((event) => (
          <article className="notification-item" key={`event-${event.id}`}>
            <span className="notification-icon"><CalendarDays size={18} /></span>
            <div className="notification-copy">
              <p><strong>{event.host_display_name}</strong> invited you to an event</p>
              <strong className="notification-title">{event.title}</strong>
              <p>{new Date(event.starts_at).toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{event.location ? ` · ${event.location}` : ""}</p>
              {event.description && <p>{event.description}</p>}
              <div className="notification-actions">
                <button className="button button-primary button-small" type="button" disabled={responding === `event-${event.id}`} onClick={() => void respondToEventInvite(event, "accept")}><Check size={14} /> Accept</button>
                <button className="icon-button" type="button" aria-label={`Decline ${event.title}`} title="Decline invitation" disabled={responding === `event-${event.id}`} onClick={() => void respondToEventInvite(event, "decline")}><X size={16} /></button>
              </div>
            </div>
          </article>
        ))}
        {invitations.map((challenge) => (
          <article className="notification-item" key={challenge.id}>
            <span className="notification-icon"><Clock3 size={18} /></span>
            <div className="notification-copy">
              <p><strong>{challenge.host_display_name}</strong> invited you to a challenge</p>
              <Link href={`/challenges/${challenge.id}`}><strong>{challenge.title}</strong></Link>
              {challenge.description && <p>{challenge.description}</p>}
              <div className="notification-actions">
                <button className="button button-primary button-small" type="button" disabled={responding === `challenge-${challenge.id}`} onClick={() => void respond(challenge, "accept")}><Check size={14} /> Accept</button>
                <button className="icon-button" type="button" aria-label={`Decline ${challenge.title}`} title="Decline invitation" disabled={responding === `challenge-${challenge.id}`} onClick={() => void respond(challenge, "decline")}><X size={16} /></button>
              </div>
            </div>
          </article>
        ))}
        {error && <p className="state-message state-error" role="alert">{error}</p>}
      </div>}
    </section>
  );
}