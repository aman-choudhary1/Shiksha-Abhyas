-- Migration 002: Users, Auth, Profiles, Parent-Student Links

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(15) UNIQUE,
    email         VARCHAR(150) UNIQUE,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('teacher','student','parent','admin')),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_users_contact CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone  ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);

-- Student extra profile info
CREATE TABLE IF NOT EXISTS student_profiles (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    class_level  SMALLINT CHECK (class_level BETWEEN 1 AND 12),
    section      VARCHAR(5),
    roll_number  VARCHAR(20),
    school_name  VARCHAR(200),
    board        VARCHAR(50)
);

-- Parent <-> Student mapping
CREATE TABLE IF NOT EXISTS parent_student_links (
    parent_user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relation        VARCHAR(30) DEFAULT 'guardian',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (parent_user_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_psl_parent  ON parent_student_links(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_psl_student ON parent_student_links(student_user_id);

-- Refresh tokens (httpOnly cookie strategy)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
