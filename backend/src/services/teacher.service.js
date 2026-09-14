import crypto from "node:crypto";
import { AppError } from "../utils/errors.js";
import { hashPassword } from "../utils/password.js";
import * as repository from "../repositories/teacher.repository.js";
import { resetUserPassword } from "../repositories/user.repository.js";
import XLSX from "xlsx";

const emailName = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");

export async function createTeacher({
  schoolId,
  schoolDomain,
  fullName,
  email,
}) {
  const teacherEmail =
    email?.trim().toLowerCase() ??
    `guru.${emailName(fullName)}@${schoolDomain}`;
  const password = "Guru@123";
  const teacher = await repository.createTeacher({
    schoolId,
    fullName,
    email: teacherEmail,
    passwordHash: await hashPassword(password),
  });
  return { teacher, credential: { email: teacherEmail, password } };
}

export async function listTeachers(schoolId, query = {}) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
  const result = await repository.listTeachers({
    schoolId,
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

export async function getTeacherDetail(teacherId, schoolId) {
  const result = await repository.getTeacherDetail(teacherId, schoolId);
  if (!result)
    throw new AppError("Teacher not found", "TEACHER_NOT_FOUND", 404);
  return result;
}

export async function removeAssignment(data) {
  if (!(await repository.removeAssignment(data)))
    throw new AppError("Assignment not found", "ASSIGNMENT_NOT_FOUND", 404);
  return { removed: true };
}

export async function assignTeacher(data) {
  if (!(await repository.assignTeacher(data)))
    throw new AppError(
      "Teacher or class not found in this school",
      "RESOURCE_NOT_FOUND",
      404,
    );
  return { teacherId: data.teacherId, classId: data.classId };
}

export async function resetTeacherPassword({
  teacherId,
  schoolId,
  actorUserId,
}) {
  const password = "Guru@123";
  const teacher = await resetUserPassword({
    userId: teacherId,
    role: "TEACHER",
    schoolId,
    passwordHash: await hashPassword(password),
    actorUserId,
    action: "TEACHER_PASSWORD_RESET",
  });
  if (!teacher)
    throw new AppError("Teacher not found", "TEACHER_NOT_FOUND", 404);
  return { email: teacher.email, password };
}

export async function importTeachers({
  buffer,
  schoolId,
  schoolDomain,
  actorUserId,
}) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet)
    throw new AppError("Workbook has no sheet", "IMPORT_INVALID", 400);
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length)
    throw new AppError("Workbook is empty", "IMPORT_EMPTY", 400);
  const normalized = rows.map((row) => {
    const fullName = String(row["Nama Lengkap"] ?? row.fullName ?? "").trim();
    const providedEmail = String(row.Email ?? row.email ?? "")
      .trim()
      .toLowerCase();
    if (!fullName)
      throw new AppError("Nama Lengkap is required", "IMPORT_INVALID", 400);
    return {
      fullName,
      email: providedEmail || `guru.${emailName(fullName)}@${schoolDomain}`,
    };
  });
  const emails = normalized.map((teacher) => teacher.email);
  if (new Set(emails).size !== emails.length)
    throw new AppError(
      "Duplicate email in import file",
      "TEACHER_DUPLICATE",
      409,
    );
  const created = await repository.importTeachers({
    schoolId,
    actorUserId,
    teachers: await Promise.all(
      normalized.map(async (teacher) => ({
        ...teacher,
        passwordHash: await hashPassword("Guru@123"),
      })),
    ),
  });
  return {
    count: created.length,
    teachers: created,
    defaultPassword: "Guru@123",
  };
}
