import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(
  currentDirectory,
  "../../database/migrations/001_initial_schema.sql",
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
  const migration = await fs.readFile(migrationPath, "utf8");
  await connection.query(migration);
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
