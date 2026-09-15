import crypto from "node:crypto";
import { AppError } from "../utils/errors.js";
import { hashPassword } from "../utils/password.js";
import {
  createSchoolWithAdmin,
  findSchoolDetail,
  listSchools,
  updateSchoolStatus,
  deleteSchool,
} from "../repositories/school.repository.js";
import { resetUserPassword } from "../repositories/user.repository.js";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const temporaryPassword = () => `School@${crypto.randomInt(100000, 999999)}`;

export async function createSchool({ name, domain, actorUserId }) {
  const slug = slugify(name);
  const password = temporaryPassword();
  const school = await createSchoolWithAdmin({
    school: { name, slug, domain: domain.toLowerCase().trim() },
    admin: {
      actorUserId,
      email: `admin.${slug}@phillyogo.id`,
      fullName: `Admin ${name}`,
      passwordHash: await hashPassword(password),
    },
  });
  return {
    school,
    admin: { email: `admin.${slug}@phillyogo.id`, password },
  };
}

export async function getSchools(query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
  const result = await listSchools({
    offset: (page - 1) * limit,
    limit,
    search: query.search,
    status: query.status,
  });
  return {
    ...result,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  };
}

export async function getSchool(id) {
  const school = await findSchoolDetail(id);
  if (!school) throw new AppError("School not found", "SCHOOL_NOT_FOUND", 404);
  return school;
}

export async function setSchoolStatus(id, status) {
  if (!(await updateSchoolStatus(id, status)))
    throw new AppError("School not found", "SCHOOL_NOT_FOUND", 404);
  return getSchool(id);
}

export async function removeSchool(id) {
  if (!(await deleteSchool(id)))
    throw new AppError("School not found", "SCHOOL_NOT_FOUND", 404);
  return { deleted: true, id };
}

export async function resetAdminPassword(schoolId, actorUserId) {
  const password = temporaryPassword();
  const admin = await resetUserPassword({
    userId: null,
    role: "ADMIN",
    schoolId,
    passwordHash: await hashPassword(password),
    actorUserId,
    action: "ADMIN_PASSWORD_RESET",
  });
  if (admin) return { email: admin.email, password };
  throw new AppError("School admin not found", "ADMIN_NOT_FOUND", 404);
}
