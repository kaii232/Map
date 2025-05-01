import { AnyPgColumn } from "drizzle-orm/pg-core";

export type BasemapNames =
  | "Openstreetmap"
  | "Opentopomap"
  | "Satellite"
  | "Ocean"
  | "Openfreemap";

export type Range = [number, number];
export type Categories = string[] | null;
export type DateFilter = [string, string];
export type GreaterThan = number[];
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
// Type for the filters definition
export type FilterDefine<T extends GenericFiltersInfo> = {
  [P in keyof T]: T[P] extends Range
    ? Extract<FiltersType, { type: "range" }>
    : T[P] extends DateFilter
      ? Extract<FiltersType, { type: "date" }>
      : T[P] extends Categories
        ? Extract<FiltersType, { type: "select" }>
        : T[P] extends GreaterThan
          ? Extract<FiltersType, { type: "greaterThan" }>
          : {
              name: string;
              type: "select" | "range" | "date" | "greaterThan";
              dbCol: AnyPgColumn;
              nullCol?: AnyPgColumn;
              maxVal?: number;
              units?: string;
            };
};

// FilterDefine type but val has no drizzle schemas included. Just wrap normal filter define type with this
export type ClientFilterDefine<T extends FilterDefine<GenericFiltersInfo>> = {
  [P in keyof T]: Omit<T[P], "dbCol" | "nullCol">;
};
