import mysql from "mysql2/promise";
import { env } from "./env.js";

let activePool;
let configuredConnectionString;

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
                : {},
            }
          : {}),
        waitForConnections: true,
        connectionLimit: env.database.connectionLimit,
      });

  return {
    execute: (sql, values) =>
      useTextProtocol ? pool.query(sql, values) : pool.execute(sql, values),
    query: (...args) => pool.query(...args),
    getConnection: async () => {
      const connection = await pool.getConnection();
      return {
        execute: (sql, values) =>
          useTextProtocol
            ? connection.query(sql, values)
            : connection.execute(sql, values),
        query: (...args) => connection.query(...args),
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

export const pool = {
  execute: (...args) => getPool().execute(...args),
  query: (...args) => getPool().query(...args),
  getConnection: (...args) => getPool().getConnection(...args),
  end: (...args) => getPool().end(...args),
};
