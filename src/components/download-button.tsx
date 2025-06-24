"use client";

import type { ALL_FILTERS_CLIENT } from "@/lib/data-definitions";
import { cn, downloadData, TOAST_MESSAGE } from "@/lib/utils";
import { LoadData, LoaderFilter } from "@/server/actions";
import { ChevronDown } from "lucide-react";
import { MapGeoJSONFeature } from "maplibre-gl";
import { ComponentProps, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Spinner from "./ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type DownloadType =
  | {
      type: "full";
      params?: LoaderFilter;
      dataKey: keyof typeof ALL_FILTERS_CLIENT;
    }
  | {
      type: "cluster";
      features: MapGeoJSONFeature[];
    };

/** Returns an array containing arrays with data keys in index 0 and unique IDs in index 1 */
const getUniqueIds = (
  features: MapGeoJSONFeature[],
): [keyof typeof ALL_FILTERS_CLIENT, number[]][] => {
  const clusterIds: Record<string, Set<number>> = {};
  for (let i = 0, length = features.length; i < length; i++) {
    if (!(features[i].source in TOAST_MESSAGE)) continue; // Hacky way of checking if the source is a data layer
    if (!clusterIds[features[i].source]) {
      clusterIds[features[i].source] = new Set();
    }
    if (features[i].id) {
      clusterIds[features[i].source].add(features[i].id as number);
    }
  }
  return Object.keys(clusterIds).map((key) => [
    key as keyof typeof ALL_FILTERS_CLIENT,
    Array.from(clusterIds[key].keys()),
  ]);
};

/**
 * Creates a download link for downloading the data passed in its `data` prop as a csv file
 */
export default function DownloadButton({
  downloadType,
  fileName,
  className,
  label = "Download Selected Data",
  ...rest
}: {
  downloadType: DownloadType;
  fileName: string;
  label?: string;
} & ComponentProps<typeof Button>) {
  const [isLoading, startTransition] = useTransition();

  const downloadAsGeojson = () => {
    if (downloadType.type === "full") {
      startTransition(async () => {
        const data = await LoadData(downloadType.dataKey, {
          data: downloadType.params!,
          downloadOpts: {
            type: "full",
            format: "geojson",
          },
        });
        if (!data.success) {
          toast.error(
            `Error occurred while downloading ${TOAST_MESSAGE[downloadType.dataKey]}: ${data.error}`,
          );
          return;
        }
        const blob = new Blob([JSON.stringify(data.data.geojson)], {
          type: "application/geo+json",
        });
        downloadData(blob, fileName + ".geojson");
      });
      return;
    }
    const entries = getUniqueIds(downloadType.features);
    startTransition(async () => {
      const data = await Promise.all(
        entries.map(([source, ids]) => {
          return LoadData(source, {
            downloadOpts: {
              type: "cluster",
              format: "geojson",
              downloadIds: ids,
            },
          });
        }),
      );
      const filtered = data.filter((val, index) => {
        if (!val.success) {
          toast.error(
            `Error downloading ${TOAST_MESSAGE[entries[index][0]]} in cluster`,
          );
        }
        return val.success;
      });
      const allFeatures = filtered.flatMap((val) => val.data.geojson.features);
      const blob = new Blob(
        [JSON.stringify({ type: "FeatureCollection", features: allFeatures })],
        {
          type: "application/geo+json",
        },
      );
      downloadData(blob, fileName + ".geojson");
    });
  };

  const downloadAsCsv = () => {
    if (downloadType.type === "full") {
      startTransition(async () => {
        const data = await LoadData(downloadType.dataKey, {
          data: downloadType.params!,
          downloadOpts: {
            type: "full",
            format: "csv",
          },
        });
        if (!data.success) {
          toast.error(
            `Error occurred while downloading ${TOAST_MESSAGE[downloadType.dataKey]}: ${data.error}`,
          );
          return;
        }
        const blob = new Blob([data.data], { type: "text/csv" });
        downloadData(blob, fileName + ".csv");
      });
      return;
    }
    const entries = getUniqueIds(downloadType.features);
    startTransition(async () => {
      const data = await Promise.all(
        entries.map(([source, ids]) => {
          return LoadData(source, {
            downloadOpts: {
              type: "cluster",
              format: "csv",
              downloadIds: ids,
            },
          });
        }),
      );
      data.map((val, index) => {
        if (!val.success) {
          toast.error(
            `Error downloading ${TOAST_MESSAGE[entries[index][0]]} in cluster`,
          );
          return;
        }
        const blob = new Blob([val.data], { type: "text/csv" });
        downloadData(blob, `${fileName}_${entries[index][0]}.csv`);
      });
    });
  };

  if ((downloadType.type === "full" && !downloadType.params) || !fileName)
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            disabled
            className={cn(
              "group flex h-10 w-full items-center justify-between rounded-full bg-neutral-800 px-3 py-2 pl-4 text-left text-sm font-bold text-white ring-offset-background placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 data-[state=open]:rounded-b-none data-[state=open]:rounded-t-2xl data-[state=open]:bg-neutral-950",
              className,
            )}
            {...rest}
          >
            {label}
            <ChevronDown
              className="size-4 shrink-0 text-earth transition-transform group-data-[state=open]:rotate-180"
              strokeWidth="3px"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Please load some data first</TooltipContent>
      </Tooltip>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group flex h-10 w-full items-center justify-between rounded-full bg-neutral-800 px-3 py-2 pl-4 text-left text-sm font-bold text-white ring-offset-background placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 data-[state=open]:rounded-b-none data-[state=open]:rounded-t-2xl data-[state=open]:bg-neutral-950",
            className,
          )}
          {...rest}
          disabled={isLoading}
        >
          {isLoading ? <Spinner className="size-4" /> : label}
          <ChevronDown
            className="size-4 shrink-0 text-earth transition-transform group-data-[state=open]:rotate-180"
            strokeWidth="3px"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={0}
        className="w-[--radix-dropdown-menu-trigger-width] rounded-t-none border-0 bg-neutral-950 text-neutral-400"
      >
        <DropdownMenuItem onSelect={downloadAsGeojson} disabled={isLoading}>
          Download as .geojson
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={downloadAsCsv} disabled={isLoading}>
          Download as .csv
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
