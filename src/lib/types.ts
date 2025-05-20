import { AnyPgColumn } from "drizzle-orm/pg-core";

/** This type collapses the type and makes it nicer to look at in the editor typehints
E.g. `ComplexType<{someKey: AnotherType; someKey2: AnotherType2}>` will become: `{finalKey: finalVal; finalKey2: finalVal2}` */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/** Contains names of all the different basemaps */
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

/** Generic type of the data that describes an object with data to populate filters */
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
    }
  | {
      name: string;
      type: "search";
      dbCol: AnyPgColumn;
      placeholder: string;
    };

/** Type for a generic object containing some filters */
export type GenericFilterDefine = Record<string, FiltersType>;

/** Type that determines the type of data that needs to come from the server in order to populate the filter */
export type NarrowFilterType<T extends FiltersType["type"]> = T extends "select"
  ? Categories
  : T extends "range"
    ? Range
    : T extends "date"
      ? DateFilter
      : T extends "greaterThan"
        ? GreaterThan
        : never; // Search filter does not need data from server and will be inferred as never

/** Type to remove the keys from a mapped type for filters that don't need to get initial data from the server */
type FilterServerPopulated<
  T extends ClientFilterDefine<GenericFilterDefine>,
  P extends keyof T,
> = T[P]["type"] extends "search" ? never : P;

/** Infer the types of data that needs to be retrieved from the server for a filter define object */
export type InferFilterTypes<
  T extends ClientFilterDefine<GenericFilterDefine>,
> = {
  [P in keyof T as FilterServerPopulated<T, P>]: NarrowFilterType<T[P]["type"]>;
};

/** Exclude the dbCol and nullCol keys from `FiltersType` */
export type ClientFilterType<T extends FiltersType> = {
  [P in keyof T as Exclude<P, "dbCol" | "nullCol">]: T[P];
};

/** Filter define object with drizzle columns removed */
export type ClientFilterDefine<T extends GenericFilterDefine> = {
  [P in keyof T]: Simplify<ClientFilterType<T[P]>>;
};
