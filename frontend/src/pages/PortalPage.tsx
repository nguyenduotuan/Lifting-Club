import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { Link } from "wouter";
import { getPublicChallenges } from "../api/challenges";
import { useAuth } from "../hooks/useAuth";
import { ChallengeCard } from "./ChallengesPage";
import type { Challenge } from "../types/challenge";

export default function PortalPage() {
  const { user } = useAuth();
  const [latest, setLatest] = useState<Challenge[]>([]);
  const [hot, setHot] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getPublicChallenges("newest"), getPublicChallenges("popular")])
      .then(([newChallenges, popularChallenges]) => { setLatest(newChallenges); setHot(popularChallenges); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Challenges could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page-column portal-page">
      <header className="portal-heading">
        <p className="eyebrow">WHAT'S MOVING</p>
        <h1>Club pulse<span className="heading-period">.</span></h1>
        <p>Fresh challenges, popular pursuits, and updates from the club.</p>
      </header>

      <section className="portal-section" aria-labelledby="portal-latest-heading">
        <div className="portal-section-heading">
          <h2 id="portal-latest-heading"><Trophy size={17} /> New challenges</h2>
          <Link href="/challenges">Explore all</Link>
        </div>
        {loading && <div className="state-message">Finding the latest challenges<span className="loading-dots">...</span></div>}
        {!loading && error && <div className="state-message state-error">{error}</div>}
        {!loading && !error && latest.length === 0 && <p className="portal-empty">No public challenges yet.</p>}
        {!loading && !error && latest.length > 0 && <div className="goal-grid portal-challenge-grid">{latest.slice(0, 3).map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} />)}</div>}
      </section>

      <section className="portal-section" aria-labelledby="portal-hot-heading">
        <div className="portal-section-heading">
          <h2 id="portal-hot-heading"><Flame size={17} /> Hot right now</h2>
          <span>BY PARTICIPANTS</span>
        </div>
        {!loading && hot.length === 0 && <p className="portal-empty">Popular challenges will show here.</p>}
        {!loading && hot.length > 0 && <div className="goal-grid portal-challenge-grid">{hot.slice(0, 3).map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} userId={user?.id} />)}</div>}
      </section>

      <section className="portal-section" aria-labelledby="portal-news-heading">
        <div className="portal-section-heading">
          <h2 id="portal-news-heading">Club news</h2>
          <span>UPDATES</span>
        </div>
        <p className="portal-empty">No club updates yet.</p>
      </section>
    </section>
  );
}