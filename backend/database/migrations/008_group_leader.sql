ALTER TABLE `groups`
  ADD COLUMN leader_participant_id BIGINT UNSIGNED NULL AFTER game_session_id,
  ADD INDEX idx_groups_leader (leader_participant_id),
  ADD CONSTRAINT fk_groups_leader FOREIGN KEY (leader_participant_id) REFERENCES participants(id);
