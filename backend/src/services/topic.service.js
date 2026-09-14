import { AppError } from "../utils/errors.js";
import * as repository from "../repositories/topic.repository.js";

export const createTopic = (data) => repository.createTopic(data);
export const listTopics = (data) => repository.listTopics(data);
export async function updateTopic(data) {
  if (!(await repository.updateTopic(data)))
    throw new AppError("Topic not found", "TOPIC_NOT_FOUND", 404);
  return repository.listTopics({
    schoolId: data.schoolId,
    userId: data.userId,
  });
}
export async function deleteTopic(topicId, userId) {
  if (!(await repository.deleteTopic(topicId, userId)))
    throw new AppError("Topic not found", "TOPIC_NOT_FOUND", 404);
  return { deleted: true };
}
