import * as service from "../services/teacher.service.js";
import { pool } from "../config/database.js";
import multer from "multer";

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
      "SELECT domain FROM schools WHERE id = ?",
      [request.user.schoolId],
    );
    response.status(201).json({
      success: true,
      data: await service.createTeacher({
        ...request.validated.body,
        schoolId: request.user.schoolId,
        schoolDomain: rows[0].domain,
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
      "SELECT domain FROM schools WHERE id = ?",
      [request.user.schoolId],
    );
    response.status(201).json({
      success: true,
      data: await service.importTeachers({
        buffer: request.file.buffer,
        schoolId: request.user.schoolId,
        schoolDomain: rows[0].domain,
        actorUserId: request.user.userId,
      }),
    });
  } catch (error) {
    next(error);
  }
}
