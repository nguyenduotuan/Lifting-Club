import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Flag, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { addGoalUpdate, createGoal, deleteGoal, getGoals, toggleMilestone, updateGoal } from "../api/goals";
import type { Goal, GoalCreateInput } from "../types/goal";

const emptyForm: GoalCreateInput = {
  title: "",
  description: "",
  category: "Personal",
  deadline: null,
  progress_enabled: false,
  current_value: 0,
  target_value: null,
  unit: null,
  milestones: [],
};

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  return new Date(deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function GoalCard({ goal, onChange, onDelete }: { goal: Goal; onChange: (goal: Goal) => void; onDelete: () => void }) {
  const [progress, setProgress] = useState(String(goal.current_value));
  const [updateText, setUpdateText] = useState("");
  const [busy, setBusy] = useState(false);
  const percentage = goal.progress_enabled && goal.target_value ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : null;

  async function changeProgress() {
    const value = Number(progress);
    if (!Number.isFinite(value) || value < 0) return;
    setBusy(true);
    try { onChange(await updateGoal(goal.id, value)); } finally { setBusy(false); }
  }

  async function changeMilestone(milestoneId: number) {
    setBusy(true);
    try { onChange(await toggleMilestone(goal.id, milestoneId)); } finally { setBusy(false); }
  }

  async function postUpdate() {
    if (!updateText.trim()) return;
    setBusy(true);
    try {
      await addGoalUpdate(goal.id, updateText.trim());
      setUpdateText("");
      onChange({ ...goal, updates: [...goal.updates, { id: Date.now(), body: updateText.trim(), created_at: new Date().toISOString() }] });
    } finally { setBusy(false); }
  }

  const completedMilestones = goal.milestones.filter((milestone) => milestone.completed).length;

  return <article className={`goal-card goal-card-${goal.status}`}>
    <div className="goal-card-top"><span className="goal-category">{goal.category}</span><button className="icon-button goal-delete" type="button" onClick={onDelete} aria-label={`Delete ${goal.title}`} title="Delete goal"><Trash2 size={15} /></button></div>
    <div className="goal-title-row"><span className="goal-icon"><Target size={18} /></span><div><h2>{goal.title}</h2><p>{goal.description || "A little progress, made visible."}</p></div></div>
    <div className="goal-meta"><span><Flag size={13} /> {formatDeadline(goal.deadline)}</span>{goal.milestones.length > 0 && <span>{completedMilestones}/{goal.milestones.length} milestones</span>}</div>
    {goal.progress_enabled && goal.target_value !== null && <div className="goal-progress-block">
      <div className="goal-progress-label"><span>{goal.current_value} {goal.unit || "done"}</span><strong>{percentage}%</strong></div>
      <div className="goal-progress-track"><span style={{ width: `${percentage}%` }} /></div>
      <div className="goal-progress-edit"><input type="number" min="0" value={progress} onChange={(event) => setProgress(event.target.value)} aria-label={`Update progress for ${goal.title}`} /><span>/ {goal.target_value} {goal.unit || ""}</span><button className="text-button" type="button" onClick={() => void changeProgress()} disabled={busy}>Update</button></div>
    </div>}
    {goal.milestones.length > 0 && <div className="goal-milestones"><p className="goal-section-label">MILESTONES</p>{goal.milestones.map((milestone) => <button className={`goal-milestone${milestone.completed ? " goal-milestone-done" : ""}`} key={milestone.id} type="button" onClick={() => void changeMilestone(milestone.id)} disabled={busy}><span>{milestone.completed ? <Check size={13} /> : <span />}</span>{milestone.title}</button>)}</div>}
    <div className="goal-update-area"><p className="goal-section-label">LATEST NOTE</p>{goal.updates.length > 0 && <p className="goal-latest-update">“{goal.updates[goal.updates.length - 1].body}”</p>}<div className="goal-update-input"><input value={updateText} onChange={(event) => setUpdateText(event.target.value)} placeholder="Log a small win..." maxLength={1000} onKeyDown={(event) => { if (event.key === "Enter") void postUpdate(); }} /><button className="icon-button" type="button" onClick={() => void postUpdate()} disabled={busy || !updateText.trim()} aria-label="Add progress update" title="Add update"><ChevronRight size={16} /></button></div></div>
  </article>;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState<GoalCreateInput>(emptyForm);
  const [milestoneText, setMilestoneText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { getGoals().then(setGoals).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Goals could not be loaded.")).finally(() => setLoading(false)); }, []);

  const groupedGoals = useMemo(() => goals.reduce<Record<string, Goal[]>>((groups, goal) => { (groups[goal.category] ??= []).push(goal); return groups; }, {}), [goals]);
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const completedGoals = goals.filter((goal) => goal.status === "completed");

  function addMilestone() {
    const title = milestoneText.trim();
    if (!title) return;
    setForm((current) => ({ ...current, milestones: [...current.milestones, { title }] }));
    setMilestoneText("");
  }

  async function submitGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (form.progress_enabled && (!form.target_value || form.target_value <= 0)) { setError("Add a target to use the progress bar."); return; }
    setSaving(true);
    try {
      const goal = await createGoal(form);
      setGoals((current) => [goal, ...current]);
      setForm(emptyForm);
      setMilestoneText("");
      setShowForm(false);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Goal could not be created."); } finally { setSaving(false); }
  }

  async function removeGoal(goal: Goal) {
    if (!window.confirm(`Delete “${goal.title}”?`)) return;
    await deleteGoal(goal.id);
    setGoals((current) => current.filter((item) => item.id !== goal.id));
  }

  return <section className="page-column goals-page">
    <header className="page-heading goals-heading"><div><p className="eyebrow">THE LONG GAME</p><h1>Goals<span className="heading-period">.</span></h1><p className="goals-intro">Make room for the things you want to become.</p></div></header>
    <div className="goals-overview"><div><strong>{activeGoals.length}</strong><span>IN MOTION</span></div><div><strong>{completedGoals.length}</strong><span>COMPLETED</span></div><div><strong>{goals.reduce((total, goal) => total + goal.milestones.filter((milestone) => milestone.completed).length, 0)}</strong><span>MILESTONES HIT</span></div><Sparkles size={34} /></div>
    {showForm && <form className="goal-create-panel" onSubmit={submitGoal}><div className="goal-create-heading"><div><p className="eyebrow">START SOMETHING</p><h2>A goal worth returning to</h2></div><button className="icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close goal form">×</button></div><div className="goal-form-grid"><div><label className="field-label" htmlFor="goal-title">Goal</label><input id="goal-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Build a portfolio" required maxLength={140} /></div><div><label className="field-label" htmlFor="goal-category">Area</label><input id="goal-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Learning" required maxLength={40} /></div></div><label className="field-label" htmlFor="goal-description">Why it matters <span>OPTIONAL</span></label><textarea id="goal-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Give this goal a little context..." rows={3} maxLength={2000} /><div className="goal-form-grid"><div><label className="field-label" htmlFor="goal-deadline">Deadline <span>OPTIONAL</span></label><input id="goal-deadline" type="date" value={form.deadline ?? ""} onChange={(event) => setForm({ ...form, deadline: event.target.value ? `${event.target.value}T23:59:59Z` : null })} /></div><div className="goal-progress-option"><label className="goal-check-label"><input type="checkbox" checked={form.progress_enabled} onChange={(event) => setForm({ ...form, progress_enabled: event.target.checked })} /><span>Track measurable progress</span></label>{form.progress_enabled && <div className="goal-target-row"><input type="number" min="0.01" step="any" value={form.target_value ?? ""} onChange={(event) => setForm({ ...form, target_value: Number(event.target.value) || null })} placeholder="Target" aria-label="Progress target" /><input value={form.unit ?? ""} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="books, sessions..." aria-label="Progress unit" maxLength={30} /></div>}</div></div><div className="goal-milestone-builder"><label className="field-label">Milestones <span>OPTIONAL</span></label><div className="goal-milestone-add"><input value={milestoneText} onChange={(event) => setMilestoneText(event.target.value)} placeholder="Add a stepping stone" maxLength={140} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addMilestone(); } }} /><button className="button button-small button-secondary" type="button" onClick={addMilestone}><Plus size={14} /> Add</button></div>{form.milestones.length > 0 && <ul>{form.milestones.map((milestone, index) => <li key={`${milestone.title}-${index}`}><span>{milestone.title}</span><button className="icon-button" type="button" onClick={() => setForm({ ...form, milestones: form.milestones.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove ${milestone.title}`}><Trash2 size={14} /></button></li>)}</ul>}</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="button button-primary" type="submit" disabled={saving}>Create goal <ChevronRight size={16} /></button></div></form>}
    {loading && <div className="state-message">Gathering your goals<span className="loading-dots">...</span></div>}
    {!loading && error && !showForm && <div className="state-message state-error">{error}</div>}
    {!loading && goals.length === 0 && !showForm && <div className="goals-empty"><span className="goals-empty-mark"><Target size={23} /></span><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>Give your ambition<br />somewhere to go.</h2><button className="button button-secondary" type="button" onClick={() => setShowForm(true)}>Create your first goal <ChevronRight size={16} /></button></div>}
    {!loading && goals.length > 0 && <div className="goal-sections">{Object.entries(groupedGoals).map(([category, categoryGoals]) => <section className="goal-category-section" key={category}><div className="goal-category-heading"><span>{category}</span><i /></div><div className="goal-grid">{categoryGoals.map((goal) => <GoalCard key={goal.id} goal={goal} onChange={(changed) => setGoals((current) => current.map((item) => item.id === changed.id ? changed : item))} onDelete={() => void removeGoal(goal)} />)}</div></section>)}</div>}
    <button className="button button-primary hosted-create-fab" type="button" onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}>
      {showForm ? "Close goal form" : <><Plus size={16} /> New goal</>}
    </button>
  </section>;
}
