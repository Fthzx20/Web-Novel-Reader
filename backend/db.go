package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

func OpenDB(cfg Config) (*sql.DB, error) {
	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(cfg.DBMaxConns)
	db.SetMaxIdleConns(cfg.DBMaxIdleConns)
	db.SetConnMaxLifetime(cfg.DBConnMaxLifetime)
	if err := db.Ping(); err != nil {
		return nil, err
	}
	return db, nil
}

func RunMigrations(db *sql.DB) error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS auth_users (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active',
			created_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS novels (
			id SERIAL PRIMARY KEY,
			slug TEXT NOT NULL UNIQUE,
			title TEXT NOT NULL,
			author TEXT NOT NULL,
			summary TEXT NOT NULL,
			tags TEXT[] NOT NULL DEFAULT '{}',
			cover_url TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'ongoing',
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS chapters (
			id SERIAL PRIMARY KEY,
			novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
			number INTEGER NOT NULL,
			volume INTEGER NOT NULL DEFAULT 1,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			word_count INTEGER NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS comments (
			id SERIAL PRIMARY KEY,
			chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
			user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
			body TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS ratings (
			id SERIAL PRIMARY KEY,
			novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
			user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
			score INTEGER NOT NULL,
			note TEXT NOT NULL DEFAULT '',
			at TIMESTAMPTZ NOT NULL,
			UNIQUE (novel_id, user_id)
		)`,
		`CREATE TABLE IF NOT EXISTS reading_history (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
			novel_slug TEXT NOT NULL,
			novel_title TEXT NOT NULL,
			chapter_id INTEGER NOT NULL,
			chapter_title TEXT NOT NULL,
			read_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS follows (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
			novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL,
			UNIQUE (user_id, novel_id)
		)`,
		`CREATE TABLE IF NOT EXISTS bookmarks (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
			novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL,
			UNIQUE (user_id, novel_id)
		)`,
		`CREATE TABLE IF NOT EXISTS site_settings (
			id INTEGER PRIMARY KEY,
			title TEXT NOT NULL,
			tagline TEXT NOT NULL,
			logo_url TEXT NOT NULL,
			logo_alt TEXT NOT NULL DEFAULT '',
			headline TEXT NOT NULL DEFAULT '',
			hero_description TEXT NOT NULL DEFAULT '',
			primary_button TEXT NOT NULL DEFAULT '',
			secondary_button TEXT NOT NULL DEFAULT '',
			accent_color TEXT NOT NULL DEFAULT '',
			highlight_label TEXT NOT NULL DEFAULT '',
			facebook_url TEXT NOT NULL DEFAULT '',
			discord_url TEXT NOT NULL DEFAULT '',
			footer_updates_label TEXT NOT NULL DEFAULT '',
			footer_updates_url TEXT NOT NULL DEFAULT '',
			footer_series_label TEXT NOT NULL DEFAULT '',
			footer_series_url TEXT NOT NULL DEFAULT '',
			footer_admin_label TEXT NOT NULL DEFAULT '',
			footer_admin_url TEXT NOT NULL DEFAULT '',
			footer_link4_label TEXT NOT NULL DEFAULT '',
			footer_link4_url TEXT NOT NULL DEFAULT '',
			footer_link5_label TEXT NOT NULL DEFAULT '',
			footer_link5_url TEXT NOT NULL DEFAULT '',
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS announcements (
			id SERIAL PRIMARY KEY,
			title TEXT NOT NULL,
			body TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS release_queue (
			id SERIAL PRIMARY KEY,
			novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
			chapter_number INTEGER NOT NULL,
			title TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'Queued',
			eta TEXT NOT NULL DEFAULT '',
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS moderation_reports (
			id SERIAL PRIMARY KEY,
			novel_id INTEGER REFERENCES novels(id) ON DELETE SET NULL,
			novel_title TEXT NOT NULL DEFAULT '',
			note TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS illustrations (
			id SERIAL PRIMARY KEY,
			url TEXT NOT NULL,
			original_name TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS reading_history_user_id_idx ON reading_history(user_id)`,
		`CREATE INDEX IF NOT EXISTS chapters_novel_id_idx ON chapters(novel_id)`,
		`CREATE INDEX IF NOT EXISTS comments_chapter_id_idx ON comments(chapter_id)`,
		`CREATE INDEX IF NOT EXISTS ratings_novel_id_idx ON ratings(novel_id)`,
		`CREATE INDEX IF NOT EXISTS follows_user_id_idx ON follows(user_id)`,
		`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS volume INTEGER NOT NULL DEFAULT 1`,
		`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_alt TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS headline TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS hero_description TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS primary_button TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS secondary_button TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS highlight_label TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS discord_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_updates_label TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_updates_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_series_label TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_series_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_admin_label TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_admin_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_link4_label TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_link4_url TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_link5_label TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_link5_url TEXT NOT NULL DEFAULT ''`,
		`CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id)`,
		`CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON announcements(created_at)`,
		`CREATE INDEX IF NOT EXISTS release_queue_created_at_idx ON release_queue(created_at)`,
		`CREATE INDEX IF NOT EXISTS release_queue_novel_id_idx ON release_queue(novel_id)`,
		`CREATE INDEX IF NOT EXISTS moderation_reports_created_at_idx ON moderation_reports(created_at)`,
		`CREATE INDEX IF NOT EXISTS illustrations_created_at_idx ON illustrations(created_at)`,
	}

	for i, stmt := range statements {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("migration %d failed: %w", i+1, err)
		}
	}
	if err := migrateChapterContentToText(db); err != nil {
		return fmt.Errorf("chapter content migration failed: %w", err)
	}
	return nil
}

func migrateChapterContentToText(db *sql.DB) error {
	rows, err := db.Query(
		`SELECT id, content FROM chapters WHERE content LIKE '[%' OR content LIKE '{%'`,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var content string
		if err := rows.Scan(&id, &content); err != nil {
			continue
		}
		text, ok := plateJSONToText(content)
		if !ok || strings.TrimSpace(text) == "" {
			continue
		}
		_, err := db.Exec(
			`UPDATE chapters SET content = $1, word_count = $2, updated_at = $3 WHERE id = $4`,
			text,
			len(strings.Fields(text)),
			time.Now(),
			id,
		)
		if err != nil {
			return err
		}
	}
	return rows.Err()
}

func plateJSONToText(raw string) (string, bool) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", false
	}
	if !strings.HasPrefix(trimmed, "[") && !strings.HasPrefix(trimmed, "{") {
		return "", false
	}
	var data any
	if err := json.Unmarshal([]byte(trimmed), &data); err != nil {
		return "", false
	}
	text := serializePlateValue(data)
	text = strings.TrimSpace(text)
	if text == "" {
		return "", false
	}
	return text, true
}

func serializePlateValue(value any) string {
	if arr, ok := value.([]any); ok {
		parts := make([]string, 0, len(arr))
		for _, node := range arr {
			part := strings.TrimSpace(serializePlateNode(node))
			if part != "" {
				parts = append(parts, part)
			}
		}
		return strings.Join(parts, "\n\n")
	}
	return strings.TrimSpace(serializePlateNode(value))
}

func serializePlateNode(value any) string {
	switch node := value.(type) {
	case map[string]any:
		if text, ok := node["text"].(string); ok {
			return text
		}
		if url := getPlateImageURL(node); url != "" {
			return "[[img:" + url + "]]"
		}
		if children, ok := node["children"].([]any); ok {
			return joinPlateChildren(children)
		}
		return ""
	case []any:
		return joinPlateChildren(node)
	default:
		return ""
	}
}

func joinPlateChildren(children []any) string {
	var builder strings.Builder
	for _, child := range children {
		builder.WriteString(serializePlateNode(child))
	}
	return builder.String()
}

func getPlateImageURL(node map[string]any) string {
	if url, ok := node["url"].(string); ok && strings.TrimSpace(url) != "" {
		return strings.TrimSpace(url)
	}
	if src, ok := node["src"].(string); ok && strings.TrimSpace(src) != "" {
		return strings.TrimSpace(src)
	}
	if data, ok := node["data"].(map[string]any); ok {
		if url, ok := data["url"].(string); ok && strings.TrimSpace(url) != "" {
			return strings.TrimSpace(url)
		}
	}
	return ""
}
