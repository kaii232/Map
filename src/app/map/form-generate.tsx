"use client";

import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ClientFilterDefine } from "@/lib/data-definitions";
import {
  FILTER_STRATEGIES,
  GenericFilterDefine,
  InferFilterTypes,
  SELECT_DEFAULT,
} from "@/lib/filters";
import { useMediaQuery } from "@/lib/use-media-query";
import { formatUnits } from "@/lib/utils";
import { CalendarDays, Search } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useAtomValue, useSetAtom } from "jotai";
import { dataAtom, flyToAtom } from "@/app/map/atoms";
import type { Feature, Point } from "geojson";

type FormGenerateProps<T extends ClientFilterDefine<GenericFilterDefine>> = {
  /** The React Hook Form instance */
  form: UseFormReturn<
    {
      [key: string]:
        | string
        | boolean
        | number[]
        | {
            from: Date;
            to: Date;
          };
    },
    unknown,
    undefined
  >;
  /** Default values for each input */
  defaults: {
    [key: string]:
      | string
      | boolean
      | number[]
      | {
          from: Date;
          to: Date;
        };
  };
  /** Data from database to populate controls */
  initialData: InferFilterTypes<T>;
  /** The filters for the data type */
  filters: T;
  /** The current dataset key */
  dataKey: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function parseDraft(draft: string): number | null {
  // Allow empty / partial states while typing
  if (draft.trim() === "") return null;

  const n = Number(draft);
  return isFiniteNumber(n) ? n : null;
}

type SingleDraftProps = {
  minBound: number;
  maxBound: number;
  step: number;
  value: number;
  units?: string;
  onCommit: (next: number) => void;
  onBlur: () => void;
};

function SingleDraftInput({
  minBound,
  maxBound,
  step,
  value,
  units,
  onCommit,
  onBlur,
}: SingleDraftProps) {
  const [draft, setDraft] = React.useState<string>(String(value));

  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseDraft(draft);
    const raw = parsed !== null ? parsed : value;
    const next = clamp(raw, minBound, maxBound);
    onCommit(next);
    setDraft(String(next));
    onBlur();
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      className="h-9 w-28"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        commit();
      }}
      aria-label={`Value ${units ?? ""}`.trim()}
    />
  );
}

function RangeField({
  filterName,
  units,
  valueArr,
  minDefault,
  maxDefault,
  onChange,
  onBlur,
}: {
  filterName: string;
  units?: string;
  valueArr: number[];
  minDefault: number;
  maxDefault: number;
  onChange: (next: [number, number]) => void;
  onBlur: () => void;
}) {
  const step = maxDefault - minDefault < 10 ? 0.1 : 1;

  const clampLocal = (v: number) =>
    Math.min(Math.max(v, minDefault), maxDefault);
  const ordered = (a: number, b: number): [number, number] => [
    Math.min(a, b),
    Math.max(a, b),
  ];

  const minVal = clampLocal(valueArr[0] ?? minDefault);
  const maxVal = clampLocal(valueArr[1] ?? maxDefault);

  const [draftMin, setDraftMin] = React.useState<string>(String(minVal));
  const [draftMax, setDraftMax] = React.useState<string>(String(maxVal));

  React.useEffect(() => {
    setDraftMin(String(minVal));
  }, [minVal]);

  React.useEffect(() => {
    setDraftMax(String(maxVal));
  }, [maxVal]);

  const commit = (which: "min" | "max") => {
    const parseOne = (s: string, fallback: number) => {
      const trimmed = s.trim();
      if (trimmed === "") return fallback;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : fallback;
    };

    const nextMinRaw = parseOne(draftMin, minVal);
    const nextMaxRaw = parseOne(draftMax, maxVal);

    const next = ordered(clampLocal(nextMinRaw), clampLocal(nextMaxRaw));
    onChange(next);

    setDraftMin(String(next[0]));
    setDraftMax(String(next[1]));
    onBlur();
  };

  return (
    <FormItem className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <FormLabel className="text-neutral-50">{filterName}</FormLabel>
        <FormDescription className="space-x-2">
          <span>
            {Number(minVal.toFixed(1))}
            {formatUnits(units)}
          </span>
          <span>–</span>
          <span>
            {Number(maxVal.toFixed(1))}
            {formatUnits(units)}
          </span>
        </FormDescription>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="text"
          inputMode="decimal"
          value={draftMin}
          onChange={(e) => setDraftMin(e.target.value)}
          onBlur={() => commit("min")}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            commit("min");
          }}
          className="h-10 flex-1 border border-neutral-700 bg-neutral-900/60 text-neutral-50 hover:bg-neutral-900"
        />
        <span className="text-sm text-neutral-500">–</span>
        <Input
          type="text"
          inputMode="decimal"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          onBlur={() => commit("max")}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            commit("max");
          }}
          className="h-10 flex-1 border border-neutral-700 bg-neutral-900/60 text-neutral-50 hover:bg-neutral-900"
        />
        {units ? (
          <span className="pl-1 text-xs text-neutral-500">
            {formatUnits(units)}
          </span>
        ) : null}
      </div>

      <FormControl>
        <Slider
          onValueChange={(v) => {
            if (!Array.isArray(v) || v.length !== 2) return;
            const next = ordered(clampLocal(v[0]), clampLocal(v[1]));
            onChange(next);
          }}
          onBlur={onBlur}
          value={[minVal, maxVal]}
          min={minDefault}
          max={maxDefault}
          step={step}
        />
      </FormControl>

      <FormMessage />
    </FormItem>
  );
}

