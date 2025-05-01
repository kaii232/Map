"use client";

import DownloadButton from "@/components/download-button";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import type { ALL_FILTERS } from "@/lib/filters";
import { LOADERS, TOAST_MESSAGE } from "@/lib/utils";
import { ActionReturn } from "@/server/actions";
import { MultiPolygon, Polygon } from "geojson";
import { useAtom, useAtomValue } from "jotai";
import { memo, ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { dataAtom, drawingAtom } from "./atoms";

/** This component renders out a way to load data with no filters */
const DataNoFilter = ({
  dataKey,
  additionalActions,
  onDataLoad,
}: {
  /** The key for the data type */
  dataKey: keyof typeof ALL_FILTERS;
  /** Components to render below the Download button of each form */
  additionalActions?: ReactNode;
  /** Callback that is invoked when data is loaded successfully */
  onDataLoad?: (
    data: Extract<ActionReturn<unknown>, { success: true }>,
  ) => void;
}) => {
  const [mapData, setMapData] = useAtom(dataAtom);
  const drawing = useAtomValue(drawingAtom);
  const loadAction = LOADERS[dataKey] as (
    drawing?: Polygon | MultiPolygon,
  ) => Promise<ActionReturn<unknown>>;

  const [isPending, startTransition] = useTransition();

  const submitAction = async () => {
    startTransition(async () => {
      toast(`Loading ${TOAST_MESSAGE[dataKey]}...`, {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: `Load${dataKey}`,
      });
      const data = await loadAction(drawing);
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
    <form className="space-y-6" action={submitAction}>
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
  );
};

export default memo(DataNoFilter);
