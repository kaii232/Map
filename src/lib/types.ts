export type VlcFilters = {
  classes: string[];
  countries: string[];
  categorySources: string[];
  sources: string[];
};

export type SeisFilters = {
  depthRange: [number, number];
  mwRange: [number, number];
  msRange: [number, number];
  mbRange: [number, number];
  dateRange: [string, string];
  catalogs: string[];
};

export type SmtFilters = {
  elevRange: [number, number];
  baseRange: [number, number];
  summitRange: [number, number];
  blRange: [number, number];
  bwRange: [number, number];
  baRange: [number, number];
  classes: string[];
  catalogs: string[];
  countries: string[];
};

export type GnssFilters = {
  elevRange: [number, number];
  dateRange: [string, string];
  projects: string[];
  stations: string[];
  countries: string[];
};

export type FltFilters = {
  lengthRange: [number, number];
  sliprateRange: [number, number];
  depthRange: [number, number];
  types: string[];
  catalogs: string[];
};
