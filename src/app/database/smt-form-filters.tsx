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
import { useSetAtom } from "jotai";
import { useTransition } from "react";
import { toast } from "sonner";
import { smtDataAtom } from "./atoms";
import { smtFormSchema } from "./form-schema";

export default function SmtFormFilters({ filters }: { filters: SmtFilters }) {
  const setSmtData = useSetAtom(smtDataAtom);

  const form = useForm<z.infer<typeof smtFormSchema>>({
    resolver: zodResolver(smtFormSchema),
    defaultValues: {
      elevation: [filters.elevRange[0], filters.elevRange[1]],
      elevAllowNull: true,
      base: [filters.baseRange[0], filters.baseRange[1]],
      baseAllowNull: true,
      summit: [filters.summitRange[0], filters.summitRange[1]],
      summitAllowNull: true,
      bl: [filters.blRange[0], filters.blRange[1]],
      blAllowNull: true,
      bw: [filters.bwRange[0], filters.bwRange[1]],
      bwAllowNull: true,
      ba: [filters.baRange[0], filters.baRange[1]],
      baAllowNull: true,
      class: "All",
      catalogs: "All",
      countries: "All",
    },
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async () => {
    startTransition(async () => {
      const data = await LoadSmt(form.getValues());
      if (data.success) setSmtData(data.data);
      else toast.error(data.error);
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" action={submitAction}>
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
                    min={filters.baseRange[0]}
                    max={filters.baseRange[1]}
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
                    min={filters.summitRange[0]}
                    max={filters.summitRange[1]}
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
        <div className="space-y-1">
          <FormField
            control={form.control}
            name="bl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BL</FormLabel>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value}
                    step={0.1}
                    min={filters.blRange[0]}
                    max={filters.blRange[1]}
                  />
                </FormControl>
                <FormDescription className="flex w-full justify-between">
                  <span>{field.value[0]}</span> <span>{field.value[1]}</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="blAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="blCheck"
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
            name="bw"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BW</FormLabel>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value}
                    step={0.1}
                    min={filters.bwRange[0]}
                    max={filters.bwRange[1]}
                  />
                </FormControl>
                <FormDescription className="flex w-full justify-between">
                  <span>{field.value[0]}</span> <span>{field.value[1]}</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bwAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="bwCheck"
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
            name="ba"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BA</FormLabel>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value}
                    step={0.1}
                    min={filters.baRange[0]}
                    max={filters.baRange[1]}
                  />
                </FormControl>
                <FormDescription className="flex w-full justify-between">
                  <span>{field.value[0]}</span> <span>{field.value[1]}</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="baAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="baCheck"
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
                  {filters.classes.map((type) => (
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
                  {filters.catalogs.map((type) => (
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
                    <SelectValue placeholder="Seamount Country" />
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
