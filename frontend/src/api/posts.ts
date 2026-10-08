import { request } from "./client";
import type { Post } from "../types/post";

export function getPosts(): Promise<Post[]> {
  return request<Post[]>("/posts");
}

export function createPost(formData: FormData): Promise<Post> {
  return request<Post>("/posts", { method: "POST", body: formData });
}

export function deletePost(postId: number): Promise<void> {
  return request<void>(`/posts/${postId}`, { method: "DELETE" });
}