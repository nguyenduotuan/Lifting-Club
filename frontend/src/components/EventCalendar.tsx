import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { Challenge } from "../types/challenge";
import type { ClubEvent } from "../types/event";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeLabel(date: string): string {
  return new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface CalendarItem {
  id: string;
  title: string;
  date: string;
  kind: "event" | "challenge";
  location: string | null;
}

export default function EventCalendar({ events, challenges = [] }: { events: ClubEvent[]; challenges?: Challenge[] }) {
  const [shownMonth, setShownMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const monthLabel = shownMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const days = useMemo(() => {
    const firstWeekday = (shownMonth.getDay() + 6) % 7;
    const dayCount = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
    const total = Math.ceil((firstWeekday + dayCount) / 7) * 7;
    return Array.from({ length: total }, (_, index) => new Date(shownMonth.getFullYear(), shownMonth.getMonth(), index - firstWeekday + 1));
  }, [shownMonth]);
  const eventMap = useMemo(() => {
    const grouped = new Map<string, CalendarItem[]>();
    const items: CalendarItem[] = [
      ...events.map((event) => ({ id: `event-${event.id}`, title: event.title, date: event.starts_at, kind: "event" as const, location: event.location })),
      ...challenges.filter((challenge) => challenge.deadline !== null).map((challenge) => ({
        id: `challenge-${challenge.id}`,
        title: challenge.title,
        date: challenge.deadline as string,
        kind: "challenge" as const,
        location: null,
      })),
    ].sort((left, right) => left.date.localeCompare(right.date));
    for (const item of items) {
      const key = dateKey(new Date(item.date));
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return grouped;
  }, [events, challenges]);
  const selectedEvents = eventMap.get(selectedDate) ?? [];

  function changeMonth(offset: number) {
    const next = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + offset, 1);
    setShownMonth(next);
    setSelectedDate(dateKey(next));
  }

  return <div className="event-calendar">
    <header className="calendar-heading">
      <h2>{monthLabel}</h2>
      <div>
        <button className="icon-button" type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" title="Previous month"><ChevronLeft size={17} /></button>
        <button className="icon-button" type="button" onClick={() => changeMonth(1)} aria-label="Next month" title="Next month"><ChevronRight size={17} /></button>
      </div>
    </header>
    <div className="calendar-grid" role="grid" aria-label={monthLabel}>
      {weekdays.map((weekday) => <div className="calendar-weekday" role="columnheader" key={weekday}>{weekday}</div>)}
      {days.map((day) => {
        const key = dateKey(day);
        const dayEvents = eventMap.get(key) ?? [];
        const inMonth = day.getMonth() === shownMonth.getMonth();
        return <button
          className={`calendar-day${inMonth ? "" : " calendar-day-outside"}${key === selectedDate ? " calendar-day-selected" : ""}${dayEvents.length ? " calendar-day-has-events" : ""}`}
          type="button"
          role="gridcell"
          key={key}
          aria-label={`${day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${dayEvents.length ? `, ${dayEvents.length} scheduled items` : ""}`}
          aria-pressed={key === selectedDate}
          onClick={() => setSelectedDate(key)}
        >
          <span className="calendar-day-number">{day.getDate()}</span>
          {dayEvents.slice(0, 2).map((item) => <span className={`calendar-day-event${item.kind === "challenge" ? " calendar-day-challenge" : ""}`} key={item.id}>{item.title}</span>)}
          {dayEvents.length > 2 && <span className="calendar-day-more">+{dayEvents.length - 2} more</span>}
        </button>;
      })}
    </div>
    <section className="calendar-agenda" aria-live="polite">
      <h3>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3>
      {selectedEvents.length === 0 ? <p>Nothing scheduled for this date.</p> : <ul>{selectedEvents.map((item) => <li className={`calendar-agenda-item calendar-agenda-${item.kind}`} key={item.id}>
        <time>{timeLabel(item.date)}</time><div><strong>{item.title}</strong><span className="calendar-item-kind">{item.kind === "event" ? "EVENT" : "CHALLENGE DEADLINE"}</span>{item.location && <span><MapPin size={12} /> {item.location}</span>}</div>
      </li>)}</ul>}
    </section>
  </div>;
}