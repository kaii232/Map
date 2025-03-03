"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  FltFilters,
  GnssFilters,
  SeisFilters,
  SmtFilters,
  VlcFilters,
} from "@/lib/filters";
import { BasemapNames } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAtom, useSetAtom } from "jotai";
import { ChevronLeft, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import { dataVisibilityAtom, layersAtom, mapStyleAtom } from "./atoms";
import FltFormFilters from "./flt-form-filters";
import GnssFormFilters from "./gnss-form-filters";
import SeisFormFilters from "./seis-form-filters";
import SmtFormFilters from "./smt-form-filters";
import VlcFormFilters from "./vlc-form-filters";

const MAP_STYLE: {
  label: BasemapNames;
  img: string;
}[] = [
  {
    label: "Openfreemap",
    img: "https://d4.alternativeto.net/JtcJ1s6H8N100N4sgtNEm2YThMGoMBeD53KKBPzGn3w/rs:fill:309:197:1/g:no:0:0/YWJzOi8vZGlzdC9zL29wZW5mcmVlbWFwXzk3MDE0OV9mdWxsLnBuZw.jpg",
  },
  {
    label: "Openstreetmap",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Soho_-_map_1.png/220px-Soho_-_map_1.png",
  },
  {
    label: "Opentopomap",
    img: "https://latlong.blog/img/blog/2023-10-02-tracestack-topo.webp",
  },
  {
    label: "Satellite",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXhvrlM50ZXAuvt7S8uXh9My90_uTQf9cyYg&s",
  },
  {
    label: "Ocean",
    img: "https://learn.arcgis.com/en/projects/find-ocean-bathymetry-data/GUID-FE9C4F4D-E9AA-46CD-9C3F-D7DB28FBCBCC-web.png",
  },
];

function camelCaseToWords(s: string) {
  const result = s.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

const DATA_LABELS = {
  smt: "Seamounts",
  vlc: "Volcanoes",
  gnss: "GNSS Stations",
  flt: "Faults",
  seis: "Seismic",
};

export default function Controls({
  initialData,
}: {
  initialData: {
    smt: SmtFilters;
    vlc: VlcFilters;
    gnss: GnssFilters;
    flt: FltFilters;
    seis: SeisFilters;
  };
}) {
  const [layers, setLayers] = useAtom(layersAtom);
  const [open, setOpen] = useState(true);
  const setMapStyle = useSetAtom(mapStyleAtom);
  const [dataVisibility, setDataVisibility] = useAtom(dataVisibilityAtom);

  const { map } = useMap();

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-10 max-h-screen w-full max-w-[320px] transition-transform duration-700 ease-map",
        !open && "-translate-x-full",
      )}
    >
      <Button
        size="icon"
        variant="outline"
        className="absolute left-[min(calc(100vw-20px-32px),320px)] top-0 ml-2.5 mt-2.5 size-8"
        onClick={() => {
          setOpen((prev) => !prev);
          if (map) {
            map.easeTo({
              padding: { left: open ? 0 : 320 },
              duration: 700, // In ms, CSS transition duration property for the sidebar matches this value
            });
          }
        }}
      >
        <ChevronLeft
          className={cn(
            "transition-transform duration-300 ease-map",
            !open && "rotate-180",
          )}
        />
      </Button>
      <div className="flex h-full max-h-full flex-col gap-2 overflow-auto bg-white py-4">
        <Collapsible defaultOpen={false} className="flex flex-col">
          <CollapsibleTrigger className="mx-4 flex items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
            Basemap
            <ChevronsUpDown />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex gap-2 overflow-auto px-4 data-[state=open]:py-1">
            {MAP_STYLE.map((style, index) => {
              return (
                <label className="min-w-fit" key={style.label}>
                  <input
                    type="radio"
                    name="map"
                    value={style.label}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                    onClick={() => setMapStyle(MAP_STYLE[index].label)}
                  />
                  <div className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 p-2 text-xs font-medium text-zinc-900 outline outline-0 outline-offset-4 outline-blue-700 ring-0 ring-zinc-900 transition-shadow peer-checked:ring-2 peer-focus-visible:outline-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={style.img}
                      className="h-12 w-full rounded-md"
                      alt={style.label}
                    />
                    {style.label}
                  </div>
                </label>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
        <Separator />
        <Collapsible className="flex flex-col px-4">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
            Map Layers
            <ChevronsUpDown />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 overflow-auto pl-2 pr-1">
            {Object.keys(layers).map((layer) => (
              <div key={layer} className="flex items-center justify-between">
                <label
                  htmlFor="switch"
                  className="text-xs font-medium text-zinc-700"
                >
                  {camelCaseToWords(layer)}
                </label>
                <Switch
                  id="switch"
                  checked={layers[layer as keyof typeof layers]}
                  onCheckedChange={(e: boolean) =>
                    setLayers((prev) => ({ ...prev, [layer]: e }))
                  }
                />
              </div>
            ))}
            {layers.seafloorAge && (
              <div>
                <div className="mb-1 h-6 w-full bg-[linear-gradient(90deg,rgba(255,255,164,1)0%,rgba(246,213,67,1)10%,rgba(252,163,9,1)20%,rgba(243,118,27,1)30%,rgba(219,80,59,1)40%,rgba(186,54,85,1)50%,rgba(146,37,104,1)60%,rgba(106,23,110,1)70%,rgba(64,10,103,1)80%,rgba(21,11,55,1)90%,rgba(0,0,4,1)100%)]"></div>
                <div className="flex w-full justify-between text-xs">
                  <p>0</p>
                  <p>279Mya</p>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
        <Separator />
        <div className="space-y-2 px-4">
          {Object.entries(initialData).map(([keyRaw, initialInfo], index) => {
            const key = keyRaw as keyof typeof initialData;
            return (
              <div className="space-y-2" key={key}>
                <Collapsible className="flex flex-col">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
                    {DATA_LABELS[key]}
                    <ChevronsUpDown />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-2 pr-1">
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor={key}
                        className="text-xs font-medium text-zinc-700"
                      >
                        Visibility
                      </label>
                      <Switch
                        id={key}
                        checked={
                          dataVisibility[key as keyof typeof initialData]
                        }
                        onCheckedChange={(e: boolean) =>
                          setDataVisibility((prev) => ({ ...prev, [key]: e }))
                        }
                      />
                    </div>
                    {key === "flt" && (
                      <FltFormFilters initialData={initialInfo as FltFilters} />
                    )}
                    {key === "gnss" && (
                      <GnssFormFilters
                        initialData={initialInfo as GnssFilters}
                      />
                    )}
                    {key === "seis" && (
                      <SeisFormFilters
                        initialData={initialInfo as SeisFilters}
                      />
                    )}
                    {key === "smt" && (
                      <SmtFormFilters initialData={initialInfo as SmtFilters} />
                    )}
                    {key === "vlc" && (
                      <VlcFormFilters initialData={initialInfo as VlcFilters} />
                    )}
                  </CollapsibleContent>
                </Collapsible>
                {index !== Object.values(initialData).length - 1 && (
                  <Separator />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
