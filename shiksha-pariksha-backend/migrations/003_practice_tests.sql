-- Migration 003: Practice Tests (Admin-managed)

CREATE TABLE IF NOT EXISTS practice_tests (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(250) NOT NULL,
    description     TEXT,
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    subject_id      BIGINT REFERENCES subjects(id) ON DELETE RESTRICT,
    class_level     SMALLINT,
    total_marks     INTEGER DEFAULT 0,
    duration_mins   INTEGER DEFAULT 30,
    is_published    BOOLEAN DEFAULT FALSE,
    publish_at      TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    target_role     VARCHAR(20) DEFAULT 'both' CHECK (target_role IN ('teacher','student','both')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_tests_subject   ON practice_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_practice_tests_published ON practice_tests(is_published, publish_at);
CREATE INDEX IF NOT EXISTS idx_practice_tests_role      ON practice_tests(target_role);

-- Many-to-many: tests <-> questions
CREATE TABLE IF NOT EXISTS test_questions (
    test_id       BIGINT NOT NULL REFERENCES practice_tests(id) ON DELETE CASCADE,
    question_id   BIGINT NOT NULL REFERENCES questions(id)      ON DELETE CASCADE,
    marks         SMALLINT NOT NULL DEFAULT 1,
    display_order SMALLINT,
    PRIMARY KEY (test_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test ON test_questions(test_id, display_order);
