import { between, eq, gte, isNull, like, or, sql, SQL } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { z } from "zod";
import type {
  ALL_FILTERS,
  ALL_FILTERS_CLIENT,
  ClientFilterDefine,
  PopulateFilters,
} from "./data-definitions";

// To add new types of filter:
// 1. Define the type of the data needed to populate the filter in types.ts
// 2. Update GenericFiltersInfo (skip if does not need to be populated with data from server), FiltersType and
//    NarrowFilterType (skip if does not need to be populated with data from server) in types.ts to reflect this new filter
// 3. If the new filter does not need to be populated with data from the server, adjust FilterServerPopulated type to reflect that
// 4. Update FilterStrategy type in this file to reflect new filter
// 5. Update FILTER_STRATEGIES in this file to deal with the new filter
// 6. Update form-generate.tsx to render the UI needed for your filter

export type Range = [number, number];
export type Categories = string[];
export type DateFilter = [string, string];
export type GreaterThan = [number];

/** Generic type of the data that describes an object with data to populate filters */
export type GenericFiltersInfo = Record<
  string,
  Range | Categories | DateFilter | GreaterThan
>;

/** Information needed to generate the form depending on the type of filter it is */
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

/** Default value for select filter */
export const SELECT_DEFAULT = "All";

type FilterStrategy<T extends FiltersType["type"]> = {
  /** Zod type used for data validation when submitting data to be loaded */
  getZodSchema: T extends "select" | "search"
    ? z.ZodString
    : T extends "range"
      ? z.ZodArray<z.ZodNumber, "many">
      : T extends "greaterThan"
        ? z.ZodArray<z.ZodNumber, "many">
        : T extends "date"
          ? z.ZodObject<{
              from: z.ZodDate;
              to: z.ZodDate;
            }>
          : never;
  /** Returns the default value for the filter controls */
  getDefaultVal: (
    initialData: NarrowFilterType<T>,
  ) => T extends "select"
    ? typeof SELECT_DEFAULT
    : T extends "range"
      ? Range
      : T extends "greaterThan"
        ? GreaterThan
        : T extends "date"
          ? { from: Date; to: Date }
          : T extends "search"
            ? ""
            : never;
  /** Indicates whether an allow null checkbox should be shown for this filter type */
  getAllowNull: boolean;
  /** Returns the drizzle SQL `SELECT` statements needed to retrieve values to populate this filter */
  getSQLSelect: (dbCol: AnyPgColumn) => SQL<NarrowFilterType<T>> | undefined;
  /** Returns the drizzle SQL `WHERE` statements to filter the data when loading */
  getSQLFilter: (
    key: string,
    vals: Record<
      string,
      z.infer<FilterStrategy<FiltersType["type"]>["getZodSchema"]> | boolean
    >,
    dbCol: AnyPgColumn,
    nullCol?: AnyPgColumn,
  ) => SQL | undefined;
};

