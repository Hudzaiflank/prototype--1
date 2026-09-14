import { AppError } from "../utils/errors.js";
import * as repository from "../repositories/class.repository.js";

export const createClass = (data) => repository.createClass(data);
export const listClasses = (schoolId, teacherId) =>
  repository.listClasses(schoolId, teacherId);
export async function getClass(id, schoolId) {
  const result = await repository.findClass(id, schoolId);
  if (!result) throw new AppError("Class not found", "CLASS_NOT_FOUND", 404);
  return result;
}

export async function getClassDetail(id, schoolId) {
  const result = await repository.getClassDetail(id, schoolId);
  if (!result) throw new AppError("Class not found", "CLASS_NOT_FOUND", 404);
  return result;
}

export async function updateClass(data) {
  if (!(await repository.updateClass(data)))
    throw new AppError("Class not found", "CLASS_NOT_FOUND", 404);
  return getClassDetail(data.id, data.schoolId);
}

export async function getTeacherClassDetail(id, schoolId, teacherId) {
  const assigned = await repository.listClasses(schoolId, teacherId);
  if (!assigned.some((classItem) => Number(classItem.id) === Number(id)))
    throw new AppError("Class access denied", "CLASS_ACCESS_DENIED", 403);
  return getClassDetail(id, schoolId);
}
