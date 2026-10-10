import type { Lift } from "./lift";
import type { User } from "./user";

export interface PostMedia {
  id: number;
  file_path: string;
  media_type: "image" | "video";
  sort_order: number;
}

export interface PostComment {
  id: number;
  post_id: number;
  user_id: number;
  user: User;
  body: string;
  created_at: string;
}

export interface PostReaction {
  id: number;
  post_id: number;
  user_id: number;
  emoji: "🔥" | "💪" | "❤️" | "🙌" | "😂";
  created_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  user: User;
  caption: string;
  created_at: string;
  activity_name: string | null;
  distance: number | null;
  distance_unit: string | null;
  duration_seconds: number | null;
  pace_seconds_per_unit: number | null;
  media: PostMedia[];
  lifts: Lift[];
  comments: PostComment[];
  reactions: PostReaction[];
}