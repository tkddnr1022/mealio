import { DropdownButton } from "@/components/ui/dropdown/DropdownButton";
import {
  DropdownList,
  type DropdownOption,
} from "@/components/ui/dropdown/DropdownList";
import { cn } from "@/lib/utils/cn";

export type FilterDropdownProps = Readonly<{
  className?: string;
  open?: boolean;
  label?: string;
  options?: readonly DropdownOption[];
  selectedValue?: string;
  onSelect?: (option: DropdownOption) => void;
  onToggle?: () => void;
}>;

export function FilterDropdown({
  className = "",
  open = false,
  label = "Label",
  options,
  selectedValue,
  onSelect,
  onToggle,
}: FilterDropdownProps) {
  return (
    <div className={cn("relative flex w-[121px] flex-col items-end", className)}>
      <DropdownButton label={label} open={open} onClick={onToggle} />
      {open ? (
        <DropdownList
          className="absolute top-10 right-0"
          options={options}
          selectedValue={selectedValue}
          onSelect={onSelect}
        />
      ) : null}
    </div>
  );
}
