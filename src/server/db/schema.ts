import { relations } from "drizzle-orm";
import {
  doublePrecision,
  foreignKey,
  geometry,
  integer,
  pgSchema,
  smallint,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const invest = pgSchema("invest");

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
    fltSegName: varchar("flt_seg_name"),
    fltType: varchar("flt_type"),
    fltLen: doublePrecision("flt_len"),
    fltSliprate: doublePrecision("flt_sliprate"),
    fltSs: doublePrecision("flt_ss"),
    fltVertSep: doublePrecision("flt_vert_sep"),
    fltHorzSep: doublePrecision("flt_horz_sep"),
    fltDip: doublePrecision("flt_dip"),
    fltRake: doublePrecision("flt_rake"),
    fltLockDepth: doublePrecision("flt_lock_depth"),
    fltGeom: geometry("flt_geom").notNull(),
    fltMaxm: doublePrecision("flt_maxm"),
    fltCmt: varchar("flt_cmt"),
    fltSrcId: integer("flt_src_id"),
    fltLoaddate: timestamp("flt_loaddate", { mode: "date" })
      .defaultNow()
      .notNull(),
    ccLoadId: smallint("cc_load_id").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "flt_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.fltSrcId],
      foreignColumns: [biblInInvest.biblId],
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
    seisMb: doublePrecision("seis_mb"),
    seisMs: doublePrecision("seis_ms"),
    seisDate: timestamp("seis_date", { mode: "date" }),
    seisLoaddate: timestamp("seis_loaddate", { mode: "date" })
      .defaultNow()
      .notNull(),
    seisCatId: integer("seis_cat_id"),
    ccLoadId: smallint("cc_load_id").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "seis_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.seisCatId],
      foreignColumns: [biblInInvest.biblId],
      name: "seis_seis_cat_id_fkey",
    }),
  ],
);

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
    ccLoadId: smallint("cc_load_id").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "smt_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.smtSrcId],
      foreignColumns: [biblInInvest.biblId],
      name: "smt_smt_src_id_fkey",
    }),
  ],
);

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

export const biblInInvest = invest.table(
  "bibl",
  {
    biblId: integer("bibl_id").primaryKey().generatedAlwaysAsIdentity({
      name: "invest.bibl_bibl_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    biblAuth: varchar("bibl_auth"),
    biblYr: varchar("bibl_yr", { length: 4 }),
    biblTitle: varchar("bibl_title"),
    biblJourn: varchar("bibl_journ"),
    biblDoi: varchar("bibl_doi"),
    biblUrl: varchar("bibl_url"),
    biblLoaddate: timestamp("bibl_loaddate", { mode: "date" }).defaultNow(),
    ccLoadId: smallint("cc_load_id").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "bibl_cc_load_id_fkey",
    }),
  ],
);

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
    vlcLon: doublePrecision("vlc_lon").notNull(),
    vlcLat: doublePrecision("vlc_lat").notNull(),
    vlcGeom: geometry("vlc_geom"),
    vlcElev: doublePrecision("vlc_elev"),
    vlcClass: varchar("vlc_class"),
    vlcLoaddate: timestamp("vlc_loaddate", { mode: "date" })
      .defaultNow()
      .notNull(),
    vlcCatSrc: varchar("vlc_cat_src"),
    countryId: integer("country_id"),
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
      columns: [table.countryId],
      foreignColumns: [countryInInvest.countryId],
      name: "vlc_country_id_fkey",
    }),
    foreignKey({
      columns: [table.vlcSrcId],
      foreignColumns: [biblInInvest.biblId],
      name: "vlc_vlc_src_id_fkey",
    }),
  ],
);

export const fltInInvestRelations = relations(fltInInvest, ({ one }) => ({
  ccInInvest: one(ccInInvest, {
    fields: [fltInInvest.ccLoadId],
    references: [ccInInvest.ccId],
  }),
  biblInInvest: one(biblInInvest, {
    fields: [fltInInvest.fltSrcId],
    references: [biblInInvest.biblId],
  }),
}));

export const ccInInvestRelations = relations(ccInInvest, ({ many }) => ({
  fltInInvests: many(fltInInvest),
  gnssStnInInvests: many(gnssStnInInvest),
  seisInInvests: many(seisInInvest),
  smtInInvests: many(smtInInvest),
  biblInInvests: many(biblInInvest),
  vlcInInvests: many(vlcInInvest),
}));

export const biblInInvestRelations = relations(
  biblInInvest,
  ({ one, many }) => ({
    fltInInvests: many(fltInInvest),
    seisInInvests: many(seisInInvest),
    smtInInvests: many(smtInInvest),
    ccInInvest: one(ccInInvest, {
      fields: [biblInInvest.ccLoadId],
      references: [ccInInvest.ccId],
    }),
    vlcInInvests: many(vlcInInvest),
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

export const countryInInvestRelations = relations(
  countryInInvest,
  ({ many }) => ({
    gnssStnInInvests: many(gnssStnInInvest),
    vlcInInvests: many(vlcInInvest),
  }),
);

export const stnTypeInInvestRelations = relations(
  stnTypeInInvest,
  ({ many }) => ({
    gnssStnInInvests: many(gnssStnInInvest),
  }),
);

export const seisInInvestRelations = relations(seisInInvest, ({ one }) => ({
  ccInInvest: one(ccInInvest, {
    fields: [seisInInvest.ccLoadId],
    references: [ccInInvest.ccId],
  }),
  biblInInvest: one(biblInInvest, {
    fields: [seisInInvest.seisCatId],
    references: [biblInInvest.biblId],
  }),
}));

export const smtInInvestRelations = relations(smtInInvest, ({ one }) => ({
  ccInInvest: one(ccInInvest, {
    fields: [smtInInvest.ccLoadId],
    references: [ccInInvest.ccId],
  }),
  biblInInvest: one(biblInInvest, {
    fields: [smtInInvest.smtSrcId],
    references: [biblInInvest.biblId],
  }),
}));

export const vlcInInvestRelations = relations(vlcInInvest, ({ one }) => ({
  ccInInvest: one(ccInInvest, {
    fields: [vlcInInvest.ccLoadId],
    references: [ccInInvest.ccId],
  }),
  countryInInvest: one(countryInInvest, {
    fields: [vlcInInvest.countryId],
    references: [countryInInvest.countryId],
  }),
  biblInInvest: one(biblInInvest, {
    fields: [vlcInInvest.vlcSrcId],
    references: [biblInInvest.biblId],
  }),
}));
