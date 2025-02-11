"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
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
import { GnssFilters } from "@/lib/types";
import { LoadGNSS } from "@/server/actions";
import { useSetAtom } from "jotai";
import { CalendarDays } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { gnssDataAtom } from "./atoms";
import { gnssFormSchema } from "./form-schema";

export default function GnssFormFilters({ filters }: { filters: GnssFilters }) {
  const setGnssData = useSetAtom(gnssDataAtom);

  const form = useForm<z.infer<typeof gnssFormSchema>>({
    resolver: zodResolver(gnssFormSchema),
    defaultValues: {
      elevation: [filters.elevRange[0], filters.elevRange[1]],
      elevAllowNull: true,
      date: {
        from: new Date(filters.dateRange[0]),
        to: new Date(filters.dateRange[1]),
      },
      dateAllowNull: true,
      projects: "All",
      stations: "All",
      countries: "All",
    },
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async (values: z.infer<typeof gnssFormSchema>) => {
    startTransition(async () => {
      const data = await LoadGNSS(values);
      if (data.success) setGnssData(data.data);
      else toast.error(data.error);
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(submitAction)}>
        <div className="space-y-1">
          <FormField
            control={form.control}
            name="elevation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Elevation</FormLabel>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={field.value}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value}
                    min={filters.elevRange[0]}
                    max={filters.elevRange[1]}
                  />
                </FormControl>
                <FormDescription className="flex w-full justify-between">
                  <span>{field.value[0]}m</span> <span>{field.value[1]}m</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="elevAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="elevCheck"
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal text-slate-700">
                  Allow null values
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Install Date</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className={
                          "flex h-10 w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-normal hover:bg-slate-50 [&_svg]:size-5"
                        }
                      >
                        <CalendarDays className="shrink-0 text-slate-600" />
                        <div className="w-full text-left text-slate-900">
                          {field.value.from.toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })}
                        </div>
                        <Separator orientation="vertical" className="mx-1" />
                        <div className="w-full text-left text-slate-900">
                          {field.value.to.toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "2-digit",
                          })}
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        captionLayout="dropdown"
                        disabled={{
                          before: new Date(filters.dateRange[0]),
                          after: new Date(filters.dateRange[1]),
                        }}
                        startMonth={new Date(filters.dateRange[0])}
                        endMonth={new Date(filters.dateRange[1])}
                        mode="range"
                        required
                        selected={field.value}
                        onSelect={(range) => {
                          if (!range) return;
                          if (
                            field.value.from.getTime() ===
                            field.value.to.getTime()
                          ) {
                            return field.onChange(range);
                          }
                          // Only to changes, set to as start date
                          if (
                            range.from?.getTime() === field.value.from.getTime()
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
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="dateCheck"
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal text-slate-700">
                  Allow null values
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="projects"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="GNSS Project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {filters.projects.map((type) => (
                    <SelectItem value={type} key={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Station Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="GNSS Stations Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {filters.stations.map((type) => (
                    <SelectItem value={type} key={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="countries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="GNSS Country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {filters.countries.map((type) => (
                    <SelectItem value={type} key={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          Load
        </Button>
      </form>
    </Form>
  );
}
