import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CalendarClock, ChevronRight, Globe2, Plus, Trophy, Users } from "lucide-react";
import { createChallenge, getChallenges, getPublicChallenges, joinChallenge, respondToChallenge } from "../api/challenges";
import { getUsers } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import MemberPicker from "../components/MemberPicker";
import type { Challenge, ChallengeCreateInput } from "../types/challenge";
import type { User } from "../types/user";

const emptyForm: ChallengeCreateInput = {
  title: "",
  description: "",
  target_value: null,
  unit: null,
  deadline: null,
  invites: [],
  is_public: false,
  max_participants: null,
};

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  return new Date(deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isPast(deadline: string | null): boolean {
  return deadline !== null && new Date(deadline).getTime() < Date.now();
}

function myMembership(challenge: Challenge, userId: number | undefined) {
  return challenge.participants.find((participant) => participant.user_id === userId);
}

export function ChallengeCard({ challenge, userId, action }: { challenge: Challenge; userId: number | undefined; action?: React.ReactNode }) {
  const membership = myMembership(challenge, userId);
  const accepted = challenge.participants.filter((participant) => participant.status === "accepted");
  const top = challenge.target_value ? [...accepted].sort((a, b) => b.current_value - a.current_value)[0] : null;
  const progressPercent = challenge.target_value && membership
    ? Math.min(100, Math.max(0, (membership.current_value / challenge.target_value) * 100))
    : null;
  const percentage = progressPercent === null ? null : Math.round(progressPercent);

  return <article className={`goal-card challenge-card${isPast(challenge.deadline) ? " challenge-card-past" : ""}`}>
    <div className="goal-card-top">
      <div className="challenge-card-labels">
        <span className="goal-category">{challenge.host_id === userId ? "HOSTING" : membership?.status === "invited" ? "INVITED" : "JOINED"}</span>
        <span className={`visibility-tag${challenge.is_public ? " visibility-tag-public" : ""}`}>{challenge.is_public ? "PUBLIC" : "PRIVATE"}</span>
      </div>
      <span className="challenge-deadline"><CalendarClock size={13} /> {formatDeadline(challenge.deadline)}</span>
    </div>
    <Link href={`/challenges/${challenge.id}`} className="goal-title-row challenge-title-link">
      <span className="goal-icon"><Trophy size={18} /></span>
      <div><h2>{challenge.title}</h2><p>{challenge.description || "A shared effort, tracked together."}</p></div>
    </Link>
    <div className="goal-meta">
      <span><Users size={13} /> {accepted.length}{challenge.max_participants !== null ? ` / ${challenge.max_participants}` : ""} in</span>
      {challenge.target_value !== null && <span>Goal: {challenge.target_value} {challenge.unit ?? ""}</span>}
      {top && top.current_value > 0 && <span>Leader: {top.display_name}</span>}
    </div>
    {progressPercent !== null && membership?.status === "accepted" && <div className="goal-progress-block">
      <div className="goal-progress-label"><span>{membership.current_value} / {challenge.target_value} {challenge.unit ?? ""}</span><strong>{percentage}%</strong></div>
      <div className="goal-progress-track"><span style={{ width: `${progressPercent}%` }} /></div>
    </div>}
    {action && <div className="challenge-card-action">{action}</div>}
  </article>;
}

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [publicChallenges, setPublicChallenges] = useState<Challenge[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [form, setForm] = useState<ChallengeCreateInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getChallenges()
      .then(setChallenges)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Challenges could not be loaded."))
      .finally(() => setLoading(false));
    getPublicChallenges("newest", 50).then(setPublicChallenges).catch(() => setPublicChallenges([]));
    getUsers().then(setMembers).catch(() => setMembers([]));
  }, []);

  const invites = useMemo(() => challenges.filter((challenge) => myMembership(challenge, user?.id)?.status === "invited"), [challenges, user]);
  const hosted = useMemo(() => challenges.filter((challenge) => challenge.host_id === user?.id && !isPast(challenge.deadline)), [challenges, user]);
  const joined = useMemo(() => challenges.filter((challenge) => challenge.host_id !== user?.id && myMembership(challenge, user?.id)?.status === "accepted" && !isPast(challenge.deadline)), [challenges, user]);
  const past = useMemo(() => challenges.filter((challenge) => (challenge.host_id === user?.id || myMembership(challenge, user?.id)?.status === "accepted") && isPast(challenge.deadline)), [challenges, user]);

  async function respond(challenge: Challenge, action: "accept" | "decline") {
    setError("");
    try {
      const updated = await respondToChallenge(challenge.id, action);
      setChallenges((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (respondError) {
      setError(respondError instanceof Error ? respondError.message : "The invite could not be answered.");
    }
  }

  async function join(challenge: Challenge) {
    setError("");
    try {
      const updated = await joinChallenge(challenge.id);
      setPublicChallenges((current) => current.map((item) => item.id === updated.id ? updated : item));
      setChallenges((current) => [updated, ...current.filter((item) => item.id !== updated.id)]);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Could not join this challenge.");
    }
  }

  async function submitChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const challenge = await createChallenge(form);
      setChallenges((current) => [challenge, ...current]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Challenge could not be created.");
    } finally { setSaving(false); }
  }

  const inviteable = members.filter((member) => member.id !== user?.id);

  return <section className="page-column challenges-page">
    <header className="page-heading goals-heading">
      <div><p className="eyebrow">BETTER TOGETHER</p><h1>Challenges<span className="heading-period">.</span></h1><p className="goals-intro">Pick an arena, chase the goal, track it side by side.</p></div>
      <button className="button button-primary" type="button" onClick={() => setShowForm((open) => !open)}><Plus size={16} /> New challenge</button>
    </header>

    {showForm && <form className="goal-create-panel" onSubmit={submitChallenge}>
      <div className="goal-create-heading"><div><p className="eyebrow">HOST SOMETHING</p><h2>Set the terms of the challenge</h2></div><button className="icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close challenge form">×</button></div>
      <div className="goal-form-grid">
        <div><label className="field-label" htmlFor="challenge-title">Challenge</label><input id="challenge-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="100K meters rowed in May" required maxLength={140} /></div>
        <div><label className="field-label" htmlFor="challenge-deadline">Deadline <span>OPTIONAL</span></label><input id="challenge-deadline" type="date" value={form.deadline?.slice(0, 10) ?? ""} onChange={(event) => setForm({ ...form, deadline: event.target.value ? `${event.target.value}T23:59:59Z` : null })} /></div>
      </div>
      <label className="field-label" htmlFor="challenge-description">Description <span>OPTIONAL</span></label>
      <textarea id="challenge-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What is this about, and how do you win?" rows={3} maxLength={2000} />
      <div className="goal-form-grid">
        <div><label className="field-label" htmlFor="challenge-target">Target <span>OPTIONAL</span></label><input id="challenge-target" type="number" min="0.01" step="any" value={form.target_value ?? ""} onChange={(event) => setForm({ ...form, target_value: Number(event.target.value) || null })} placeholder="100" /></div>
        <div><label className="field-label" htmlFor="challenge-unit">Unit <span>OPTIONAL</span></label><input id="challenge-unit" value={form.unit ?? ""} onChange={(event) => setForm({ ...form, unit: event.target.value || null })} placeholder="km, sessions, kg..." maxLength={30} /></div>
      </div>
      <label className="challenge-visibility-toggle">
        <input type="checkbox" checked={form.is_public} onChange={(event) => setForm({ ...form, is_public: event.target.checked, max_participants: event.target.checked ? form.max_participants ?? 20 : null })} />
        <Globe2 size={16} />
        <span>Make this challenge public</span>
      </label>
      {form.is_public && <div className="challenge-capacity-field">
        <label className="field-label" htmlFor="challenge-capacity">Participant limit</label>
        <input id="challenge-capacity" type="number" min="2" max="500" step="1" required value={form.max_participants ?? 20} onChange={(event) => setForm({ ...form, max_participants: Number(event.target.value) || 2 })} />
      </div>}
      {inviteable.length > 0 && <div className="challenge-invite-picker">
        <p className="goal-section-label">INVITE MEMBERS</p>
        <MemberPicker members={inviteable} selected={form.invites} onChange={(invites) => setForm((current) => ({ ...current, invites }))} />
      </div>}
      {error && <p className="state-message state-error">{error}</p>}
      <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Creating..." : "Create challenge"}</button>
    </form>}

    {loading && <div className="state-message">Opening the arena<span className="loading-dots">...</span></div>}
    {!loading && error && !showForm && <div className="state-message state-error">{error}</div>}
    {!loading && challenges.length === 0 && publicChallenges.length === 0 && !showForm && <div className="goals-empty">
      <span className="goals-empty-mark"><Trophy size={23} /></span>
      <p className="eyebrow">NO CROWDS YET</p>
      <h2>Start something worth<br />showing up for.</h2>
      <button className="button button-secondary" type="button" onClick={() => setShowForm(true)}>Host your first challenge <ChevronRight size={16} /></button>
    </div>}

    {!loading && invites.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Waiting on you</span><i /></div>
      <div className="goal-grid">{invites.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} action={<>
          <button className="button button-secondary" type="button" onClick={() => void respond(challenge, "accept")}>Accept</button>
          <button className="text-button" type="button" onClick={() => void respond(challenge, "decline")}>Decline</button>
        </>} />
      ))}</div>
    </section>}

    {!loading && hosted.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Hosted by you</span><i /></div>
      <div className="goal-grid">{hosted.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} />)}</div>
    </section>}

    {!loading && joined.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Challenges you joined</span><i /></div>
      <div className="goal-grid">{joined.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} />)}</div>
    </section>}

    {!loading && publicChallenges.some((challenge) => {
      const membership = myMembership(challenge, user?.id);
      return !membership || membership.status === "declined";
    }) && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Public challenges</span><i /></div>
      <div className="goal-grid">{publicChallenges.filter((challenge) => {
        const membership = myMembership(challenge, user?.id);
        return !membership || membership.status === "declined";
      }).map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} action={
        <button className="button button-secondary" type="button" onClick={() => void join(challenge)}>Join challenge</button>
      } />)}</div>
    </section>}

    {!loading && past.length > 0 && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Past challenges</span><i /></div>
      <div className="goal-grid">{past.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} />)}</div>
    </section>}
  </section>;
}
