import {
  ALL_FILTERS,
  FltFilters,
  generateSQLSelect,
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

const safeFirstRow = <T extends GenericFiltersInfo>(data: T[]): T => {
  if (data.length) return data[0];

  return {} as T;
};

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
