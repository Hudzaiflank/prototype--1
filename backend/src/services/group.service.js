import { secureShuffle } from "./matching.service.js";

export function distributeParticipants(participants, groupCount) {
  if (
    !Number.isInteger(groupCount) ||
    groupCount < 1 ||
    groupCount > participants.length
  )
    throw new Error("Invalid group count");
  const groups = Array.from({ length: groupCount }, () => []);
  for (const [index, participant] of secureShuffle(participants).entries())
    groups[index % groupCount].push(participant);
  return groups;
}
