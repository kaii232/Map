"use client";

import DownloadButton from "@/components/download-button";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Spinner from "@/components/ui/spinner";
import {
  createDefaultValues,
  seisFilters,
  SeisFilters,
  seisFormSchema,
} from "@/lib/filters";
import { LoadSeis } from "@/server/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useAtomValue } from "jotai";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { drawingAtom, seisDataAtom } from "./atoms";
import FormGenerate from "./form-generate";

export default function SeisFormFilters({
  initialData,
}: {
  initialData: SeisFilters;
}) {
  const [seisData, setSeisData] = useAtom(seisDataAtom);
  const drawing = useAtomValue(drawingAtom);

  const defaults = createDefaultValues(initialData, seisFilters);

  const form = useForm<z.infer<typeof seisFormSchema>>({
    resolver: zodResolver(seisFormSchema),
    defaultValues: defaults,
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async (values: z.infer<typeof seisFormSchema>) => {
    startTransition(async () => {
      toast("Loading data...", {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: "Loadseis",
      });
      const data = await LoadSeis(values, drawing);
      toast.dismiss("Loadseis");
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.features.length} seismic data`,
        );
        setSeisData(data.data);
      } else toast.error(data.error);
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(submitAction)}>
        <FormGenerate
          defaults={defaults}
          filters={seisFilters}
          form={form}
          initialData={initialData}
        />
        <div>
          <Button type="submit" disabled={isPending} className="mb-2 w-full">
            {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
          </Button>
          <DownloadButton
            className="w-full"
            data={seisData}
            fileName="seis_invest.csv"
          />
        </div>
      </form>
    </Form>
  );
}
