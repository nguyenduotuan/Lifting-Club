import type { Lift } from "./lift";
import type { User } from "./user";

export interface PostMedia {
  id: number;
  file_path: string;
  media_type: "image" | "video";
  sort_order: number;
}

export interface Post {
  id: number;
  user_id: number;
  user: User;
  caption: string;
  created_at: string;
  media: PostMedia[];
  lifts: Lift[];
}