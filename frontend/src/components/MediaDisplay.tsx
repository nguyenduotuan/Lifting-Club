import type { PostMedia } from "../types/post";

export default function MediaDisplay({ items }: { items: PostMedia[] }) {
  if (items.length === 0) return null;

  return (
    <div className={`media-grid${items.length === 1 ? " media-grid-single" : ""}`}>
      {items.map((item) => (
        <div className="media-frame" key={item.id}>
          {item.media_type === "video"
            ? <video src={item.file_path} controls preload="metadata" />
            : <img src={item.file_path} alt="Training session" loading="lazy" />}
        </div>
      ))}
    </div>
  );
}