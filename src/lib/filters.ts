import {
  biblInInvest,
  countryInInvest,
  fltInInvest,
  gnssStnInInvest,
  seisInInvest,
  slab2InInvest,
  slipModelInInvest,
  smtInInvest,
  stnTypeInInvest,
  vlcInInvest,
} from "@/server/db/schema";
import { sql, SQL } from "drizzle-orm";
import { z } from "zod";
import type {
  Categories,
  ClientFilterDefine,
  DateFilter,
  FilterDefine,
  GenericFiltersInfo,
  GreaterThan,
  Range,
} from "./types";

// To add new data with filters follow these steps:
// 1. Define the filter types for each filter of either catagory type (select), range (slider), dateRange (calendar)
// 2. Create the filterDefine object, this object will denote
//    name: The label of the filter
//    type: The the type of filter it is
//    dbCol: The drizzle column that the filter will be applied on
//    nullCol: For select filters, if NULL is selected, the column that the IS NULL filter should be applied on
// 3. Create server action to load the data
// 4. Update the labels and loaders in utils.ts
// 5. Update database/page.tsx to fetch the data needed to populate the filter.
// 6. Update database-map.tsx mapDataLayers to specify the layer styles
// 7. Update controls.tsx ColourRamps legends object if a legend is needed to display the data

// To add additional filters:
// 1. Update the filter type
// 2. Update the filterDefine object
// 3. Update database/page.tsx to fetch the data needed to populate the filter

export type VlcFilters = {
  classes: Categories;
  countries: Categories;
  sources: Categories;
};

const vlcFilters: FilterDefine<VlcFilters> = {
  classes: {
    name: "Class",
    type: "select",
    dbCol: vlcInInvest.vlcClass,
    nullCol: vlcInInvest.vlcClass,
  },
  countries: {
    name: "Country",
    type: "select",
    dbCol: countryInInvest.countryName,
    nullCol: vlcInInvest.countryId,
  },
  sources: {
    name: "Source",
    type: "select",
    dbCol: biblInInvest.biblTitle,
    nullCol: vlcInInvest.vlcSrcId,
  },
};

export type SeisFilters = {
  depthRange: Range;
  mwRange: Range;
  dateRange: DateFilter;
  catalogs: Categories;
};

const seisFilters: FilterDefine<SeisFilters> = {
  depthRange: {
    dbCol: seisInInvest.seisDepth,
    name: "Depth",
    type: "range",
    units: "m",
  },
  mwRange: {
    dbCol: seisInInvest.seisMw,
    name: "Mw",
    type: "range",
  },
  dateRange: {
    dbCol: seisInInvest.seisDate,
    name: "Date",
    type: "date",
  },
  catalogs: {
    dbCol: biblInInvest.biblTitle,
    nullCol: seisInInvest.seisCatId,
    name: "Catalog",
    type: "select",
  },
};

export type SmtFilters = {
  elevRange: Range;
  baseRange: Range;
  summitRange: Range;
  classes: Categories;
  catalogs: Categories;
};
const smtFilters: FilterDefine<SmtFilters> = {
  elevRange: {
    dbCol: smtInInvest.smtElev,
    name: "Elevation",
    type: "range",
    units: "m",
  },
  baseRange: {
    dbCol: smtInInvest.smtBase,
    name: "Base",
    type: "range",
    units: "m",
  },
  summitRange: {
    dbCol: smtInInvest.smtSummit,
    name: "Summit",
    type: "range",
    units: "m",
  },
  classes: {
    dbCol: smtInInvest.smtClass,
    nullCol: smtInInvest.smtClass,
    name: "Class",
    type: "select",
  },
  catalogs: {
    dbCol: biblInInvest.biblTitle,
    nullCol: smtInInvest.smtSrcId,
    name: "Catalog",
    type: "select",
  },
};

export type GnssFilters = {
  elevRange: Range;
  dateRange: DateFilter;
  projects: Categories;
  stations: Categories;
  countries: Categories;
};
const gnssFilters: FilterDefine<GnssFilters> = {
  elevRange: {
    dbCol: gnssStnInInvest.gnssElev,
    name: "Elevation",
    type: "range",
    units: "m",
  },
  dateRange: {
    dbCol: gnssStnInInvest.gnssInstDate,
    name: "Install Date",
    type: "date",
  },
  countries: {
    dbCol: countryInInvest.countryName,
    nullCol: gnssStnInInvest.countryId,
    name: "Country",
    type: "select",
  },
  projects: {
    dbCol: gnssStnInInvest.gnssProj,
    nullCol: gnssStnInInvest.gnssProj,
    type: "select",
    name: "Project",
  },
  stations: {
    dbCol: stnTypeInInvest.stnTypeName,
    nullCol: gnssStnInInvest.stnTypeId,
    type: "select",
    name: "Station Type",
  },
};

export type FltFilters = {
  lengthRange: Range;
  sliprateRange: Range;
  depthRange: Range;
  types: Categories;
  catalogs: Categories;
};

const fltFilters: FilterDefine<FltFilters> = {
  lengthRange: {
    dbCol: fltInInvest.fltLen,
    name: "Length",
    type: "range",
    units: "Km",
  },
  sliprateRange: {
    dbCol: fltInInvest.fltSliprate,
    name: "Sliprate",
    type: "range",
  },
  depthRange: {
    dbCol: fltInInvest.fltLockDepth,
    name: "Depth",
    type: "range",
    units: "m",
  },
  types: {
    dbCol: fltInInvest.fltType,
    nullCol: fltInInvest.fltType,
    type: "select",
    name: "Type",
  },
  catalogs: {
    dbCol: biblInInvest.biblTitle,
    nullCol: fltInInvest.fltSrcId,
    name: "Catalog",
    type: "select",
  },
};

