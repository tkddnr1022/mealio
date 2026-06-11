'use client';

import { useState } from 'react';
import { DropdownButton } from '@/components/ui/dropdown/DropdownButton';
import {
  DropdownList,
  type DropdownOption,
} from '@/components/ui/dropdown/DropdownList';
import { cn } from '@/lib/utils/cn';

export interface FilterDropdownProps {
  className?: string;
  /** 제어 모드: 넘기면 열림 상태의 단일 소스 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 비제어 모드일 때만 초기 열림(`open` 미지정 시) */
  defaultOpen?: boolean;
  label?: string;
  options?: readonly DropdownOption[];
  selectedValue?: string;
  onSelect?: (option: DropdownOption) => void;
}

export function FilterDropdown({
  className = '',
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  label,
  options,
  selectedValue,
  onSelect,
}: FilterDropdownProps) {
  const isControlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = isControlled ? openProp : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  const handleToggle = () => {
    setOpen(!isOpen);
  };

  const handleSelect = (option: DropdownOption) => {
    onSelect?.(option);
    setOpen(false);
  };

  return (
    <div className={cn('relative flex flex-col items-end', className)}>
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
