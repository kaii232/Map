"use client";

import { AccountLink } from "@/components/header";
import {
  SelectTabs,
  SelectTabsContent,
  SelectTabsItem,
  SelectTabsTab,
  SelectTabsTrigger,
  SelectTabsValue,
} from "@/components/select-tabs";
import { TourStep } from "@/components/tour";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ALL_FILTERS_CLIENT, PopulateFilters } from "@/lib/filters";
import { BasemapNames, Range } from "@/lib/types";
import { cn, DATA_LABELS } from "@/lib/utils";
import { ActionReturn } from "@/server/actions";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Book,
  ChevronDown,
  ChevronLeft,
  Home,
  Map,
  RotateCcw,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { memo, ReactNode, useCallback, useMemo, useState } from "react";
import { useMap } from "react-map-gl/maplibre";
import {
  dataAtom,
  dataVisibilityAtom,
  defaultVisibility,
  layersAtom,
  mapStyleAtom,
  panelOpenAtom,
  slipRangeAtom,
} from "./atoms";
import DataFormFilters from "./data-filter";
import DataNoFilter from "./data-no-filter";

/** Used to populate the basemap select component */
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
] as const;

/** Labels for the map layer select component */
const LAYER_LABELS: Record<string, string> = {
  hillshade: "Hillshade",
  plateMovementVectors: "Plate Movement Vectors",
  plates: "Tectonic Plates (Bird, 2003)",
  platesNew: "Tectonic Plates (Hasterok, 2022)",
  seafloorAge: "Seafloor Age",
};

