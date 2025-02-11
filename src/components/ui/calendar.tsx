"use client";

import * as React from "react";
import { DayPicker, DropdownProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
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
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options?.map((option) => {
            if (option.disabled) return;
            return (
              <SelectItem
                key={option.value}
                value={option.value.toString()}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            );
          })}
        </SelectGroup>
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
        month_caption: "flex justify-center mt-1 items-center",
        caption_label: "text-sm font-medium text-slate-700",
        nav: "flex items-center absolute top-0 inset-x-0 justify-between",
        button_previous:
          "inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-white text-slate-700 active:ring-slate-200 hover:bg-slate-100 hover:text-slate-900 transition active:ring-2 active:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:text-slate-400 disabled:pointer-events-none disabled:opacity-70 size-8 [&_svg]:size-5",
        button_next:
          "inline-flex items-center justify-center whitespace-nowrap rotate-180 rounded-md ring-offset-white text-slate-700 active:ring-slate-200 hover:bg-slate-100 hover:text-slate-900 transition active:ring-2 active:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:text-slate-400 disabled:pointer-events-none disabled:opacity-70 size-8 [&_svg]:size-5",
        month_grid: "w-full border-separate border-spacing-y-1",
        weekday: "text-slate-500 rounded-md w-9 sm:w-10 font-normal text-sm",
        day: "group text-center transition-all text-sm p-1 relative aria-selected:bg-slate-100 first:aria-selected:rounded-l-md last:aria-selected:rounded-r-md focus-within:relative focus-within:z-20",
        day_button:
          "inline-flex items-center justify-center text-slate-700 hover:text-slate-900 whitespace-nowrap rounded-md hover:bg-slate-100 transition size-8 sm:size-9 group-[.highlight]:!bg-slate-900 group-[.highlight]:hover:!bg-slate-900/90 group-[.highlight]:!text-zinc-50 group-[.highlight]:hover:!text-zinc-50 group-[.middle]:hover:bg-slate-200 group-[.today]:bg-slate-900 group-[.today]:hover:bg-slate-900 group-[.today]:text-brand-700 group-[.today]:hover:text-slate-900 ring-offset-white active:ring-slate-200 active:ring-2 active:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:text-slate-400 disabled:pointer-events-none disabled:opacity-70",
        range_end: "highlight rounded-r-md",
        range_start: "highlight rounded-l-md",
        range_middle: "middle aria-selected:text-slate-900",
        today: "today",
        outside:
          "day-outside opacity-70 aria-selected:opacity-80 aria-selected:bg-slate-100/50",
        disabled: "text-slate-500 opacity-50",
        hidden: "invisible",
        dropdowns: "flex gap-2",
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
