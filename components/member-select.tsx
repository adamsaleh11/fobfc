import { cn } from "@/lib/cn";

type MemberOption = {
  _id: string;
  name: string;
};

type MemberSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  members: MemberOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function MemberSelect({
  label,
  value,
  onChange,
  members,
  disabled,
  placeholder = "Select a member",
  className,
}: MemberSelectProps) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/60 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="" className="bg-slate-950 text-slate-100">
          {placeholder}
        </option>
        {members.map((member) => (
          <option
            key={member._id}
            value={member._id}
            className="bg-slate-950 text-slate-100"
          >
            {member.name}
          </option>
        ))}
      </select>
    </label>
  );
}
