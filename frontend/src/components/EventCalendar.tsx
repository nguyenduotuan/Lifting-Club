import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
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

export default function EventCalendar({ events }: { events: ClubEvent[] }) {
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
    const grouped = new Map<string, ClubEvent[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.starts_at));
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    }
    return grouped;
  }, [events]);
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
          aria-label={`${day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${dayEvents.length ? `, ${dayEvents.length} events` : ""}`}
          aria-pressed={key === selectedDate}
          onClick={() => setSelectedDate(key)}
        >
          <span className="calendar-day-number">{day.getDate()}</span>
          {dayEvents.slice(0, 2).map((event) => <span className="calendar-day-event" key={event.id}>{event.title}</span>)}
          {dayEvents.length > 2 && <span className="calendar-day-more">+{dayEvents.length - 2} more</span>}
        </button>;
      })}
    </div>
    <section className="calendar-agenda" aria-live="polite">
      <h3>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3>
      {selectedEvents.length === 0 ? <p>No events on this date.</p> : <ul>{selectedEvents.map((event) => <li key={event.id}>
        <time>{timeLabel(event.starts_at)}</time><div><strong>{event.title}</strong>{event.location && <span><MapPin size={12} /> {event.location}</span>}</div>
      </li>)}</ul>}
    </section>
  </div>;
}