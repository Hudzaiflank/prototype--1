import * as service from "../services/class.service.js";

export async function create(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await service.createClass({
        ...request.validated.body,
        schoolId: request.user.schoolId,
      }),
    });
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
