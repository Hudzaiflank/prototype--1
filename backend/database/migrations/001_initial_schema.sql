CREATE TABLE IF NOT EXISTS schools (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	slug VARCHAR(180) NOT NULL UNIQUE,
	domain VARCHAR(150) NOT NULL UNIQUE,
	status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	school_id BIGINT UNSIGNED NULL,
	role ENUM('SUPER_ADMIN', 'ADMIN', 'TEACHER') NOT NULL,
	full_name VARCHAR(150) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	admin_school_id BIGINT GENERATED ALWAYS AS (IF(role = 'ADMIN', school_id, NULL)) STORED,
	last_login_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id),
	CONSTRAINT chk_user_role_school CHECK ((role = 'SUPER_ADMIN' AND school_id IS NULL) OR (role IN ('ADMIN', 'TEACHER') AND school_id IS NOT NULL)),
	INDEX idx_users_school_role (school_id, role, status),
	UNIQUE KEY uq_one_school_admin (admin_school_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS classes (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	school_id BIGINT UNSIGNED NOT NULL,
	grade_level VARCHAR(10) NOT NULL,
	major VARCHAR(50) NOT NULL,
	class_number INT NOT NULL,
	name VARCHAR(50) NOT NULL,
	status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uq_class_identity (school_id, grade_level, major, class_number),
	CONSTRAINT fk_classes_school FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teacher_classes (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	teacher_id BIGINT UNSIGNED NOT NULL,
	class_id BIGINT UNSIGNED NOT NULL,
	assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	unassigned_at DATETIME NULL,
	UNIQUE KEY uq_teacher_class (teacher_id, class_id),
	CONSTRAINT fk_teacher_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users(id),
	CONSTRAINT fk_teacher_classes_class FOREIGN KEY (class_id) REFERENCES classes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS topics (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	school_id BIGINT UNSIGNED NOT NULL,
	created_by BIGINT UNSIGNED NOT NULL,
	visibility ENUM('SCHOOL', 'PRIVATE') NOT NULL,
	title VARCHAR(150) NOT NULL,
	description TEXT NULL,
	status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_topics_school FOREIGN KEY (school_id) REFERENCES schools(id),
	CONSTRAINT fk_topics_creator FOREIGN KEY (created_by) REFERENCES users(id),
	INDEX idx_topics_scope (school_id, visibility, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rooms (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	class_id BIGINT UNSIGNED NOT NULL,
	created_by BIGINT UNSIGNED NOT NULL,
	code CHAR(6) NOT NULL UNIQUE,
	status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
	opened_at DATETIME NULL,
	closed_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_rooms_class FOREIGN KEY (class_id) REFERENCES classes(id),
	CONSTRAINT fk_rooms_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS game_sessions (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	room_id BIGINT UNSIGNED NOT NULL,
	created_by BIGINT UNSIGNED NOT NULL,
	topic_id BIGINT UNSIGNED NULL,
	input_mode ENUM('STUDENT', 'TEACHER') NOT NULL,
	game_mode ENUM('ALL_STUDENTS', 'GROUPS') NOT NULL,
	problem_display_limit INT NOT NULL DEFAULT 1,
	group_count INT NULL,
	status ENUM('WAITING', 'PLAYING', 'PAUSED', 'FINISHED', 'CLOSED') NOT NULL DEFAULT 'WAITING',
	state_version INT UNSIGNED NOT NULL DEFAULT 0,
	started_at DATETIME NULL,
	paused_at DATETIME NULL,
	resumed_at DATETIME NULL,
	finished_at DATETIME NULL,
	expires_at DATETIME NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_sessions_room FOREIGN KEY (room_id) REFERENCES rooms(id),
	CONSTRAINT fk_sessions_creator FOREIGN KEY (created_by) REFERENCES users(id),
	CONSTRAINT fk_sessions_topic FOREIGN KEY (topic_id) REFERENCES topics(id),
	INDEX idx_sessions_status (status, expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS participants (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	game_session_id BIGINT UNSIGNED NOT NULL,
	session_uuid CHAR(36) NOT NULL UNIQUE,
	full_name VARCHAR(150) NOT NULL,
	status ENUM('CONNECTED', 'DISCONNECTED', 'FINISHED') NOT NULL DEFAULT 'CONNECTED',
	joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	connected_at DATETIME NULL,
	disconnected_at DATETIME NULL,
	finished_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_participants_session FOREIGN KEY (game_session_id) REFERENCES game_sessions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problems (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	game_session_id BIGINT UNSIGNED NOT NULL,
	participant_id BIGINT UNSIGNED NULL,
	created_by BIGINT UNSIGNED NULL,
	content TEXT NOT NULL,
	source ENUM('STUDENT', 'TEACHER', 'IMPORT') NOT NULL,
	status ENUM('ACTIVE', 'USED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE KEY uq_participant_problem (game_session_id, participant_id),
	CONSTRAINT fk_problems_session FOREIGN KEY (game_session_id) REFERENCES game_sessions(id),
	CONSTRAINT fk_problems_participant FOREIGN KEY (participant_id) REFERENCES participants(id),
	CONSTRAINT fk_problems_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `groups` (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	game_session_id BIGINT UNSIGNED NOT NULL,
	group_number INT NOT NULL,
	status ENUM('WAITING', 'PLAYING', 'PAUSED', 'FINISHED') NOT NULL DEFAULT 'WAITING',
	active_turn_id BIGINT UNSIGNED NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	UNIQUE KEY uq_session_group (game_session_id, group_number),
	CONSTRAINT fk_groups_session FOREIGN KEY (game_session_id) REFERENCES game_sessions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS group_members (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	group_id BIGINT UNSIGNED NOT NULL,
	participant_id BIGINT UNSIGNED NOT NULL,
	assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE KEY uq_group_member (group_id, participant_id),
	CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES `groups`(id),
	CONSTRAINT fk_group_members_participant FOREIGN KEY (participant_id) REFERENCES participants(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assignments (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	game_session_id BIGINT UNSIGNED NOT NULL,
	group_id BIGINT UNSIGNED NULL,
	participant_id BIGINT UNSIGNED NOT NULL,
	problem_id BIGINT UNSIGNED NOT NULL,
	sequence_number INT NOT NULL,
	status ENUM('PENDING', 'ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
	assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	completed_at DATETIME NULL,
	UNIQUE KEY uq_assignment_participant (game_session_id, participant_id),
	UNIQUE KEY uq_assignment_problem (game_session_id, problem_id),
	CONSTRAINT fk_assignments_session FOREIGN KEY (game_session_id) REFERENCES game_sessions(id),
	CONSTRAINT fk_assignments_group FOREIGN KEY (group_id) REFERENCES `groups`(id),
	CONSTRAINT fk_assignments_participant FOREIGN KEY (participant_id) REFERENCES participants(id),
	CONSTRAINT fk_assignments_problem FOREIGN KEY (problem_id) REFERENCES problems(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS game_turns (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	game_session_id BIGINT UNSIGNED NOT NULL,
	group_id BIGINT UNSIGNED NOT NULL,
	assignment_id BIGINT UNSIGNED NOT NULL,
	turn_number INT NOT NULL,
	status ENUM('PENDING', 'ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
	participant_card_state ENUM('HIDDEN', 'REVEALED') NOT NULL DEFAULT 'HIDDEN',
	problem_card_state ENUM('HIDDEN', 'REVEALED') NOT NULL DEFAULT 'HIDDEN',
	started_at DATETIME NULL,
	revealed_at DATETIME NULL,
	completed_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE KEY uq_group_turn (group_id, turn_number),
	UNIQUE KEY uq_group_assignment (group_id, assignment_id),
	CONSTRAINT fk_turns_session FOREIGN KEY (game_session_id) REFERENCES game_sessions(id),
	CONSTRAINT fk_turns_group FOREIGN KEY (group_id) REFERENCES `groups`(id),
	CONSTRAINT fk_turns_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id BIGINT UNSIGNED NOT NULL,
	token_hash VARCHAR(255) NOT NULL,
	expires_at DATETIME NOT NULL,
	revoked_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id),
	INDEX idx_refresh_tokens_lookup (user_id, revoked_at, expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	actor_user_id BIGINT UNSIGNED NULL,
	school_id BIGINT UNSIGNED NULL,
	action VARCHAR(100) NOT NULL,
	entity_type VARCHAR(50) NOT NULL,
	entity_id BIGINT UNSIGNED NULL,
	metadata JSON NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id),
	CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools(id),
	INDEX idx_audit_school_created (school_id, created_at)
) ENGINE=InnoDB;