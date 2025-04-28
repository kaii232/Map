import {
  FltFilters,
  GnssFilters,
  SeisFilters,
  Slab2Filters,
  SlipFilters,
  SmtFilters,
  VlcFilters,
} from "@/lib/filters";
import { GenericFiltersInfo } from "@/lib/types";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
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
import { eq, sql } from "drizzle-orm";
import { Metadata } from "next";
import { headers } from "next/headers";
import DatabaseMap from "./database-map";

// Disable caching
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Map",
  description: "View and download data from EOS or global datasets",
};

const safeFirstRow = <T extends GenericFiltersInfo>(data: T[]): T => {
  if (data.length) return data[0];

  return {} as T;
};

export default async function DatabasePage() {
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
  ]: [
    VlcFilters[],
    SeisFilters[],
    SmtFilters[],
    GnssFilters[],
    FltFilters[],
    Slab2Filters[],
    SlipFilters[],
  ] = await Promise.all([
    db
      // .with(sources)
      .select({
        classes: sql<string[]>`ARRAY_AGG(DISTINCT ${vlcInInvest.vlcClass})`,
        // categorySources: sql<string[]>`ARRAY_AGG(DISTINCT sources)`,
        countries: sql<
          string[]
        >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
        sources: sql<string[]>`ARRAY_AGG(DISTINCT ${biblInInvest.biblTitle})`,
      })
      .from(vlcInInvest)
      .leftJoin(
        countryInInvest,
        eq(vlcInInvest.countryId, countryInInvest.countryId),
      )
      .leftJoin(biblInInvest, eq(vlcInInvest.vlcSrcId, biblInInvest.biblId))
      .where(restrict),
    // .leftJoin(sources, eq(sources.vlcId, vlcInInvest.vlcId)),
    db
      .select({
        depthRange: sql<
          [number, number]
        >`ARRAY[MIN(${seisInInvest.seisDepth}), MAX(${seisInInvest.seisDepth})]`,
        mwRange: sql<
          [number, number]
        >`ARRAY[MIN(${seisInInvest.seisMw}), MAX(${seisInInvest.seisMw})]`,
        dateRange: sql<
          [string, string]
        >`ARRAY[MIN(${seisInInvest.seisDate}), MAX(${seisInInvest.seisDate})]`,
        catalogs: sql<string[]>`ARRAY_AGG(DISTINCT ${biblInInvest.biblTitle})`,
      })
      .from(seisInInvest)
      .leftJoin(biblInInvest, eq(seisInInvest.seisCatId, biblInInvest.biblId))
      .where(restrict),
    db
      .select({
        elevRange: sql<
          [number, number]
        >`ARRAY[MIN(${smtInInvest.smtElev}), MAX(${smtInInvest.smtElev})]`,
        baseRange: sql<
          [number, number]
        >`ARRAY[MIN(${smtInInvest.smtBase}), MAX(${smtInInvest.smtBase})]`,
        summitRange: sql<
          [number, number]
        >`ARRAY[MIN(${smtInInvest.smtSummit}), MAX(${smtInInvest.smtSummit})]`,
        classes: sql<string[]>`ARRAY_AGG(DISTINCT ${smtInInvest.smtClass})`,
        catalogs: sql<string[]>`ARRAY_AGG(DISTINCT ${biblInInvest.biblTitle})`,
      })
      .from(smtInInvest)
      .leftJoin(biblInInvest, eq(smtInInvest.smtSrcId, biblInInvest.biblId))
      .where(restrict),
    db
      .select({
        elevRange: sql<
          [number, number]
        >`ARRAY[MIN(${gnssStnInInvest.gnssElev}), MAX(${gnssStnInInvest.gnssElev})]`,
        dateRange: sql<
          [string, string]
        >`ARRAY[MIN(${gnssStnInInvest.gnssInstDate}), MAX(${gnssStnInInvest.gnssInstDate})]`,
        projects: sql<
          string[]
        >`ARRAY_AGG(DISTINCT ${gnssStnInInvest.gnssProj})`,
        stations: sql<
          string[]
        >`ARRAY_AGG(DISTINCT ${stnTypeInInvest.stnTypeName})`,
        countries: sql<
          string[]
        >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
      })
      .from(gnssStnInInvest)
      .leftJoin(
        countryInInvest,
        eq(gnssStnInInvest.countryId, countryInInvest.countryId),
      )
      .leftJoin(
        stnTypeInInvest,
        eq(gnssStnInInvest.stnTypeId, stnTypeInInvest.stnTypeId),
      ),
    db
      .select({
        lengthRange: sql<
          [number, number]
        >`ARRAY[MIN(${fltInInvest.fltLen}), MAX(${fltInInvest.fltLen})]`,
        sliprateRange: sql<
          [number, number]
        >`ARRAY[MIN(${fltInInvest.fltSliprate}), MAX(${fltInInvest.fltSliprate})]`,
        depthRange: sql<
          [number, number]
        >`ARRAY[MIN(${fltInInvest.fltLockDepth}), MAX(${fltInInvest.fltLockDepth})]`,
        types: sql<string[]>`ARRAY_AGG(DISTINCT ${fltInInvest.fltType})`,
        catalogs: sql<string[]>`ARRAY_AGG(DISTINCT ${biblInInvest.biblTitle})`,
      })
      .from(fltInInvest)
      .leftJoin(biblInInvest, eq(fltInInvest.fltSrcId, biblInInvest.biblId))
      .where(restrict),
    db
      .select({
        region: sql<string[]>`ARRAY_AGG(DISTINCT ${slab2InInvest.slabRegion})`,
      })
      .from(slab2InInvest),
    db
      .select({
        modelEvent: sql<
          string[]
        >`ARRAY_AGG(DISTINCT ${slipModelInInvest.modelEvent})`,
        slipRate: sql<
          [number, number]
        >`ARRAY[MIN(${slipModelInInvest.patchSlip}), MAX(${slipModelInInvest.patchSlip})]`,
      })
      .from(slipModelInInvest)
      .leftJoin(
        biblInInvest,
        eq(slipModelInInvest.modelSrcId, biblInInvest.biblId),
      )
      .where(restrict),
  ]);

  return (
    <main className="h-screen w-full">
      <DatabaseMap
        initialData={{
          flt: safeFirstRow(fltFilters),
          gnss: safeFirstRow(gnssFilters),
          smt: safeFirstRow(smtFilters),
          vlc: safeFirstRow(vlcFilters),
          seis: safeFirstRow(seisFilters),
          hf: {},
          slab2: safeFirstRow(slab2Filters),
          slip: safeFirstRow(slipFilters),
        }}
      />
    </main>
  );
}
