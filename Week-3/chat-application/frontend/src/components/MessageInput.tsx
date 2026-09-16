import { Send } from "lucide-react";
import type { FormEvent, ChangeEvent } from "react";

type Props = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

const MessageInput = ({ value, onChange, onSubmit }: Props) => (
  <form
    onSubmit={onSubmit}
    className="flex gap-2 mt-3 p-1 bg-send-bg rounded-lg"
  >
    <input
      value={value}
      onChange={onChange}
      placeholder="Your message"
      className="flex-1 px-4 py-2 text-body outline-none"
    />
    <button
      type="submit"
      className="text-primary p-2.5 cursor-pointer hover:bg-primary-tint transition-colors"
    >
      <Send size={20} />
    </button>
  </form>
);

export default MessageInput;
