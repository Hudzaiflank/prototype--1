ALTER TABLE participants ADD COLUMN student_id BIGINT UNSIGNED NULL AFTER game_session_id;
ALTER TABLE participants ADD CONSTRAINT fk_participants_student FOREIGN KEY (student_id) REFERENCES students(id);
ALTER TABLE participants ADD UNIQUE KEY uq_participant_student_session (game_session_id, student_id);