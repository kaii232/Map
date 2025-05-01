"use client";

import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  ClientFilterDefine,
  FilterDefine,
  GenericFiltersInfo,
} from "@/lib/types";
import { useMediaQuery } from "@/lib/use-media-query";
import { CalendarDays } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

type FormGenerateProps<T extends GenericFiltersInfo> = {
  /** The React Hook Form instance */
  form: UseFormReturn<
    {
      [key: string]:
        | string
        | boolean
        | number[]
        | {
            from: Date;
            to: Date;
          };
    },
    unknown,
    undefined
  >;
  /** Default values for each input */
  defaults: {
    [key: string]:
      | string
      | boolean
      | number[]
      | {
          from: Date;
          to: Date;
        };
  };
  /** Data from database to populate controls */
  initialData: T;
  /** The filters for the data type */
  filters: ClientFilterDefine<FilterDefine<T>>;
};

/**
 * Component for automatically rendering the correct controls for each filter
 */
export default function FormGenerate<T extends GenericFiltersInfo>({
  form,
  defaults,
  initialData,
  filters,
}: FormGenerateProps<T>) {
  const isLarge = useMediaQuery("(min-width:640px)");

  return Object.entries(filters).map(([key, filter]) => {
    if (filter.type === "select")
      return (
        <FormField
          key={key}
          control={form.control}
          name={key}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-50">{filter.name}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value as string}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={filter.name} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {initialData[key as keyof typeof filters]?.map((type) => (
                    <SelectItem value={String(type)} key={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    if (filter.type === "range") {
      return (
        <div className="space-y-4" key={key}>
          <FormField
            control={form.control}
            name={key}
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <FormLabel className="text-neutral-50">
                    {filter.name}
                  </FormLabel>
                  <FormDescription className="space-x-2">
                    {Array.isArray(field.value) && (
                      <>
                        <span>
                          {Number(field.value[0].toFixed(1))}
                          {filter.units}
                        </span>
                        <span>–</span>
                        <span>
                          {Number(field.value[1].toFixed(1))}
                          {filter.units}
                        </span>
                      </>
                    )}
                  </FormDescription>
                </div>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={field.value as number[]}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value as number[]}
                    min={
                      defaults[key] && Array.isArray(defaults[key])
                        ? defaults[key][0]
                        : 0
                    }
                    max={
                      defaults[key] && Array.isArray(defaults[key])
                        ? defaults[key][1]
                        : 0
                    }
                    step={
                      defaults[key] &&
                      Array.isArray(defaults[key]) &&
                      defaults[key][1] - defaults[key][0] < 10
                        ? 0.1
                        : 1
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${key}AllowNull`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal text-neutral-300">
                  Allow null values
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    }
    if (filter.type === "greaterThan") {
      return (
        <div className="space-y-4" key={key}>
          <FormField
            control={form.control}
            name={key}
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <FormLabel className="text-neutral-50">
                    {filter.name}
                  </FormLabel>
                  <FormDescription className="space-x-2">
                    {Array.isArray(field.value) && (
                      <>
                        {">"}
                        {Number(field.value[0].toFixed(1))}
                        {filter.units}
                      </>
                    )}
                  </FormDescription>
                </div>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={field.value as number[]}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value as number[]}
                    min={
                      defaults[key] && Array.isArray(defaults[key])
                        ? defaults[key][0]
                        : 0
                    }
                    max={filter.maxVal}
                    step={
                      defaults[key] &&
                      filter.maxVal &&
                      Array.isArray(defaults[key]) &&
                      filter.maxVal - defaults[key][0] < 1
                        ? 0.1
                        : 0.5
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${key}AllowNull`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal text-neutral-300">
                  Allow null values
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    }
    if (filter.type === "date") {
      const earliest =
        defaults[key] &&
        typeof defaults[key] === "object" &&
        !Array.isArray(defaults[key])
          ? defaults[key].from
          : new Date();
      const latest =
        defaults[key] &&
        typeof defaults[key] === "object" &&
        !Array.isArray(defaults[key])
          ? defaults[key].to
          : new Date();
      return (
        <div className="space-y-3" key={key}>
          <FormField
            control={form.control}
            name={key}
            render={({ field }) =>
              typeof field.value === "object" && !Array.isArray(field.value) ? (
                <FormItem>
                  <FormLabel className="text-neutral-50">
                    {filter.name}
                  </FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={
                            "flex h-10 w-full items-center gap-2 rounded-md border border-neutral-600 bg-neutral-950 px-4 py-2 text-sm font-normal hover:bg-neutral-900 [&_svg]:size-5"
                          }
                        >
                          <CalendarDays className="shrink-0 text-neutral-400" />
                          <div className="w-full text-left text-neutral-50">
                            {field.value.from.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })}
                          </div>
                          <Separator orientation="vertical" className="mx-1" />
                          <div className="w-full text-left text-neutral-50">
                            {field.value.to.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })}
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          captionLayout="dropdown"
                          disabled={{
                            before: earliest,
                            after: latest,
                          }}
                          startMonth={earliest}
                          endMonth={latest}
                          mode="range"
                          required
                          selected={field.value}
                          onSelect={(range) => {
                            const current = field.value as {
                              from: Date;
                              to: Date;
                            };
                            if (!range) return;
                            if (
                              current.from.getTime() === current.to.getTime()
                            ) {
                              return field.onChange(range);
                            }
                            // Only to changes, set to as start date
                            if (
                              range.from?.getTime() === current.from.getTime()
                            )
                              return field.onChange({
                                from: range.to,
                                to: range.to,
                              });
                            // Otherwise
                            return field.onChange({
                              from: range.from,
                              to: range.from,
                            });
                          }}
                          autoFocus
                          defaultMonth={field.value.from}
                          numberOfMonths={isLarge ? 2 : 1}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) : (
                <></>
              )
            }
          />
          <FormField
            control={form.control}
            name={`${key}AllowNull`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal text-neutral-300">
                  Allow null values
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    }
  });
}