export type Slab2Filters = {
  region: Categories;
};

const slab2Filters: FilterDefine<Slab2Filters> = {
  region: {
    dbCol: slab2InInvest.slabRegion,
    nullCol: slab2InInvest.slabRegion,
    name: "Region",
    type: "select",
  },
};

export type SlipFilters = {
  modelEvent: Categories;
  slipRate: GreaterThan;
};

const slipFilters: FilterDefine<SlipFilters> = {
  modelEvent: {
    dbCol: slipModelInInvest.modelEvent,
    name: "Model Event",
    nullCol: slipModelInInvest.modelEvent,
    type: "select",
  },
  slipRate: {
    dbCol: slipModelInInvest.patchSlip,
    name: "Slip Rate",
    type: "greaterThan",
    maxVal: 1,
    units: "m",
  },
};

/**
 * An object containing the filter types for all the different data types. The key of this object is used as the key for all other objects
 * dealing with the different data types, and its value
 * defines the filters. Value is `null` when there are no filters for that data type.
 * Do not import this on the client!
 */
export const ALL_FILTERS = {
  smt: smtFilters,
  vlc: vlcFilters,
  gnss: gnssFilters,
  flt: fltFilters,
  seis: seisFilters,
  hf: null,
  slab2: slab2Filters,
  slip: slipFilters,
};

function cleanObjectForClient() {
  const out: Record<
    string,
    ClientFilterDefine<FilterDefine<GenericFiltersInfo>> | null
  > = {};
  Object.entries(ALL_FILTERS).map(([key, val]) => {
    if (val === null) {
      out[key] = null;
      return;
    }
    const filterObj: (typeof out)[string] = {};
    Object.entries(val).map(([clientKey, clientVal]) => {
      const obj = { ...clientVal };
      delete obj.dbCol;
      delete obj.nullCol;
      filterObj[clientKey] = obj;
    });
    out[key] = filterObj;
  });
  return out as {
    [P in keyof typeof ALL_FILTERS]: (typeof ALL_FILTERS)[P] extends FilterDefine<GenericFiltersInfo>
      ? ClientFilterDefine<(typeof ALL_FILTERS)[P]>
      : null;
  };
}
/** ALL_FILTERS object with drizzle schema columns removed for the client */
export const ALL_FILTERS_CLIENT = cleanObjectForClient();

/**
 * This function creates a zod schema for input validation for the given filters
 * @param filters An object describing the type of filters
 * @returns A zodSchema for input validation
 */
export const createZodSchema = <T extends GenericFiltersInfo>(
  filters: ClientFilterDefine<FilterDefine<T>>,
) => {
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

  Object.keys(filters).forEach((key) => {
    if (filters[key].type === "select") {
      schema[key] = z.string();
    } else if (filters[key].type === "range") {
      schema[key] = z.number().array().length(2);
      schema[`${key}AllowNull`] = z.boolean();
    } else if (filters[key].type === "date") {
      schema[key] = z.object({ from: z.date(), to: z.date() }).required();
      schema[`${key}AllowNull`] = z.boolean();
    } else {
      schema[key] = z.number().array().length(1);
      schema[`${key}AllowNull`] = z.boolean();
    }
  });
  return schema;
};

/**
 * A function that creates an object containing the default values for the given filters
 * @param initialData Data fetched from database for populating the filter values
 * @param filters An object describing the type of filters
 * @returns An object containing the default values for each filter
 */
export const createDefaultValues = <T extends GenericFiltersInfo>(
  initialData: T,
  filters: ClientFilterDefine<FilterDefine<T>>,
) => {
  const values: {
    [key: string]: boolean | string | number[] | { from: Date; to: Date };
  } = {};
  Object.keys(filters).forEach((key) => {
    if (filters[key].type === "select") {
      values[key] = "All";
      return;
    }
    // Rest of the filters has allow null check box
    values[`${key}AllowNull`] = false;
    if (filters[key].type === "range") {
      values[key] = [
        (initialData[key] ? Number(initialData[key][0]) : 0) || 0,
        (initialData[key] ? Number(initialData[key][1]) : 0) || 0,
      ];
      return;
    }
    if (filters[key].type === "greaterThan") {
      values[key] = [Number(initialData[key]) || 0];
      return;
    }
    const now = Date.now();
    values[key] = {
      from: new Date(
        initialData[key] && initialData[key][0] !== "NULL"
          ? initialData[key][0]
          : now,
      ),
      to: new Date(
        initialData[key] && initialData[key][1] !== "NULL"
          ? initialData[key][1]
          : now,
      ),
    };
  });
  return values;
};

/**
 * Convenience function to generate the SQL select statements needed to populate the filter
 * @param filter An object describing the type of filters
 * @returns An object containing the SQL select statements required for populating the filter
 */
export const generateSQLSelect = <T extends GenericFiltersInfo>(
  filter: FilterDefine<T>,
): { [P in keyof T]: SQL<T[P]> } => {
  const res: Record<string, SQL> = {};
  Object.entries(filter).map(([key, val]) => {
    if (val.type === "range") {
      res[key] = sql<Range>`ARRAY[MIN(${val.dbCol}), MAX(${val.dbCol})]`;
    } else if (val.type === "select") {
      res[key] = sql<Categories>`ARRAY_AGG(DISTINCT ${val.dbCol})`;
    } else if (val.type === "date") {
      res[key] = sql<DateFilter>`ARRAY[MIN(${val.dbCol}), MAX(${val.dbCol})]`;
    } else {
      // Greather than filter
      res[key] = sql<GreaterThan>`ARRAY[MIN(${val.dbCol})]`;
    }
  });
  return res as { [P in keyof T]: SQL<T[P]> };
};
