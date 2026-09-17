import { pool } from "../config/database.js";

const shouldReset = process.argv.includes("--yes");
const showHelp = process.argv.includes("--help") || process.argv.includes("-h");

if (showHelp) {
  console.log("Usage: npm run db:reset-operational -- --yes");
  console.log("Deletes operational data while preserving schools and user accounts.");
  process.exit(0);
}

if (!shouldReset) {
  console.error("Reset dibatalkan. Jalankan dengan flag --yes jika memang yakin:");
  console.error("npm run db:reset-operational -- --yes");
  process.exit(1);
}

const tables = [
  "game_turns",
  "assignments",
  "group_members",
  "groups",
  "student_problems",
  "problems",
  "participants",
  "game_sessions",
  "rooms",
  "teacher_classes",
  "class_enrollments",
  "classes",
  "students",
  "topics",
];

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const counts = [];

  for (const table of tables) {
    const [rows] = await connection.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
    counts.push({ table, total: Number(rows[0].total) });
    await connection.query(`DELETE FROM \`${table}\``);
  }

  await connection.commit();
  console.log("Operational data reset completed.");
  for (const { table, total } of counts) console.log(`- ${table}: ${total} deleted`);
  console.log("Preserved: schools, users, refresh tokens, audit logs, and schema.");
} catch (error) {
  await connection.rollback();
  console.error("Operational data reset failed:", error.message);
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
