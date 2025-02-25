"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Spinner from "@/components/ui/spinner";
import {
  createDefaultValues,
  GnssFilters,
  gnssFilters,
  gnssFormSchema,
} from "@/lib/filters";
import { LoadGNSS } from "@/server/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtomValue, useSetAtom } from "jotai";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { drawingAtom, gnssDataAtom } from "./atoms";
import FormGenerate from "./form-generate";

export default function GnssFormFilters({
  initialData,
}: {
  initialData: GnssFilters;
}) {
  const setGnssData = useSetAtom(gnssDataAtom);
  const drawing = useAtomValue(drawingAtom);

  const defaults = createDefaultValues(initialData, gnssFilters);
  const form = useForm<z.infer<typeof gnssFormSchema>>({
    resolver: zodResolver(gnssFormSchema),
    defaultValues: defaults,
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async (values: z.infer<typeof gnssFormSchema>) => {
    startTransition(async () => {
      toast("Loading data...", {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: "Loadgnss",
      });
      const data = await LoadGNSS(values, drawing);
      toast.dismiss("Loadgnss");
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.features.length} GNSS Stations`,
        );
        setGnssData(data.data);
      } else toast.error(data.error);
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(submitAction)}>
        <FormGenerate
          defaults={defaults}
          filters={gnssFilters}
          form={form}
          initialData={initialData}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
        </Button>
      </form>
    </Form>
  );
}