/**
 * Component for automatically rendering the correct controls for each filter
 */
export default function FormGenerate<
  T extends ClientFilterDefine<GenericFilterDefine>,
>({ form, defaults, initialData, filters, dataKey }: FormGenerateProps<T>) {
  const isLarge = useMediaQuery("(min-width:640px)");

  return Object.entries(filters).map(([key, filter]) => {
    return (
      <div className="space-y-4" key={key}>
        {filter.type === "select" && (
          <FormField
            key={key}
            control={form.control}
            name={key}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-50">{filter.name}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value as string}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={filter.name} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SELECT_DEFAULT}>All</SelectItem>
                    {initialData[key as keyof typeof filters]?.map((type) => (
                      <SelectItem value={String(type)} key={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {filter.type === "range" && (
          <FormField
            control={form.control}
            name={key}
            render={({ field }) => {
              const valueArr = Array.isArray(field.value)
                ? field.value
                : [0, 0];

              const minDefault =
                defaults[key] && Array.isArray(defaults[key])
                  ? defaults[key][0]
                  : 0;
              const maxDefault =
                defaults[key] && Array.isArray(defaults[key])
                  ? defaults[key][1]
                  : 0;

              return (
                <RangeField
                  filterName={filter.name}
                  units={filter.units}
                  valueArr={valueArr as number[]}
                  minDefault={minDefault}
                  maxDefault={maxDefault}
                  onChange={(next) => field.onChange(next)}
                  onBlur={field.onBlur}
                />
              );
            }}
          />
        )}

        {filter.type === "greaterThan" && (
          <FormField
            control={form.control}
            name={key}
            render={({ field }) => {
              const valueArr = Array.isArray(field.value) ? field.value : [0];

              const minDefault =
                defaults[key] && Array.isArray(defaults[key])
                  ? defaults[key][0]
                  : 0;

              const maxVal =
                typeof filter.maxVal === "number" ? filter.maxVal : minDefault;

              const step = maxVal - minDefault < 1 ? 0.1 : 0.5;

              const current = clamp(valueArr[0], minDefault, maxVal);

              const setValue = (next: number) => {
                field.onChange([clamp(next, minDefault, maxVal)]);
              };

              return (
                <FormItem className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <FormLabel className="text-neutral-50">
                        {filter.name}
                      </FormLabel>
                      <FormDescription className="space-x-2">
                        {">"}
                        {Number(current.toFixed(1))}
                        {formatUnits(filter.units)}
                      </FormDescription>
                    </div>

                    {/* Manual entry */}
                    <SingleDraftInput
                      minBound={minDefault}
                      maxBound={maxVal}
                      step={step}
                      value={current}
                      units={filter.units}
                      onCommit={(next) => setValue(next)}
                      onBlur={field.onBlur}
                    />
                  </div>

                  <FormControl>
                    <Slider
                      onValueChange={(v) => {
                        if (Array.isArray(v) && v.length > 0) setValue(v[0]);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={field.disabled}
                      value={[current]}
                      min={minDefault}
                      max={maxVal}
                      step={step}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              );
            }}
          />
        )}

        {filter.type === "date" && (
          <FormField
            control={form.control}
            name={key}
            render={({ field }) => {
              const earliest =
                defaults[key] &&
                typeof defaults[key] === "object" &&
                !Array.isArray(defaults[key])
                  ? defaults[key].from
                  : new Date();
              const latest =
                defaults[key] &&
                typeof defaults[key] === "object" &&
                !Array.isArray(defaults[key])
                  ? defaults[key].to
                  : new Date();
              return typeof field.value === "object" &&
                !Array.isArray(field.value) ? (
                <FormItem>
                  <FormLabel className="text-neutral-50">
                    {filter.name}
                  </FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={
                            "flex h-10 w-full items-center gap-2 rounded-full bg-neutral-800 px-4 py-2 text-sm font-normal data-[state=open]:bg-neutral-950 [&_svg]:size-5"
                          }
                        >
                          <CalendarDays className="shrink-0 text-neutral-400" />
                          <div className="w-full text-left text-neutral-50">
                            {field.value.from.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })}
                          </div>
                          <Separator orientation="vertical" className="mx-1" />
                          <div className="w-full text-left text-neutral-50">
                            {field.value.to.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "2-digit",
                            })}
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto border-0 p-0">
                        <Calendar
                          captionLayout="dropdown"
                          disabled={{
                            before: earliest,
                            after: latest,
                          }}
                          startMonth={earliest}
                          endMonth={latest}
                          mode="range"
                          required
                          selected={field.value}
                          onSelect={(range) => {
                            const current = field.value as {
                              from: Date;
                              to: Date;
                            };
                            if (!range) return;
                            if (
                              current.from.getTime() === current.to.getTime()
                            ) {
                              return field.onChange(range);
                            }
                            // Only to changes, set to as start date
                            if (
                              range.from?.getTime() === current.from.getTime()
                            )
                              return field.onChange({
                                from: range.to,
                                to: range.to,
                              });
                            // Otherwise
                            return field.onChange({
                              from: range.from,
                              to: range.from,
                            });
                          }}
                          autoFocus
                          defaultMonth={field.value.from}
                          numberOfMonths={isLarge ? 2 : 1}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) : (
                <></>
              );
            }}
          />
        )}
        {filter.type === "search" && (
          <FormField
            key={key}
            control={form.control}
            name={key}
            render={({ field }) => {
              const loaded = useAtomValue(dataAtom);
              const setFlyTo = useSetAtom(flyToAtom);

              const handleKeyDown = (
                e: React.KeyboardEvent<HTMLInputElement>,
              ) => {
                if (e.key !== "Enter") return;

                if (dataKey !== "vlc") return;

                const q = String(field.value ?? "")
                  .trim()
                  .toLowerCase();
                if (!q) return;

                const feats = loaded.vlc?.geojson?.features ?? [];
                const match = feats.find((f) => {
                  const name = String(f.properties?.name ?? "").toLowerCase();
                  return name.includes(q);
                });

                if (!match || match.geometry.type !== "Point") return;

                const [lng, lat] = match.geometry.coordinates as [
                  number,
                  number,
                ];
                setFlyTo({ center: [lng, lat], zoom: 9 });
              };

              return (
                <FormItem>
                  <FormLabel className="text-neutral-50">
                    {filter.name}
                  </FormLabel>
                  <FormControl>
                    <Input
                      left={<Search />}
                      placeholder={filter.placeholder}
                      {...field}
                      value={field.value as string}
                      autoComplete="off"
                      autoCorrect="off"
                      onKeyDown={handleKeyDown}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        )}

        {FILTER_STRATEGIES[filter.type].getAllowNull && (
          <FormField
            control={form.control}
            name={`${key}AllowNull`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={field.disabled}
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal text-neutral-300">
                  Allow null values
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    );
  });
}
