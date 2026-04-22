import { useState } from "react";
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
}>;

export function FilterDropdown({
  className = "",
  open = false,
  label = "Label",
  options,
  selectedValue,
  onSelect,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(open);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (option: DropdownOption) => {
    onSelect?.(option);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative flex w-[121px] flex-col items-end", className)}>
      <DropdownButton label={label} open={isOpen} onClick={handleToggle} />
      {isOpen ? (
        <DropdownList
          className="absolute top-10 right-0"
          options={options}
          selectedValue={selectedValue}
          onSelect={handleSelect}
        />
      ) : null}
    </div>
  );
}
