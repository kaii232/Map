"use client";

import DownloadButton from "@/components/download-button";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Spinner from "@/components/ui/spinner";
import {
  createDefaultValues,
  slab2Filters,
  Slab2Filters,
  slab2FormSchema,
} from "@/lib/filters";
import { LoadSlab2 } from "@/server/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useAtomValue } from "jotai";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { dataAtom, drawingAtom } from "./atoms";
import FormGenerate from "./form-generate";

export default function Slab2FormFilters({
  initialData,
}: {
  initialData: Slab2Filters;
}) {
  const [mapData, setMapData] = useAtom(dataAtom);
  const drawing = useAtomValue(drawingAtom);

  const defaults = createDefaultValues(initialData, slab2Filters);

  const form = useForm<z.infer<typeof slab2FormSchema>>({
    resolver: zodResolver(slab2FormSchema),
    defaultValues: defaults,
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async (values: z.infer<typeof slab2FormSchema>) => {
    startTransition(async () => {
      toast("Loading data...", {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: "Loadslab",
      });
      const data = await LoadSlab2(values, drawing);
      toast.dismiss("Loadslab");
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.features.length} slab data`,
        );
        setMapData((prev) => ({
          ...prev,
          slab2: data.data,
        }));
      } else toast.error(data.error);
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(submitAction)}>
        <FormGenerate
          defaults={defaults}
          filters={slab2Filters}
          form={form}
          initialData={initialData}
        />
        <div>
          <Button type="submit" disabled={isPending} className="mb-2 w-full">
            {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
          </Button>
          <DownloadButton
            className="mb-2 w-full"
            data={mapData.slab2}
            fileName="slab2_invest.csv"
          />
        </div>
      </form>
    </Form>
  );
}
