import { cn, getInterpolateRange } from "@/lib/utils";
import { useAtomValue } from "jotai";
import { CSSProperties, memo } from "react";
import {
  colorsAtom,
  dataAtom,
  dataVisibilityAtom,
  layersAtom,
  rangeAtom,
} from "./atoms";

const createLinearGradient = (colors: string[], base: number = 1) => {
  return `linear-gradient(90deg${getInterpolateRange(
    [0, 100],
    colors,
    base,
  ).reduce((prev, current, index, arr) => {
    if (index % 2 === 0) return prev;
    return `${prev}, ${current} ${arr[index - 1]}%`;
  }, "")})`;
};

/** Displays the colour ramp legends for currently visible data on the map */
const ColorRamps = ({ className }: { className?: string }) => {
  const layers = useAtomValue(layersAtom);
  const dataVisibility = useAtomValue(dataVisibilityAtom);
  const mapData = useAtomValue(dataAtom);
  const ranges = useAtomValue(rangeAtom);
  const dataColor = useAtomValue(colorsAtom);

  /** Defines how to display the legend and when it should be visible */
  const legends: {
    name: string;
    color: string;
    min: string;
    max: string;
    visible: boolean;
  }[] = [
    {
      name: "Seafloor age",
      color: createLinearGradient([
        "#ffffa4",
        "#f6d543",
        "#fca309",
        "#f3761b",
        "#db503b",
        "#ba3655",
        "#922568",
        "#6a176e",
        "#400a67",
        "#150b37",
        "#000004",
      ]),
      min: "0 Mya",
      max: "194 Mya",
      visible: layers.seafloorAge,
    },
    {
      name: "Seismic depth",
      color: createLinearGradient(dataColor.seis, 0.5),
      min: `${ranges.seis && ranges.seis[0]} ${mapData.seis?.units?.depth}`,
      max: `${ranges.seis && ranges.seis[1]} ${mapData.seis?.units?.depth}`,
      visible:
        dataVisibility.seis &&
        !!mapData.seis &&
        mapData.seis.geojson.features.length > 0,
    },
    {
      name: "Heatflow qval",
      color: createLinearGradient(dataColor.hf),
      min: `<-400 ${mapData.hf?.units?.qval}`,
      max: `>400 ${mapData.hf?.units?.qval}`,
      visible:
        dataVisibility.hf &&
        !!mapData.hf &&
        mapData.hf.geojson.features.length > 0,
    },
    {
      name: "Slab depth",
      color: createLinearGradient(dataColor.slab2),
      min: `${ranges.slab2 && ranges.slab2[0]} ${mapData.slab2?.units?.depth}`,
      max: `${ranges.slab2 && ranges.slab2[1]} ${mapData.slab2?.units?.depth}`,
      visible:
        dataVisibility.slab2 &&
        !!mapData.slab2 &&
        mapData.slab2.geojson.features.length > 0,
    },
    {
      name: "Slip",
      color: createLinearGradient(dataColor.slip),
      min: `${ranges.slip && ranges.slip[0]} ${mapData.slip?.units?.slip}`,
      max: `${ranges.slip && ranges.slip[1]} ${mapData.slip?.units?.slip}`,
      visible:
        dataVisibility.slip &&
        !!mapData.slip &&
        mapData.slip.geojson.features.length > 0,
    },
    {
      name: "Crust Thickness",
      color: createLinearGradient([
        "#ffffff",
        "#e0dfde",
        "#c8c5b8",
        "#bdb596",
        "#b29f76",
        "#aa8665",
        "#a4705c",
        "#9b5850",
        "#883c3b",
        "#6b1f1e",
        "#4c0001",
      ]),
      min: "0 km",
      max: "80 km",
      visible: layers.crustThickness,
    },
  ];

  const showcolorRange = legends.some((legend) => legend.visible);

  if (!showcolorRange) return null;

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
              className={`mb-1 h-6 w-full bg-[image:var(--gradient)]`}
              style={{ "--gradient": legend.color } as CSSProperties}
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

export default memo(ColorRamps);
