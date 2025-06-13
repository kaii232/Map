"use client";

import { cn, downloadData } from "@/lib/utils";
import { Feature, FeatureCollection } from "geojson";
import { json2csv } from "json-2-csv";
import { ChevronDown } from "lucide-react";
import { ComponentProps } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const flattenGeoJsonToCSV = (input: FeatureCollection) => {
  const items = input.features;
  const res = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].properties) res.push(items[i].properties!);
  }
  const csv = json2csv(res, {
    expandNestedObjects: false,
    emptyFieldValue: "",
  });
  return csv;
};
/**
 * Creates a download link for downloading the data passed in its `data` prop as a csv file
 */
export default function DownloadButton({
  data,
  fileName,
  className,
  label = "Download Selected Data",
  ...rest
}: {
  data?: FeatureCollection;
  fileName: string;
  label?: string;
} & ComponentProps<typeof Button>) {
  const downloadAsGeojson = () => {
    if (!data) return;
    const newFeatures: Feature[] = [];
    data.features.forEach((feature) => {
      newFeatures.push({
        ...feature,
        properties: { ...feature.properties, geometry: undefined },
      });
    });
    const blob = new Blob(
      [JSON.stringify({ type: "FeatureCollection", features: newFeatures })],
      {
        type: "application/geo+json",
      },
    );
    downloadData(blob, fileName + ".geojson");
  };

  const downloadAsCsv = () => {
    if (!data) return;
    const csv = flattenGeoJsonToCSV(data);
    const blob = new Blob([csv], { type: "text/csv" });
    downloadData(blob, fileName + ".csv");
  };

  if (!data || !fileName)
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
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={0}
        className="w-[--radix-dropdown-menu-trigger-width] rounded-t-none border-0 bg-neutral-950 text-neutral-400"
      >
        <DropdownMenuItem onSelect={downloadAsGeojson}>
          Download as .geojson
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={downloadAsCsv}>
          Download as .csv
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
