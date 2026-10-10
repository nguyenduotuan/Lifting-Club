import { jsonBody, request } from "./client";
import type { Challenge, ChallengeCreateInput } from "../types/challenge";

export function getChallenges(): Promise<Challenge[]> {
  return request<Challenge[]>("/challenges");
}

export function getPublicChallenges(sort: "newest" | "popular" = "newest", limit = 6): Promise<Challenge[]> {
  return request<Challenge[]>(`/challenges/discover?sort=${sort}&limit=${limit}`);
}

export function getChallenge(challengeId: number): Promise<Challenge> {
  return request<Challenge>(`/challenges/${challengeId}`);
}

export function createChallenge(payload: ChallengeCreateInput): Promise<Challenge> {
  return request<Challenge>("/challenges", jsonBody(payload));
}

export function joinChallenge(challengeId: number): Promise<Challenge> {
  return request<Challenge>(`/challenges/${challengeId}/join`, { method: "POST" });
}

export function inviteToChallenge(challengeId: number, usernames: string[]): Promise<Challenge> {
  return request<Challenge>(`/challenges/${challengeId}/invite`, jsonBody({ usernames }));
}

export function respondToChallenge(challengeId: number, action: "accept" | "decline"): Promise<Challenge> {
  return request<Challenge>(`/challenges/${challengeId}/respond`, jsonBody({ action }));
}

export function updateChallengeProgress(challengeId: number, currentValue: number): Promise<Challenge> {
  return request<Challenge>(`/challenges/${challengeId}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_value: currentValue }),
  });
}

export function deleteChallenge(challengeId: number): Promise<void> {
  return request<void>(`/challenges/${challengeId}`, { method: "DELETE" });
}