/** This object defines the methods needed for each of the filter types */
export const FILTER_STRATEGIES: {
  [P in FiltersType["type"]]: FilterStrategy<P>;
} = {
  date: {
    getZodSchema: z.object({ from: z.date(), to: z.date() }).required(),
    getDefaultVal(initialData) {
      const now = Date.now();
      return {
        from: new Date(initialData[0] !== "NULL" ? initialData[0] : now),
        to: new Date(initialData[1] !== "NULL" ? initialData[1] : now),
      };
    },
    getAllowNull: true,
    getSQLSelect(dbCol) {
      return sql<DateFilter>`ARRAY[MIN(${dbCol}), MAX(${dbCol})]`;
    },
    getSQLFilter(key, vals, dbCol) {
      const input = vals[key];
      if (typeof input !== "object" || Array.isArray(input)) return;
      if (vals[`${key}AllowNull`]) {
        return or(
          between(dbCol, input.from.toISOString(), input.to.toISOString()),
          isNull(dbCol),
        );
      } else {
        return between(dbCol, input.from.toISOString(), input.to.toISOString());
      }
    },
  },
  select: {
    getZodSchema: z.string(),
    getDefaultVal() {
      return SELECT_DEFAULT;
    },
    getAllowNull: false,
    getSQLSelect(dbCol) {
      return sql<Categories>`ARRAY_AGG(DISTINCT ${dbCol})`;
    },
    getSQLFilter(key, vals, dbCol, nullCol) {
      const input = vals[key];
      if (typeof input !== "string") return;
      if (input === SELECT_DEFAULT) return;
      if (input === "NULL" && nullCol) {
        return isNull(nullCol);
      } else {
        return eq(dbCol, input);
      }
    },
  },
  range: {
    getZodSchema: z.number().array().length(2),
    getDefaultVal(initialData) {
      return [Number(initialData[0]) || 0, Number(initialData[1]) || 0];
    },
    getAllowNull: true,
    getSQLSelect(dbCol) {
      return sql<Range>`ARRAY[FLOOR(MIN(${dbCol})), CEIL(MAX(${dbCol}))]`;
    },
    getSQLFilter(key, vals, dbCol) {
      const input = vals[key];
      if (!Array.isArray(input)) return;
      if (vals[`${key}AllowNull`]) {
        return or(between(dbCol, input[0], input[1]), isNull(dbCol));
      } else {
        return between(dbCol, input[0], input[1]);
      }
    },
  },
  greaterThan: {
    getZodSchema: z.number().array().length(1),
    getDefaultVal(initialData) {
      return initialData.length === 1 ? initialData : [0];
    },
    getAllowNull: true,
    getSQLSelect(dbCol) {
      return sql<GreaterThan>`ARRAY[FLOOR(MIN(${dbCol}))]`;
    },
    getSQLFilter(key, vals, dbCol) {
      const input = vals[key];
      if (!Array.isArray(input)) return;
      if (vals[`${key}AllowNull`]) {
        return or(gte(dbCol, input[0]), isNull(dbCol));
      } else {
        return gte(dbCol, input[0]);
      }
    },
  },
  search: {
    getZodSchema: z.string(),
    getDefaultVal() {
      return "";
    },
    getAllowNull: false,
    getSQLSelect() {
      return undefined;
    },
    getSQLFilter(key, vals, dbCol) {
      const input = vals[key];
      if (typeof input !== "string") return;
      if (!input.trim()) return;
      if (vals[`${key}AllowNull`]) {
        return or(
          like(sql`lower(${dbCol})`, `%${input.trim().toLowerCase()}%`),
          isNull(dbCol),
        );
      } else {
        return like(sql`lower(${dbCol})`, `%${input.trim().toLowerCase()}%`);
      }
    },
  },
};

/**
 * This function creates a zod schema for input validation for the given filters
 * @param filters An object describing the type of filters
 * @returns A zodSchema for input validation
 */
export function createZodSchema(
  filters: NonNullable<
    (typeof ALL_FILTERS | typeof ALL_FILTERS_CLIENT)[keyof typeof ALL_FILTERS]
  >,
) {
  const schema: Record<
    string,
    | z.ZodArray<z.ZodNumber, "many">
    | z.ZodBoolean
    | z.ZodString
    | z.ZodObject<{
        from: z.ZodDate;
        to: z.ZodDate;
      }>
  > = {};

  Object.entries(filters).forEach(([key, val]: [string, FiltersType]) => {
    schema[key] = FILTER_STRATEGIES[val.type].getZodSchema;
    if (FILTER_STRATEGIES[val.type].getAllowNull)
      schema[`${key}AllowNull`] = z.boolean();
  });
  return schema;
}

/**
 * A function that creates an object containing the default values for the given filters
 * @param initialData Data fetched from database for populating the filter values
 * @param filters An object describing the type of filters
 * @returns An object containing the default values for each filter
 */
export function createDefaultValues<T extends keyof PopulateFilters>( // This generic doesn't actually do anything but it helps prevent some errors so it's here
  initialData: PopulateFilters[T],
  filters: NonNullable<(typeof ALL_FILTERS_CLIENT)[T]>,
) {
  const values: {
    [key: string]: boolean | string | number[] | { from: Date; to: Date };
  } = {};
  Object.keys(filters).forEach((key) => {
    values[key] = FILTER_STRATEGIES[filters[key].type].getDefaultVal(
      initialData[key as keyof typeof initialData] as NarrowFilterType<
        (typeof filters)[string]["type"]
      >, // What a mess
    );
    if (FILTER_STRATEGIES[filters[key].type].getAllowNull)
      values[`${key}AllowNull`] = true;
  });
  return values;
}

/**
 * Convenience function to generate the SQL select statements needed to populate the filter
 * @param filter An object describing the type of filters
 * @returns An object containing the SQL select statements required for populating the filter
 */
export const generateSQLSelect = <T extends GenericFilterDefine>(filter: T) => {
  const res: Record<string, SQL> = {};
  Object.entries(filter).forEach(([key, val]) => {
    const statement = FILTER_STRATEGIES[val.type].getSQLSelect(val.dbCol);
    if (statement) res[key] = statement;
  });
  return res as {
    [P in keyof InferFilterTypes<T>]: SQL<InferFilterTypes<T>[P]>;
  };
};
