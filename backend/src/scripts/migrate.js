import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationDirectory = path.resolve(
  currentDirectory,
  "../../database/migrations",
);

const connection = await mysql.createConnection({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  multipleStatements: true,
});

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.database.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.query(`USE \`${env.database.name}\``);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  const migrationFiles = (await fs.readdir(migrationDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const filename of migrationFiles) {
    const [applied] = await connection.query(
      "SELECT filename FROM schema_migrations WHERE filename = ?",
      [filename],
    );
    if (applied.length) continue;
    const migration = await fs.readFile(
      path.join(migrationDirectory, filename),
      "utf8",
    );
    await connection.query(migration);
    await connection.query(
      "INSERT INTO schema_migrations (filename) VALUES (?)",
      [filename],
    );
  }
  try {
    await connection.query(
      "ALTER TABLE game_sessions ADD COLUMN state_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER status",
    );
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") throw error;
  }
  await connection.query(
    "ALTER TABLE game_sessions MODIFY COLUMN room_id BIGINT UNSIGNED NULL",
  );
  try {
    await connection.query(
      "ALTER TABLE game_sessions ADD COLUMN class_id BIGINT UNSIGNED NULL AFTER room_id",
    );
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") throw error;
  }
  const [constraints] = await connection.query(
    "SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema = ? AND table_name = 'users' AND constraint_name = 'chk_user_role_school'",
    [env.database.name],
  );
  if (!constraints.length)
    await connection.query(
      "ALTER TABLE users ADD CONSTRAINT chk_user_role_school CHECK ((role = 'SUPER_ADMIN' AND school_id IS NULL) OR (role IN ('ADMIN', 'TEACHER') AND school_id IS NOT NULL))",
    );
  console.log(`Database migration completed for ${env.database.name}`);
} finally {
  await connection.end();
}
