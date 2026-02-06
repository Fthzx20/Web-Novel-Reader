package main

import (
	"database/sql"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/lib/pq"
)

type AppRepository struct {
	store *Store
	db    *sql.DB
	cache struct {
		mu          sync.RWMutex
		novels      []*Novel
		lastFetched time.Time
		ttl         time.Duration
	}
}

func NewAppRepository(store *Store, db *sql.DB) *AppRepository {
	repo := &AppRepository{store: store, db: db}
	repo.cache.ttl = 30 * time.Second
	return repo
}

func (r *AppRepository) ListNovels() []*Novel {
	r.cache.mu.RLock()
	if time.Since(r.cache.lastFetched) < r.cache.ttl && r.cache.novels != nil {
		cached := r.cache.novels
		r.cache.mu.RUnlock()
		return cached
	}
	r.cache.mu.RUnlock()

	rows, err := r.db.Query(
		`SELECT id, slug, title, author, summary, tags, cover_url, status, created_at, updated_at
		 FROM novels
		 ORDER BY updated_at DESC, id DESC`,
	)
	if err != nil {
		return []*Novel{}
	}
	defer rows.Close()

	items := make([]*Novel, 0)
	for rows.Next() {
		var novel Novel
		var tags []string
		if err := rows.Scan(
			&novel.ID,
			&novel.Slug,
			&novel.Title,
			&novel.Author,
			&novel.Summary,
			pq.Array(&tags),
			&novel.CoverURL,
			&novel.Status,
			&novel.CreatedAt,
			&novel.UpdatedAt,
		); err != nil {
			continue
		}
		novel.Tags = tags
		items = append(items, &novel)
	}

	r.cache.mu.Lock()
	r.cache.novels = items
	r.cache.lastFetched = time.Now()
	r.cache.mu.Unlock()

	return items
}

func (r *AppRepository) GetNovel(id int) (*Novel, error) {
	var novel Novel
	var tags []string
	err := r.db.QueryRow(
		`SELECT id, slug, title, author, summary, tags, cover_url, status, created_at, updated_at
		 FROM novels WHERE id = $1`,
		id,
	).Scan(
		&novel.ID,
		&novel.Slug,
		&novel.Title,
		&novel.Author,
		&novel.Summary,
		pq.Array(&tags),
		&novel.CoverURL,
		&novel.Status,
		&novel.CreatedAt,
		&novel.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}
	novel.Tags = tags
	return &novel, nil
}

func (r *AppRepository) CreateNovel(input NovelInput) (*Novel, error) {
	now := time.Now()
	slug := strings.TrimSpace(input.Slug)
	if slug == "" {
		slug = slugify(input.Title)
	}
	var novel Novel
	novel.Slug = slug
	novel.Title = strings.TrimSpace(input.Title)
	novel.Author = strings.TrimSpace(input.Author)
	novel.Summary = strings.TrimSpace(input.Summary)
	novel.Tags = input.Tags
	novel.CoverURL = strings.TrimSpace(input.CoverURL)
	novel.Status = strings.TrimSpace(input.Status)
	novel.CreatedAt = now
	novel.UpdatedAt = now

	err := r.db.QueryRow(
		`INSERT INTO novels (slug, title, author, summary, tags, cover_url, status, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id`,
		novel.Slug,
		novel.Title,
		novel.Author,
		novel.Summary,
		pq.Array(novel.Tags),
		novel.CoverURL,
		novel.Status,
		novel.CreatedAt,
		novel.UpdatedAt,
	).Scan(&novel.ID)
	if err != nil {
		return nil, err
	}
	r.invalidateNovelsCache()
	return &novel, nil
}

