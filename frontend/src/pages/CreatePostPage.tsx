import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, ImagePlus, Plus, Trash2, UploadCloud } from "lucide-react";
import { Link, useLocation } from "wouter";
import { createPost } from "../api/posts";
import type { LiftInput } from "../types/lift";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_LIFT_WEIGHT = 4_294_967_295;

function newLift(): LiftInput {
  return { exercise_name: "", weight: 0, unit: "kg", reps: 1 };
}

type PostMode = "regular" | "strength" | "activity";

export default function CreatePostPage() {
  const [, setLocation] = useLocation();
  const [postMode, setPostMode] = useState<PostMode>("strength");
  const [caption, setCaption] = useState("");
  const [lifts, setLifts] = useState<LiftInput[]>([newLift()]);
  const [activityName, setActivityName] = useState("");
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">("km");
  const [durationHours, setDurationHours] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [durationSeconds, setDurationSeconds] = useState("0");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateLift(index: number, field: keyof LiftInput, value: string) {
    setLifts((current) => current.map((lift, liftIndex) => {
      if (liftIndex !== index) return lift;
      if (field === "unit") return { ...lift, unit: value as LiftInput["unit"] };
      if (field === "weight" || field === "reps") return { ...lift, [field]: Number(value) };
      return { ...lift, exercise_name: value };
    }));
  }

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const combined = [...files, ...selected];
    if (combined.length > 6) {
      setError("A post can include up to 6 media files.");
    } else if (selected.some((file) => file.size > MAX_FILE_SIZE)) {
      setError("Each file must be 25 MB or smaller.");
    } else if (selected.some((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
      setError("Choose image or video files only.");
    } else {
      setError("");
      setFiles(combined);
    }
    event.target.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validLifts = postMode === "strength" ? lifts.filter((lift) => lift.exercise_name.trim()) : [];
    if (postMode === "strength" && validLifts.length === 0) {
      setError("Add at least one lift with an exercise name.");
      return;
    }
    if (validLifts.some((lift) => !Number.isInteger(lift.weight) || lift.weight < 0 || lift.weight > MAX_LIFT_WEIGHT)) {
      setError("Weights must be whole numbers from 0 to 4,294,967,295.");
      return;
    }
    if (validLifts.some((lift) => lift.reps <= 0)) {
      setError("Reps must be greater than zero.");
      return;
    }

    const totalDuration = Number(durationHours) * 3600 + Number(durationMinutes) * 60 + Number(durationSeconds);
    if (postMode === "activity" && (!activityName.trim() || !Number.isFinite(Number(distance)) || Number(distance) <= 0 || totalDuration <= 0)) {
      setError("Add an activity, a distance, and a duration greater than zero.");
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("lifts", JSON.stringify(validLifts));
    if (postMode === "activity") {
      formData.append("activity", JSON.stringify({
        name: activityName.trim(),
        distance: Number(distance),
        distance_unit: distanceUnit,
        duration_seconds: totalDuration,
      }));
    }
    files.forEach((file) => formData.append("media", file));

    setSubmitting(true);
    try {
      await createPost(formData);
      setLocation("/posts");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Post could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-column create-page">
      <Link className="back-link" href="/posts"><ArrowLeft size={16} /> Back to posts</Link>
      <header className="page-heading create-heading"><div><p className="eyebrow">LOG THE SESSION</p><h1>New post<span className="heading-period">.</span></h1></div></header>

      <form className="create-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="caption">Caption <span>OPTIONAL</span></label>
        <textarea id="caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={2000} rows={4} placeholder="A note from today's session..." />

        <label className="field-label" htmlFor="post-type">What are you logging?</label>
        <select id="post-type" value={postMode} onChange={(event) => { setPostMode(event.target.value as PostMode); setError(""); }}>
          <option value="regular">Regular Post</option>
          <option value="strength">Strength Session</option>
          <option value="activity">Distance Activity</option>
        </select>

        {postMode === "strength" && <><div className="form-section-heading"><div><p className="eyebrow">THE WORK</p><h2>Lifts</h2></div><button className="button button-small button-secondary" type="button" onClick={() => setLifts((current) => [...current, newLift()])}><Plus size={15} /> Add lift</button></div>
        <div className="lift-fields">
          {lifts.map((lift, index) => (
            <div className="lift-field-row" key={index}>
              <label className="sr-only" htmlFor={`exercise-${index}`}>Exercise name</label>
              <input id={`exercise-${index}`} value={lift.exercise_name} onChange={(event) => updateLift(index, "exercise_name", event.target.value)} maxLength={100} placeholder="Exercise name" required={index === 0} />
              <label className="sr-only" htmlFor={`weight-${index}`}>Weight</label>
              <input id={`weight-${index}`} type="number" min="0" max={MAX_LIFT_WEIGHT} step="1" value={lift.weight} onChange={(event) => updateLift(index, "weight", event.target.value)} placeholder="Weight" required={index === 0} />
              <label className="sr-only" htmlFor={`unit-${index}`}>Weight unit</label>
              <select id={`unit-${index}`} value={lift.unit} onChange={(event) => updateLift(index, "unit", event.target.value)} aria-label="Weight unit"><option value="kg">kg</option><option value="lb">lb</option></select>
              <label className="sr-only" htmlFor={`reps-${index}`}>Reps</label>
              <input id={`reps-${index}`} type="number" min="1" max="1000" step="1" value={lift.reps} onChange={(event) => updateLift(index, "reps", event.target.value)} placeholder="Reps" required={index === 0} />
              <button className="icon-button remove-lift" type="button" onClick={() => setLifts((current) => current.length > 1 ? current.filter((_, liftIndex) => liftIndex !== index) : current)} aria-label="Remove lift" title="Remove lift" disabled={lifts.length === 1}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        </>}

        {postMode === "activity" && <div className="activity-fields">
          <div className="form-section-heading"><div><p className="eyebrow">THE DISTANCE</p><h2>Activity</h2></div></div>
          <label className="field-label" htmlFor="activity-name">Activity</label>
          <input id="activity-name" value={activityName} onChange={(event) => setActivityName(event.target.value)} maxLength={100} placeholder="Running, cycling, swimming..." />
          <div className="activity-input-row">
            <div><label className="field-label" htmlFor="distance">Distance</label><input id="distance" type="number" min="0.01" step="0.01" value={distance} onChange={(event) => setDistance(event.target.value)} placeholder="5" /></div>
            <div><label className="field-label" htmlFor="distance-unit">Unit</label><select id="distance-unit" value={distanceUnit} onChange={(event) => setDistanceUnit(event.target.value as "km" | "mi")}><option value="km">km</option><option value="mi">mi</option></select></div>
          </div>
          <label className="field-label">Time</label>
          <div className="activity-input-row activity-time-row">
            <input aria-label="Hours" type="number" min="0" max="99" value={durationHours} onChange={(event) => setDurationHours(event.target.value)} placeholder="Hours" />
            <input aria-label="Minutes" type="number" min="0" max="59" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} placeholder="Minutes" />
            <input aria-label="Seconds" type="number" min="0" max="59" value={durationSeconds} onChange={(event) => setDurationSeconds(event.target.value)} placeholder="Seconds" />
          </div>
          <p className="field-hint">Your pace will be calculated and added to the post.</p>
        </div>}

        <div className="form-section-heading media-section-heading"><div><p className="eyebrow">THE MOMENT</p><h2>Media <span className="optional-note">OPTIONAL</span></h2></div></div>
        <label className="upload-zone">
          <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple onChange={addFiles} />
          <span className="upload-icon"><ImagePlus size={21} /></span>
          <span><strong>Add photos or video</strong><small>Up to 6 files · 25 MB each</small></span>
          <UploadCloud className="upload-cloud" size={19} />
        </label>
        {files.length > 0 && <ul className="file-list">{files.map((file, index) => <li key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" className="icon-button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><Trash2 size={15} /></button></li>)}</ul>}

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Posting..." : "Share post"}<ArrowLeft className="share-arrow" size={16} /></button></div>
      </form>
    </section>
  );
}