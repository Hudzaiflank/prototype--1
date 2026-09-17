import * as service from "../services/class.service.js";
import * as studentService from "../services/student.service.js";
import multer from "multer";

export const uploadStudentFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (/\.(xlsx|xls)$/i.test(file.originalname)) return callback(null, true);
    callback(new Error("Only .xlsx or .xls files are supported"));
  },
});

export async function create(request, response, next) {
  try {
    if (!request.file)
      return response.status(400).json({ success: false, message: "Excel siswa wajib diunggah" });
    response.status(201).json({
      success: true,
      data: await service.createClassWithStudents({
        ...request.validated.body,
        schoolId: request.user.schoolId,
        buffer: request.file.buffer,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function previewStudents(request, response, next) {
  try {
    if (!request.file)
      return response.status(400).json({ success: false, message: "Excel siswa wajib diunggah" });
    response.json({
      success: true,
      data: await studentService.preview(
        request.file.buffer,
        request.user.schoolId,
        request.body.academicYear,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function listStudents(request, response, next) {
  try {
    response.json({
      success: true,
      data: await studentService.listClassStudents(request.params.classId, request.user.schoolId),
    });
  } catch (error) {
    next(error);
  }
}

export async function resetStudents(request, response, next) {
  try {
    response.json({
      success: true,
      data: await studentService.resetClassStudents(request.params.classId, request.user.schoolId),
    });
  } catch (error) {
    next(error);
  }
}

export async function promoteSchool(request, response, next) {
  try {
    const nextAcademicYear = request.body.nextAcademicYear ?? `${Number(request.body.academicYear.slice(0, 4)) + 1}/${Number(request.body.academicYear.slice(5)) + 1}`;
    response.json({
      success: true,
      data: await studentService.promoteSchool({ ...request.body, nextAcademicYear, schoolId: request.user.schoolId }),
    });
  } catch (error) {
    next(error);
  }
}

export async function resetLevel(request, response, next) {
  try {
    response.json({
      success: true,
      data: await studentService.resetLevel({ ...request.body, schoolId: request.user.schoolId }),
    });
  } catch (error) {
    next(error);
  }
}

export function downloadStudentTemplate(_request, response, next) {
  try {
    response
      .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .set("Content-Disposition", "attachment; filename=template-siswa.xlsx")
      .send(studentService.createTemplate());
  } catch (error) {
    next(error);
  }
}

export async function list(request, response, next) {
  try {
    const teacherId =
      request.user.role === "TEACHER" ? request.user.userId : null;
    response.json({
      success: true,
      data: await service.listClasses(request.user.schoolId, teacherId),
    });
  } catch (error) {
    next(error);
  }
}

export async function detail(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.getClassDetail(
        request.params.classId,
        request.user.schoolId,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function update(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.updateClass({
        ...request.validated.body,
        id: request.params.classId,
        schoolId: request.user.schoolId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function teacherDetail(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.getTeacherClassDetail(
        request.params.classId,
        request.user.schoolId,
        request.user.userId,
      ),
    });
  } catch (error) {
    next(error);
  }
}
