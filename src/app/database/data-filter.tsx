"use client";

import DownloadButton from "@/components/download-button";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import Spinner from "@/components/ui/spinner";
import {
  ALL_FILTERS_CLIENT,
  createDefaultValues,
  createZodSchema,
  PopulateFilters,
} from "@/lib/filters";
import { LOADERS, TOAST_MESSAGE } from "@/lib/utils";
import { ActionReturn } from "@/server/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { MultiPolygon, Polygon } from "geojson";
import { useAtom, useAtomValue } from "jotai";
import { memo, ReactNode, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { dataAtom, drawingAtom } from "./atoms";
import FormGenerate from "./form-generate";

/** This component renders out the given filters for the data type */
const DataFormFilters = ({
  initialData,
  dataKey,
  additionalActions,
  onDataLoad,
}: {
  /** Data from database to populate filter controls */
  initialData: NonNullable<PopulateFilters[typeof dataKey]>;
  /** The key for the data type */
  dataKey: keyof typeof ALL_FILTERS_CLIENT;
  /** Components to render below the Download button of each form */
  additionalActions?: ReactNode;
  /** Callback that is invoked when data is loaded successfully */
  onDataLoad?: (
    data: Extract<ActionReturn<unknown>, { success: true }>,
  ) => void;
}) => {
  const [mapData, setMapData] = useAtom(dataAtom);
  const drawing = useAtomValue(drawingAtom);
  const filters = ALL_FILTERS_CLIENT[dataKey]!;
  const [isPending, startTransition] = useTransition();

  const defaults = useMemo(
    () => createDefaultValues(initialData, filters),
    [initialData, filters],
  );
  const formSchema = useMemo(
    () => z.object(createZodSchema(filters)),
    [filters],
  );
  const loadAction = LOADERS[dataKey] as (
    values: z.infer<typeof formSchema>,
    drawing?: Polygon | MultiPolygon,
  ) => Promise<ActionReturn<unknown>>;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  });

  const submitAction = async (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      toast(`Loading ${TOAST_MESSAGE[dataKey]}...`, {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: `Load${dataKey}`,
      });
      const data = await loadAction(values, drawing);
      toast.dismiss(`Load${dataKey}`);
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.features.length} ${TOAST_MESSAGE[dataKey]}`,
        );
        setMapData((prev) => ({
          ...prev,
          [dataKey]: data.data,
        }));
        if (onDataLoad) onDataLoad(data);
      } else toast.error(data.error);
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(submitAction)}>
        <FormGenerate
          defaults={defaults}
          filters={filters}
          form={form}
          initialData={initialData}
        />
        <div>
          <Button type="submit" disabled={isPending} className="mb-2 w-full">
            {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
          </Button>
          <DownloadButton
            className="w-full"
            data={mapData[dataKey]}
            fileName={`${dataKey}_invest.csv`}
          />
          {additionalActions && (
            <div className="mt-2 space-y-2">{additionalActions}</div>
          )}
        </div>
      </form>
    </Form>
  );
};

export default memo(DataFormFilters);
