import { jsonBody, request } from "./client";
import type { ClubEvent, EventCreateInput } from "../types/event";

export function getEvents(): Promise<ClubEvent[]> {
  return request<ClubEvent[]>("/events");
}

export function getPublicEvents(): Promise<ClubEvent[]> {
  return request<ClubEvent[]>("/events/discover");
}

export function createEvent(payload: EventCreateInput): Promise<ClubEvent> {
  return request<ClubEvent>("/events", jsonBody(payload));
}

export function joinEvent(eventId: number): Promise<ClubEvent> {
  return request<ClubEvent>(`/events/${eventId}/join`, { method: "POST" });
}

export function inviteToEvent(eventId: number, usernames: string[]): Promise<ClubEvent> {
  return request<ClubEvent>(`/events/${eventId}/invite`, jsonBody({ usernames }));
}

export function respondToEvent(eventId: number, action: "accept" | "decline"): Promise<ClubEvent> {
  return request<ClubEvent>(`/events/${eventId}/respond`, jsonBody({ action }));
}

export function deleteEvent(eventId: number): Promise<void> {
  return request<void>(`/events/${eventId}`, { method: "DELETE" });
}