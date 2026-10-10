import { request } from "./client";
import type { Post } from "../types/post";
import type { User, UserProfile } from "../types/user";

export function getUsers(): Promise<User[]> {
  return request<User[]>("/users");
}

export function getUser(username: string): Promise<UserProfile> {
  return request<UserProfile>(`/users/${encodeURIComponent(username)}`);
}

export function getUserPosts(username: string): Promise<Post[]> {
  return request<Post[]>(`/users/${encodeURIComponent(username)}/posts`);
}

export function updateDisplayName(displayName: string): Promise<User> {
  return request<User>("/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: displayName }),
  });
}

export function updateProfileImage(image: File): Promise<User> {
  const formData = new FormData();
  formData.append("image", image);
  return request<User>("/users/me/profile-image", {
    method: "PATCH",
    body: formData,
  });
}