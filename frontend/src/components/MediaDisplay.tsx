import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PostMedia } from "../types/post";
import { mediaUrl } from "../api/client";

export default function MediaDisplay({ items }: { items: PostMedia[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  if (items.length === 0) return null;

  const activeItem = items[activeIndex];
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  function showPrevious() {
    setActiveIndex((index) => Math.max(0, index - 1));
  }

  function showNext() {
    setActiveIndex((index) => Math.min(items.length - 1, index + 1));
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    setTouchStart(event.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStart === null) return;
    const distance = event.changedTouches[0]?.clientX - touchStart;
    if (Math.abs(distance) > 40) {
      if (distance < 0) showNext();
      else showPrevious();
    }
    setTouchStart(null);
  }

  return (
    <div className="media-carousel">
      <div className="media-carousel-stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="media-frame" key={activeItem.id}>
          {activeItem.media_type === "video"
            ? <video src={mediaUrl(activeItem.file_path)} controls preload="metadata" />
            : <button className="media-image-button" type="button" onClick={() => setViewerOpen(true)} aria-label={`Open photo ${activeIndex + 1} of ${items.length}`}>
              <img src={mediaUrl(activeItem.file_path)} alt="Training session" loading="lazy" />
            </button>}
        </div>
        {hasPrevious && <button className="media-nav media-nav-previous" type="button" onClick={showPrevious} aria-label="Previous photo"><ChevronLeft size={20} /></button>}
        {hasNext && <button className="media-nav media-nav-next" type="button" onClick={showNext} aria-label="Next photo"><ChevronRight size={20} /></button>}
        {items.length > 1 && <div className="media-indicator" aria-label={`Photo ${activeIndex + 1} of ${items.length}`}>
          <span>{activeIndex + 1} / {items.length}</span>
          <div className="media-dots" aria-hidden="true">
            {items.map((item, index) => <span className={index === activeIndex ? "media-dot media-dot-active" : "media-dot"} key={item.id} />)}
          </div>
        </div>}
      </div>
      {viewerOpen && activeItem.media_type === "image" && <div className="media-viewer" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setViewerOpen(false)}>
        <button className="media-viewer-close" type="button" onClick={() => setViewerOpen(false)} aria-label="Close photo viewer"><X size={22} /></button>
        <img src={mediaUrl(activeItem.file_path)} alt="Training session" onClick={(event) => event.stopPropagation()} />
        {hasPrevious && <button className="media-viewer-nav media-viewer-previous" type="button" onClick={(event) => { event.stopPropagation(); showPrevious(); }} aria-label="Previous photo"><ChevronLeft size={28} /></button>}
        {hasNext && <button className="media-viewer-nav media-viewer-next" type="button" onClick={(event) => { event.stopPropagation(); showNext(); }} aria-label="Next photo"><ChevronRight size={28} /></button>}
        <span className="media-viewer-count">{activeIndex + 1} / {items.length}</span>
      </div>}
    </div>
  );
}