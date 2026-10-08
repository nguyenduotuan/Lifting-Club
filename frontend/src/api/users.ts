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