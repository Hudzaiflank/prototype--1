import * as service from "../services/student.service.js";

export async function list(request, response, next) {
  try {
    response.json({ success: true, data: await service.listStudents(request.user.schoolId) });
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
      }),
    });
  } catch (error) {
    next(error);
  }
}