CREATE TABLE prospects (id TEXT PRIMARY KEY,name TEXT NOT NULL,website TEXT NOT NULL,email TEXT,status TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE audits (id TEXT PRIMARY KEY,prospect_id TEXT NOT NULL,url TEXT NOT NULL,result_json TEXT NOT NULL,is_demo INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE proposals (id TEXT PRIMARY KEY,prospect_id TEXT NOT NULL,proposal_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
INSERT INTO prospects VALUES ('legacy-prospect','Legacy agency prospect','https://example.com','owner@example.test','new','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
