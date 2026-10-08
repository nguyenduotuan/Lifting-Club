import { request } from "./client";
import type { Post, PostComment, PostReaction } from "../types/post";

export function getPosts(): Promise<Post[]> {
  return request<Post[]>("/posts");
}

export function createPost(formData: FormData): Promise<Post> {
  return request<Post>("/posts", { method: "POST", body: formData });
}

export function deletePost(postId: number): Promise<void> {
  return request<void>(`/posts/${postId}`, { method: "DELETE" });
}

export function createComment(postId: number, body: string): Promise<PostComment> {
  return request<PostComment>(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

export function togglePostReaction(postId: number, emoji: PostReaction["emoji"]): Promise<{ reactions: PostReaction[] }> {
  return request<{ reactions: PostReaction[] }>(`/posts/${postId}/reaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emoji }),
  });
}