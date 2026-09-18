import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

type Props = {
  onEdit: () => void;
  onDelete: () => void;
};

const MessageActions = ({ onEdit, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 mt-2 mr-1 rounded-card hover:bg-black/10"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-6 z-10 bg-surface rounded-card shadow-lg py-1 w-28 text-body">
          <button
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-surface-muted text-text-primary"
          >
            Edit
          </button>
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-surface-muted text-red-500"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageActions;
