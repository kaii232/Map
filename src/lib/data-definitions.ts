import {
  biblInInvest,
  countryInInvest,
  fltInInvest,
  gnssStnInInvest,
  gnssVectorInInvest,
  seisInInvest,
  slab2InInvest,
  slipModelInInvest,
  smtInInvest,
  stnTypeInInvest,
  vlcInInvest,
} from "@/server/db/schema";
import type {
  FiltersType,
  GenericFilterDefine,
  InferFilterTypes,
} from "./filters";
import { Simplify } from "./types";

// To add new data with and without filters follow these steps:
// 1. Define the filter using the createDataFilter helper function this object will denote (skip this step if no filter)
//    name:    The label of the filter
//    type:    The the type of filter it is
//    dbCol:   The drizzle column that the filter will be applied on
//    nullCol: For select filters, if NULL is selected, the column that the IS NULL filter should be applied on
//    others:  Filter types like range, search and greaterThan have additional fields
// 2. Update the ALL_FILTERS object with the filter object defined in 1. or null if no filter
// 3. Update LOADER_DEFINITION in actions.ts to specify how to load this new data type
// 4. Update the labels and in utils.ts
// 5. Update map/page.tsx to fetch the data needed to populate the filter using the generateSQLSelect function. (skip this step if no filter)
// 6. Update map/database-map.tsx mapDataLayers to specify the layer styles
// 7. Update map/color-ramps.tsx legends object if a legend is needed to display the data

// To add additional filters for data that already exists:
// 2. Update the filter object of that data

/** Exclude the dbCol and nullCol keys from `FiltersType` */
export type ClientFilterType<T extends FiltersType> = {
  [P in keyof T as Exclude<P, "dbCol" | "nullCol">]: T[P];
};

/** Filter define object with drizzle columns removed */
export type ClientFilterDefine<T extends GenericFilterDefine> = {
  [P in keyof T]: Simplify<ClientFilterType<T[P]>>;
};

/** Helper function to enable type safety when defining new filters */
const createDataFilter = <T extends GenericFilterDefine>(obj: {
  [P in keyof T]: T[P];
}) => obj;

const vlcFilters = createDataFilter({
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
  search: {
    name: "Volcano Name",
    type: "search",
    dbCol: vlcInInvest.vlcName,
    placeholder: "Search for volcanoes",
  },
});

const seisFilters = createDataFilter({
  depthRange: {
    dbCol: seisInInvest.seisDepth,
    name: "Depth",
    type: "range",
    units: "km",
  },
  mwRange: {
    dbCol: seisInInvest.seisMw,
    name: "Mw",
    type: "range",
  },
  catalogs: {
    dbCol: biblInInvest.biblTitle,
    nullCol: seisInInvest.seisCatId,
    name: "Catalog",
    type: "select",
  },
});

const smtFilters = createDataFilter({
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
});

const gnssFilters = createDataFilter({
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
  vector: {
    dbCol: biblInInvest.biblTitle,
    nullCol: gnssVectorInInvest.vectorBiblId,
    type: "select",
    name: "GNSS Vector",
  },
});

const fltFilters = createDataFilter({
  lengthRange: {
    dbCol: fltInInvest.fltLen,
    name: "Length",
    type: "range",
    units: "km",
  },
  sliprateRange: {
    dbCol: fltInInvest.fltSliprate,
    name: "Sliprate",
    type: "range",
    units: "mm/yr",
  },
  depthRange: {
    dbCol: fltInInvest.fltLockDepth,
    name: "Locking Depth",
    type: "range",
    units: "km",
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
});

const slab2Filters = createDataFilter({
  region: {
    dbCol: slab2InInvest.slabRegion,
    nullCol: slab2InInvest.slabRegion,
    name: "Region",
    type: "select",
  },
});

const slipFilters = createDataFilter({
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
});

/**
 * An object containing the filter types for all the different data types. The keys of this object is used as the keys for all other objects
 * dealing with the different data types, and its respective value defines the filters for that data type.
 * Value is `null` when there are no filters for that data type.
 * # DO NOT import this on the client!
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
  rock: null,
};

function cleanObjectForClient() {
  const out: Record<
    string,
    Record<string, ClientFilterType<FiltersType>> | null
  > = {};
  Object.entries(ALL_FILTERS).forEach(([key, val]) => {
    if (val === null) {
      out[key] = null;
      return;
    }
    const filterObj: (typeof out)[string] = {};
    Object.entries(val).map(([clientKey, clientVal]) => {
      const { dbCol, nullCol, ...obj } = clientVal;
      filterObj[clientKey] = obj;
    });
    out[key] = filterObj;
  });
  return out as {
    [P in keyof typeof ALL_FILTERS]: (typeof ALL_FILTERS)[P] extends GenericFilterDefine
      ? Simplify<ClientFilterDefine<(typeof ALL_FILTERS)[P]>>
      : null;
  };
}
/** `ALL_FILTERS` object with drizzle schema columns removed for the client */
export const ALL_FILTERS_CLIENT = cleanObjectForClient();

/** Type of the data required to populate all filters */
export type PopulateFilters = {
  [P in keyof typeof ALL_FILTERS as (typeof ALL_FILTERS)[P] extends GenericFilterDefine
    ? P
    : never]: (typeof ALL_FILTERS)[P] extends GenericFilterDefine
    ? Simplify<InferFilterTypes<(typeof ALL_FILTERS)[P]>>
    : never;
};
