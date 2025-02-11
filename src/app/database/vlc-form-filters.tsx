"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { VlcFilters } from "@/lib/types";
import { LoadVlc } from "@/server/actions";
import { useSetAtom } from "jotai";
import { useTransition } from "react";
import { toast } from "sonner";
import { vlcDataAtom } from "./atoms";
import { vlcFormSchema } from "./form-schema";

export default function VlcFormFilters({ filters }: { filters: VlcFilters }) {
  const setVlcData = useSetAtom(vlcDataAtom);

  const form = useForm<z.infer<typeof vlcFormSchema>>({
    resolver: zodResolver(vlcFormSchema),
    defaultValues: {
      class: "All",
      sources: "All",
      categorySources: "All",
      countries: "All",
    },
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async (values: z.infer<typeof vlcFormSchema>) => {
    startTransition(async () => {
      const data = await LoadVlc(values);
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.features.length} volcanoes`,
        );
        setVlcData(data.data);
      } else toast.error(data.error);
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(submitAction)}>
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
          name="categorySources"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Volcano Source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {filters.categorySources?.map((type) => (
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
          name="sources"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catalogue</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Volcano Catalogue" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {filters.sources?.map((type) => (
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
                  {filters.countries?.map((type) => (
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
