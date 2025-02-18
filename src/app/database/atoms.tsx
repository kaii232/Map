import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { atom } from "jotai";
import { StyleSpecification } from "react-map-gl/maplibre";

export const layersAtom = atom({
  seafloor: false,
  hillshade: false,
});

export const mapStyleAtom = atom<string | StyleSpecification>(
  "https://tiles.openfreemap.org/styles/liberty",
);

export const drawingAtom = atom<Polygon | MultiPolygon>();

export const gnssDataAtom = atom<FeatureCollection>();
export const seisDataAtom = atom<FeatureCollection>();
export const smtDataAtom = atom<FeatureCollection>();
export const fltDataAtom = atom<FeatureCollection>();
export const vlcDataAtom = atom<FeatureCollection>();

export const dataVisibilityAtom = atom({
  gnss: true,
  seis: true,
  smt: true,
  flt: true,
  vlc: true,
});
