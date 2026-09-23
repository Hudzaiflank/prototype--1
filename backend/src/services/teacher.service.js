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

const normalizeSchoolDomain = (domain, schoolName) => {
  const normalized = String(domain ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/@/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
  if (normalized) return normalized;

  const schoolSlug = String(schoolName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return schoolSlug ? `${schoolSlug}.phillyogo.id` : "phillyogo.id";
};

const generatedEmail = (name, domain, schoolName, suffix = "") =>
  `${emailName(name) || "guru"}${suffix}@${normalizeSchoolDomain(domain, schoolName)}`;

function readTeacherRows(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet)
    throw new AppError("Workbook has no sheet", "IMPORT_INVALID", 400);
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length)
    throw new AppError("Workbook is empty", "IMPORT_EMPTY", 400);
  return rows;
}

async function normalizeTeacherRows({
  buffer,
  schoolId,
  schoolDomain,
  schoolName,
}) {
  const rows = readTeacherRows(buffer);
  const usedEmails = new Set(await repository.listTeacherEmails(schoolId));
  const usedNips = new Set(await repository.listTeacherNips());
  const preview = [];
  const errors = [];
  for (const [index, row] of rows.entries()) {
    const fullName = String(row["Nama Lengkap"] ?? "").trim();
    if (!fullName) {
      errors.push({ row: index + 2, message: "Nama Lengkap wajib diisi" });
      continue;
    }
    const nip = String(row.NIP ?? "").trim();
    if (!/^\d{18}$/.test(nip)) {
      errors.push({
        row: index + 2,
        message: "NIP wajib diisi dengan tepat 18 digit angka",
      });
      continue;
    }
    if (usedNips.has(nip)) {
      errors.push({ row: index + 2, message: "NIP sudah terdaftar" });
      continue;
    }
    usedNips.add(nip);
    const baseEmail = generatedEmail(fullName, schoolDomain, schoolName);
    let suffix = 1;
    let email = baseEmail;
    while (usedEmails.has(email)) {
      suffix += 1;
      email = generatedEmail(fullName, schoolDomain, schoolName, suffix);
    }
    usedEmails.add(email);
    preview.push({ row: index + 2, fullName, nip, email });
  }
  return { preview, errors };
}

export async function createTeacher({
  schoolId,
  schoolDomain,
  schoolName,
  fullName,
  email,
  nip,
}) {
  const providedEmail = email?.trim().toLowerCase();
  let teacherEmail = providedEmail;
  if (!teacherEmail) {
    const usedEmails = new Set(await repository.listTeacherEmails(schoolId));
    const baseEmail = generatedEmail(fullName, schoolDomain, schoolName);
    let suffix = 1;
    teacherEmail = baseEmail;
    while (usedEmails.has(teacherEmail)) {
      suffix += 1;
      teacherEmail = generatedEmail(fullName, schoolDomain, schoolName, suffix);
    }
  }
  const password = "Guru@123";
  const teacher = await repository.createTeacher({
    schoolId,
    fullName,
    nip,
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
  schoolName,
  actorUserId,
}) {
  const { preview, errors } = await normalizeTeacherRows({
    buffer,
    schoolId,
    schoolDomain,
    schoolName,
  });
  if (errors.length)
    throw new AppError("Import contains invalid rows", "IMPORT_INVALID", 400, {
      rows: errors,
    });
  const created = await repository.importTeachers({
    schoolId,
    actorUserId,
    teachers: await Promise.all(
      preview.map(async (teacher) => ({
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

export async function previewTeachers({
  buffer,
  schoolId,
  schoolDomain,
  schoolName,
}) {
  const result = await normalizeTeacherRows({
    buffer,
    schoolId,
    schoolDomain,
    schoolName,
  });
  return {
    rows: result.preview,
    errors: result.errors,
    valid: result.errors.length === 0 && result.preview.length > 0,
  };
}
