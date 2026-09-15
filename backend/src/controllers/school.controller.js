import * as schoolService from "../services/school.service.js";

export async function create(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await schoolService.createSchool({
        ...request.validated.body,
        actorUserId: request.user.userId,
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
      data: await schoolService.getSchools(request.validated.query),
    });
  } catch (error) {
    next(error);
  }
}

export async function detail(request, response, next) {
  try {
    response.json({
      success: true,
      data: await schoolService.getSchool(request.params.schoolId),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(request, response, next) {
  try {
    response.json({
      success: true,
      data: await schoolService.setSchoolStatus(
        request.params.schoolId,
        request.validated.body.status,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(request, response, next) {
  try {
    response.json({
      success: true,
      data: await schoolService.removeSchool(
        request.params.schoolId,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function resetAdminPassword(request, response, next) {
  try {
    response.json({
      success: true,
      data: await schoolService.resetAdminPassword(
        request.params.schoolId,
        request.user.userId,
      ),
    });
  } catch (error) {
    next(error);
  }
}
