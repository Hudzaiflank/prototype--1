import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const adminEmail = `admin.${slugify(env.seed.sampleSchoolName)}@phillyogo.id`;

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const superAdminHash = await hashPassword(env.seed.superAdminPassword);
  await connection.execute(
    `INSERT INTO users (school_id, role, full_name, email, password_hash)
     VALUES (NULL, 'SUPER_ADMIN', 'Super Administrator', ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), status = 'ACTIVE'`,
    [env.seed.superAdminEmail, superAdminHash],
  );

  const schoolSlug = slugify(env.seed.sampleSchoolName);
  await connection.execute(
    `INSERT INTO schools (name, slug, domain)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE'`,
    [env.seed.sampleSchoolName, schoolSlug, env.seed.sampleSchoolDomain],
  );
  const [schools] = await connection.execute(
    "SELECT id FROM schools WHERE slug = ? LIMIT 1",
    [schoolSlug],
  );
  const schoolId = schools[0].id;
  const adminHash = await hashPassword(env.seed.sampleSchoolAdminPassword);
  await connection.execute(
    `INSERT INTO users (school_id, role, full_name, email, password_hash)
     VALUES (?, 'ADMIN', ?, ?, ?)
     ON DUPLICATE KEY UPDATE school_id = VALUES(school_id), password_hash = VALUES(password_hash), status = 'ACTIVE'`,
    [schoolId, `Admin ${env.seed.sampleSchoolName}`, adminEmail, adminHash],
  );
  await connection.commit();
  console.log(`Seed completed. Sample admin: ${adminEmail}`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
  await pool.end();
}
