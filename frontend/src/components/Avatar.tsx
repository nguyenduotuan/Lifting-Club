import { Link } from "wouter";

interface AvatarProps {
  username: string;
  displayName: string;
  image: string | null;
  size?: "small" | "large";
  linked?: boolean;
}

export default function Avatar({ username, displayName, image, size = "small", linked = false }: AvatarProps) {
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const content = image
    ? <img className={`avatar avatar-${size}`} src={image} alt="" />
    : <span className={`avatar avatar-${size} avatar-fallback`} aria-label={displayName}>{initials || "A"}</span>;

  return linked ? <Link href={`/profile/${username}`} className="avatar-link" aria-label={`${displayName}'s profile`}>{content}</Link> : content;
}