func (r *AppRepository) UpdateNovel(id int, input NovelInput) (*Novel, error) {
	current, err := r.GetNovel(id)
	if err != nil {
		return nil, err
	}
	current.Title = strings.TrimSpace(input.Title)
	current.Author = strings.TrimSpace(input.Author)
	current.Summary = strings.TrimSpace(input.Summary)
	current.Tags = input.Tags
	current.CoverURL = strings.TrimSpace(input.CoverURL)
	current.Status = strings.TrimSpace(input.Status)
	if strings.TrimSpace(input.Slug) != "" {
		current.Slug = strings.TrimSpace(input.Slug)
	}
	current.UpdatedAt = time.Now()

	_, err = r.db.Exec(
		`UPDATE novels
		 SET slug = $1, title = $2, author = $3, summary = $4, tags = $5, cover_url = $6, status = $7, updated_at = $8
		 WHERE id = $9`,
		current.Slug,
		current.Title,
		current.Author,
		current.Summary,
		pq.Array(current.Tags),
		current.CoverURL,
		current.Status,
		current.UpdatedAt,
		id,
	)
	if err != nil {
		return nil, err
	}
	r.invalidateNovelsCache()
	return current, nil
}

func (r *AppRepository) DeleteNovel(id int) error {
	result, err := r.db.Exec("DELETE FROM novels WHERE id = $1", id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return errNotFound
	}
	r.invalidateNovelsCache()
	return nil
}

func (r *AppRepository) ListChaptersByNovel(novelID int) ([]*Chapter, error) {
	rows, err := r.db.Query(
		`SELECT id, novel_id, number, title, content, word_count, created_at, updated_at
		 FROM chapters
		 WHERE novel_id = $1
		 ORDER BY number ASC`,
		novelID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*Chapter, 0)
	for rows.Next() {
		var chapter Chapter
		if err := rows.Scan(
			&chapter.ID,
			&chapter.NovelID,
			&chapter.Number,
			&chapter.Title,
			&chapter.Content,
			&chapter.WordCount,
			&chapter.CreatedAt,
			&chapter.UpdatedAt,
		); err != nil {
			continue
		}
		items = append(items, &chapter)
	}
	return items, nil
}

func (r *AppRepository) GetChapter(id int) (*Chapter, error) {
	var chapter Chapter
	err := r.db.QueryRow(
		`SELECT id, novel_id, number, title, content, word_count, created_at, updated_at
		 FROM chapters WHERE id = $1`,
		id,
	).Scan(
		&chapter.ID,
		&chapter.NovelID,
		&chapter.Number,
		&chapter.Title,
		&chapter.Content,
		&chapter.WordCount,
		&chapter.CreatedAt,
		&chapter.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}
	return &chapter, nil
}

func (r *AppRepository) CreateChapter(novelID int, input ChapterInput) (*Chapter, error) {
	if _, err := r.GetNovel(novelID); err != nil {
		return nil, err
	}
	now := time.Now()
	chapter := &Chapter{
		NovelID:   novelID,
		Number:    input.Number,
		Title:     strings.TrimSpace(input.Title),
		Content:   strings.TrimSpace(input.Content),
		WordCount: len(strings.Fields(input.Content)),
		CreatedAt: now,
		UpdatedAt: now,
	}

	err := r.db.QueryRow(
		`INSERT INTO chapters (novel_id, number, title, content, word_count, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id`,
		chapter.NovelID,
		chapter.Number,
		chapter.Title,
		chapter.Content,
		chapter.WordCount,
		chapter.CreatedAt,
		chapter.UpdatedAt,
	).Scan(&chapter.ID)
	if err != nil {
		return nil, err
	}
	return chapter, nil
}

func (r *AppRepository) UpdateChapter(id int, input ChapterInput) (*Chapter, error) {
	chapter, err := r.GetChapter(id)
	if err != nil {
		return nil, err
	}
	chapter.Number = input.Number
	chapter.Title = strings.TrimSpace(input.Title)
	chapter.Content = strings.TrimSpace(input.Content)
	chapter.WordCount = len(strings.Fields(input.Content))
	chapter.UpdatedAt = time.Now()

	_, err = r.db.Exec(
		`UPDATE chapters SET number = $1, title = $2, content = $3, word_count = $4, updated_at = $5 WHERE id = $6`,
		chapter.Number,
		chapter.Title,
		chapter.Content,
		chapter.WordCount,
		chapter.UpdatedAt,
		chapter.ID,
	)
	if err != nil {
		return nil, err
	}
	return chapter, nil
}

