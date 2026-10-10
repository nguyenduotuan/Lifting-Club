import { CalendarDays } from "lucide-react";
import { Link } from "wouter";

export default function EventsPage() {
  return (
    <section className="page-column events-page">
      <header className="page-heading">
        <div><p className="eyebrow">MAKE A PLAN TOGETHER</p><h1>Events<span className="heading-period">.</span></h1></div>
      </header>
      <div className="goals-empty events-empty">
        <span className="goals-empty-mark"><CalendarDays size={23} /></span>
        <p className="eyebrow">YOUR SHARED CALENDAR</p>
        <h2>Nothing on the calendar yet.</h2>
        <p className="goals-intro">Event scheduling isn't available yet. For now, share a plan with your circle as a post.</p>
        <Link className="button button-secondary" href="/create">Post a plan</Link>
      </div>
    </section>
  );
}