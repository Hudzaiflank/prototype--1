import XLSX from "xlsx";
import { AppError } from "../utils/errors.js";
import * as repository from "../repositories/student.repository.js";

function parseRows(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet)
    throw new AppError("Workbook has no sheet", "IMPORT_INVALID", 400);
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length)
    throw new AppError("Workbook is empty", "IMPORT_EMPTY", 400);
  const seen = new Set();
  const preview = rows.map((row, index) => {
    const fullName = String(row["Nama Lengkap"] ?? "").trim();
    const nisn = String(row.NISN ?? "").trim();
    const errors = [];
    if (!fullName) errors.push("Nama Lengkap wajib diisi");
    if (!/^\d{10}$/.test(nisn)) errors.push("NISN wajib tepat 10 digit angka");
    if (seen.has(nisn)) errors.push("NISN duplikat di file ini");
    if (nisn) seen.add(nisn);
    return {
      row: index + 2,
      fullName,
      nisn,
      errors,
      valid: errors.length === 0,
    };
  });
  return preview;
}

export async function preview(buffer, schoolId, academicYear) {
  const rows = parseRows(buffer);
  const existing = await repository.findStudentsByNisns(
    rows.filter((row) => row.valid).map((row) => row.nisn),
    academicYear,
  );
  const byNisn = new Map(existing.map((student) => [student.nisn, student]));
  const latest = await repository.findLatestStudentEnrollments(
    existing.map((student) => student.id),
  );
  const latestByStudentId = new Map(
    latest.map((student) => [student.studentId, student]),
  );
  for (const row of rows) {
    const student = byNisn.get(row.nisn);
    if (
      student &&
      student.fullName.toLowerCase() !== row.fullName.toLowerCase()
    )
      row.errors.push(
        `Nama tidak cocok dengan NISN yang sudah terdaftar: ${student.fullName}`,
      );
    if (student) {
      const latestEnrollment = latestByStudentId.get(student.id);
      const terminalGrade =
        latestEnrollment?.schoolLevel === "SMP" ? "9" : "12";
      if (
        latestEnrollment?.enrollmentStatus === "INACTIVE" &&
        String(latestEnrollment.gradeLevel) === terminalGrade
      ) {
        row.errors.push(
          `Siswa sudah lulus dari ${latestEnrollment.schoolName} (${latestEnrollment.className}) pada tahun ajaran ${latestEnrollment.academicYear}`,
        );
      } else if (student.className) {
        row.errors.push(
          `NISN sudah terdaftar di ${student.schoolName}, kelas ${student.className}, tahun ajaran ${student.academicYear}`,
        );
      }
    }
    row.valid = row.errors.length === 0;
  }
  return {
    rows,
    valid: rows.length > 0 && rows.every((row) => row.valid),
    validCount: rows.filter((row) => row.valid).length,
    errorCount: rows.filter((row) => !row.valid).length,
  };
}

export async function createClassWithStudents(data) {
  const previewResult = await preview(
    data.buffer,
    data.schoolId,
    data.academicYear,
  );
  if (!previewResult.valid)
    throw new AppError(
      "Perbaiki data Excel sebelum menyimpan kelas",
      "IMPORT_INVALID",
      400,
      previewResult,
    );
  return repository.createClassWithStudents({
    ...data,
    students: previewResult.rows,
  });
}

export async function listClassStudents(classId, schoolId) {
  return repository.listClassStudents(classId, schoolId);
}

export async function resetClassStudents(classId, schoolId) {
  if (!(await repository.resetClassStudents(classId, schoolId)))
    throw new AppError("Class not found", "CLASS_NOT_FOUND", 404);
  return listClassStudents(classId, schoolId);
}

export function createTemplate() {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Nama Lengkap", "NISN"],
    ["Ahmad Fauzan", "0012345678"],
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Siswa");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export const promoteSchool = (data) => repository.promoteSchool(data);
export const resetLevel = (data) => repository.resetLevel(data);
export const listStudents = ({ schoolId = null, teacherId = null } = {}) =>
  repository.listStudents(schoolId, teacherId);
export async function getStudentHistory(data) {
  const result = await repository.getStudentHistory(data);
  if (!result) {
    if (data.teacherId) {
      throw new AppError(
        "Siswa tersebut tidak berada dalam pengawasan Anda.",
        "STUDENT_NOT_SUPERVISED",
        403,
      );
    }
    throw new AppError("Student not found", "STUDENT_NOT_FOUND", 404);
  }
  return result;
}
