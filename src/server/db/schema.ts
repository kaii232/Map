import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  foreignKey,
  geometry,
  index,
  integer,
  numeric,
  pgSchema,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const invest = pgSchema("invest");

export const slab2OgcFidSeqInInvest = invest.sequence("slab2_ogc_fid_seq", {
  startWith: "1",
  increment: "1",
  minValue: "1",
  maxValue: "2147483647",
  cache: "1",
  cycle: false,
});

export const slab2InInvest = invest.table(
  "slab2",
  {
    slabId: integer("slab_id").primaryKey().generatedByDefaultAsIdentity({
      name: "invest.slab2_slab_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    slabGeom: geometry("slab_geom", { type: "multilinestring", srid: 4326 }),
    slabDepth: numeric("slab_depth", { precision: 10, scale: 0 }),
    slabRegion: text("slab_region"),
    slabLayer: text("slab_layer"),
    slabCountryId: integer("slab_country_id"),
    ccLoadId: smallint("cc_load_id").default(1),
    slabSrcId: integer("slab_src_id"),
    slabLoaddate: timestamp("slab_loaddate", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("slab2_geom_geom_idx").using(
      "gist",
      table.slabGeom.asc().nullsLast().op("gist_geometry_ops_2d"),
    ),
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "slab2_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.slabCountryId],
      foreignColumns: [countryInInvest.countryId],
      name: "slab2_slab_country_id_fkey",
    }).onUpdate("cascade"),
    foreignKey({
      columns: [table.slabSrcId],
      foreignColumns: [biblInInvest.biblId],
      name: "slab2_slab_src_id_fkey",
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
    gnssName: text("gnss_name").notNull(),
    gnssLon: doublePrecision("gnss_lon").notNull(),
    gnssLat: doublePrecision("gnss_lat").notNull(),
    gnssGeom: geometry("gnss_geom"),
    gnssElev: doublePrecision("gnss_elev"),
    gnssProj: varchar("gnss_proj"),
    gnssInstDate: timestamp("gnss_inst_date", {
      withTimezone: true,
      mode: "string",
    }),
    gnssDecomDate: timestamp("gnss_decom_date", {
      withTimezone: true,
      mode: "string",
    }),
    gnssLoaddate: timestamp("gnss_loaddate", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
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

export const gnssVectorInInvest = invest.table(
  "gnss_vector",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    vectorId: bigint("vector_id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "invest.gnss_vector_vector_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    vectorGnssId: integer("vector_gnss_id"),
    vectorLoaddate: timestamp("vector_loaddate", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    vectorEasting: real("vector_easting"),
    vectorNorthing: real("vector_northing"),
    vectorVertical: real("vector_vertical"),
    vectorEastingUnc: real("vector_easting_unc"),
    vectorNorthingUnc: real("vector_northing_unc"),
    vectorVerticalUnc: real("vector_vertical_unc"),
    vectorCorr: real("vector_corr"),
    vectorTimePeriod: text("vector_time_period"),
    ccLoadId: smallint("cc_load_id").default(sql`'1'`),
    vectorBiblId: integer("vector_bibl_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "gnss_vector_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.vectorBiblId],
      foreignColumns: [biblInInvest.biblId],
      name: "gnss_vector_vector_bibl_id_fkey",
    }),
    foreignKey({
      columns: [table.vectorGnssId],
      foreignColumns: [gnssStnInInvest.gnssId],
      name: "gnss_vector_vector_gnss_id_fkey",
    }),
    unique("gnss_vector_vector_id_key").on(table.vectorId),
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
    smtLoaddate: timestamp("smt_loaddate", {
      withTimezone: true,
      mode: "string",
    })
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
    seisDate: timestamp("seis_date", { withTimezone: true, mode: "string" }),
    seisLoaddate: timestamp("seis_loaddate", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    seisCatId: integer("seis_cat_id"),
    ccLoadId: smallint("cc_load_id").default(1),
    seisMi: doublePrecision("seis_mi"),
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
    fltLoaddate: timestamp("flt_loaddate", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    ccLoadId: smallint("cc_load_id").default(1),
    fltDipDir: text("flt_dip_dir"),
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
    biblLoaddate: timestamp("bibl_loaddate", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    ccLoadId: smallint("cc_load_id").default(1),
    biblIssn: text("bibl_issn"),
    // TODO: failed to parse database type 'tsvector'
    // biblTsvector: unknown("bibl_tsvector").generatedAlwaysAs(sql`to_tsvector('english'::regconfig, (((COALESCE(bibl_auth, ''::character varying))::text || ' '::text) || (COALESCE(bibl_title, ''::character varying))::text))`),
    biblIsInvest: boolean("bibl_is_invest").default(false),
    biblIsRestricted: boolean("bibl_is_restricted").default(false),
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
    vlcLoaddate: timestamp("vlc_loaddate", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    vlcCatSrc: varchar("vlc_cat_src"),
    countryId: integer("country_id"),
    vlcSrcId: integer("vlc_src_id"),
    ccLoadId: smallint("cc_load_id").default(1),
    gvpId: integer("gvp_id"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    vlcGvpNew: bigint("vlc_gvp_new", { mode: "number" }),
    vlcGvpUrl: text("vlc_gvp_url"),
    vlcWovodatUrl: text("vlc_wovodat_url"),
    vlcRegion: text("vlc_region"),
    vlcLandform: text("vlc_landform"),
    vlcLastEruption: text("vlc_last_eruption"),
    vlcSetting: text("vlc_setting"),
    vlcTimePeriod: text("vlc_time_period"),
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

export const account = invest.table("account", {
  id: text().primaryKey().notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    mode: "string",
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    mode: "string",
  }),
  scope: text(),
  password: text(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = invest.table(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [unique("session_token_unique").on(table.token)],
);

export const verification = invest.table("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const user = invest.table(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    role: text().default("user").notNull(),
  },
  (table) => [unique("user_email_unique").on(table.email)],
);

export const rockSampleInInvest = invest.table(
  "rock_sample",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    rockSampleId: bigint("rock_sample_id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity({
        name: "invest.rock_sample_rock_sample_id_seq",
        startWith: 1,
        increment: 1,
        minValue: 1,
        maxValue: 9223372036854775807,
        cache: 1,
      }),
    rockSrc: text("rock_src"),
    rockSampleName: text("rock_sample_name"),
    rockLoc: text("rock_loc"),
    rockElevMin: doublePrecision("rock_elev_min"),
    rockElevMax: doublePrecision("rock_elev_max"),
    rockSampTech: text("rock_samp_tech"),
    rockDepthMin: doublePrecision("rock_depth_min"),
    rockDepthMax: doublePrecision("rock_depth_max"),
    rockType: text("rock_type"),
    rockClass: text("rock_class"),
    rockTexture: text("rock_texture"),
    rockCmt: text("rock_cmt"),
    rockEruptionDate: text("rock_eruption_date"),
    rockAlteration: text("rock_alteration"),
    rockAlterationType: text("rock_alteration_type"),
    rockMaterial: text("rock_material"),
    rockMineral: text("rock_mineral"),
    rockCrystal: text("rock_crystal"),
    rockMineralGrain: text("rock_mineral_grain"),
    rockInclusionType: text("rock_inclusion_type"),
    rockLatMin: doublePrecision("rock_lat_min"),
    rockLonMin: doublePrecision("rock_lon_min"),
    rockLatMax: doublePrecision("rock_lat_max"),
    rockLonMax: doublePrecision("rock_lon_max"),
    rockGeom: geometry("rock_geom"),
    rockSio2Wt: text("rock_sio2_wt"),
    rockTio2Wt: text("rock_tio2_wt"),
    rockZro2Wt: text("rock_zro2_wt"),
    rockHfo2Wt: text("rock_hfo2_wt"),
    rockTho2Wt: text("rock_tho2_wt"),
    rockUo2Wt: text("rock_uo2_wt"),
    rockAl2O3Wt: text("rock_al2o3_wt"),
    rockCr2O3Wt: text("rock_cr2o3_wt"),
    rockSc2O3Wt: text("rock_sc2o3_wt"),
    rockLa2O3Wt: text("rock_la2o3_wt"),
    rockCe2O3Wt: text("rock_ce2o3_wt"),
    rockNd2O3Wt: text("rock_nd2o3_wt"),
    rockSm2O3Wt: text("rock_sm2o3_wt"),
    rockEu2O3Wt: text("rock_eu2o3_wt"),
    rockGd2O3Wt: text("rock_gd2o3_wt"),
    rockDy2O3Wt: text("rock_dy2o3_wt"),
    rockEr2O3Wt: text("rock_er2o3_wt"),
    rockYb2O3Wt: text("rock_yb2o3_wt"),
    rockY2O3Wt: text("rock_y2o3_wt"),
    rockV2O3Wt: text("rock_v2o3_wt"),
    rockV2O5Wt: text("rock_v2o5_wt"),
    rockNb2O5Wt: text("rock_nb2o5_wt"),
    rockTa2O5Wt: text("rock_ta2o5_wt"),
    rockPr2O3Wt: text("rock_pr2o3_wt"),
    rockWo3Wt: text("rock_wo3_wt"),
    rockFe2O3TWt: text("rock_fe2o3t_wt"),
    rockFe2O3Wt: text("rock_fe2o3_wt"),
    rockFeotWt: text("rock_feot_wt"),
    rockFeoWt: text("rock_feo_wt"),
    rockCaoWt: text("rock_cao_wt"),
    rockMgoWt: text("rock_mgo_wt"),
    rockMnoWt: text("rock_mno_wt"),
    rockMn3O4Wt: text("rock_mn3o4_wt"),
    rockBaoWt: text("rock_bao_wt"),
    rockSroWt: text("rock_sro_wt"),
    rockPboWt: text("rock_pbo_wt"),
    rockNioWt: text("rock_nio_wt"),
    rockZnoWt: text("rock_zno_wt"),
    rockCooWt: text("rock_coo_wt"),
    rockCuoWt: text("rock_cuo_wt"),
    rockK2OWt: text("rock_k2o_wt"),
    rockNa2OWt: text("rock_na2o_wt"),
    rockLi2OWt: text("rock_li2o_wt"),
    rockP2O5Wt: text("rock_p2o5_wt"),
    rockH2OWt: text("rock_h2o_wt"),
    rockH2OpWt: text("rock_h2op_wt"),
    rockH2OmWt: text("rock_h2om_wt"),
    rockCo2Wt: text("rock_co2_wt"),
    rockCWt: text("rock_c_wt"),
    rockFWt: text("rock_f_wt"),
    rockClWt: text("rock_cl_wt"),
    rockSo2Wt: text("rock_so2_wt"),
    rockSo3Wt: text("rock_so3_wt"),
    rockSWt: text("rock_s_wt"),
    rockTeWt: text("rock_te_wt"),
    rockLoiWt: text("rock_loi_wt"),
    rockFeWt: text("rock_fe_wt"),
    rockMnWt: text("rock_mn_wt"),
    rockKWt: text("rock_k_wt"),
    rockPWt: text("rock_p_wt"),
    rockCoWt: text("rock_co_wt"),
    rockHfWt: text("rock_hf_wt"),
    rockCuWt: text("rock_cu_wt"),
    rockNiWt: text("rock_ni_wt"),
    rockPbWt: text("rock_pb_wt"),
    rockSbWt: text("rock_sb_wt"),
    rockAsWt: text("rock_as_wt"),
    rockZnWt: text("rock_zn_wt"),
    rockAgWt: text("rock_ag_wt"),
    rockAuWt: text("rock_au_wt"),
    rockPtWt: text("rock_pt_wt"),
    rockPdWt: text("rock_pd_wt"),
    rockRhWt: text("rock_rh_wt"),
    rockBiWt: text("rock_bi_wt"),
    rockGeologicalAge: text("rock_geological_age"),
    rockAge: text("rock_age"),
    rockDatingMethod: text("rock_dating_method"),
    srcId: integer("src_id"),
    ccLoadId: smallint("cc_load_id").default(sql`'1'`),
    rockLoaddate: timestamp("rock_loaddate", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "rock_sample_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.srcId],
      foreignColumns: [biblInInvest.biblId],
      name: "rock_sample_src_id_fkey",
    }),
  ],
);

export const heatflowInInvest = invest.table(
  "heatflow",
  {
    hfId: integer("hf_id").primaryKey().generatedAlwaysAsIdentity({
      name: "invest.heatflow_hf_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    hfName: text("hf_name"),
    hfLon: doublePrecision("hf_lon").notNull(),
    hfLat: doublePrecision("hf_lat").notNull(),
    hfGeom: geometry("hf_geom"),
    hfElev: doublePrecision("hf_elev"),
    hfQval: doublePrecision("hf_qval"),
    hfQUnc: doublePrecision("hf_q_unc"),
    hfQc: doublePrecision("hf_qc"),
    hfQcUnc: doublePrecision("hf_qc_unc"),
    hfQMethod: text("hf_q_method"),
    hfQTop: doublePrecision("hf_q_top"),
    hfQBot: doublePrecision("hf_q_bot"),
    hfProbePen: doublePrecision("hf_probe_pen"),
    hfMeasuredDepth: doublePrecision("hf_measured_depth"),
    hfTrueDepth: doublePrecision("hf_true_depth"),
    hfExploMethod: text("hf_explo_method"),
    hfPurpose: text("hf_purpose"),
    hfCorrHpFlag: text("hf_corr_hp_flag"),
    hfYear: varchar("hf_year", { length: 4 }),
    hfEnv: text("hf_env"),
    hfRef: text("hf_ref"),
    hfCmt: text("hf_cmt"),
    hfLoaddate: timestamp("hf_loaddate", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    hfSrcId: smallint("hf_src_id"),
    ccLoadId: smallint("cc_load_id").default(1),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "heatflow_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.hfSrcId],
      foreignColumns: [biblInInvest.biblId],
      name: "heatflow_hf_src_id",
    }),
  ],
);

export const slipModelInInvest = invest.table(
  "slip_model",
  {
    modelId: integer("model_id").notNull(),
    patchId: integer("patch_id").notNull(),
    patchLat: doublePrecision("patch_lat"),
    patchLon: doublePrecision("patch_lon"),
    patchCorner1Lat: doublePrecision("patch_corner1_lat"),
    patchCorner1Lon: doublePrecision("patch_corner1_lon"),
    patchCorner2Lat: doublePrecision("patch_corner2_lat"),
    patchCorner2Lon: doublePrecision("patch_corner2_lon"),
    patchCorner3Lat: doublePrecision("patch_corner3_lat"),
    patchCorner3Lon: doublePrecision("patch_corner3_lon"),
    patchCorner4Lat: doublePrecision("patch_corner4_lat"),
    patchCorner4Lon: doublePrecision("patch_corner4_lon"),
    patchGeom: geometry("patch_geom"),
    patchDepth: doublePrecision("patch_depth"),
    patchLength: doublePrecision("patch_length"),
    patchWidth: doublePrecision("patch_width"),
    patchRake: doublePrecision("patch_rake"),
    patchStrike: doublePrecision("patch_strike"),
    patchDip: doublePrecision("patch_dip"),
    patchSlip: doublePrecision("patch_slip"),
    patchStrikeslip: doublePrecision("patch_strikeslip"),
    patchDipslip: doublePrecision("patch_dipslip"),
    patchTensileslip: doublePrecision("patch_tensileslip"),
    modelUploaddate: timestamp("model_uploaddate", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    modelSrcId: integer("model_src_id"),
    ccLoadId: smallint("cc_load_id").default(sql`'1'`),
    patchRakeslip: doublePrecision("patch_rakeslip"),
    patchCorner1Z: doublePrecision("patch_corner1_z"),
    patchCorner2Z: doublePrecision("patch_corner2_z"),
    patchCorner3Z: doublePrecision("patch_corner3_z"),
    patchCorner4Z: doublePrecision("patch_corner4_z"),
    modelEvent: text("model_event"),
    patchEastslip: doublePrecision("patch_eastslip"),
    patchNorthslip: doublePrecision("patch_northslip"),
  },
  (table) => [
    foreignKey({
      columns: [table.ccLoadId],
      foreignColumns: [ccInInvest.ccId],
      name: "slip_model_cc_load_id_fkey",
    }),
    foreignKey({
      columns: [table.modelSrcId],
      foreignColumns: [biblInInvest.biblId],
      name: "slip_model_model_src_id_fkey",
    }),
    primaryKey({
      columns: [table.modelId, table.patchId],
      name: "slip_model_pkey",
    }),
  ],
);

export const slab2InInvestRelations = relations(slab2InInvest, ({ one }) => ({
  ccInInvest: one(ccInInvest, {
    fields: [slab2InInvest.ccLoadId],
    references: [ccInInvest.ccId],
  }),
  countryInInvest: one(countryInInvest, {
    fields: [slab2InInvest.slabCountryId],
    references: [countryInInvest.countryId],
  }),
  biblInInvest: one(biblInInvest, {
    fields: [slab2InInvest.slabSrcId],
    references: [biblInInvest.biblId],
  }),
}));

export const ccInInvestRelations = relations(ccInInvest, ({ many }) => ({
  slab2InInvests: many(slab2InInvest),
  gnssStnInInvests: many(gnssStnInInvest),
  smtInInvests: many(smtInInvest),
  seisInInvests: many(seisInInvest),
  fltInInvests: many(fltInInvest),
  biblInInvests: many(biblInInvest),
  vlcInInvests: many(vlcInInvest),
  heatflowInInvests: many(heatflowInInvest),
  slipModelInInvests: many(slipModelInInvest),
}));

export const countryInInvestRelations = relations(
  countryInInvest,
  ({ many }) => ({
    slab2InInvests: many(slab2InInvest),
    gnssStnInInvests: many(gnssStnInInvest),
    vlcInInvests: many(vlcInInvest),
  }),
);

export const biblInInvestRelations = relations(
  biblInInvest,
  ({ one, many }) => ({
    slab2InInvests: many(slab2InInvest),
    smtInInvests: many(smtInInvest),
    seisInInvests: many(seisInInvest),
    fltInInvests: many(fltInInvest),
    ccInInvest: one(ccInInvest, {
      fields: [biblInInvest.ccLoadId],
      references: [ccInInvest.ccId],
    }),
    vlcInInvests: many(vlcInInvest),
    heatflowInInvests: many(heatflowInInvest),
    slipModelInInvests: many(slipModelInInvest),
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

export const gnssVectorInInvestRelations = relations(
  gnssVectorInInvest,
  ({ one }) => ({
    ccInInvest: one(ccInInvest, {
      fields: [gnssVectorInInvest.ccLoadId],
      references: [ccInInvest.ccId],
    }),
    biblInInvest: one(biblInInvest, {
      fields: [gnssVectorInInvest.vectorBiblId],
      references: [biblInInvest.biblId],
    }),
    gnssStnInInvest: one(gnssStnInInvest, {
      fields: [gnssVectorInInvest.vectorGnssId],
      references: [gnssStnInInvest.gnssId],
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
  biblInInvest: one(biblInInvest, {
    fields: [smtInInvest.smtSrcId],
    references: [biblInInvest.biblId],
  }),
}));

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

export const rockSampleInInvestRelations = relations(
  rockSampleInInvest,
  ({ one }) => ({
    ccInInvest: one(ccInInvest, {
      fields: [rockSampleInInvest.ccLoadId],
      references: [ccInInvest.ccId],
    }),
    biblInInvest: one(biblInInvest, {
      fields: [rockSampleInInvest.srcId],
      references: [biblInInvest.biblId],
    }),
  }),
);

export const heatflowInInvestRelations = relations(
  heatflowInInvest,
  ({ one }) => ({
    ccInInvest: one(ccInInvest, {
      fields: [heatflowInInvest.ccLoadId],
      references: [ccInInvest.ccId],
    }),
    biblInInvest: one(biblInInvest, {
      fields: [heatflowInInvest.hfSrcId],
      references: [biblInInvest.biblId],
    }),
  }),
);

export const slipModelInInvestRelations = relations(
  slipModelInInvest,
  ({ one }) => ({
    ccInInvest: one(ccInInvest, {
      fields: [slipModelInInvest.ccLoadId],
      references: [ccInInvest.ccId],
    }),
    biblInInvest: one(biblInInvest, {
      fields: [slipModelInInvest.modelSrcId],
      references: [biblInInvest.biblId],
    }),
  }),
);