func (r *AppRepository) DeleteChapter(id int) error {
	result, err := r.db.Exec("DELETE FROM chapters WHERE id = $1", id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return errNotFound
	}
	return nil
}

func (r *AppRepository) ListCommentsByChapter(chapterID int) ([]*Comment, error) {
	rows, err := r.db.Query(
		`SELECT id, chapter_id, user_id, body, created_at
		 FROM comments WHERE chapter_id = $1
		 ORDER BY created_at DESC`,
		chapterID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*Comment, 0)
	for rows.Next() {
		var comment Comment
		if err := rows.Scan(
			&comment.ID,
			&comment.ChapterID,
			&comment.UserID,
			&comment.Body,
			&comment.CreatedAt,
		); err != nil {
			continue
		}
		items = append(items, &comment)
	}
	return items, nil
}

func (r *AppRepository) CreateComment(chapterID int, input CommentInput) (*Comment, error) {
	now := time.Now()
	comment := &Comment{
		ChapterID: chapterID,
		UserID:    input.UserID,
		Body:      strings.TrimSpace(input.Body),
		CreatedAt: now,
	}
	if comment.Body == "" {
		return nil, errors.New("comment body required")
	}

	err := r.db.QueryRow(
		`INSERT INTO comments (chapter_id, user_id, body, created_at)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id`,
		comment.ChapterID,
		comment.UserID,
		comment.Body,
		comment.CreatedAt,
	).Scan(&comment.ID)
	if err != nil {
		return nil, err
	}
	return comment, nil
}

func (r *AppRepository) ListRatingsByNovel(novelID int) ([]*Rating, error) {
	rows, err := r.db.Query(
		`SELECT id, novel_id, user_id, score, note, at
		 FROM ratings WHERE novel_id = $1
		 ORDER BY at DESC`,
		novelID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*Rating, 0)
	for rows.Next() {
		var rating Rating
		if err := rows.Scan(
			&rating.ID,
			&rating.NovelID,
			&rating.UserID,
			&rating.Score,
			&rating.Note,
			&rating.At,
		); err != nil {
			continue
		}
		items = append(items, &rating)
	}
	return items, nil
}

func (r *AppRepository) CreateRating(novelID int, input RatingInput) (*Rating, error) {
	now := time.Now()
	rating := &Rating{
		NovelID: novelID,
		UserID:  input.UserID,
		Score:   input.Score,
		Note:    strings.TrimSpace(input.Note),
		At:      now,
	}

	err := r.db.QueryRow(
		`INSERT INTO ratings (novel_id, user_id, score, note, at)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (novel_id, user_id)
		 DO UPDATE SET score = EXCLUDED.score, note = EXCLUDED.note, at = EXCLUDED.at
		 RETURNING id`,
		rating.NovelID,
		rating.UserID,
		rating.Score,
		rating.Note,
		rating.At,
	).Scan(&rating.ID)
	if err != nil {
		return nil, err
	}
	return rating, nil
}

func (r *AppRepository) ListUsers() []*User {
	return r.store.ListUsers()
}

func (r *AppRepository) CreateUser(name, role string) (*User, error) {
	return r.store.CreateUser(name, role)
}

