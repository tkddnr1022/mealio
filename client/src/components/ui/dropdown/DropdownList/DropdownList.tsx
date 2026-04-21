import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { cn } from "@/lib/utils/cn";

export type DropdownOption = Readonly<{
  value: string;
  label: string;
}>;

export type DropdownListProps = Readonly<{
  className?: string;
  options?: readonly DropdownOption[];
  selectedValue?: string;
  onSelect?: (option: DropdownOption) => void;
}>;

const defaultOptions: readonly DropdownOption[] = [
  { value: "label-1", label: "Label" },
  { value: "label-2", label: "Label" },
  { value: "label-3", label: "Label" },
];

export function DropdownList({
  className = "",
  options = defaultOptions,
  selectedValue = options[0]?.value,
  onSelect,
}: DropdownListProps) {
  return (
    <ul
      className={cn(
        "w-[120px] overflow-hidden rounded-xl bg-background-surface shadow-md",
        className,
      )}
    >
      {options.map((option) => (
        <li key={option.value}>
          <DropdownItem
            label={option.label}
            selected={selectedValue === option.value}
            onClick={() => onSelect?.(option)}
          />
        </li>
      ))}
    </ul>
  );
}
