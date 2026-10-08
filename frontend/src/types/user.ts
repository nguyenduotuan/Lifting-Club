export interface User {
  id: number;
  username: string;
  display_name: string;
  profile_image: string | null;
  created_at?: string;
}

export interface UserProfile extends User {
  post_count: number;
}