import * as service from "../services/student.service.js";

export async function list(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.listStudents({
        schoolId: request.user.schoolId,
        teacherId: request.user.role === "TEACHER" ? request.user.userId : null,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function history(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.getStudentHistory({
        studentId: request.params.studentId,
        schoolId: request.user.schoolId,
        teacherId: request.user.role === "TEACHER" ? request.user.userId : null,
      }),
    });
  } catch (error) {
    next(error);
  }
}
