import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, CalendarClock, MapPin, Trash2, Users } from "lucide-react";
import ActivityOptions from "../components/ActivityOptions";
import { deleteEvent, getEvent, joinEvent, leaveEvent, respondToEvent } from "../api/events";
import { useAuth } from "../hooks/useAuth";
import type { ClubEvent } from "../types/event";
import { getPinnedIds, togglePinnedId } from "../utils/pins";

function formatDate(date: string): string {
  return new Date(date).toLocaleString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pinnedIds, setPinnedIds] = useState<number[]>(() => getPinnedIds(user?.id, "event"));

  useEffect(() => {
    if (!Number.isInteger(eventId)) {
      setError("Event not found.");
      setLoading(false);
      return;
    }
    getEvent(eventId)
      .then(setEvent)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Event could not be loaded."))
      .finally(() => setLoading(false));
  }, [eventId]);

  const membership = useMemo(() => event?.participants.find((participant) => participant.user_id === user?.id), [event, user]);

  if (loading) return <div className="state-message">Loading event<span className="loading-dots">...</span></div>;
  if (!event) return <div className="state-message state-error">{error || "Event not found."}</div>;

  const current = event;
  const isHost = current.host_id === user?.id;
  const isPinned = pinnedIds.includes(current.id);
  const accepted = current.participants.filter((participant) => participant.status === "accepted");

  async function run(action: () => Promise<ClubEvent>) {
    setError("");
    setBusy(true);
    try { setEvent(await action()); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "The event could not be updated."); }
    finally { setBusy(false); }
  }

  function togglePin() {
    if (user) setPinnedIds(togglePinnedId(user.id, "event", current.id));
  }

  async function removeEvent() {
    if (!window.confirm(`Delete “${current.title}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteEvent(current.id);
      setLocation("/events");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Event could not be deleted.");
      setBusy(false);
    }
  }

  return <section className="page-column event-detail-page">
    <Link href="/events" className="challenge-back"><ArrowLeft size={15} /> All events</Link>
    <header className="page-heading goals-heading event-detail-heading">
      <div>
        <p className="eyebrow">{isHost ? "YOU ARE THE HOST" : `HOSTED BY ${current.host_display_name.toLocaleUpperCase()}`}</p>
        <h1>{current.title}<span className="heading-period">.</span></h1>
        <p className="goals-intro">{current.description || `Hosted by ${current.host_display_name}.`}</p>
      </div>
      <ActivityOptions title={current.title} pinned={isPinned} onTogglePin={togglePin}>
        {membership?.status === "invited" ? <>
          <button type="button" role="menuitem" disabled={busy} onClick={() => void run(() => respondToEvent(current.id, "accept"))}>Accept invitation</button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => void run(() => respondToEvent(current.id, "decline"))}>Decline invitation</button>
        </> : membership?.status === "accepted" ? <button type="button" role="menuitem" disabled={busy} onClick={() => void run(() => leaveEvent(current.id))}>Leave event</button>
          : current.is_public && <button type="button" role="menuitem" disabled={busy} onClick={() => void run(() => joinEvent(current.id))}>Join event</button>}
        {isHost && <button className="activity-options-danger" type="button" role="menuitem" disabled={busy} onClick={() => void removeEvent()}><Trash2 size={15} /> Delete event</button>}
      </ActivityOptions>
    </header>

    {error && <div className="state-message state-error" role="alert">{error}</div>}
    <div className="goal-card event-detail-facts">
      <p><CalendarClock size={16} /><span><strong>{formatDate(current.starts_at)}</strong><small>STARTS</small></span></p>
      {current.ends_at && <p><CalendarClock size={16} /><span><strong>{formatDate(current.ends_at)}</strong><small>ENDS</small></span></p>}
      {current.location && <p><MapPin size={16} /><span><strong>{current.location}</strong><small>LOCATION</small></span></p>}
      <p><Users size={16} /><span><strong>{accepted.length}{current.max_participants !== null ? ` / ${current.max_participants}` : ""}</strong><small>ATTENDING</small></span></p>
    </div>

    <section className="goal-category-section">
      <div className="goal-category-heading"><span>Attending</span><i /></div>
      <div className="event-attendee-list">
        {accepted.map((participant) => <div className="goal-card event-attendee" key={participant.id}>
          <strong>{participant.display_name}</strong>{participant.user_id === current.host_id && <span>HOST</span>}
        </div>)}
        {accepted.length === 0 && <p className="collection-empty">No one has joined this event yet.</p>}
      </div>
    </section>
  </section>;
}