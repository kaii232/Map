import Header from "@/components/header";
import { db } from "@/server/db";
import { biblInInvest } from "@/server/db/schema";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { NextButton, PrevButton } from "./pagination";
import PapersSearch from "./papers-search";

const PAGE_SIZE = 20;

const HighlightSearch = ({
  query,
  text,
}: {
  query: string | undefined;
  text: string | null;
}) => {
  if (!query || !text) return text;
  const regex = new RegExp(
    `${query
      .split(/ +/g)
      .map((part) => {
        if (part) return `(${part})`;
        return "";
      })
      .join("|")}`,
    "gi",
  );
  const splitText = text.split(regex);
  return (
    <>
      {splitText.map((split, index) => {
        if (!split) return;
        if (regex.test(split.toLowerCase()) && split.length > 1)
          return (
            <mark
              key={index}
              className="rounded-sm bg-amber-300/30 text-inherit ring-2 ring-amber-300/30"
            >
              {split}
            </mark>
          );
        return <span key={index}>{split}</span>;
      })}
    </>
  );
};

export default async function Publications({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const { query, page } = await searchParams;

  const pageNum = Number.isNaN(Number(page)) ? 0 : Number(page);

  const searchVector = query
    ?.replaceAll(/[^A-Za-z0-9 &]/g, "")
    .replaceAll("&", " ")
    .trim()
    .replaceAll(/ +/g, ":* & ");

  const filter = searchVector
    ? sql`bibl_tsvector @@ to_tsquery('english', ${searchVector + ":*"})`
    : undefined;

  const publications = filter
    ? await db
        .select({
          id: biblInInvest.biblId,
          author: biblInInvest.biblAuth,
          year: biblInInvest.biblYr,
          title: biblInInvest.biblTitle,
          journal: biblInInvest.biblJourn,
          doi: biblInInvest.biblDoi,
          url: biblInInvest.biblUrl,
          rank: sql`ts_rank(bibl_tsvector, to_tsquery('english', ${searchVector + ":*"})) as rank`,
          count: sql`count(*) OVER()`.mapWith(Number),
        })
        .from(biblInInvest)
        .where(filter)
        .orderBy(sql`rank DESC NULLS LAST`)
        .offset(pageNum)
        .limit(PAGE_SIZE)
    : await db
        .select({
          id: biblInInvest.biblId,
          author: biblInInvest.biblAuth,
          year: biblInInvest.biblYr,
          title: biblInInvest.biblTitle,
          journal: biblInInvest.biblJourn,
          doi: biblInInvest.biblDoi,
          url: biblInInvest.biblUrl,
          count: sql`count(*) OVER()`.mapWith(Number),
        })
        .from(biblInInvest)
        .offset(pageNum)
        .limit(PAGE_SIZE);

  const hasNextPage =
    publications.length === PAGE_SIZE &&
    publications[0].count > pageNum * PAGE_SIZE + publications.length;
  const hasPrevPage = pageNum > 0;

  return (
    <>
      <Header />
      <main className="px-4">
        <div className="mx-auto max-w-7xl space-y-4 pb-4 pt-12">
          <h1 className="text-2xl font-semibold text-neutral-50">
            Publications
          </h1>
          <PapersSearch />
          <ul className="space-y-2">
            {publications.map((pub) => {
              const Comp = pub.url ? Link : "div";

              return (
                <li key={pub.id}>
                  <Comp
                    //@ts-expect-error If url is nullish Comp will be a div
                    href={pub.url ?? undefined}
                    target={pub.url ? "_blank" : undefined}
                    className="block rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-neutral-300 transition hover:border-neutral-600"
                  >
                    <div className="mb-4">
                      <p className="text-sm text-neutral-400">
                        {pub.journal}
                        {pub.journal && pub.year && " · "}
                        {pub.year}
                        {pub.year && pub.doi && " · "}
                        {pub.doi}
                      </p>
                      <h3 className="text-lg font-medium text-neutral-50">
                        {<HighlightSearch text={pub.title} query={query} />}
                      </h3>
                    </div>

                    <p>{<HighlightSearch text={pub.author} query={query} />}</p>
                  </Comp>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2 text-slate-300">
            <PrevButton hasPrevPage={hasPrevPage} pageNum={pageNum} />
            <NextButton hasNextPage={hasNextPage} pageNum={pageNum} />
          </div>
        </div>
      </main>
    </>
  );
}