func (r *AppRepository) CreateAuthUser(input AuthRegisterInput) (*AuthUser, error) {
	email := normalizeEmail(input.Email)
	if email == "" {
		return nil, errors.New("email required")
	}
	var existingID int
	checkErr := r.db.QueryRow("SELECT id FROM auth_users WHERE email = $1", email).Scan(&existingID)
	if checkErr == nil {
		return nil, errConflict
	}
	if checkErr != nil && !errors.Is(checkErr, sql.ErrNoRows) {
		return nil, checkErr
	}

	hash, err := hashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	name := strings.TrimSpace(input.Name)
	role := "user"
	if strings.TrimSpace(input.Role) != "" {
		role = strings.TrimSpace(input.Role)
	}
	createdAt := time.Now()

	var user AuthUser
	user.Role = role
	user.CreatedAt = createdAt
	user.Email = email
	user.Name = name
	user.PasswordHash = hash

	err = r.db.QueryRow(
		`INSERT INTO auth_users (name, email, password_hash, role, created_at)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id`,
		name, email, hash, role, createdAt,
	).Scan(&user.ID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *AppRepository) GetAuthUserByEmail(email string) (*AuthUser, error) {
	key := normalizeEmail(email)
	if key == "" {
		return nil, errNotFound
	}
	var user AuthUser
	err := r.db.QueryRow(
		`SELECT id, name, email, password_hash, role, created_at
		 FROM auth_users WHERE email = $1`,
		key,
	).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *AppRepository) ListReadingHistory(userID int) []*ReadingHistory {
	rows, err := r.db.Query(
		`SELECT id, user_id, novel_slug, novel_title, chapter_id, chapter_title, read_at
		 FROM reading_history
		 WHERE user_id = $1
		 ORDER BY read_at DESC`,
		userID,
	)
	if err != nil {
		return []*ReadingHistory{}
	}
	defer rows.Close()

	items := make([]*ReadingHistory, 0)
	for rows.Next() {
		var entry ReadingHistory
		if err := rows.Scan(
			&entry.ID,
			&entry.UserID,
			&entry.NovelSlug,
			&entry.NovelTitle,
			&entry.ChapterID,
			&entry.ChapterTitle,
			&entry.ReadAt,
		); err != nil {
			continue
		}
		items = append(items, &entry)
	}
	return items
}

func (r *AppRepository) AddReadingHistory(userID int, input ReadingHistoryInput) (*ReadingHistory, error) {
	entry := &ReadingHistory{
		UserID:       userID,
		NovelSlug:    strings.TrimSpace(input.NovelSlug),
		NovelTitle:   strings.TrimSpace(input.NovelTitle),
		ChapterID:    input.ChapterID,
		ChapterTitle: strings.TrimSpace(input.ChapterTitle),
		ReadAt:       time.Now(),
	}

	err := r.db.QueryRow(
		`INSERT INTO reading_history (user_id, novel_slug, novel_title, chapter_id, chapter_title, read_at)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id`,
		entry.UserID, entry.NovelSlug, entry.NovelTitle, entry.ChapterID, entry.ChapterTitle, entry.ReadAt,
	).Scan(&entry.ID)
	if err != nil {
		return nil, err
	}
	return entry, nil
}

func (r *AppRepository) ListFollows(userID int) []*Follow {
	rows, err := r.db.Query(
		`SELECT id, user_id, novel_id, created_at
		 FROM follows WHERE user_id = $1
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return []*Follow{}
	}
	defer rows.Close()
	items := make([]*Follow, 0)
	for rows.Next() {
		var item Follow
		if err := rows.Scan(&item.ID, &item.UserID, &item.NovelID, &item.CreatedAt); err != nil {
			continue
		}
		items = append(items, &item)
	}
	return items
}

func (r *AppRepository) AddFollow(userID int, novelID int) (*Follow, error) {
	entry := &Follow{UserID: userID, NovelID: novelID, CreatedAt: time.Now()}
	err := r.db.QueryRow(
		`INSERT INTO follows (user_id, novel_id, created_at)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (user_id, novel_id) DO UPDATE SET created_at = EXCLUDED.created_at
		 RETURNING id`,
		entry.UserID,
		entry.NovelID,
		entry.CreatedAt,
	).Scan(&entry.ID)
	if err != nil {
		return nil, err
	}
	return entry, nil
}

func (r *AppRepository) RemoveFollow(userID int, novelID int) error {
	result, err := r.db.Exec("DELETE FROM follows WHERE user_id = $1 AND novel_id = $2", userID, novelID)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return errNotFound
	}
	return nil
}

func (r *AppRepository) ListBookmarks(userID int) []*Bookmark {
	rows, err := r.db.Query(
		`SELECT id, user_id, novel_id, created_at
		 FROM bookmarks WHERE user_id = $1
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return []*Bookmark{}
	}
	defer rows.Close()
	items := make([]*Bookmark, 0)
	for rows.Next() {
		var item Bookmark
		if err := rows.Scan(&item.ID, &item.UserID, &item.NovelID, &item.CreatedAt); err != nil {
			continue
		}
		items = append(items, &item)
	}
	return items
}

func (r *AppRepository) AddBookmark(userID int, novelID int) (*Bookmark, error) {
	entry := &Bookmark{UserID: userID, NovelID: novelID, CreatedAt: time.Now()}
	err := r.db.QueryRow(
		`INSERT INTO bookmarks (user_id, novel_id, created_at)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (user_id, novel_id) DO UPDATE SET created_at = EXCLUDED.created_at
		 RETURNING id`,
		entry.UserID,
		entry.NovelID,
		entry.CreatedAt,
	).Scan(&entry.ID)
	if err != nil {
		return nil, err
	}
	return entry, nil
}

func (r *AppRepository) RemoveBookmark(userID int, novelID int) error {
	result, err := r.db.Exec("DELETE FROM bookmarks WHERE user_id = $1 AND novel_id = $2", userID, novelID)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return errNotFound
	}
	return nil
}

