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

type ColorConfig =
  | {
      type: "solid";
      default: string;
      label: string;
    }
  | {
      type: "gradient";
      default: string[];
      label: string;
    };

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
    <div className="my-6 flex items-center justify-between">
      <label
        htmlFor={buttonId + "-color-picker"}
        className="w-full text-sm font-normal text-neutral-300"
      >
        Adjust {label} colour
      </label>
      <Popover>
        <PopoverTrigger
          id={buttonId + "-color-picker"}
          className="size-8 rounded border-neutral-600 bg-[var(--selected-color)]"
          style={{ "--selected-color": currentColor } as CSSProperties}
        ></PopoverTrigger>
        <PopoverContent className="[&_.react-colorful]:w-auto">
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

const ColorControl = ({
  dataKey,
}: {
  dataKey: keyof typeof ALL_FILTERS_CLIENT;
}) => {
  const [dataColors, setDataColors] = useAtom(colorsAtom);

  const colorConfig: Partial<{
    [P in keyof typeof ALL_FILTERS_CLIENT]: (typeof dataColors)[P] extends Record<
      string,
      string
    >
      ? Record<keyof (typeof dataColors)[P], ColorConfig>
      : ColorConfig;
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
  };

  if (!colorConfig[dataKey]) return null;

  if ("type" in colorConfig[dataKey]) {
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
  }

  return Object.entries(colorConfig[dataKey]).map(
    ([colorKey, config]: [colorKey: string, config: ColorConfig]) => {
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
            defaultColor={config.default as string}
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
};

export default memo(ColorControl);
