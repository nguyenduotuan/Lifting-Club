import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Globe2, MapPin, Plus, Trash2, Users } from "lucide-react";
import { createEvent, deleteEvent, getEvents, getPublicEvents, joinEvent, respondToEvent } from "../api/events";
import { getUsers } from "../api/users";
import MemberPicker from "../components/MemberPicker";
import { useAuth } from "../hooks/useAuth";
import type { ClubEvent, EventCreateInput } from "../types/event";
import type { User } from "../types/user";

const emptyForm: EventCreateInput = {
  title: "",
  description: "",
  location: null,
  starts_at: "",
  ends_at: null,
  invites: [],
  is_public: false,
  max_participants: null,
};

function membership(event: ClubEvent, userId: number | undefined) {
  return event.participants.find((participant) => participant.user_id === userId);
}

function eventHasEnded(event: ClubEvent): boolean {
  return new Date(event.ends_at ?? event.starts_at).getTime() < Date.now();
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function EventCard({ event, userId, action }: { event: ClubEvent; userId: number | undefined; action?: React.ReactNode }) {
  const accepted = event.participants.filter((participant) => participant.status === "accepted").length;
  const state = membership(event, userId)?.status;
  const category = event.host_id === userId ? "HOSTING" : state === "invited" ? "INVITED" : state === "accepted" ? "GOING" : event.is_public ? "PUBLIC" : "PRIVATE";

  return <article className={`goal-card event-card${eventHasEnded(event) ? " event-card-past" : ""}`}>
    <div className="goal-card-top">
      <div className="challenge-card-labels">
        <span className="goal-category">{category}</span>
        <span className={`visibility-tag${event.is_public ? " visibility-tag-public" : ""}`}>{event.is_public ? "PUBLIC" : "PRIVATE"}</span>
      </div>
      <span className="event-date"><CalendarClock size={13} /> {formatDate(event.starts_at)}</span>
    </div>
    <div className="event-card-title"><h2>{event.title}</h2><p>{event.description || `Hosted by ${event.host_display_name}.`}</p></div>
    <div className="goal-meta">
      {event.location && <span><MapPin size={13} /> {event.location}</span>}
      <span><Users size={13} /> {accepted}{event.max_participants !== null ? ` / ${event.max_participants}` : ""} attending</span>
      <span>Host: {event.host_display_name}</span>
    </div>
    {action && <div className="challenge-card-action">{action}</div>}
  </article>;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [publicEvents, setPublicEvents] = useState<ClubEvent[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [form, setForm] = useState<EventCreateInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyEventId, setBusyEventId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadEvents() {
    setError("");
    try {
      const [mine, open] = await Promise.all([getEvents(), getPublicEvents()]);
      setEvents(mine);
      setPublicEvents(open);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Events could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
    getUsers().then(setMembers).catch(() => setMembers([]));
  }, []);

  const invitations = useMemo(() => events.filter((event) => membership(event, user?.id)?.status === "invited"), [events, user]);
  const hosted = useMemo(() => events.filter((event) => event.host_id === user?.id && !eventHasEnded(event)), [events, user]);
  const joined = useMemo(() => events.filter((event) => event.host_id !== user?.id && membership(event, user?.id)?.status === "accepted" && !eventHasEnded(event)), [events, user]);
  const past = useMemo(() => events.filter((event) => (event.host_id === user?.id || membership(event, user?.id)?.status === "accepted") && eventHasEnded(event)), [events, user]);
  const discover = publicEvents.filter((event) => {
    const state = membership(event, user?.id)?.status;
    return event.host_id !== user?.id && state !== "accepted" && state !== "invited";
  });
  const inviteable = members.filter((member) => member.id !== user?.id);

  async function runEventAction(event: ClubEvent, action: () => Promise<ClubEvent>) {
    setError("");
    setBusyEventId(event.id);
    try {
      const updated = await action();
      setEvents((current) => [updated, ...current.filter((item) => item.id !== updated.id)]);
      setPublicEvents((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The event could not be updated.");
    } finally {
      setBusyEventId(null);
    }
  }

  async function submitEvent(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError("");
    setSaving(true);
    try {
      const created = await createEvent({
        ...form,
        location: form.location?.trim() || null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      });
      setEvents((current) => [created, ...current]);
      if (created.is_public) setPublicEvents((current) => [...current, created].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      setForm(emptyForm);
      setShowForm(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The event could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(event: ClubEvent) {
    if (!window.confirm(`Delete “${event.title}”? This cannot be undone.`)) return;
    setBusyEventId(event.id);
    try {
      await deleteEvent(event.id);
      setEvents((current) => current.filter((item) => item.id !== event.id));
      setPublicEvents((current) => current.filter((item) => item.id !== event.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The event could not be deleted.");
    } finally {
      setBusyEventId(null);
    }
  }

  return <section className="page-column events-page">
    <header className="page-heading goals-heading">
      <div><p className="eyebrow">MAKE A PLAN TOGETHER</p><h1>Events<span className="heading-period">.</span></h1><p className="goals-intro">Put a date on it and bring your people together.</p></div>
      <button className="button button-primary" type="button" onClick={() => setShowForm((open) => !open)}><Plus size={16} /> New event</button>
    </header>

    {showForm && <form className="goal-create-panel" onSubmit={submitEvent}>
      <div className="goal-create-heading"><div><p className="eyebrow">HOST SOMETHING</p><h2>Set up an event</h2></div><button className="icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close event form">×</button></div>
      <div className="goal-form-grid event-form-grid">
        <div><label className="field-label" htmlFor="event-title">Event</label><input id="event-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Saturday morning lift" required maxLength={140} /></div>
        <div><label className="field-label" htmlFor="event-location">Location <span>OPTIONAL</span></label><input id="event-location" value={form.location ?? ""} onChange={(event) => setForm({ ...form, location: event.target.value || null })} placeholder="Club gym" maxLength={200} /></div>
      </div>
      <div className="goal-form-grid event-form-grid">
        <div><label className="field-label" htmlFor="event-start">Starts</label><input id="event-start" type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} required /></div>
        <div><label className="field-label" htmlFor="event-end">Ends <span>OPTIONAL</span></label><input id="event-end" type="datetime-local" min={form.starts_at || undefined} value={form.ends_at ?? ""} onChange={(event) => setForm({ ...form, ends_at: event.target.value || null })} /></div>
      </div>
      <label className="field-label" htmlFor="event-description">Description <span>OPTIONAL</span></label>
      <textarea id="event-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What are you planning?" rows={3} maxLength={2000} />
      <label className="challenge-visibility-toggle">
        <input type="checkbox" checked={form.is_public} onChange={(event) => setForm({ ...form, is_public: event.target.checked, max_participants: event.target.checked ? form.max_participants ?? 20 : null })} />
        <Globe2 size={16} /><span>Make this event public</span>
      </label>
      {form.is_public && <div className="challenge-capacity-field">
        <label className="field-label" htmlFor="event-capacity">Participant limit</label>
        <input id="event-capacity" type="number" min="2" max="500" step="1" required value={form.max_participants ?? 20} onChange={(event) => setForm({ ...form, max_participants: Number(event.target.value) || 2 })} />
      </div>}
      {inviteable.length > 0 && <div className="challenge-invite-picker">
        <p className="goal-section-label">INVITE MEMBERS</p>
        <MemberPicker members={inviteable} selected={form.invites} onChange={(invites) => setForm((current) => ({ ...current, invites }))} />
      </div>}
      {error && <p className="state-message state-error">{error}</p>}
      <button className="button button-primary" type="submit" disabled={saving || !form.starts_at}>{saving ? "Creating..." : "Create event"}</button>
    </form>}

    {loading && <div className="state-message">Checking the calendar<span className="loading-dots">...</span></div>}
    {!loading && error && <div className="state-message state-error" role="alert">{error}<button className="text-button" type="button" onClick={() => void loadEvents()}>Try again</button></div>}
    {!loading && invitations.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Waiting on you</span><i /></div>
      <div className="goal-grid">{invitations.map((event) => <EventCard key={event.id} event={event} userId={user?.id} action={<>
        <button className="button button-secondary" type="button" disabled={busyEventId === event.id} onClick={() => void runEventAction(event, () => respondToEvent(event.id, "accept"))}>Accept</button>
        <button className="text-button" type="button" disabled={busyEventId === event.id} onClick={() => void runEventAction(event, () => respondToEvent(event.id, "decline"))}>Decline</button>
      </>} />)}</div>
    </section>}
    {!loading && hosted.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Hosted by you</span><i /></div>
      <div className="goal-grid">{hosted.map((event) => <EventCard key={event.id} event={event} userId={user?.id} action={<button className="icon-button event-delete" type="button" disabled={busyEventId === event.id} onClick={() => void removeEvent(event)} aria-label={`Delete ${event.title}`} title="Delete event"><Trash2 size={15} /></button>} />)}</div>
    </section>}
    {!loading && joined.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Events you joined</span><i /></div>
      <div className="goal-grid">{joined.map((event) => <EventCard key={event.id} event={event} userId={user?.id} />)}</div>
    </section>}
    {!loading && discover.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Public events</span><i /></div>
      <div className="goal-grid">{discover.map((event) => <EventCard key={event.id} event={event} userId={user?.id} action={<button className="button button-secondary" type="button" disabled={busyEventId === event.id} onClick={() => void runEventAction(event, () => joinEvent(event.id))}>Join event</button>} />)}</div>
    </section>}
    {!loading && past.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Past events</span><i /></div>
      <div className="goal-grid">{past.map((event) => <EventCard key={event.id} event={event} userId={user?.id} />)}</div>
    </section>}
    {!loading && !error && events.length === 0 && discover.length === 0 && <div className="goals-empty events-empty">
      <span className="goals-empty-mark"><CalendarClock size={23} /></span><p className="eyebrow">YOUR SHARED CALENDAR</p><h2>Nothing on the calendar yet.</h2>
      <button className="button button-secondary" type="button" onClick={() => setShowForm(true)}>Create your first event</button>
    </div>}
  </section>;
}