import { useEffect, type ReactNode } from "react";
import { Route, Switch, useLocation } from "wouter";
import Navigation from "./components/Navigation";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import ChallengeDetailPage from "./pages/ChallengeDetailPage";
import ChallengesPage from "./pages/ChallengesPage";
import CreatePostPage from "./pages/CreatePostPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import FeedPage from "./pages/FeedPage";
import GoalsPage from "./pages/GoalsPage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import PortalPage from "./pages/PortalPage";
import ProfilePage from "./pages/ProfilePage";
import SchedulePage from "./pages/SchedulePage";
import SettingsPage from "./pages/SettingsPage";

function LocationRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation(to); }, [setLocation, to]);
  return <main className="app-loading"><span className="loading-ring" /></main>;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="app-loading"><span className="loading-ring" /></main>;
  return user ? <AuthenticatedLayout>{children}</AuthenticatedLayout> : <LocationRedirect to="/login" />;
}

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <div className="app-shell"><Navigation /><main className="app-main">{children}</main></div>;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <main className="app-loading"><span className="loading-ring" /></main>;
  return user ? <LocationRedirect to="/" /> : <LoginPage />;
}

function ProfileRedirect() {
  const { user } = useAuth();
  return <LocationRedirect to={`/profile/${user?.username ?? ""}`} />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login"><LoginRoute /></Route>
      <Route path="/feed"><RequireAuth><LocationRedirect to="/posts" /></RequireAuth></Route>
      <Route path="/create"><RequireAuth><CreatePostPage /></RequireAuth></Route>
      <Route path="/posts/create"><RequireAuth><CreatePostPage /></RequireAuth></Route>
      <Route path="/posts"><RequireAuth><FeedPage /></RequireAuth></Route>
      <Route path="/settings"><RequireAuth><SettingsPage /></RequireAuth></Route>
      <Route path="/events/create"><RequireAuth><EventsPage createOnly /></RequireAuth></Route>
      <Route path="/events"><RequireAuth><EventsPage /></RequireAuth></Route>
      <Route path="/events/:id"><RequireAuth><EventDetailPage /></RequireAuth></Route>
      <Route path="/calendar"><RequireAuth><SchedulePage /></RequireAuth></Route>
      <Route path="/notifications"><RequireAuth><NotificationsPage /></RequireAuth></Route>
      <Route path="/goals/create"><RequireAuth><GoalsPage createOnly /></RequireAuth></Route>
      <Route path="/goals"><RequireAuth><GoalsPage /></RequireAuth></Route>
      <Route path="/challenges/create"><RequireAuth><ChallengesPage createOnly /></RequireAuth></Route>
      <Route path="/challenges"><RequireAuth><ChallengesPage /></RequireAuth></Route>
      <Route path="/challenges/:id"><RequireAuth><ChallengeDetailPage /></RequireAuth></Route>
      <Route path="/profile"><RequireAuth><ProfileRedirect /></RequireAuth></Route>
      <Route path="/profile/:username"><RequireAuth><ProfilePage /></RequireAuth></Route>
      <Route path="/"><RequireAuth><PortalPage /></RequireAuth></Route>
      <Route><LocationRedirect to="/" /></Route>
    </Switch>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}