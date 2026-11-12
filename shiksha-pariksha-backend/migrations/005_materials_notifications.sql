-- Migration 005: Study Materials & Notifications

CREATE TABLE IF NOT EXISTS study_materials (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(250) NOT NULL,
    description     TEXT,
    file_url        TEXT NOT NULL,
    file_name       TEXT,
    file_type       VARCHAR(20),
    file_size_bytes BIGINT,
    subject_id      BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
    class_level     SMALLINT,
    uploaded_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    download_count  INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_subject ON study_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_class   ON study_materials(class_level);
CREATE INDEX IF NOT EXISTS idx_materials_active  ON study_materials(is_active);

CREATE TABLE IF NOT EXISTS notifications (
    id            BIGSERIAL PRIMARY KEY,
    title         VARCHAR(250) NOT NULL,
    body          TEXT,
    is_important  BOOLEAN DEFAULT FALSE,
    target_role   VARCHAR(20) CHECK (target_role IN ('teacher','student','parent','all')),
    created_by    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_imp  ON notifications(is_important, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_reads (
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id  BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    read_at          TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, notification_id)
);
