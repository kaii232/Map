"use client";

import { cn } from "@/lib/utils";
import { FeatureCollection } from "geojson";
import { json2csv } from "json-2-csv";
import Link from "next/link";
import { ComponentProps, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const flattenGeoJsonToCSV = (input: FeatureCollection) => {
  const items = input.features;
  const res = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].properties) res.push(items[i].properties!);
  }
  const csv = json2csv(res);
  return csv;
};

export default function DownloadButton({
  data,
  fileName,
  className,
  ...rest
}: { data?: FeatureCollection; fileName: string } & ComponentProps<
  typeof Button
>) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!data || !fileName) return;
    const csv = flattenGeoJsonToCSV(data);
    const downloadData = new Blob([csv], { type: "text/csv" });
    const downloadUrl = window.URL.createObjectURL(downloadData);
    setUrl(downloadUrl);
  }, [data, fileName]);

  if (url)
    return (
      <Button variant="outline" className={className} asChild {...rest}>
        <Link href={url} target="_blank" download={fileName}>
          Download Selected Data
        </Link>
      </Button>
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          {...rest}
          disabled
          className={cn("disabled:pointer-events-auto", className)}
        >
          Download Selected Data
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Please load some data first</TooltipContent>
    </Tooltip>
  );
}
