DELETE FROM game_turns;
DELETE FROM assignments;
DELETE FROM group_members;
DELETE FROM `groups`;
DELETE FROM problems;
DELETE FROM participants;
DELETE FROM game_sessions;
DELETE FROM rooms;
DELETE FROM teacher_classes;
DELETE FROM classes;
DELETE FROM topics;
DELETE FROM refresh_tokens;
DELETE FROM audit_logs;
DELETE FROM users WHERE role IN ('ADMIN', 'TEACHER');

ALTER TABLE schools MODIFY COLUMN domain VARCHAR(150) NULL;
ALTER TABLE schools ADD COLUMN level ENUM('SMP', 'SMA', 'SMK') NOT NULL DEFAULT 'SMA' AFTER name;
ALTER TABLE classes ADD COLUMN academic_year VARCHAR(9) NOT NULL DEFAULT '2026/2027' AFTER school_id;
ALTER TABLE classes ADD INDEX idx_classes_school_year (school_id, academic_year, grade_level, status);
ALTER TABLE classes ADD UNIQUE KEY uq_class_school_year (school_id, academic_year, grade_level, major, class_number);

CREATE TABLE IF NOT EXISTS students (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	nisn CHAR(10) NOT NULL UNIQUE,
	full_name VARCHAR(150) NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS class_enrollments (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	student_id BIGINT UNSIGNED NOT NULL,
	class_id BIGINT UNSIGNED NOT NULL,
	school_id BIGINT UNSIGNED NOT NULL,
	academic_year VARCHAR(9) NOT NULL,
	status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students(id),
	CONSTRAINT fk_enrollment_class FOREIGN KEY (class_id) REFERENCES classes(id),
	CONSTRAINT fk_enrollment_school FOREIGN KEY (school_id) REFERENCES schools(id),
	UNIQUE KEY uq_student_class_year (student_id, class_id, academic_year),
	INDEX idx_enrollment_class_status (class_id, status),
	INDEX idx_enrollment_student_history (student_id, academic_year)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_problems (
	id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	student_id BIGINT UNSIGNED NOT NULL,
	game_session_id BIGINT UNSIGNED NOT NULL,
	class_id BIGINT UNSIGNED NOT NULL,
	content TEXT NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_student_problem_student FOREIGN KEY (student_id) REFERENCES students(id),
	CONSTRAINT fk_student_problem_session FOREIGN KEY (game_session_id) REFERENCES game_sessions(id),
	CONSTRAINT fk_student_problem_class FOREIGN KEY (class_id) REFERENCES classes(id),
	UNIQUE KEY uq_student_problem_session (student_id, game_session_id),
	INDEX idx_student_problem_history (student_id, created_at)
) ENGINE=InnoDB;