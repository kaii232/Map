"use client";

import * as React from "react";
import { DayPicker, DropdownProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export function CustomSelectDropdown(props: DropdownProps) {
  const { options, value, onChange } = props;

  const handleValueChange = (newValue: string) => {
    if (onChange) {
      const syntheticEvent = {
        target: {
          value: newValue,
        },
      } as React.ChangeEvent<HTMLSelectElement>;

      onChange(syntheticEvent);
    }
  };

  return (
    <Select value={value?.toString()} onValueChange={handleValueChange}>
      <SelectTrigger className="grow">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-0">
        {options?.map((option) => {
          if (option.disabled) return;
          return (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
              disabled={option.disabled}
              className="pl-7"
            >
              {option.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 sm:p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4 relative",
        month: "space-y-4",
        month_caption: "flex justify-center mt-1 items-center px-9",
        caption_label: "text-sm font-medium text-neutral-300",
        nav: "flex items-center absolute top-2 pointer-events-none inset-x-0 justify-between",
        button_previous:
          "inline-flex pointer-events-auto items-center justify-center whitespace-nowrap rounded-full ring-offset-background text-neutral-300 hover:bg-neutral-800 hover:text-neutral-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:text-neutral-400 disabled:pointer-events-none disabled:opacity-70 size-8 [&_svg]:size-5",
        button_next:
          "inline-flex pointer-events-auto items-center justify-center whitespace-nowrap rotate-180 rounded-full ring-offset-background text-neutral-300 hover:bg-neutral-800 hover:text-neutral-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:text-neutral-400 disabled:pointer-events-none disabled:opacity-70 size-8 [&_svg]:size-5",
        month_grid: "w-full border-separate border-spacing-y-1",
        weekday:
          "text-neutral-400 rounded-full w-9 sm:w-10 font-normal text-sm",
        day: "group text-center transition-all text-sm p-1 relative aria-selected:bg-neutral-800 first:aria-selected:rounded-l-full last:aria-selected:rounded-r-full focus-within:relative focus-within:z-20",
        day_button:
          "inline-flex items-center justify-center text-neutral-300 hover:text-neutral-800 whitespace-nowrap rounded-full hover:bg-neutral-200 transition size-8 sm:size-9 group-[.highlight]:!bg-earth group-[.highlight]:!text-white group-[.highlight]:hover:!bg-white group-[.highlight]:hover:!text-earth group-[.middle]:hover:bg-neutral-200 group-[.today]:bg-neutral-800 group-[.today]:hover:bg-neutral-800/90 group-[.today]:text-earth ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:text-neutral-400 disabled:pointer-events-none disabled:opacity-70",
        range_end: "highlight rounded-r-full",
        range_start: "highlight rounded-l-full",
        range_middle: "middle aria-selected:text-neutral-800",
        today: "today",
        outside:
          "day-outside opacity-70 aria-selected:opacity-80 aria-selected:bg-neutral-800/80",
        disabled: "text-neutral-500 opacity-60",
        hidden: "invisible",
        dropdowns: "flex gap-1 grow",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-5", className)} {...props} />
        ),
        Dropdown: CustomSelectDropdown,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
