-- Migration 001: Base Question Bank Schema (ported from demo)
-- exams, subjects, questions, question_options, import_jobs

CREATE TABLE IF NOT EXISTS exams (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    year         INTEGER,
    language     VARCHAR(30),
    source_file  TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL UNIQUE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    id                BIGSERIAL PRIMARY KEY,
    exam_id           BIGINT REFERENCES exams(id) ON DELETE CASCADE,
    subject_id        BIGINT REFERENCES subjects(id) ON DELETE RESTRICT,
    question_number   INTEGER,
    question_text_en  TEXT,
    question_text_hi  TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_question_text_non_empty CHECK (
        (question_text_en IS NOT NULL AND TRIM(question_text_en) <> '') OR
        (question_text_hi IS NOT NULL AND TRIM(question_text_hi) <> '')
    )
);

CREATE INDEX IF NOT EXISTS idx_questions_exam_subject ON questions(exam_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_qnum   ON questions(exam_id, question_number);

CREATE TABLE IF NOT EXISTS question_options (
    id             BIGSERIAL PRIMARY KEY,
    question_id    BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_key     CHAR(1) NOT NULL,
    option_text_en TEXT,
    option_text_hi TEXT,
    is_correct     BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_question_option_key    UNIQUE (question_id, option_key),
    CONSTRAINT chk_option_key_valid      CHECK (option_key IN ('A','B','C','D')),
    CONSTRAINT chk_option_text_non_empty CHECK (
        (option_text_en IS NOT NULL AND TRIM(option_text_en) <> '') OR
        (option_text_hi IS NOT NULL AND TRIM(option_text_hi) <> '')
    )
);

CREATE INDEX IF NOT EXISTS idx_question_options_qid ON question_options(question_id);

CREATE TABLE IF NOT EXISTS import_jobs (
    id             BIGSERIAL PRIMARY KEY,
    exam_id        BIGINT REFERENCES exams(id) ON DELETE SET NULL,
    file_name      TEXT,
    status         VARCHAR(30) NOT NULL DEFAULT 'processing' CHECK (
                       status IN ('processing','completed','failed','completed_with_errors')
                   ),
    total_rows     INTEGER DEFAULT 0,
    imported_rows  INTEGER DEFAULT 0,
    failed_rows    INTEGER DEFAULT 0,
    error_details  JSONB DEFAULT '[]'::jsonb,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_exam    ON import_jobs(exam_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created ON import_jobs(created_at DESC);
