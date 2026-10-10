export interface EventParticipant {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  profile_image: string | null;
  status: "invited" | "accepted" | "declined";
}

export interface ClubEvent {
  id: number;
  host_id: number;
  host_username: string;
  host_display_name: string;
  title: string;
  description: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  is_public: boolean;
  max_participants: number | null;
  created_at: string;
  participants: EventParticipant[];
}

export interface EventCreateInput {
  title: string;
  description: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  invites: string[];
  is_public: boolean;
  max_participants: number | null;
}