UPDATE `groups` g
SET leader_participant_id = COALESCE(
  (
    SELECT gm.participant_id
    FROM group_members gm
    JOIN participants p ON p.id = gm.participant_id
    WHERE gm.group_id = g.id AND p.status = 'CONNECTED'
    ORDER BY gm.assigned_at, gm.id
    LIMIT 1
  ),
  (
    SELECT gm.participant_id
    FROM group_members gm
    WHERE gm.group_id = g.id
    ORDER BY gm.assigned_at, gm.id
    LIMIT 1
  )
)
WHERE g.leader_participant_id IS NULL;
