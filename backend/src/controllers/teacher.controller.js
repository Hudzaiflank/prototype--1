import * as service from "../services/teacher.service.js";
import { pool } from "../config/database.js";
import multer from "multer";
import XLSX from "xlsx";

export const uploadTeacherFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (/\.(xlsx|xls)$/i.test(file.originalname)) return callback(null, true);
    callback(new Error("Only .xlsx or .xls files are supported"));
  },
});

export async function create(request, response, next) {
  try {
    const [rows] = await pool.execute(
      "SELECT name, domain FROM schools WHERE id = ?",
      [request.user.schoolId],
    );
    response.status(201).json({
      success: true,
      data: await service.createTeacher({
        ...request.validated.body,
        schoolId: request.user.schoolId,
        schoolDomain: rows[0].domain,
        schoolName: rows[0].name,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function list(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.listTeachers(
        request.user.schoolId,
        request.validated.query,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function detail(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.getTeacherDetail(
        request.params.teacherId,
        request.user.schoolId,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function assign(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await service.assignTeacher({
        teacherId: request.validated.body.teacherId,
        classId: request.params.classId,
        schoolId: request.user.schoolId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.resetTeacherPassword({
        teacherId: request.params.teacherId,
        schoolId: request.user.schoolId,
        actorUserId: request.user.userId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function removeAssignment(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.removeAssignment({
        teacherId: request.params.teacherId,
        classId: request.params.classId,
        schoolId: request.user.schoolId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function importTeachers(request, response, next) {
  try {
    if (!request.file)
      return response
        .status(400)
        .json({ success: false, message: "Excel file is required" });
    const [rows] = await pool.execute(
      "SELECT name, domain FROM schools WHERE id = ?",
      [request.user.schoolId],
    );
    response.status(201).json({
      success: true,
      data: await service.importTeachers({
        buffer: request.file.buffer,
        schoolId: request.user.schoolId,
        schoolDomain: rows[0].domain,
        schoolName: rows[0].name,
        actorUserId: request.user.userId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function previewImport(request, response, next) {
  try {
    if (!request.file)
      return response
        .status(400)
        .json({ success: false, message: "Excel file is required" });
    const [rows] = await pool.execute(
      "SELECT name, domain FROM schools WHERE id = ?",
      [request.user.schoolId],
    );
    response.json({
      success: true,
      data: await service.previewTeachers({
        buffer: request.file.buffer,
        schoolId: request.user.schoolId,
        schoolDomain: rows[0].domain,
        schoolName: rows[0].name,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export function downloadTemplate(_request, response, next) {
  try {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Nama Lengkap", "NIP"],
      ["Budi Santoso", "198501012010011001"],
    ]);
    sheet["B1"].z = "@";
    sheet["!cols"] = [{ wch: 28 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(workbook, sheet, "Guru");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    response
      .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .set("Content-Disposition", "attachment; filename=template-guru.xlsx")
      .send(buffer);
  } catch (error) {
    next(error);
  }
}
