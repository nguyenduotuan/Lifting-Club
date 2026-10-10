import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import Avatar from "./Avatar";
import type { User } from "../types/user";

interface MemberPickerProps {
  members: User[];
  selected: string[];
  onChange: (usernames: string[]) => void;
  exclude?: string[];
  placeholder?: string;
}

export default function MemberPicker({ members, selected, onChange, exclude = [], placeholder = "Search people to invite..." }: MemberPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const options = useMemo(() => {
    const taken = new Set([...exclude, ...selected]);
    const normalized = query.trim().toLocaleLowerCase();
    return members
      .filter((member) => !taken.has(member.username))
      .filter((member) => `${member.display_name} ${member.username}`.toLocaleLowerCase().includes(normalized))
      .slice(0, 8);
  }, [members, exclude, selected, query]);

  const selectedMembers = selected
    .map((username) => members.find((member) => member.username === username))
    .filter((member): member is User => Boolean(member));

  function addMember(username: string) {
    onChange([...selected, username]);
    setQuery("");
  }

  return <div className="member-picker" ref={rootRef}>
    {selectedMembers.length > 0 && <div className="member-picker-chips">
      {selectedMembers.map((member) => (
        <span className="member-picker-chip" key={member.id}>
          {member.display_name}
          <button type="button" onClick={() => onChange(selected.filter((name) => name !== member.username))} aria-label={`Remove ${member.display_name}`} title={`Remove ${member.display_name}`}>
            <X size={11} />
          </button>
        </span>
      ))}
    </div>}
    <label className="member-picker-field">
      <Search size={14} aria-hidden="true" />
      <input
        type="search"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (options.length > 0) addMember(options[0].username);
          }
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
    {open && <div className="member-picker-dropdown" role="listbox">
      {options.map((member) => (
        <button className="member-picker-option" type="button" key={member.id} onClick={() => addMember(member.username)}>
          <Avatar username={member.username} displayName={member.display_name} image={member.profile_image} />
          <span className="member-picker-option-copy"><strong>{member.display_name}</strong><small>@{member.username}</small></span>
        </button>
      ))}
      {options.length === 0 && <p className="member-picker-empty">No matching members.</p>}
    </div>}
  </div>;
}
