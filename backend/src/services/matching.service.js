import { randomInt } from "node:crypto";
import { AppError } from "../utils/errors.js";

export const secureShuffle = (items) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

export function createPerfectMatching(participants, problems) {
  if (!participants.length || participants.length !== problems.length)
    throw new AppError(
      "Participant and problem counts must match",
      "MATCHING_IMPOSSIBLE",
      409,
    );

  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const candidates = new Map(
    participants.map((participant) => [
      participant.id,
      secureShuffle(problems)
        .filter((problem) => problem.participant_id !== participant.id)
        .map((problem) => problem.id),
    ]),
  );
  const assignedProblemToParticipant = new Map();

  const visit = (participantId, visited) => {
    for (const problemId of candidates.get(participantId) ?? []) {
      if (visited.has(problemId)) continue;
      visited.add(problemId);
      const currentParticipant = assignedProblemToParticipant.get(problemId);
      if (
        currentParticipant === undefined ||
        visit(currentParticipant, visited)
      ) {
        assignedProblemToParticipant.set(problemId, participantId);
        return true;
      }
    }
    return false;
  };

  for (const participant of secureShuffle(participants)) {
    if (!visit(participant.id, new Set()))
      throw new AppError(
        "Perfect matching could not be generated",
        "MATCHING_IMPOSSIBLE",
        409,
      );
  }

  return [...assignedProblemToParticipant.entries()].map(
    ([problemId, participantId], index) => ({
      participantId,
      problemId,
      sequenceNumber: index + 1,
      problem: problemById.get(problemId),
    }),
  );
}