/** Displays the colour ramp legends for currently visible data on the map */
const ColourRamps = ({ className }: { className?: string }) => {
  const layers = useAtomValue(layersAtom);
  const dataVisibility = useAtomValue(dataVisibilityAtom);
  const mapData = useAtomValue(dataAtom);
  const slipRange = useAtomValue(slipRangeAtom);

  /** Defines how to display the legend and when it should be visible */
  const legends: {
    name: string;
    colour: string;
    min: string;
    max: string;
    visible: boolean;
  }[] = [
    {
      name: "Seafloor age",
      colour:
        "bg-[linear-gradient(90deg,rgba(255,255,164,1)0%,rgba(246,213,67,1)10%,rgba(252,163,9,1)20%,rgba(243,118,27,1)30%,rgba(219,80,59,1)40%,rgba(186,54,85,1)50%,rgba(146,37,104,1)60%,rgba(106,23,110,1)70%,rgba(64,10,103,1)80%,rgba(21,11,55,1)90%,rgba(0,0,4,1)100%)]",
      min: "0",
      max: "194Mya",
      visible: layers.seafloorAge,
    },
    {
      name: "Seismic depth",
      colour:
        "bg-[linear-gradient(90deg,rgba(255,247,236,1)0%,rgba(254,232,200,1)0.4%,rgba(253,212,158,1)0.8%,rgba(253,187,132,1)1.6%,rgba(235,124,73,1)3.2%,rgba(219,82,53,1)6.4%,rgba(181,33,18,1)12.8%,rgba(117,6,6,1)25.6%,rgba(54,10,7,1)51.2%,rgba(0,0,0,1)100%)]",
      min: "<2m",
      max: ">1024m",
      visible:
        dataVisibility.seis &&
        !!mapData.seis &&
        mapData.seis.features.length > 0,
    },
    {
      name: "Heatflow qval",
      colour:
        "bg-[linear-gradient(90deg,rgba(12,74,110,1)0%,rgba(2,132,199,1)25%,rgba(238,238,238,1)50%,rgba(225,29,72,1)75%,rgba(76,5,25,1)100%)]",
      min: "<-400W/m²",
      max: ">400W/m²",
      visible:
        dataVisibility.hf && !!mapData.hf && mapData.hf.features.length > 0,
    },
    {
      name: "Slab depth",
      colour:
        "bg-[linear-gradient(90deg,rgba(255,255,164,1)0%,rgba(246,213,67,1)10%,rgba(252,163,9,1)20%,rgba(243,118,27,1)30%,rgba(219,80,59,1)40%,rgba(186,54,85,1)50%,rgba(146,37,104,1)60%,rgba(106,23,110,1)70%,rgba(64,10,103,1)80%,rgba(21,11,55,1)90%,rgba(0,0,4,1)100%)]",
      min: "0m",
      max: "1000m",
      visible:
        dataVisibility.slab2 &&
        !!mapData.slab2 &&
        mapData.slab2.features.length > 0,
    },
    {
      name: "Slip",
      colour:
        "bg-[linear-gradient(90deg,_#FCFDBF_3.28%,_#FDDC9E_10.05%,_#FEBA80_16.71%,_#FD9869_23.11%,_#F8765C_30.04%,_#EB5760_36.81%,_#D3436E_43.23%,_#B63779_50.1%,_#982D80_56.61%,_#7B2382_63.38%,_#5F187F_70.41%,_#410F74_76.57%,_#231151_83.43%,_#0C0927_90.09%,_#000004_96.86%)]",
      min: `${slipRange[0]}m`,
      max: `${slipRange[1]}m`,
      visible:
        dataVisibility.slip &&
        !!mapData.slip &&
        mapData.slip.features.length > 0,
    },
  ];

  const showColourRange = legends.some((legend) => legend.visible);

  if (!showColourRange) return null;

  return (
    <div
      className={cn(
        "absolute bottom-2.5 mb-8 ml-2.5 flex w-32 flex-col gap-2 bg-background p-1 text-xs text-neutral-300",
        className,
      )}
    >
      {legends.map((legend) => {
        if (!legend.visible) return null;
        return (
          <div key={legend.name}>
            <span className="mb-0.5 block">{legend.name}</span>
            <div
              role="presentation"
              className={`mb-1 h-6 w-full ${legend.colour}`}
            ></div>
            <div className="flex w-full justify-between">
              <span>{legend.min}</span>
              <span>{legend.max}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Contains all the controls for the map */
const Controls = ({
  initialData,
}: {
  /** Data from database to populate filter controls */
  initialData: PopulateFilters;
}) => {
  const [layers, setLayers] = useAtom(layersAtom);
  const [open, setOpen] = useAtom(panelOpenAtom);
  const [mapStyle, setMapStyle] = useAtom(mapStyleAtom);
  const [dataVisibility, setDataVisibility] = useAtom(dataVisibilityAtom);
  const setLoadedData = useSetAtom(dataAtom);
  const [dataSelectValue, setDataSelectValue] = useState<string>();
  const setSlipRange = useSetAtom(slipRangeAtom);
  const { map } = useMap();

  const [filtersKey, setFiltersKey] = useState(Math.random().toString()); // Used to reset filters
  const resetFilters = useCallback(() => {
    setFiltersKey(Math.random().toString());
    setDataVisibility(defaultVisibility);
  }, [setDataVisibility]);
  const clearData = useCallback(() => {
    setLoadedData({});
  }, [setLoadedData]);

  /** Specific actions and callbacks for each data type */
  const MAP_DATA_SPECIFICS: Partial<
    Record<
      keyof typeof ALL_FILTERS_CLIENT,
      {
        onLoad?: (
          data: Extract<ActionReturn<unknown>, { success: true }>,
        ) => void;
        additionalActions?: ReactNode;
      }
    >
  > = useMemo(
    () => ({
      gnss: {
        additionalActions: (
          <Button variant="outline" className="w-full" asChild>
            <Link
              href={"stations.csv"}
              target="_blank"
              download
              prefetch={false}
            >
              Download Full Original Dataset
            </Link>
          </Button>
        ),
      },
      hf: {
        additionalActions: (
          <Button variant="outline" className="w-full" asChild>
            <Link
              href={"IHFC_2024_GHFDB.xlsx"}
              target="_blank"
              download
              prefetch={false}
            >
              Download Full Original Dataset
            </Link>
          </Button>
        ),
      },
      seis: {
        additionalActions: (
          <>
            <Button variant="outline" className="w-full" asChild>
              <Link
                href={"isc-ehb-new.csv"}
                target="_blank"
                download
                prefetch={false}
              >
                Download ISC-EHB Catalogue
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link
                href={"isc-gem-cat-1.csv"}
                target="_blank"
                download
                prefetch={false}
              >
                Download ISC-GEM Catalogue
              </Link>
            </Button>
          </>
        ),
      },
      vlc: {
        additionalActions: (
          <Button variant="outline" className="w-full" asChild>
            <Link
              href={"EOS_volcanoes.xlsx"}
              target="_blank"
              download
              prefetch={false}
            >
              Download Full Original Dataset
            </Link>
          </Button>
        ),
      },
      slip: {
        onLoad(data) {
          if (data.metadata) setSlipRange(data.metadata as Range);
        },
      },
    }),
    [setSlipRange],
  );

  return (
    <>
      <TourStep step={2}>
        <Button
          size="icon"
          variant="outline"
          className={cn(
            "absolute top-0 z-30 ml-4 mt-4 size-8 bg-background transition-transform duration-700 ease-map sm:ml-2.5 sm:mt-2.5",
            open && "sm:translate-x-[320px]",
          )}
          aria-label="Toggle map panel open or closed"
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
      </TourStep>
      <ColourRamps className="left-0 z-10 flex sm:hidden" />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-20 max-h-screen w-full max-w-[320px] transition-transform duration-700 ease-map",
          !open && "-translate-x-full",
        )}
      >
        <ColourRamps className="left-full hidden sm:flex" />
        <div className="flex h-full max-h-full flex-col divide-y divide-neutral-600 overflow-auto bg-background pt-12 text-neutral-300 sm:pt-0">
          <div className="flex flex-col gap-1 p-4">
            <span className="mb-3 text-xs font-medium text-neutral-300">
              Navigation
            </span>
            <Button
              variant="ghost"
              className="justify-start text-white hover:text-earth"
              asChild
            >
              <Link href="/">
                <Home strokeWidth="3px" />
                Home
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="justify-start text-earth"
            >
              <Link href="/map">
                <Map strokeWidth="3px" />
                Map
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-white hover:text-earth"
              asChild
            >
              <Link href="/publications">
                <Book strokeWidth="3px" />
                Publications
              </Link>
            </Button>
          </div>
          <div className="space-y-4 p-4">
            <span className="text-xs font-medium text-neutral-300">
              Map Options
            </span>
            <TourStep step={3}>
              <div>
                <Select
                  value={mapStyle}
                  onValueChange={(val) => setMapStyle(val as BasemapNames)}
                >
                  <SelectTrigger>Basemap</SelectTrigger>
                  <SelectContent>
                    {MAP_STYLE.map((style) => {
                      return (
                        <SelectItem value={style.label} key={style.label}>
                          <div className="flex h-8 items-center gap-2">
                            <img
                              src={style.img}
                              className="h-full w-12 rounded-md"
                              alt={style.label}
                            />
                            {style.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </TourStep>
            <TourStep step={4}>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex h-10 w-full items-center justify-between rounded-full bg-neutral-800 px-3 py-2 pl-4 text-left text-sm font-bold ring-offset-background placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 data-[state=open]:rounded-b-none data-[state=open]:rounded-t-2xl data-[state=open]:bg-neutral-950",
                        Object.values(layers).some((val) => val)
                          ? "text-earth"
                          : "text-white",
                      )}
                    >
                      Map Layers
                      <ChevronDown
                        className="h-4 w-4 shrink-0"
                        strokeWidth="3px"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    sideOffset={0}
                    className="w-[--radix-dropdown-menu-trigger-width] rounded-t-none border-0 bg-neutral-950 text-neutral-400"
                  >
                    {Object.keys(layers).map((layer) => (
                      <DropdownMenuCheckboxItem
                        key={layer}
                        className="flex items-center justify-between rounded-xl font-bold data-[state=checked]:text-earth"
                        onSelect={(e) => e.preventDefault()}
                        checked={layers[layer as keyof typeof layers]}
                        onCheckedChange={(e: boolean) =>
                          setLayers((prev) => ({ ...prev, [layer]: e }))
                        }
                      >
                        {LAYER_LABELS[layer]}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TourStep>
          </div>
          <div className="grow p-4">
            <span className="mb-4 block text-xs font-medium text-neutral-300">
              Data
            </span>
            <SelectTabs
              value={dataSelectValue}
              onValueChange={setDataSelectValue}
              key={filtersKey}
            >
              <TourStep
                step={5}
                localBeforeStep={() => setDataSelectValue("gnss")}
              >
                <div className="flex gap-2">
                  <SelectTabsTrigger>
                    <SelectTabsValue placeholder="Select data type" />
                  </SelectTabsTrigger>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="Reset all filters"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={resetFilters}
                      >
                        <RotateCcw strokeWidth="3px" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset all filters</TooltipContent>
                  </Tooltip>
                  <Dialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            aria-label="Clear all data"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                          >
                            <Trash strokeWidth="3px" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Clear all data</TooltipContent>
                    </Tooltip>
                    <DialogContent>
                      <DialogTitle>Clear all data?</DialogTitle>
                      <DialogDescription>
                        This action will clear all the currently loaded data.
                      </DialogDescription>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button onClick={clearData} className="bg-red-700">
                            Clear
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TourStep>
              <SelectTabsContent>
                {Object.keys(initialData).map((key) => (
                  <SelectTabsItem key={key} value={key}>
                    {DATA_LABELS[key as keyof typeof initialData]}
                  </SelectTabsItem>
                ))}
              </SelectTabsContent>
              <TourStep step={6}>
                <div>
                  {Object.entries(initialData).map(([keyRaw, initialInfo]) => {
                    const key = keyRaw as keyof typeof initialData;

                    return (
                      <SelectTabsTab value={key} key={key + "tab"}>
                        <div className="my-6 flex items-center justify-between">
                          <label
                            htmlFor={key}
                            className="w-full text-sm font-normal text-neutral-300"
                          >
                            Visibility
                          </label>
                          <Switch
                            id={key}
                            checked={dataVisibility[key]}
                            onCheckedChange={(e: boolean) =>
                              setDataVisibility((prev) => ({
                                ...prev,
                                [key]: e,
                              }))
                            }
                          />
                        </div>
                        {ALL_FILTERS_CLIENT[key] && initialInfo ? (
                          <DataFormFilters
                            initialData={initialInfo}
                            dataKey={key}
                            onDataLoad={MAP_DATA_SPECIFICS[key]?.onLoad}
                            additionalActions={
                              MAP_DATA_SPECIFICS[key]?.additionalActions
                            }
                          />
                        ) : (
                          <DataNoFilter
                            dataKey={key}
                            onDataLoad={MAP_DATA_SPECIFICS[key]?.onLoad}
                            additionalActions={
                              MAP_DATA_SPECIFICS[key]?.additionalActions
                            }
                          />
                        )}
                      </SelectTabsTab>
                    );
                  })}
                </div>
              </TourStep>
            </SelectTabs>
          </div>
          <div className="px-1 py-2">
            <AccountLink className="w-full text-neutral-50" />
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Controls);
