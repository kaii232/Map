"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Spinner from "@/components/ui/spinner";
import {
  createDefaultValues,
  vlcFilters,
  VlcFilters,
  vlcFormSchema,
} from "@/lib/filters";
import { LoadVlc } from "@/server/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtomValue, useSetAtom } from "jotai";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { drawingAtom, vlcDataAtom } from "./atoms";
import FormGenerate from "./form-generate";

export default function VlcFormFilters({
  initialData,
}: {
  initialData: VlcFilters;
}) {
  const setVlcData = useSetAtom(vlcDataAtom);
  const drawing = useAtomValue(drawingAtom);

  const defaults = createDefaultValues(initialData, vlcFilters);

  const form = useForm<z.infer<typeof vlcFormSchema>>({
    resolver: zodResolver(vlcFormSchema),
    defaultValues: defaults,
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async (values: z.infer<typeof vlcFormSchema>) => {
    startTransition(async () => {
      toast("Loading data...", {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: "Loadvlc",
      });
      const data = await LoadVlc(values, drawing);
      toast.dismiss("Loadvlc");
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
        <FormGenerate
          form={form}
          defaults={defaults}
          filters={vlcFilters}
          initialData={initialData}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
        </Button>
      </form>
    </Form>
  );
}
