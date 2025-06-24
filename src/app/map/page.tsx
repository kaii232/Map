import { Steps, TourRoot } from "@/components/tour";
import { ALL_FILTERS } from "@/lib/data-definitions";
import { GenericFiltersInfo, generateSQLSelect } from "@/lib/filters";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
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
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import { headers } from "next/headers";
import DatabaseMap from "./database-map";

// Disable caching
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Map",
  description: "View and download data from EOS or global datasets",
};

const safeFirstRow = <T extends GenericFiltersInfo>(data: T[]) => {
  if (data.length) return data[0];

  return {} as T;
};

const TOUR_STEPS: Steps = [
  {
    type: "dialog",
    title: "Welcome to the map",
    description:
      "On this page you will be able to load, view and download a variety of data. Logged in users will have access to restricted data.",
  },
  {
    type: "tooltip",
    title: "Open and close side panel",
    description:
      "Clicking this button will allow you to open and close the side panel.",
  },
  {
    type: "tooltip",
    title: "Select Basemap",
    description: "Select the basemap from the options here.",
  },
  {
    type: "tooltip",
    title: "Map layers",
    description:
      "Toggle the visibility of map layers like plate boundaries and hillshading here.",
  },
  {
    type: "tooltip",
    title: "Select data",
    description: "Select the type of data you want to load from here.",
  },
  {
    type: "tooltip",
    title: "Filtering and downloading data",
    description:
      "Filter the type of data you wish to load using these filter controls. You can also download the selected data in a .geojson or .csv file after loading.",
  },
  {
    type: "tooltip",
    title: "Download map",
    description:
      "Click this button to download a high resolution picture of the map with separate layers.",
  },
  {
    type: "tooltip",
    title: "Restart tour",
    description:
      "If you missed anything, click this button to go through the introduction guide again!",
  },
];

export default async function DatabasePage() {
  // If you want to add vlcCatSrc as a filter you would need this subquery
  // const sources = db.$with("sources").as(
  //   db
  //     .select({
  //       vlcId: vlcInInvest.vlcId,
  //       sources: sql`string_to_table(${vlcInInvest.vlcCatSrc}, ', ')`.as(
  //         "sources",
  //       ),
  //     })
  //     .from(vlcInInvest),
  // );

  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableRefresh: true,
    },
  });
  const restrict = session
    ? undefined
    : eq(biblInInvest.biblIsRestricted, false);

  const [
    vlcFilters,
    seisFilters,
    smtFilters,
    gnssFilters,
    fltFilters,
    slab2Filters,
    slipFilters,
  ] = await Promise.all([
    db
      // .with(sources)
      .select(
        // categorySources: sql<string[]>`ARRAY_AGG(DISTINCT sources)`,
        generateSQLSelect(ALL_FILTERS.vlc),
      )
      .from(vlcInInvest)
      .leftJoin(
        countryInInvest,
        eq(vlcInInvest.countryId, countryInInvest.countryId),
      )
      .leftJoin(biblInInvest, eq(vlcInInvest.vlcSrcId, biblInInvest.biblId))
      .where(restrict),
    // .leftJoin(sources, eq(sources.vlcId, vlcInInvest.vlcId)),
    db
      .select(generateSQLSelect(ALL_FILTERS.seis))
      .from(seisInInvest)
      .leftJoin(biblInInvest, eq(seisInInvest.seisCatId, biblInInvest.biblId))
      .where(restrict),
    db
      .select(generateSQLSelect(ALL_FILTERS.smt))
      .from(smtInInvest)
      .leftJoin(biblInInvest, eq(smtInInvest.smtSrcId, biblInInvest.biblId))
      .where(restrict),
    db
      .select(generateSQLSelect(ALL_FILTERS.gnss))
      .from(gnssStnInInvest)
      .leftJoin(
        countryInInvest,
        eq(gnssStnInInvest.countryId, countryInInvest.countryId),
      )
      .leftJoin(
        stnTypeInInvest,
        eq(gnssStnInInvest.stnTypeId, stnTypeInInvest.stnTypeId),
      )
      .leftJoin(
        gnssVectorInInvest,
        eq(gnssVectorInInvest.vectorGnssId, gnssStnInInvest.gnssId),
      )
      .leftJoin(
        biblInInvest,
        eq(biblInInvest.biblId, gnssVectorInInvest.vectorBiblId),
      ),
    db
      .select(generateSQLSelect(ALL_FILTERS.flt))
      .from(fltInInvest)
      .leftJoin(biblInInvest, eq(fltInInvest.fltSrcId, biblInInvest.biblId))
      .where(restrict),
    db.select(generateSQLSelect(ALL_FILTERS.slab2)).from(slab2InInvest),
    db
      .select(generateSQLSelect(ALL_FILTERS.slip))
      .from(slipModelInInvest)
      .leftJoin(
        biblInInvest,
        eq(slipModelInInvest.modelSrcId, biblInInvest.biblId),
      )
      .where(restrict),
  ]);

  return (
    <main className="h-screen w-full">
      <TourRoot tourId="map" steps={TOUR_STEPS}>
        <DatabaseMap
          initialData={{
            flt: safeFirstRow(fltFilters),
            gnss: safeFirstRow(gnssFilters),
            smt: safeFirstRow(smtFilters),
            vlc: safeFirstRow(vlcFilters),
            seis: safeFirstRow(seisFilters),
            slab2: safeFirstRow(slab2Filters),
            slip: safeFirstRow(slipFilters),
          }}
        />
      </TourRoot>
    </main>
  );
}
