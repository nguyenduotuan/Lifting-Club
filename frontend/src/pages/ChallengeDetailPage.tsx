import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, CalendarClock, Crown, Trophy, UserPlus } from "lucide-react";
import { deleteChallenge, getChallenge, inviteToChallenge, joinChallenge, leaveChallenge, respondToChallenge, updateChallengeProgress } from "../api/challenges";
import { getUsers } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/Avatar";
import ActivityOptions from "../components/ActivityOptions";
import MemberPicker from "../components/MemberPicker";
import type { Challenge } from "../types/challenge";
import type { User } from "../types/user";
import { getPinnedIds, togglePinnedId } from "../utils/pins";

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  return new Date(deadline).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const challengeId = Number(id);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [progress, setProgress] = useState("");
  const [inviteSelection, setInviteSelection] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pinnedIds, setPinnedIds] = useState<number[]>(() => getPinnedIds(user?.id, "challenge"));

  useEffect(() => {
    if (!Number.isFinite(challengeId)) { setError("Challenge not found."); setLoading(false); return; }
    getChallenge(challengeId)
      .then((loaded) => { setChallenge(loaded); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Challenge could not be loaded."))
      .finally(() => setLoading(false));
    getUsers().then(setMembers).catch(() => setMembers([]));
  }, [challengeId]);

  const membership = useMemo(() => challenge?.participants.find((participant) => participant.user_id === user?.id), [challenge, user]);
  const leaderboard = useMemo(
    () => [...(challenge?.participants ?? [])].filter((participant) => participant.status === "accepted").sort((a, b) => b.current_value - a.current_value),
    [challenge],
  );
  const pendingInvites = useMemo(() => (challenge?.participants ?? []).filter((participant) => participant.status === "invited"), [challenge]);
  const inviteable = useMemo(() => {
    const taken = new Set((challenge?.participants ?? []).map((participant) => participant.user_id));
    return members.filter((member) => !taken.has(member.id));
  }, [members, challenge]);

  useEffect(() => {
    if (membership) setProgress(String(membership.current_value));
  }, [membership?.current_value, membership]);

  if (loading) return <div className="state-message">Loading challenge<span className="loading-dots">...</span></div>;
  if (!challenge) return <div className="state-message state-error">{error || "Challenge not found."}</div>;

  const current = challenge;
  const isHost = current.host_id === user?.id;
  const target = current.target_value;

  async function run(action: () => Promise<Challenge>) {
    setError("");
    setBusy(true);
    try { setChallenge(await action()); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function saveProgress() {
    const value = Number(progress);
    if (!Number.isFinite(value) || value < 0) { setError("Progress must be a positive number."); return; }
    await run(() => updateChallengeProgress(current.id, value));
  }

  async function sendInvites() {
    if (inviteSelection.length === 0) return;
    await run(() => inviteToChallenge(current.id, inviteSelection));
    setInviteSelection([]);
  }

  async function removeChallenge() {
    if (!window.confirm(`Delete “${current.title}”? This cannot be undone.`)) return;
    try {
      await deleteChallenge(current.id);
      setLocation("/challenges");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Challenge could not be deleted.");
    }
  }

  function togglePin() {
    if (user) setPinnedIds(togglePinnedId(user.id, "challenge", current.id));
  }

  return <section className="page-column challenge-detail-page">
    <Link href="/challenges" className="challenge-back"><ArrowLeft size={15} /> All challenges</Link>

    <header className="page-heading goals-heading">
      <div>
        <p className="eyebrow">{isHost ? "YOU ARE THE HOST" : `HOSTED BY ${challenge.host_display_name.toLocaleUpperCase()}`}</p>
        <h1>{challenge.title}<span className="heading-period">.</span></h1>
        <p className="goals-intro">{challenge.description || "A shared effort, tracked together."}</p>
      </div>
      <ActivityOptions title={current.title} pinned={pinnedIds.includes(current.id)} onTogglePin={togglePin}>
        {membership?.status === "invited" ? <>
          <button type="button" role="menuitem" disabled={busy} onClick={() => void run(() => respondToChallenge(current.id, "accept"))}>Accept invitation</button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => void run(() => respondToChallenge(current.id, "decline"))}>Decline invitation</button>
        </> : membership?.status === "accepted" ? <button type="button" role="menuitem" disabled={busy} onClick={() => void run(() => leaveChallenge(current.id))}>Leave challenge</button>
          : challenge.is_public && <button type="button" role="menuitem" disabled={busy} onClick={() => void run(() => joinChallenge(current.id))}>Join challenge</button>}
        {isHost && <button className="activity-options-danger" type="button" role="menuitem" disabled={busy} onClick={() => void removeChallenge()}>Delete challenge</button>}
      </ActivityOptions>
    </header>

    <div className="goals-overview challenge-facts">
      <div><strong><CalendarClock size={15} /> {formatDeadline(challenge.deadline)}</strong><span>DEADLINE</span></div>
      <div><strong>{target !== null ? `${target} ${challenge.unit ?? ""}` : "—"}</strong><span>TARGET</span></div>
      <div><strong>{leaderboard.length}</strong><span>IN THE ARENA</span></div>
      <Trophy size={34} />
    </div>

    {membership?.status === "invited" && <div className="goal-card challenge-invite-banner">
      <p><strong>{challenge.host_display_name}</strong> invited you to join this challenge.</p>
      <div className="challenge-card-action">
        <button className="button button-primary" type="button" disabled={busy} onClick={() => void run(() => respondToChallenge(challenge.id, "accept"))}>Accept</button>
        <button className="text-button" type="button" disabled={busy} onClick={() => void run(() => respondToChallenge(challenge.id, "decline"))}>Decline</button>
      </div>
    </div>}

    {error && <div className="state-message state-error">{error}</div>}

    {membership?.status === "accepted" && <div className="goal-card challenge-progress-panel">
      <p className="goal-section-label">LOG YOUR PROGRESS</p>
      <div className="goal-progress-edit">
        <input type="number" min="0" step="any" value={progress} onChange={(event) => setProgress(event.target.value)} aria-label="Update your challenge progress" />
        {target !== null && <span>/ {target} {challenge.unit ?? ""}</span>}
        <button className="text-button" type="button" disabled={busy} onClick={() => void saveProgress()}>Update</button>
      </div>
    </div>}

    <section className="goal-category-section">
      <div className="goal-category-heading"><span>Leaderboard</span><i /></div>
      {leaderboard.length === 0 && <div className="state-message">Nobody has joined yet.</div>}
      <div className="challenge-leaderboard">{leaderboard.map((participant, index) => {
        const progressPercent = target
          ? Math.min(100, Math.max(0, (participant.current_value / target) * 100))
          : null;
        const percentage = progressPercent === null ? null : Math.round(progressPercent);
        return <div className={`goal-card challenge-standing${participant.user_id === user?.id ? " challenge-standing-you" : ""}`} key={participant.id}>
          <span className="challenge-rank">{index === 0 ? <Crown size={15} /> : `#${index + 1}`}</span>
          <Avatar username={participant.username} displayName={participant.display_name} image={participant.profile_image} />
          <div className="challenge-standing-copy">
            <strong>{participant.display_name}{participant.user_id === challenge.host_id && <small> · host</small>}</strong>
            {progressPercent !== null && <div className="goal-progress-track"><span style={{ width: `${progressPercent}%` }} /></div>}
          </div>
          <span className="challenge-standing-value">{participant.current_value}{target !== null ? ` / ${target} · ${percentage}%` : ""} {challenge.unit ?? ""}</span>
        </div>;
      })}</div>
    </section>

    {isHost && <section className="goal-category-section">
      <div className="goal-category-heading"><span>Manage invites</span><i /></div>
      {pendingInvites.length > 0 && <p className="challenge-pending">Waiting on: {pendingInvites.map((participant) => participant.display_name).join(", ")}</p>}
      {inviteable.length === 0
        ? <p className="challenge-pending">Every member is already in this challenge.</p>
        : <div className="goal-card challenge-invite-panel">
            <MemberPicker members={members} selected={inviteSelection} exclude={challenge.participants.map((participant) => participant.username)} onChange={setInviteSelection} />
            <button className="button button-secondary" type="button" disabled={busy || inviteSelection.length === 0} onClick={() => void sendInvites()}><UserPlus size={15} /> Send invites</button>
          </div>}
    </section>}
  </section>;
}
