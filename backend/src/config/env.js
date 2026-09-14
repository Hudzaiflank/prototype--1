import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? "phillyogo_refresh",
  retentionDays: Number(process.env.RETENTION_DAYS ?? 30),
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
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
