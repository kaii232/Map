/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapStyle } from "@vis.gl/react-maplibre";
import { FeatureCollection } from "geojson";
import { atom } from "jotai";

export const layersAtom = atom({
  seafloor: false,
  hillshade: false,
});

export const mapStyleAtom = atom<string | MapStyle>(
  "https://tiles.openfreemap.org/styles/liberty",
);

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
