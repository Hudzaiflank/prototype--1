if (!globalThis.WebSocketPair) await import("dotenv/config");

const DEFAULT_FRONTEND_URLS = [
  "http://localhost:5173",
  "https://prototype--1.pages.dev",
  "https://phillyogo-frontend.pages.dev",
  "https://piscall.com",
  "https://www.piscall.com",
];

function parseFrontendUrls(value) {
  return [
    ...new Set(
      (value ?? "")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => url.replace(/\/+$/, "")),
    ),
  ];
}

const configuredFrontendUrls = parseFrontendUrls(
  process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL,
);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  frontendUrls: [...new Set([...DEFAULT_FRONTEND_URLS, ...configuredFrontendUrls])],
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? "phillyogo_refresh",
  retentionDays: Number(process.env.RETENTION_DAYS ?? 30),
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true",
    sslCa: process.env.DB_SSL_CA?.replace(/\\n/g, "\n"),
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
    slowQueryMs: Number(process.env.DB_SLOW_QUERY_MS ?? 500),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "2h",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
  },
  seed: {
    superAdminEmail:
      process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@gmail.com",
    superAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD ?? "Bismillah",
    sampleSchoolName: process.env.SEED_SCHOOL_NAME ?? "SMA Negeri 4 Bandung",
    sampleSchoolDomain: process.env.SEED_SCHOOL_DOMAIN ?? "sman4bandung.co.id",
    sampleSchoolAdminPassword:
      process.env.SEED_SCHOOL_ADMIN_PASSWORD ?? "SMA4@2026",
  },
};
