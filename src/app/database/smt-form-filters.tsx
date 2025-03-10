"use client";

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
import { useAtomValue, useSetAtom } from "jotai";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { drawingAtom, smtDataAtom } from "./atoms";
import FormGenerate from "./form-generate";

export default function SmtFormFilters({
  initialData,
}: {
  initialData: SmtFilters;
}) {
  const setSmtData = useSetAtom(smtDataAtom);
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
        setSmtData(data.data);
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
        </Button>
      </form>
    </Form>
  );
}
