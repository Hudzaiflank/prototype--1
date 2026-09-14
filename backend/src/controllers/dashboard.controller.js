import * as service from "../services/dashboard.service.js";

export async function superAdmin(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.getSuperAdminDashboard(),
    });
  } catch (error) {
    next(error);
  }
}

export async function admin(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.getAdminDashboard(request.user.schoolId),
    });
  } catch (error) {
    next(error);
  }
}

export async function teacher(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.getTeacherDashboard(
        request.user.userId,
        request.user.schoolId,
      ),
    });
  } catch (error) {
    next(error);
  }
}
