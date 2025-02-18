"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SmtFilters } from "@/lib/types";
import { LoadSmt } from "@/server/actions";
import { useAtomValue, useSetAtom } from "jotai";
import { useTransition } from "react";
import { toast } from "sonner";
import { drawingAtom, smtDataAtom } from "./atoms";
import { smtFormSchema } from "./form-schema";

export default function SmtFormFilters({ filters }: { filters: SmtFilters }) {
  const setSmtData = useSetAtom(smtDataAtom);
  const drawing = useAtomValue(drawingAtom);

  const elevRange = [filters.elevRange[0] || 0, filters.elevRange[1] || 0];
  const baseRange = [filters.baseRange[0] || 0, filters.baseRange[1] || 0];
  const summitRange = [
    filters.summitRange[0] || 0,
    filters.summitRange[1] || 0,
  ];

  const form = useForm<z.infer<typeof smtFormSchema>>({
    resolver: zodResolver(smtFormSchema),
    defaultValues: {
      elevation: elevRange,
      elevAllowNull: true,
      base: baseRange,
      baseAllowNull: true,
      summit: summitRange,
      summitAllowNull: true,
      class: "All",
      catalogs: "All",
    },
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async (values: z.infer<typeof smtFormSchema>) => {
    startTransition(async () => {
      const data = await LoadSmt(values, drawing);
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.features.length} seamounts`,
        );
        setSmtData(data.data);
      } else toast.error(data.error);
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
                    min={elevRange[0]}
                    max={elevRange[1]}
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
        <div className="space-y-1">
          <FormField
            control={form.control}
            name="base"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base</FormLabel>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={field.value}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value}
                    min={baseRange[0]}
                    max={baseRange[1]}
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
            name="baseAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="baseCheck"
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
        <div className="space-y-1">
          <FormField
            control={form.control}
            name="summit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summit</FormLabel>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={field.value}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value}
                    min={summitRange[0]}
                    max={summitRange[1]}
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
            name="summitAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="summitCheck"
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
          name="class"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seamount Class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {filters.classes?.map((type) => (
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
          name="catalogs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catalogue</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seamount Catalogue" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {filters.catalogs?.map((type) => (
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
          {drawing ? "Load data within area" : "Load"}
        </Button>
      </form>
    </Form>
  );
}
