import * as service from "../services/topic.service.js";

export async function create(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await service.createTopic({
        ...request.validated.body,
        schoolId: request.user.schoolId,
        createdBy: request.user.userId,
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
      data: await service.listTopics({
        schoolId: request.user.schoolId,
        userId: request.user.userId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function update(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.updateTopic({
        ...request.validated.body,
        topicId: request.params.topicId,
        schoolId: request.user.schoolId,
        userId: request.user.userId,
      }),
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(request, response, next) {
  try {
    response.json({
      success: true,
      data: await service.deleteTopic(
        request.params.topicId,
        request.user.userId,
      ),
    });
  } catch (error) {
    next(error);
  }
}
