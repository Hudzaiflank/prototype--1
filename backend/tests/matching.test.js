import test from "node:test";
import assert from "node:assert/strict";
import { createPerfectMatching } from "../src/services/matching.service.js";

test("perfect matching assigns each participant one non-self problem", () => {
  const participants = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const problems = [
    { id: 11, participant_id: 1 },
    { id: 12, participant_id: 2 },
    { id: 13, participant_id: 3 },
  ];
  const assignments = createPerfectMatching(participants, problems);
  assert.equal(assignments.length, 3);
  assert.equal(new Set(assignments.map((item) => item.participantId)).size, 3);
  assert.equal(new Set(assignments.map((item) => item.problemId)).size, 3);
  for (const assignment of assignments) {
    assert.notEqual(
      problems.find((problem) => problem.id === assignment.problemId)
        .participant_id,
      assignment.participantId,
    );
  }
});

test("perfect matching rejects impossible one-participant self-match", () => {
  assert.throws(
    () => createPerfectMatching([{ id: 1 }], [{ id: 11, participant_id: 1 }]),
    (error) => error.code === "MATCHING_IMPOSSIBLE",
  );
});
