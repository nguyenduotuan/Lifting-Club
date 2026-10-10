import { Activity, ArrowUpRight, Bell, CalendarDays, Flag, Plus, Trophy, UserRound } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../hooks/useAuth";

export default function PortalPage() {
  const { user } = useAuth();
  const destinations = [
    { href: "/feed", number: "01", label: "FYP", description: "Catch up on what your circle is sharing.", icon: Activity },
    { href: "/challenges", number: "02", label: "Challenges", description: "See what's in motion and take part.", icon: Trophy },
    { href: "/goals", number: "03", label: "Goals & milestones", description: "Keep track of progress and celebrate wins.", icon: Flag },
    { href: "/events", number: "04", label: "Events", description: "Find plans and moments with your circle.", icon: CalendarDays },
    { href: "/notifications", number: "05", label: "Notifications", description: "See invitations waiting for your response.", icon: Bell },
    { href: "/create", number: "06", label: "Post", description: "Add a moment, session, or small victory.", icon: Plus },
    { href: `/profile/${user?.username ?? ""}`, number: "07", label: "Your profile", description: "Revisit your posts and personal progress.", icon: UserRound },
  ];

  return (
    <section className="page-column portal-page">
      <header className="portal-heading">
        <p className="eyebrow">THE CIRCLE, AT A GLANCE</p>
        <h1>Your circuit<span className="heading-period">.</span></h1>
        <p>Everything you and your people are building, all in one place.</p>
      </header>

      <section className="portal-section" aria-labelledby="portal-destinations-heading">
        <div className="portal-section-heading">
          <h2 id="portal-destinations-heading">Pick up where you like</h2>
          <span>YOUR PLACES</span>
        </div>
        <nav className="portal-destinations" aria-label="Explore Circuit">
          {destinations.map(({ href, number, label, description, icon: Icon }) => (
            <Link className="portal-destination" href={href} key={href}>
              <span className="portal-destination-number">{number}</span>
              <span className="portal-destination-icon"><Icon size={19} strokeWidth={1.8} /></span>
              <span className="portal-destination-copy"><strong>{label}</strong><small>{description}</small></span>
              <ArrowUpRight className="portal-destination-arrow" size={18} />
            </Link>
          ))}
        </nav>
      </section>
    </section>
  );
}