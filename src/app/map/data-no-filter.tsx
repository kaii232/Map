"use client";

import DownloadButton from "@/components/download-button";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import type { ALL_FILTERS_CLIENT } from "@/lib/data-definitions";
import { TOAST_MESSAGE } from "@/lib/utils";
import { ActionReturn, LoadData } from "@/server/actions";
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
  dataKey: keyof typeof ALL_FILTERS_CLIENT;
  /** Components to render below the Download button of each form */
  additionalActions?: ReactNode;
  /** Callback that is invoked when data is loaded successfully */
  onDataLoad?: (data: Extract<ActionReturn, { success: true }>) => void;
}) => {
  const [mapData, setMapData] = useAtom(dataAtom);
  const drawing = useAtomValue(drawingAtom);

  const [isPending, startTransition] = useTransition();

  const submitAction = async () => {
    startTransition(async () => {
      toast(`Loading ${TOAST_MESSAGE[dataKey]}...`, {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: `Load${dataKey}`,
      });
      const data = await LoadData(dataKey, {
        data: {
          filter: false,
          drawing,
        },
      });
      toast.dismiss(`Load${dataKey}`);
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.geojson.features.length} ${TOAST_MESSAGE[dataKey]}`,
        );
        setMapData((prev) => ({
          ...prev,
          [dataKey]: {
            ...data.data,
            // Save the params that were used to load this data for downloading of data
            params: {
              filter: false,
              drawing: drawing,
            },
          },
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
          downloadType={{
            dataKey: dataKey,
            type: "full",
            params: mapData[dataKey]?.params,
          }}
          fileName={`${dataKey}_invest`}
        />
        {additionalActions && (
          <div className="mt-2 space-y-2">{additionalActions}</div>
        )}
      </div>
    </form>
  );
};

export default memo(DataNoFilter);
