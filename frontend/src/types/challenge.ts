export interface ChallengeParticipant {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  profile_image: string | null;
  status: "invited" | "accepted" | "declined";
  current_value: number;
}

export interface Challenge {
  id: number;
  host_id: number;
  host_username: string;
  host_display_name: string;
  title: string;
  description: string;
  target_value: number | null;
  unit: string | null;
  deadline: string | null;
  created_at: string;
  participants: ChallengeParticipant[];
}

export interface ChallengeCreateInput {
  title: string;
  description: string;
  target_value: number | null;
  unit: string | null;
  deadline: string | null;
  invites: string[];
}
