import { relations } from "drizzle-orm";
import {
  doublePrecision,
  foreignKey,
  geometry,
  integer,
  pgSchema,
  smallint,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const invest = pgSchema("invest");

export const countryInInvest = invest.table("country", {
  countryId: integer("country_id").primaryKey().generatedAlwaysAsIdentity({
    name: "invest.country_country_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  countryCode: varchar("country_code", { length: 3 }).notNull(),
  countryName: varchar("country_name").notNull(),
  countryGeom: geometry("country_geom"),
});

export const fltSrcInInvest = invest.table("flt_src", {
  fltSrcId: integer("flt_src_id").primaryKey().generatedAlwaysAsIdentity({
    name: "invest.flt_src_flt_src_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  fltSrc: varchar("flt_src").notNull(),
  fltSrcDesc: varchar("flt_src_desc"),
  fltSrcLink: varchar("flt_src_link"),
});

export const ccInInvest = invest.table("cc", {
  ccId: smallint("cc_id").primaryKey().generatedAlwaysAsIdentity({
    name: "invest.cc_cc_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 32767,
    cache: 1,
  }),
  ccFname: varchar("cc_fname"),
  ccLname: varchar("cc_lname"),
  ccAdd: varchar("cc_add"),
});

export const seisInInvest = invest.table(
  "seis",
  {
    seisId: integer("seis_id").primaryKey().generatedAlwaysAsIdentity({
      name: "invest.seis_seis_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    seisLon: doublePrecision("seis_lon").notNull(),
    seisLat: doublePrecision("seis_lat").notNull(),
    seisGeom: geometry("seis_geom"),
    seisDepth: doublePrecision("seis_depth"),
    seisMw: doublePrecision("seis_mw"),
    seisMs: doublePrecision("seis_ms"),
    seisMb: doublePrecision("seis_mb"),
    seisDate: timestamp("seis_date", { mode: "date" }),
    seisLoaddate: timestamp("seis_loaddate", { mode: "date" })
      .defaultNow()
      .notNull(),
    seisCatId: integer("seis_cat_id"),
    countryId1: integer("country_id1"),
    countryId2: integer("country_id2"),
    ccIdLoad: smallint("cc_id_load").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccIdLoad],
      foreignColumns: [countryInInvest.countryId],
      name: "seis_cc_id_load_fkey",
    }),
    foreignKey({
      columns: [table.countryId1],
      foreignColumns: [countryInInvest.countryId],
      name: "seis_country_id1_fkey",
    }),
    foreignKey({
      columns: [table.countryId2],
      foreignColumns: [countryInInvest.countryId],
      name: "seis_country_id2_fkey",
    }),
    foreignKey({
      columns: [table.seisCatId],
      foreignColumns: [seisCatInInvest.seisCatId],
      name: "seis_seis_cat_id_fkey",
    }),
  ],
);

export const seisCatInInvest = invest.table("seis_cat", {
  seisCatId: integer("seis_cat_id").primaryKey().generatedAlwaysAsIdentity({
    name: "invest.seis_cat_seis_cat_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  seisCatName: varchar("seis_cat_name").notNull(),
  seisCatDesc: varchar("seis_cat_desc"),
  seisCatLink: varchar("seis_cat_link"),
});

export const vlcInInvest = invest.table(
  "vlc",
  {
    vlcId: integer("vlc_id").primaryKey().generatedAlwaysAsIdentity({
      name: "invest.vlc_vlc_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    vlcName: varchar("vlc_name"),
    vlcLat: doublePrecision("vlc_lat").notNull(),
    vlcLon: doublePrecision("vlc_lon").notNull(),
    vlcGeom: geometry("vlc_geom"),
    vlcElev: doublePrecision("vlc_elev"),
    vlcClass: varchar("vlc_class"),
    vlcLoaddate: timestamp("vlc_loaddate", { mode: "date" })
      .defaultNow()
      .notNull(),
    vlcCatSrc: varchar("vlc_cat_src"),
    countryId1: integer("country_id1"),
    countryId2: integer("country_id2"),
    vlcSrcId: integer("vlc_src_id"),
    ccLoadId: smallint("cc_load_id").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "vlc_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.countryId1],
      foreignColumns: [countryInInvest.countryId],
      name: "vlc_country_id1_fkey",
    }),
    foreignKey({
      columns: [table.countryId2],
      foreignColumns: [countryInInvest.countryId],
      name: "vlc_country_id2_fkey",
    }),
    foreignKey({
      columns: [table.vlcSrcId],
      foreignColumns: [vlcSrcInInvest.vlcSrcId],
      name: "vlc_vlc_src_id_fkey",
    }),
  ],
);

export const smtSrcInInvest = invest.table("smt_src", {
  smtSrcId: integer("smt_src_id").primaryKey().generatedAlwaysAsIdentity({
    name: "invest.smt_src_smt_src_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  smtSrcName: varchar("smt_src_name").notNull(),
  smtSrcDesc: varchar("smt_src_desc"),
  smtSrcLink: varchar("smt_src_link"),
});

export const vlcSrcInInvest = invest.table("vlc_src", {
  vlcSrcId: integer("vlc_src_id").primaryKey().generatedAlwaysAsIdentity({
    name: "invest.vlc_src_vlc_src_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  vlcSrcName: varchar("vlc_src_name").notNull(),
  vlcSrcDesc: varchar("vlc_src_desc"),
  vlcSrcLink: varchar("vlc_src_link"),
});

export const fltInInvest = invest.table(
  "flt",
  {
    fltId: integer("flt_id").primaryKey().generatedAlwaysAsIdentity({
      name: "invest.flt_flt_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    fltName: varchar("flt_name"),
    fltType: varchar("flt_type"),
    fltLen: doublePrecision("flt_len"),
    fltSliprate: doublePrecision("flt_sliprate"),
    fltLockDepth: doublePrecision("flt_lock_depth"),
    fltGeom: geometry("flt_geom").notNull(),
    fltSrcId: integer("flt_src_id"),
    fltLoaddate: time("flt_loaddate").defaultNow().notNull(),
    fltCountryId1: integer("flt_country_id1"),
    fltCountryId2: integer("flt_country_id2"),
    ccLoadId: smallint("cc_load_id").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "flt_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.fltCountryId1],
      foreignColumns: [countryInInvest.countryId],
      name: "flt_flt_country_id1_fkey",
    }),
    foreignKey({
      columns: [table.fltCountryId2],
      foreignColumns: [countryInInvest.countryId],
      name: "flt_flt_country_id2_fkey",
    }),
    foreignKey({
      columns: [table.fltSrcId],
      foreignColumns: [fltSrcInInvest.fltSrcId],
      name: "flt_flt_src_id_fkey",
    }),
  ],
);

export const gnssStnInInvest = invest.table(
  "gnss_stn",
  {
    gnssId: integer("gnss_id").primaryKey().generatedAlwaysAsIdentity({
      name: "invest.gnss_stn_gnss_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    gnssName: varchar("gnss_name").notNull(),
    gnssLon: doublePrecision("gnss_lon").notNull(),
    gnssLat: doublePrecision("gnss_lat").notNull(),
    gnssGeom: geometry("gnss_geom"),
    gnssElev: doublePrecision("gnss_elev"),
    gnssProj: varchar("gnss_proj"),
    gnssInstDate: timestamp("gnss_inst_date", { mode: "date" }),
    gnssDecomDate: timestamp("gnss_decom_date", { mode: "date" }),
    gnssLoaddate: timestamp("gnss_loaddate", { mode: "date" }).defaultNow(),
    gnssCmt: varchar("gnss_cmt"),
    stnTypeId: integer("stn_type_id"),
    countryId: integer("country_id").notNull(),
    ccLoadId: smallint("cc_load_id").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "gnss_stn_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.countryId],
      foreignColumns: [countryInInvest.countryId],
      name: "gnss_stn_country_id_fkey",
    }),
    foreignKey({
      columns: [table.stnTypeId],
      foreignColumns: [stnTypeInInvest.stnTypeId],
      name: "gnss_stn_stn_type_id_fkey",
    }),
  ],
);

export const stnTypeInInvest = invest.table("stn_type", {
  stnTypeId: integer("stn_type_id").primaryKey().generatedAlwaysAsIdentity({
    name: "invest.stn_type_stn_type_id_seq",
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  stnTypeName: varchar("stn_type_name").notNull(),
  stnDesc: varchar("stn_desc"),
});

export const smtInInvest = invest.table(
  "smt",
  {
    smtId: integer("smt_id").primaryKey().generatedAlwaysAsIdentity({
      name: "invest.smt_smt_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    smtName: varchar("smt_name"),
    smtLon: doublePrecision("smt_lon").notNull(),
    smtLat: doublePrecision("smt_lat").notNull(),
    smtGeom: geometry("smt_geom"),
    smtBase: doublePrecision("smt_base"),
    smtSummit: doublePrecision("smt_summit"),
    smtElev: doublePrecision("smt_elev"),
    smtBl: doublePrecision("smt_bl"),
    smtBw: doublePrecision("smt_bw"),
    smtBa: doublePrecision("smt_ba"),
    smtClass: varchar("smt_class"),
    smtLoaddate: timestamp("smt_loaddate", { mode: "date" })
      .defaultNow()
      .notNull(),
    smtSrcId: integer("smt_src_id"),
    countryId: integer("country_id"),
    ccLoadId: smallint("cc_load_id").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "smt_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.countryId],
      foreignColumns: [countryInInvest.countryId],
      name: "smt_country_id_fkey",
    }),
    foreignKey({
      columns: [table.smtSrcId],
      foreignColumns: [smtSrcInInvest.smtSrcId],
      name: "smt_smt_src_id_fkey",
    }),
  ],
);

export const seisInInvestRelations = relations(seisInInvest, ({ one }) => ({
  countryInInvest_ccIdLoad: one(countryInInvest, {
    fields: [seisInInvest.ccIdLoad],
    references: [countryInInvest.countryId],
    relationName: "seisInInvest_ccIdLoad_countryInInvest_countryId",
  }),
  countryInInvest_countryId1: one(countryInInvest, {
    fields: [seisInInvest.countryId1],
    references: [countryInInvest.countryId],
    relationName: "seisInInvest_countryId1_countryInInvest_countryId",
  }),
  countryInInvest_countryId2: one(countryInInvest, {
    fields: [seisInInvest.countryId2],
    references: [countryInInvest.countryId],
    relationName: "seisInInvest_countryId2_countryInInvest_countryId",
  }),
  seisCatInInvest: one(seisCatInInvest, {
    fields: [seisInInvest.seisCatId],
    references: [seisCatInInvest.seisCatId],
  }),
}));

export const countryInInvestRelations = relations(
  countryInInvest,
  ({ many }) => ({
    seisInInvests_ccIdLoad: many(seisInInvest, {
      relationName: "seisInInvest_ccIdLoad_countryInInvest_countryId",
    }),
    seisInInvests_countryId1: many(seisInInvest, {
      relationName: "seisInInvest_countryId1_countryInInvest_countryId",
    }),
    seisInInvests_countryId2: many(seisInInvest, {
      relationName: "seisInInvest_countryId2_countryInInvest_countryId",
    }),
    vlcInInvests_countryId1: many(vlcInInvest, {
      relationName: "vlcInInvest_countryId1_countryInInvest_countryId",
    }),
    vlcInInvests_countryId2: many(vlcInInvest, {
      relationName: "vlcInInvest_countryId2_countryInInvest_countryId",
    }),
    fltInInvests_fltCountryId1: many(fltInInvest, {
      relationName: "fltInInvest_fltCountryId1_countryInInvest_countryId",
    }),
    fltInInvests_fltCountryId2: many(fltInInvest, {
      relationName: "fltInInvest_fltCountryId2_countryInInvest_countryId",
    }),
    gnssStnInInvests: many(gnssStnInInvest),
    smtInInvests: many(smtInInvest),
  }),
);

export const seisCatInInvestRelations = relations(
  seisCatInInvest,
  ({ many }) => ({
    seisInInvests: many(seisInInvest),
  }),
);

export const vlcInInvestRelations = relations(vlcInInvest, ({ one }) => ({
  ccInInvest: one(ccInInvest, {
    fields: [vlcInInvest.ccLoadId],
    references: [ccInInvest.ccId],
  }),
  countryInInvest_countryId1: one(countryInInvest, {
    fields: [vlcInInvest.countryId1],
    references: [countryInInvest.countryId],
    relationName: "vlcInInvest_countryId1_countryInInvest_countryId",
  }),
  countryInInvest_countryId2: one(countryInInvest, {
    fields: [vlcInInvest.countryId2],
    references: [countryInInvest.countryId],
    relationName: "vlcInInvest_countryId2_countryInInvest_countryId",
  }),
  vlcSrcInInvest: one(vlcSrcInInvest, {
    fields: [vlcInInvest.vlcSrcId],
    references: [vlcSrcInInvest.vlcSrcId],
  }),
}));

export const ccInInvestRelations = relations(ccInInvest, ({ many }) => ({
  vlcInInvests: many(vlcInInvest),
  fltInInvests: many(fltInInvest),
  gnssStnInInvests: many(gnssStnInInvest),
  smtInInvests: many(smtInInvest),
}));

export const vlcSrcInInvestRelations = relations(
  vlcSrcInInvest,
  ({ many }) => ({
    vlcInInvests: many(vlcInInvest),
  }),
);

export const fltInInvestRelations = relations(fltInInvest, ({ one }) => ({
  ccInInvest: one(ccInInvest, {
    fields: [fltInInvest.ccLoadId],
    references: [ccInInvest.ccId],
  }),
  countryInInvest_fltCountryId1: one(countryInInvest, {
    fields: [fltInInvest.fltCountryId1],
    references: [countryInInvest.countryId],
    relationName: "fltInInvest_fltCountryId1_countryInInvest_countryId",
  }),
  countryInInvest_fltCountryId2: one(countryInInvest, {
    fields: [fltInInvest.fltCountryId2],
    references: [countryInInvest.countryId],
    relationName: "fltInInvest_fltCountryId2_countryInInvest_countryId",
  }),
  fltSrcInInvest: one(fltSrcInInvest, {
    fields: [fltInInvest.fltSrcId],
    references: [fltSrcInInvest.fltSrcId],
  }),
}));

export const fltSrcInInvestRelations = relations(
  fltSrcInInvest,
  ({ many }) => ({
    fltInInvests: many(fltInInvest),
  }),
);

export const gnssStnInInvestRelations = relations(
  gnssStnInInvest,
  ({ one }) => ({
    ccInInvest: one(ccInInvest, {
      fields: [gnssStnInInvest.ccLoadId],
      references: [ccInInvest.ccId],
    }),
    countryInInvest: one(countryInInvest, {
      fields: [gnssStnInInvest.countryId],
      references: [countryInInvest.countryId],
    }),
    stnTypeInInvest: one(stnTypeInInvest, {
      fields: [gnssStnInInvest.stnTypeId],
      references: [stnTypeInInvest.stnTypeId],
    }),
  }),
);

export const stnTypeInInvestRelations = relations(
  stnTypeInInvest,
  ({ many }) => ({
    gnssStnInInvests: many(gnssStnInInvest),
  }),
);

export const smtInInvestRelations = relations(smtInInvest, ({ one }) => ({
  ccInInvest: one(ccInInvest, {
    fields: [smtInInvest.ccLoadId],
    references: [ccInInvest.ccId],
  }),
  countryInInvest: one(countryInInvest, {
    fields: [smtInInvest.countryId],
    references: [countryInInvest.countryId],
  }),
  smtSrcInInvest: one(smtSrcInInvest, {
    fields: [smtInInvest.smtSrcId],
    references: [smtSrcInInvest.smtSrcId],
  }),
}));

export const smtSrcInInvestRelations = relations(
  smtSrcInInvest,
  ({ many }) => ({
    smtInInvests: many(smtInInvest),
  }),
);
