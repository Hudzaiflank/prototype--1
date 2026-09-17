UPDATE class_enrollments e
JOIN (
  SELECT student_id, academic_year, MIN(id) AS keep_id
  FROM class_enrollments
  WHERE status = 'ACTIVE'
  GROUP BY student_id, academic_year
) duplicates ON duplicates.student_id = e.student_id
  AND duplicates.academic_year = e.academic_year
SET e.status = 'INACTIVE', e.updated_at = CURRENT_TIMESTAMP
WHERE e.status = 'ACTIVE' AND e.id <> duplicates.keep_id;

ALTER TABLE class_enrollments
  ADD COLUMN active_student_year VARCHAR(32)
  GENERATED ALWAYS AS (
    IF(status = 'ACTIVE', CONCAT(student_id, ':', academic_year), NULL)
  ) STORED;

ALTER TABLE class_enrollments
  ADD UNIQUE KEY uq_active_student_year (active_student_year);