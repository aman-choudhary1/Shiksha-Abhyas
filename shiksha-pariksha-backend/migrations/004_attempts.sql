-- Migration 004: Test Attempts & Answers

CREATE TABLE IF NOT EXISTS test_attempts (
    id              BIGSERIAL PRIMARY KEY,
    test_id         BIGINT NOT NULL REFERENCES practice_tests(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    submitted_at    TIMESTAMPTZ,
    score           INTEGER,
    total_marks     INTEGER,
    percentage      NUMERIC(5,2),
    time_taken_sec  INTEGER,
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress','submitted','timed_out'))
);

CREATE INDEX IF NOT EXISTS idx_attempts_test    ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user    ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status  ON test_attempts(status);

-- Prevent duplicate active attempts per user per test
CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_active_unique
    ON test_attempts(test_id, user_id)
    WHERE status = 'in_progress';

CREATE TABLE IF NOT EXISTS attempt_answers (
    id              BIGSERIAL PRIMARY KEY,
    attempt_id      BIGINT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id     BIGINT NOT NULL REFERENCES questions(id)     ON DELETE CASCADE,
    selected_key    CHAR(1) CHECK (selected_key IN ('A','B','C','D')),
    is_correct      BOOLEAN,
    time_spent_sec  INTEGER,
    answered_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
