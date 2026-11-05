SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'participants'
    AND index_name = 'idx_participants_session_status_id'
);
SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE participants ADD INDEX idx_participants_session_status_id (game_session_id, status, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'problems'
    AND index_name = 'idx_problems_session_status_participant'
);
SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE problems ADD INDEX idx_problems_session_status_participant (game_session_id, status, participant_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'group_members'
    AND index_name = 'idx_group_members_participant_group'
);
SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE group_members ADD INDEX idx_group_members_participant_group (participant_id, group_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'assignments'
    AND index_name = 'idx_assignments_session_group_status'
);
SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE assignments ADD INDEX idx_assignments_session_group_status (game_session_id, group_id, status)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'game_turns'
    AND index_name = 'idx_game_turns_group_status_number'
);
SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE game_turns ADD INDEX idx_game_turns_group_status_number (group_id, status, turn_number)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
