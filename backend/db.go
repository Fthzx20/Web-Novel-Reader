package main

import (
	"database/sql"
	"errors"
	"fmt"

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
		`ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`,
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
	return nil
}