import Header from "@/components/header";
import { ALL_FILTERS_CLIENT } from "@/lib/data-definitions";
import { DATA_LABELS } from "@/lib/utils";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  biblInInvest,
  fltInInvest,
  heatflowInInvest,
  rockSampleInInvest,
  seisInInvest,
  slab2InInvest,
  slipModelInInvest,
  smtInInvest,
  vlcInInvest,
} from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Databases",
  description: "View the sources of data for each of the data types.",
};

const select = {
  id: sql<number>`DISTINCT ${biblInInvest.biblId}`,
  title: biblInInvest.biblTitle,
  journal: biblInInvest.biblJourn,
  doi: biblInInvest.biblDoi,
  url: biblInInvest.biblUrl,
  year: biblInInvest.biblYr,
  author: biblInInvest.biblAuth,
};

const TO_SELECT: Record<
  Exclude<keyof typeof ALL_FILTERS_CLIENT, "gnss">,
  { from: AnyPgTable; biblCol: AnyPgColumn }
> = {
  smt: {
    from: smtInInvest,
    biblCol: smtInInvest.smtSrcId,
  },
  vlc: {
    from: vlcInInvest,
    biblCol: vlcInInvest.vlcSrcId,
  },
  flt: {
    from: fltInInvest,
    biblCol: fltInInvest.fltSrcId,
  },
  seis: {
    from: seisInInvest,
    biblCol: seisInInvest.seisCatId,
  },
  hf: {
    from: heatflowInInvest,
    biblCol: heatflowInInvest.hfSrcId,
  },
  slab2: {
    from: slab2InInvest,
    biblCol: slab2InInvest.slabSrcId,
  },
  slip: {
    from: slipModelInInvest,
    biblCol: slipModelInInvest.modelSrcId,
  },
  rock: {
    from: rockSampleInInvest,
    biblCol: rockSampleInInvest.srcId,
  },
};

// Orders the labels alphabetically
const TO_SELECT_ORDERED = Object.entries(TO_SELECT).sort(([keyA], [keyB]) =>
  DATA_LABELS[keyA as keyof typeof TO_SELECT] <
  DATA_LABELS[keyB as keyof typeof TO_SELECT]
    ? -1
    : 1,
);

export default async function Databases() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableRefresh: true,
    },
  });

  const sources = await Promise.all(
    TO_SELECT_ORDERED.map(([, val]) =>
      db
        .select(select)
        .from(biblInInvest)
        .innerJoin(val.from, eq(val.biblCol, biblInInvest.biblId))
        .where(!session ? eq(biblInInvest.biblIsRestricted, false) : undefined),
    ),
  );

  return (
    <>
      <Header />
      <main className="px-4 pt-[53px]">
        <div className="mx-auto max-w-7xl space-y-8 pb-4 pt-12">
          <h1 className="text-2xl font-semibold text-neutral-50">
            Data Sources
          </h1>
          {TO_SELECT_ORDERED.map(([key], index) => {
            return (
              <div key={key} className="rounded-2xl bg-neutral-950 p-4">
                <span className="mb-4 block text-neutral-50">
                  {DATA_LABELS[key as keyof typeof TO_SELECT]}
                </span>
                <ul className="space-y-2">
                  {sources[index].map((pub) => {
                    return (
                      <li
                        key={pub.id}
                        className="relative block rounded-lg border border-neutral-800 bg-neutral-800/70 p-4 text-neutral-300 transition hover:border-neutral-600"
                      >
                        <p className="mb-4 text-sm text-neutral-400">
                          {pub.journal}
                          {pub.journal && pub.year && " · "}
                          {pub.year}
                          {pub.year && pub.doi && " · "}
                          {pub.doi}
                        </p>
                        {pub.url || pub.doi ? (
                          <Link
                            href={
                              pub.url ? pub.url : `https://doi.org/${pub.doi}`
                            }
                            target="_blank"
                            className="text-lg font-medium text-neutral-50"
                          >
                            <span className="absolute inset-0 rounded-lg"></span>
                            {pub.title}
                          </Link>
                        ) : (
                          <h3 className="text-lg font-medium text-neutral-50">
                            {pub.title}
                          </h3>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
