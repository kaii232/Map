import { AnyPgColumn } from "drizzle-orm/pg-core";

// This type collapses the type and makes it nicer to look at in the editor typehints
// E.g. ComplexType<{someKey: AnotherType; someKey2: AnotherType2}> will become => {finalKey: finalVal; finalKey2: finalVal2}
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type BasemapNames =
  | "Openstreetmap"
  | "Opentopomap"
  | "Satellite"
  | "Ocean"
  | "Openfreemap";

export type Range = [number, number];
export type Categories = string[] | null;
export type DateFilter = [string, string];
export type GreaterThan = [number];
// Generic type of the data that describes the filter values
export type GenericFiltersInfo = Record<
  string,
  Range | Categories | DateFilter | GreaterThan
>;

// Information needed to generate the form depending on the type of filter it is
export type FiltersType =
  | {
      name: string;
      type: "select";
      dbCol: AnyPgColumn;
      nullCol: AnyPgColumn;
    }
  | {
      name: string;
      type: "range";
      dbCol: AnyPgColumn;
      units?: string;
    }
  | {
      name: string;
      type: "date";
      dbCol: AnyPgColumn;
    }
  | {
      name: string;
      type: "greaterThan";
      dbCol: AnyPgColumn;
      maxVal: number;
      units?: string;
    };

export type GenericFilterDefine = Record<string, FiltersType>;

export type NarrowFilterType<T extends FiltersType["type"]> = T extends "select"
  ? Categories
  : T extends "range"
    ? Range
    : T extends "date"
      ? DateFilter
      : T extends "greaterThan"
        ? GreaterThan
        : never;

export type InferFilterTypes<
  T extends ClientFilterDefine<GenericFilterDefine>,
> = {
  [P in keyof T]: NarrowFilterType<T[P]["type"]>;
};

// Exclude the dbCol and nullCol keys
export type ClientFilterType<T extends FiltersType> = {
  [P in keyof T as Exclude<P, "dbCol" | "nullCol">]: T[P];
};

export type ClientFilterDefine<T extends GenericFilterDefine> = {
  [P in keyof T]: Simplify<ClientFilterType<T[P]>>;
};
