import { cn } from "@/lib/utils";

interface OptionCardProps {
  label: string;
  icon: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function OptionCard({
  label,
  icon,
  selected,
  onClick,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-2 py-3 text-xs font-medium transition-all",
        selected && "option-selected border-transparent text-accent-purple",
        !selected && "text-gray-700",
        className,
      )}
    >
      <span className={cn(selected ? "text-accent-purple" : "text-pink-500")}>
        {icon}
      </span>
      {label}
    </button>
  );
}
