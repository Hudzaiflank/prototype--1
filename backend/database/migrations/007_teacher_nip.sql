DELETE tc
FROM teacher_classes tc
JOIN users u ON u.id = tc.teacher_id
WHERE u.role = 'TEACHER';

DELETE rt
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE u.role = 'TEACHER';

DELETE FROM audit_logs
WHERE actor_user_id IN (SELECT id FROM users WHERE role = 'TEACHER');

DELETE FROM users WHERE role = 'TEACHER';

ALTER TABLE users
  ADD COLUMN nip CHAR(18) NULL AFTER full_name,
  ADD UNIQUE KEY uq_users_nip (nip),
  ADD CONSTRAINT chk_teacher_nip
    CHECK ((role = 'TEACHER' AND nip IS NOT NULL) OR role <> 'TEACHER');
