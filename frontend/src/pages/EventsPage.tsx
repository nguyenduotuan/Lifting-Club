import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { CalendarClock, Globe2, MapPin, Pin, Plus, Users } from "lucide-react";
import { createEvent, getEvents, getPublicEvents } from "../api/events";
import { getUsers } from "../api/users";
import MemberPicker from "../components/MemberPicker";
import { useAuth } from "../hooks/useAuth";
import type { ClubEvent, EventCreateInput } from "../types/event";
import type { User } from "../types/user";
import { getPinnedIds, pinnedFirst } from "../utils/pins";

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

type EventCategory = "private" | "public" | "hosted";

function EventCard({ event, userId }: { event: ClubEvent; userId: number | undefined }) {
  const accepted = event.participants.filter((participant) => participant.status === "accepted").length;
  const state = membership(event, userId)?.status;
  const category = event.host_id === userId ? "HOSTING" : state === "invited" ? "INVITED" : state === "accepted" ? "GOING" : event.is_public ? "PUBLIC" : "PRIVATE";

  return <article className={`goal-card event-card${eventHasEnded(event) ? " event-card-past" : ""}`}>
    <div className="goal-card-top">
      <div className="challenge-card-labels">
        <span className="goal-category">{category}</span>
        {getPinnedIds(userId, "event").includes(event.id) && <span className="pinned-marker" title="Pinned to homepage"><Pin size={12} /></span>}
        <span className={`visibility-tag${event.is_public ? " visibility-tag-public" : ""}`}>{event.is_public ? "PUBLIC" : "PRIVATE"}</span>
      </div>
      <span className="event-date"><CalendarClock size={13} /> {formatDate(event.starts_at)}</span>
    </div>
    <Link href={`/events/${event.id}`} className="event-card-title"><h2>{event.title}</h2><p>{event.description || `Hosted by ${event.host_display_name}.`}</p></Link>
    <div className="goal-meta">
      {event.location && <span><MapPin size={13} /> {event.location}</span>}
      <span><Users size={13} /> {accepted}{event.max_participants !== null ? ` / ${event.max_participants}` : ""} attending</span>
      <span>Host: {event.host_display_name}</span>
    </div>
  </article>;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [publicEvents, setPublicEvents] = useState<ClubEvent[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [form, setForm] = useState<EventCreateInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [activeCategory, setActiveCategory] = useState<EventCategory>(() => new URLSearchParams(window.location.search).get("category") === "public" ? "public" : "private");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (showForm) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showForm]);

  const privateVisible = useMemo(() => events.filter((event) => event.host_id !== user?.id && !event.is_public && ["invited", "accepted"].includes(membership(event, user?.id)?.status ?? "") && !eventHasEnded(event)), [events, user]);
  const hosted = useMemo(() => events.filter((event) => event.host_id === user?.id && !eventHasEnded(event)), [events, user]);
  const publicVisible = useMemo(() => Array.from(new Map([...events, ...publicEvents]
    .filter((event) => event.is_public && event.host_id !== user?.id && !eventHasEnded(event))
    .map((event) => [event.id, event])).values()), [events, publicEvents, user]);
  const past = useMemo(() => events.filter((event) => (event.host_id === user?.id || membership(event, user?.id)?.status === "accepted") && eventHasEnded(event)), [events, user]);
  const inviteable = members.filter((member) => member.id !== user?.id);

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

  return <section className="page-column events-page">
    <header className="page-heading goals-heading">
      <div><p className="eyebrow">MAKE A PLAN TOGETHER</p><h1>Events<span className="heading-period">.</span></h1><p className="goals-intro">Put a date on it and bring your people together.</p></div>
    </header>

    {showForm && <form ref={formRef} className="goal-create-panel" onSubmit={submitEvent}>
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
    <nav className="collection-tabs" aria-label="Event categories">
      <button className="collection-tab collection-tab-private" type="button" aria-pressed={activeCategory === "private"} onClick={() => setActiveCategory("private")}>Private <span>{privateVisible.length}</span></button>
      <button className="collection-tab collection-tab-public" type="button" aria-pressed={activeCategory === "public"} onClick={() => setActiveCategory("public")}>Public <span>{publicVisible.length}</span></button>
      <button className="collection-tab collection-tab-hosted" type="button" aria-pressed={activeCategory === "hosted"} onClick={() => setActiveCategory("hosted")}>Hosted by you <span>{hosted.length}</span></button>
    </nav>
    {!loading && <section className={`collection-panel collection-panel-${activeCategory}`}>
      {activeCategory === "private" && <>
        <div className="goal-category-heading"><span>Private events &amp; invitations</span><i /></div>
        {privateVisible.length === 0 && <p className="collection-empty">Private invitations and events you join will appear here.</p>}
        <div className="goal-grid">{pinnedFirst(privateVisible, getPinnedIds(user?.id, "event"), (event) => event.id).map((event) => <EventCard key={event.id} event={event} userId={user?.id} />)}</div>
      </>}
      {activeCategory === "public" && <>
        <div className="goal-category-heading"><span>Open to everyone</span><i /></div>
        {publicVisible.length === 0 && <p className="collection-empty">No public events to show right now.</p>}
        <div className="goal-grid">{pinnedFirst(publicVisible, getPinnedIds(user?.id, "event"), (event) => event.id).map((event) => <EventCard key={event.id} event={event} userId={user?.id} />)}</div>
      </>}
      {activeCategory === "hosted" && <>
        <div className="goal-category-heading"><span>Created by you</span><i /></div>
        {hosted.length === 0 && <p className="collection-empty">Events you create will appear here.</p>}
        <div className="goal-grid">{pinnedFirst(hosted, getPinnedIds(user?.id, "event"), (event) => event.id).map((event) => <EventCard key={event.id} event={event} userId={user?.id} />)}</div>
      </>}
    </section>}
    {!loading && past.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Past events</span><i /></div>
      <div className="goal-grid">{past.map((event) => <EventCard key={event.id} event={event} userId={user?.id} />)}</div>
    </section>}
    {!loading && !error && events.length === 0 && publicVisible.length === 0 && <div className="goals-empty events-empty">
      <span className="goals-empty-mark"><CalendarClock size={23} /></span><p className="eyebrow">YOUR SHARED CALENDAR</p><h2>Nothing on the calendar yet.</h2>
      <button className="button button-secondary" type="button" onClick={() => setShowForm(true)}>Create your first event</button>
    </div>}
    {activeCategory === "hosted" && <button className="button button-primary hosted-create-fab" type="button" onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}>
      {showForm ? "Close event form" : <><Plus size={16} /> New event</>}
    </button>}
  </section>;
}