func (r *AppRepository) invalidateNovelsCache() {
	r.cache.mu.Lock()
	r.cache.novels = nil
	r.cache.lastFetched = time.Time{}
	r.cache.mu.Unlock()
}

func (r *AppRepository) GetSiteSettings() (*SiteSettings, error) {
	var settings SiteSettings
	err := r.db.QueryRow(
		`SELECT id, title, tagline, logo_url, updated_at FROM site_settings WHERE id = 1`,
	).Scan(&settings.ID, &settings.Title, &settings.Tagline, &settings.LogoURL, &settings.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return &SiteSettings{ID: 1, Title: "Nocturne Shelf", Tagline: "A minimalist novel reader.", LogoURL: "", UpdatedAt: time.Now()}, nil
		}
		return nil, err
	}
	return &settings, nil
}

func (r *AppRepository) UpdateSiteSettings(input SiteSettingsInput) (*SiteSettings, error) {
	settings := &SiteSettings{
		ID:        1,
		Title:     strings.TrimSpace(input.Title),
		Tagline:   strings.TrimSpace(input.Tagline),
		LogoURL:   strings.TrimSpace(input.LogoURL),
		UpdatedAt: time.Now(),
	}
	_, err := r.db.Exec(
		`INSERT INTO site_settings (id, title, tagline, logo_url, updated_at)
		 VALUES (1, $1, $2, $3, $4)
		 ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, tagline = EXCLUDED.tagline, logo_url = EXCLUDED.logo_url, updated_at = EXCLUDED.updated_at`,
		settings.Title,
		settings.Tagline,
		settings.LogoURL,
		settings.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return settings, nil
}

func (r *AppRepository) ListAnnouncements() []*Announcement {
	rows, err := r.db.Query(
		`SELECT id, title, body, created_at FROM announcements ORDER BY created_at DESC`,
	)
	if err != nil {
		return []*Announcement{}
	}
	defer rows.Close()
	items := make([]*Announcement, 0)
	for rows.Next() {
		var item Announcement
		if err := rows.Scan(&item.ID, &item.Title, &item.Body, &item.CreatedAt); err != nil {
			continue
		}
		items = append(items, &item)
	}
	return items
}

func (r *AppRepository) CreateAnnouncement(input AnnouncementInput) (*Announcement, error) {
	item := &Announcement{
		Title:     strings.TrimSpace(input.Title),
		Body:      strings.TrimSpace(input.Body),
		CreatedAt: time.Now(),
	}
	err := r.db.QueryRow(
		`INSERT INTO announcements (title, body, created_at) VALUES ($1, $2, $3) RETURNING id`,
		item.Title,
		item.Body,
		item.CreatedAt,
	).Scan(&item.ID)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (r *AppRepository) UpdateAnnouncement(id int, input AnnouncementInput) (*Announcement, error) {
	item := &Announcement{
		ID:        id,
		Title:     strings.TrimSpace(input.Title),
		Body:      strings.TrimSpace(input.Body),
		CreatedAt: time.Now(),
	}
	result, err := r.db.Exec(
		`UPDATE announcements SET title = $1, body = $2 WHERE id = $3`,
		item.Title,
		item.Body,
		item.ID,
	)
	if err != nil {
		return nil, err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return nil, errNotFound
	}
	return item, nil
}

func (r *AppRepository) DeleteAnnouncement(id int) error {
	result, err := r.db.Exec("DELETE FROM announcements WHERE id = $1", id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return errNotFound
	}
	return nil
}

func (r *AppRepository) ListReleaseQueue() ([]*ReleaseQueueItem, error) {
	rows, err := r.db.Query(
		`SELECT rq.id, rq.novel_id, n.title, rq.chapter_number, rq.title, rq.status, rq.eta, rq.notes, rq.created_at, rq.updated_at
		 FROM release_queue rq
		 JOIN novels n ON n.id = rq.novel_id
		 ORDER BY rq.created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*ReleaseQueueItem, 0)
	for rows.Next() {
		var item ReleaseQueueItem
		if err := rows.Scan(
			&item.ID,
			&item.NovelID,
			&item.NovelTitle,
			&item.ChapterNumber,
			&item.Title,
			&item.Status,
			&item.Eta,
			&item.Notes,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			continue
		}
		items = append(items, &item)
	}
	return items, nil
}

func (r *AppRepository) CreateReleaseQueue(input ReleaseQueueInput) (*ReleaseQueueItem, error) {
	if input.NovelID <= 0 {
		return nil, errNotFound
	}
	if _, err := r.GetNovel(input.NovelID); err != nil {
		return nil, err
	}
	if strings.TrimSpace(input.Title) == "" || input.ChapterNumber <= 0 {
		return nil, errors.New("title and chapterNumber required")
	}
	status := strings.TrimSpace(input.Status)
	if status == "" {
		status = "Queued"
	}
	item := &ReleaseQueueItem{
		NovelID:       input.NovelID,
		ChapterNumber: input.ChapterNumber,
		Title:         strings.TrimSpace(input.Title),
		Status:        status,
		Eta:           strings.TrimSpace(input.Eta),
		Notes:         strings.TrimSpace(input.Notes),
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := r.db.QueryRow(
		`INSERT INTO release_queue (novel_id, chapter_number, title, status, eta, notes, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id`,
		item.NovelID,
		item.ChapterNumber,
		item.Title,
		item.Status,
		item.Eta,
		item.Notes,
		item.CreatedAt,
		item.UpdatedAt,
	).Scan(&item.ID); err != nil {
		return nil, err
	}

	if err := r.db.QueryRow(
		`SELECT title FROM novels WHERE id = $1`,
		item.NovelID,
	).Scan(&item.NovelTitle); err != nil {
		return nil, err
	}

	return item, nil
}

func (r *AppRepository) UpdateReleaseQueueStatus(id int, status string) (*ReleaseQueueItem, error) {
	status = strings.TrimSpace(status)
	if status == "" {
		return nil, errors.New("status required")
	}
	item := &ReleaseQueueItem{}
	item.Status = status
	item.UpdatedAt = time.Now()

	result, err := r.db.Exec(
		`UPDATE release_queue SET status = $1, updated_at = $2 WHERE id = $3`,
		item.Status,
		item.UpdatedAt,
		id,
	)
	if err != nil {
		return nil, err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return nil, errNotFound
	}

	row := r.db.QueryRow(
		`SELECT rq.id, rq.novel_id, n.title, rq.chapter_number, rq.title, rq.status, rq.eta, rq.notes, rq.created_at, rq.updated_at
		 FROM release_queue rq
		 JOIN novels n ON n.id = rq.novel_id
		 WHERE rq.id = $1`,
		id,
	)
	if err := row.Scan(
		&item.ID,
		&item.NovelID,
		&item.NovelTitle,
		&item.ChapterNumber,
		&item.Title,
		&item.Status,
		&item.Eta,
		&item.Notes,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return item, nil
}

func (r *AppRepository) DeleteReleaseQueue(id int) error {
	result, err := r.db.Exec("DELETE FROM release_queue WHERE id = $1", id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return errNotFound
	}
	return nil
}

func (r *AppRepository) ListModerationReports() ([]*ModerationReport, error) {
	rows, err := r.db.Query(
		`SELECT r.id,
		 COALESCE(r.novel_id, 0),
		 COALESCE(n.title, r.novel_title, ''),
		 r.note,
		 r.created_at
		 FROM moderation_reports r
		 LEFT JOIN novels n ON n.id = r.novel_id
		 ORDER BY r.created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]*ModerationReport, 0)
	for rows.Next() {
		var item ModerationReport
		if err := rows.Scan(
			&item.ID,
			&item.NovelID,
			&item.NovelTitle,
			&item.Note,
			&item.CreatedAt,
		); err != nil {
			continue
		}
		items = append(items, &item)
	}
	return items, nil
}

func (r *AppRepository) CreateModerationReport(input ModerationReportInput) (*ModerationReport, error) {
	if strings.TrimSpace(input.Note) == "" {
		return nil, errors.New("note required")
	}
	createdAt := time.Now()
	item := &ModerationReport{
		NovelID:    input.NovelID,
		NovelTitle: strings.TrimSpace(input.NovelTitle),
		Note:       strings.TrimSpace(input.Note),
		CreatedAt:  createdAt,
	}
	var novelID sql.NullInt64
	if input.NovelID > 0 {
		novelID = sql.NullInt64{Int64: int64(input.NovelID), Valid: true}
	}

	err := r.db.QueryRow(
		`INSERT INTO moderation_reports (novel_id, novel_title, note, created_at)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id`,
		novelID,
		item.NovelTitle,
		item.Note,
		item.CreatedAt,
	).Scan(&item.ID)
	if err != nil {
		return nil, err
	}

	if item.NovelID == 0 && novelID.Valid {
		item.NovelID = int(novelID.Int64)
	}
	return item, nil
}

func (r *AppRepository) DeleteModerationReport(id int) error {
	result, err := r.db.Exec("DELETE FROM moderation_reports WHERE id = $1", id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return errNotFound
	}
	return nil
}

func (r *AppRepository) CreateIllustration(input IllustrationInput) (*Illustration, error) {
	now := time.Now()
	illustration := &Illustration{
		URL:          strings.TrimSpace(input.URL),
		OriginalName: strings.TrimSpace(input.OriginalName),
		CreatedAt:    now,
	}
	if illustration.URL == "" || illustration.OriginalName == "" {
		return nil, errors.New("invalid illustration input")
	}
	err := r.db.QueryRow(
		`INSERT INTO illustrations (url, original_name, created_at)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		illustration.URL,
		illustration.OriginalName,
		illustration.CreatedAt,
	).Scan(&illustration.ID)
	if err != nil {
		return nil, err
	}
	return illustration, nil
}