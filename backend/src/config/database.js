import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";
import { env } from "./env.js";

let activePool;
let configuredConnectionString;
const metrics = {
  queryCount: 0,
  totalQueryMs: 0,
  slowQueryCount: 0,
  connectionWaitCount: 0,
  totalConnectionWaitMs: 0,
};
const aivenCa = readFileSync(new URL("../../aiven-ca.pem", import.meta.url), "utf8");

function recordQuery(startedAt, sql) {
  const durationMs = Date.now() - startedAt;
  metrics.queryCount += 1;
  metrics.totalQueryMs += durationMs;
  if (durationMs >= env.database.slowQueryMs) {
    metrics.slowQueryCount += 1;
    console.warn("[slow-query]", {
      durationMs,
      sql: String(sql).replace(/\s+/g, " ").slice(0, 240),
    });
  }
}

async function executeTimed(executor, sql, values) {
  const startedAt = Date.now();
  try {
    return await executor(sql, values);
  } finally {
    recordQuery(startedAt, sql);
  }
}

function createConnectionPool(connectionString) {
  const useTextProtocol = Boolean(connectionString);
  const pool = connectionString
    ? mysql.createPool(connectionString)
    : mysql.createPool({
        host: env.database.host,
        port: env.database.port,
        database: env.database.name,
        user: env.database.user,
        password: env.database.password,
        ...(env.database.ssl
          ? {
              ssl: env.database.sslCa
                ? { ca: env.database.sslCa }
                : { ca: aivenCa },
            }
          : {}),
        waitForConnections: true,
        connectionLimit: env.database.connectionLimit,
      });

  return {
    execute: (sql, values) =>
      executeTimed(
        useTextProtocol
          ? pool.query.bind(pool)
          : pool.execute.bind(pool),
        sql,
        values,
      ),
    query: (sql, values) =>
      executeTimed(pool.query.bind(pool), sql, values),
    getConnection: async () => {
      const waitStartedAt = Date.now();
      const connection = await pool.getConnection();
      metrics.connectionWaitCount += 1;
      metrics.totalConnectionWaitMs += Date.now() - waitStartedAt;
      return {
        execute: (sql, values) =>
          executeTimed(
            useTextProtocol
              ? connection.query.bind(connection)
              : connection.execute.bind(connection),
            sql,
            values,
          ),
        query: (sql, values) =>
          executeTimed(connection.query.bind(connection), sql, values),
        beginTransaction: (...args) => connection.beginTransaction(...args),
        commit: (...args) => connection.commit(...args),
        rollback: (...args) => connection.rollback(...args),
        release: () => connection.release(),
      };
    },
    end: (...args) => pool.end(...args),
  };
}

function getPool() {
  activePool ??= createConnectionPool(configuredConnectionString);
  return activePool;
}

export function configureDatabase(connectionString) {
  if (!connectionString) throw new Error("Database connection string is required");
  if (configuredConnectionString && configuredConnectionString !== connectionString)
    throw new Error("Database connection was already configured differently");
  if (activePool && !configuredConnectionString)
    throw new Error("Database pool was initialized before cloud configuration");
  configuredConnectionString = connectionString;
}

export function getDatabaseMetrics() {
  return { ...metrics };
}

export const pool = {
  execute: (...args) => getPool().execute(...args),
  query: (...args) => getPool().query(...args),
  getConnection: (...args) => getPool().getConnection(...args),
  end: (...args) => getPool().end(...args),
};
