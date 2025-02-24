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
import Spinner from "@/components/ui/spinner";
import { FltFilters } from "@/lib/types";
import { LoadFlt } from "@/server/actions";
import { useAtomValue, useSetAtom } from "jotai";
import { useTransition } from "react";
import { toast } from "sonner";
import { drawingAtom, fltDataAtom } from "./atoms";
import { fltFormSchema } from "./form-schema";

export default function FltFormFilters({ filters }: { filters: FltFilters }) {
  const setFltData = useSetAtom(fltDataAtom);
  const drawing = useAtomValue(drawingAtom);

  const lengthRange = [
    filters.lengthRange[0] || 0,
    filters.lengthRange[1] || 0,
  ];
  const sliprateRange = [
    filters.sliprateRange[0] || 0,
    filters.sliprateRange[1] || 0,
  ];
  const depthRange = [filters.depthRange[0] || 0, filters.depthRange[1] || 0];

  const form = useForm<z.infer<typeof fltFormSchema>>({
    resolver: zodResolver(fltFormSchema),
    defaultValues: {
      length: lengthRange,
      lengthAllowNull: true,
      sliprate: sliprateRange,
      sliprateAllowNull: true,
      depth: depthRange,
      depthAllowNull: true,
      types: "All",
      catalogs: "All",
    },
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async (values: z.infer<typeof fltFormSchema>) => {
    startTransition(async () => {
      toast("Loading data...", {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: "Loadflt",
      });
      const data = await LoadFlt(values, drawing);
      toast.dismiss("Loadflt");
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.features.length} faults`,
        );
        setFltData(data.data);
      } else toast.error(data.error);
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(submitAction)}>
        <div className="space-y-1">
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length</FormLabel>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={field.value}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value}
                    min={lengthRange[0]}
                    max={lengthRange[1]}
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
            name="lengthAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="lengthCheck"
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
            name="sliprate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slip Rate</FormLabel>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={field.value}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value}
                    min={sliprateRange[0]}
                    max={sliprateRange[1]}
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
            name="sliprateAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="slipCheck"
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
            name="depth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lock Depth</FormLabel>
                <FormControl>
                  <Slider
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultValue={field.value}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    value={field.value}
                    min={depthRange[0]}
                    max={depthRange[1]}
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
            name="depthAllowNull"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormControl>
                  <Checkbox
                    key="depthCheck"
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
          name="types"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fault Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Fault type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {filters.types?.map((type) => (
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
                    <SelectValue placeholder="Fault catalogue" />
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
          {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
        </Button>
      </form>
    </Form>
  );
}
