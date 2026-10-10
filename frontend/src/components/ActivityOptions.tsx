import { useRef, type ReactNode } from "react";
import { MoreVertical, Pin, PinOff } from "lucide-react";

interface ActivityOptionsProps {
  title: string;
  pinned: boolean;
  onTogglePin: () => void;
  children?: ReactNode;
}

export default function ActivityOptions({ title, pinned, onTogglePin, children }: ActivityOptionsProps) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function runAndClose(action: () => void) {
    action();
    menuRef.current?.removeAttribute("open");
  }

  return <details className="activity-options" ref={menuRef}>
    <summary aria-label={`Options for ${title}`} title="Activity options"><MoreVertical size={18} /></summary>
    <div className="activity-options-menu" role="menu" aria-label={`${title} options`}>
      <button type="button" role="menuitem" onClick={() => runAndClose(onTogglePin)}>
        {pinned ? <PinOff size={15} /> : <Pin size={15} />}{pinned ? "Unpin from homepage" : "Pin to homepage"}
      </button>
      {children}
    </div>
  </details>;
}