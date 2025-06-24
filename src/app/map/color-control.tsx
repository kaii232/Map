import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_FILTERS_CLIENT } from "@/lib/data-definitions";
import { PopoverClose } from "@radix-ui/react-popover";
import { useAtom } from "jotai";
import { CSSProperties, memo, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { colorsAtom } from "./atoms";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ColorConfig<T extends Record<string, string | string[]> = {}> =
  | {
      type: "solid";
      default: string;
      label: string;
    }
  | {
      type: "gradient";
      default: string[];
      label: string;
    }
  | {
      type: "multi";
      pickers: {
        [P in keyof T]: T[P] extends string[]
          ? Extract<ColorConfig, { type: "gradient" }>
          : T[P] extends string
            ? Extract<ColorConfig, { type: "solid" }>
            : never;
      };
    };

/** Renders a solid colour picker. Only updates the colour on save */
const SolidColorPicker = ({
  buttonId,
  label,
  defaultColor,
  currentColor,
  onSave,
}: {
  buttonId: string;
  label: string;
  defaultColor: string;
  currentColor: string;
  onSave: (color: string) => void;
}) => {
  const selectedColor = useRef<string>("");

  return (
    <div className="flex items-center">
      <label
        htmlFor={buttonId + "-color-picker"}
        className="w-full text-sm font-normal text-neutral-300"
      >
        Adjust {label} colour
      </label>
      <Popover>
        <PopoverTrigger
          id={buttonId + "-color-picker"}
          className="size-8 shrink-0 rounded-md border border-neutral-600 bg-[var(--selected-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          style={{ "--selected-color": currentColor } as CSSProperties}
        />
        <PopoverContent className="[&_.react-colorful\_\_hue]:mt-4 [&_.react-colorful\_\_hue]:h-3 [&_.react-colorful\_\_hue]:rounded-lg [&_.react-colorful\_\_saturation]:[clip-path:inset(0px_round_8px)] [&_.react-colorful]:w-auto">
          <HexColorPicker
            color={currentColor as string}
            onChange={(color) => (selectedColor.current = color)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <PopoverClose asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSave(defaultColor)}
              >
                Reset to Default
              </Button>
            </PopoverClose>
            <PopoverClose asChild>
              <Button size="sm" onClick={() => onSave(selectedColor.current)}>
                Save
              </Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

/** Allows the user to change the colours of map icons and lines */
const ColorControl = ({
  dataKey,
}: {
  dataKey: keyof typeof ALL_FILTERS_CLIENT;
}) => {
  const [dataColors, setDataColors] = useAtom(colorsAtom);

  const colorConfig: Partial<{
    [P in keyof typeof dataColors]: (typeof dataColors)[P] extends Record<
      string,
      string | string[]
    >
      ? Extract<ColorConfig<(typeof dataColors)[P]>, { type: "multi" }>
      : (typeof dataColors)[P] extends string[]
        ? Extract<ColorConfig, { type: "gradient" }>
        : (typeof dataColors)[P] extends string
          ? Extract<ColorConfig, { type: "solid" }>
          : never;
  }> = {
    vlc: {
      type: "solid",
      default: "#1E293B",
      label: "icon",
    },
    smt: {
      type: "solid",
      default: "#854D0E",
      label: "icon",
    },
    gnss: {
      type: "multi",
      pickers: {
        icon: {
          type: "solid",
          default: "#E39F40",
          label: "icon",
        },
        vector: {
          type: "solid",
          default: "#8b36d1",
          label: "vector",
        },
      },
    },
    rock: {
      type: "solid",
      default: "#b85a1f",
      label: "icon",
    },
    flt: {
      type: "solid",
      default: "#f43f5e",
      label: "line",
    },
    hf: {
      type: "gradient",
      default: ["#0c4a6e", "#0284c7", "#eeeeee", "#e11d48", "#4c0519"],
      label: "point",
    },
    seis: {
      type: "gradient",
      default: [
        "#fff7ec",
        "#fee8c8",
        "#fdd49e",
        "#fdbb84",
        "#eb7c49",
        "#db5235",
        "#b52112",
        "#750606",
        "#360A07",
        "#000000",
      ],
      label: "point",
    },
    slab2: {
      type: "gradient",
      default: ["#ffffa4", "#fca309", "#db503b", "#922568", "#400a67", "#fff"],
      label: "line",
    },
    slip: {
      type: "gradient",
      default: [
        "#FCFDBF",
        "#FDDC9E",
        "#FD9869",
        "#F8765C",
        "#D3436E",
        "#B63779",
        "#7B2382",
        "#5F187F",
        "#231151",
        "#0C0927",
        "#000004",
      ],
      label: "patch",
    },
  };

  if (!colorConfig[dataKey]) return null;

  if (colorConfig[dataKey].type === "solid") {
    const config = colorConfig[dataKey] as Extract<
      ColorConfig,
      { type: "solid" }
    >;
    return (
      <SolidColorPicker
        currentColor={dataColors[dataKey] as string}
        buttonId={dataKey}
        defaultColor={config.default}
        label={config.label}
        onSave={(color) =>
          setDataColors((prev) => ({
            ...prev,
            [dataKey]: color,
          }))
        }
      />
    );
  }
  if (colorConfig[dataKey].type === "multi") {
    return Object.entries(colorConfig[dataKey].pickers).map(
      ([colorKey, config]) => {
        if (config.type === "solid") {
          return (
            <SolidColorPicker
              key={colorKey}
              currentColor={
                dataColors[dataKey][
                  colorKey as keyof (typeof dataColors)[keyof typeof dataColors]
                ]
              }
              buttonId={colorKey}
              defaultColor={config.default}
              label={config.label}
              onSave={(color) =>
                setDataColors((prev) => ({
                  ...prev,
                  [dataKey]: {
                    ...(prev[dataKey] as object),
                    [colorKey]: color,
                  },
                }))
              }
            />
          );
        }
      },
    );
  }
};

export default memo(ColorControl);
