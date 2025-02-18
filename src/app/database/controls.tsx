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
  BasemapNames,
  FltFilters,
  GnssFilters,
  SeisFilters,
  SmtFilters,
  VlcFilters,
} from "@/lib/types";
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

export default function Controls({
  filters,
}: {
  filters: {
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
            <div className="flex items-center justify-between">
              <label
                htmlFor="switch"
                className="text-xs font-medium text-zinc-700"
              >
                Seafloor Age
              </label>
              <Switch
                id="switch"
                checked={layers.seafloor}
                onCheckedChange={(e: boolean) =>
                  setLayers((prev) => ({ ...prev, seafloor: e }))
                }
              />
            </div>
            {layers.seafloor && (
              <div>
                <div className="mb-1 h-10 w-full bg-gradient-to-r from-black to-white"></div>
                <div className="flex w-full justify-between text-xs">
                  <p>0</p>
                  <p>194</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <label
                htmlFor="switch"
                className="text-xs font-medium text-zinc-700"
              >
                Hillshading
              </label>
              <Switch
                id="switch"
                checked={layers.hillshade}
                onCheckedChange={(e: boolean) =>
                  setLayers((prev) => ({ ...prev, hillshade: e }))
                }
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Separator />
        <div className="space-y-2 px-4">
          <Collapsible className="flex flex-col">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
              Seamounts
              <ChevronsUpDown />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 pr-1">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="switch"
                  className="text-xs font-medium text-zinc-700"
                >
                  Visibility
                </label>
                <Switch
                  id="switch"
                  checked={dataVisibility.smt}
                  onCheckedChange={(e: boolean) =>
                    setDataVisibility((prev) => ({ ...prev, smt: e }))
                  }
                />
              </div>
              <SmtFormFilters filters={filters.smt} />
            </CollapsibleContent>
          </Collapsible>
          <Collapsible className="flex flex-col">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
              Volcanoes
              <ChevronsUpDown />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 pr-1">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="switch"
                  className="text-xs font-medium text-zinc-700"
                >
                  Visibility
                </label>
                <Switch
                  id="switch"
                  checked={dataVisibility.vlc}
                  onCheckedChange={(e: boolean) =>
                    setDataVisibility((prev) => ({ ...prev, vlc: e }))
                  }
                />
              </div>
              <VlcFormFilters filters={filters.vlc} />
            </CollapsibleContent>
          </Collapsible>
          <Collapsible className="flex flex-col">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
              GNSS Stations
              <ChevronsUpDown />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 pr-1">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="switch"
                  className="text-xs font-medium text-zinc-700"
                >
                  Visibility
                </label>
                <Switch
                  id="switch"
                  checked={dataVisibility.gnss}
                  onCheckedChange={(e: boolean) =>
                    setDataVisibility((prev) => ({ ...prev, gnss: e }))
                  }
                />
              </div>
              <GnssFormFilters filters={filters.gnss} />
            </CollapsibleContent>
          </Collapsible>
          <Collapsible className="flex flex-col">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
              Faults
              <ChevronsUpDown />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 pr-1">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="switch"
                  className="text-xs font-medium text-zinc-700"
                >
                  Visibility
                </label>
                <Switch
                  id="switch"
                  checked={dataVisibility.flt}
                  onCheckedChange={(e: boolean) =>
                    setDataVisibility((prev) => ({ ...prev, flt: e }))
                  }
                />
              </div>
              <FltFormFilters filters={filters.flt} />
            </CollapsibleContent>
          </Collapsible>
          <Collapsible className="flex flex-col">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 rounded-md py-2 pl-2 pr-1 text-xs font-medium text-zinc-700 hover:bg-slate-100 data-[state=open]:mb-2">
              Seismic
              <ChevronsUpDown />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 pr-1">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="switch"
                  className="text-xs font-medium text-zinc-700"
                >
                  Visibility
                </label>
                <Switch
                  id="switch"
                  checked={dataVisibility.seis}
                  onCheckedChange={(e: boolean) =>
                    setDataVisibility((prev) => ({ ...prev, seis: e }))
                  }
                />
              </div>
              <SeisFormFilters filters={filters.seis} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
