type Range = [number, number];
type Categories = string[] | null;

export type VlcFilters = {
  classes: Categories;
  countries: Categories;
  sources: Categories;
};

export type SeisFilters = {
  depthRange: Range;
  mwRange: Range;
  dateRange: [string, string];
  catalogs: Categories;
};

export type SmtFilters = {
  elevRange: Range;
  baseRange: Range;
  summitRange: Range;
  classes: Categories;
  catalogs: Categories;
};

export type GnssFilters = {
  elevRange: Range;
  dateRange: [string, string];
  projects: Categories;
  stations: Categories;
  countries: Categories;
};

export type FltFilters = {
  lengthRange: Range;
  sliprateRange: Range;
  depthRange: Range;
  types: Categories;
  catalogs: Categories;
};
