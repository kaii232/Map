"use client";

import DownloadButton from "@/components/download-button";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Spinner from "@/components/ui/spinner";
import {
  createDefaultValues,
  smtFilters,
  SmtFilters,
  smtFormSchema,
} from "@/lib/filters";
import { LoadSmt } from "@/server/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom, useAtomValue } from "jotai";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { dataAtom, drawingAtom } from "./atoms";
import FormGenerate from "./form-generate";

export default function SmtFormFilters({
  initialData,
}: {
  initialData: SmtFilters;
}) {
  const [mapData, setMapData] = useAtom(dataAtom);
  const drawing = useAtomValue(drawingAtom);

  const defaults = createDefaultValues(initialData, smtFilters);

  const form = useForm<z.infer<typeof smtFormSchema>>({
    resolver: zodResolver(smtFormSchema),
    defaultValues: defaults,
  });

  const [isPending, startTransition] = useTransition();

  const submitAction = async (values: z.infer<typeof smtFormSchema>) => {
    startTransition(async () => {
      toast("Loading data...", {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: "Loadsmt",
      });
      const data = await LoadSmt(values, drawing);
      toast.dismiss("Loadsmt");
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.features.length} seamounts`,
        );
        setMapData((prev) => ({ ...prev, smt: data.data }));
      } else toast.error(data.error);
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(submitAction)}>
        <FormGenerate
          defaults={defaults}
          filters={smtFilters}
          form={form}
          initialData={initialData}
        />
        <div>
          <Button type="submit" disabled={isPending} className="mb-2 w-full">
            {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
          </Button>
          <DownloadButton
            className="w-full"
            data={mapData.smt}
            fileName="smt_invest.csv"
          />
        </div>
      </form>
    </Form>
  );
}
