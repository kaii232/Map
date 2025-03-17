"use client";

import DownloadButton from "@/components/download-button";
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
import { useAtom, useAtomValue } from "jotai";
import Link from "next/link";
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
  const [vlcData, setVlcData] = useAtom(vlcDataAtom);
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
      <form className="space-y-6" onSubmit={form.handleSubmit(submitAction)}>
        <FormGenerate
          form={form}
          defaults={defaults}
          filters={vlcFilters}
          initialData={initialData}
        />
        <div>
          <Button type="submit" disabled={isPending} className="mb-2 w-full">
            {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
          </Button>
          <DownloadButton
            className="mb-2 w-full"
            data={vlcData}
            fileName="vlc_invest.csv"
          />
          <Button variant="outline" className="w-full" asChild>
            <Link href={"EOS_volcanoes.xlsx"} target="_blank" download>
              Download Full Original Dataset
            </Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
