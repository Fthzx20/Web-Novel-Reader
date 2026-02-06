package main

import (
	"errors"
	"sort"
	"strings"
	"sync"
	"time"
)

var errNotFound = errors.New("not found")
var errConflict = errors.New("conflict")

type Store struct {
	mu            sync.RWMutex
	nextNovelID   int
	nextChapterID int
	nextCommentID int
	nextRatingID  int
	nextUserID    int
	nextAuthUserID int
	nextHistoryID int
	nextFollowID int
	nextBookmarkID int
	novels        map[int]*Novel
	chapters      map[int]*Chapter
	comments      map[int]*Comment
	ratings       map[int]*Rating
	users         map[int]*User
	authUsers     map[int]*AuthUser
	authUsersByEmail map[string]int
	history       map[int]*ReadingHistory
	follows       map[int]*Follow
	bookmarks     map[int]*Bookmark
	settings      *SiteSettings
	announcements map[int]*Announcement
	nextAnnouncementID int
}

func NewStore() *Store {
	s := &Store{
		nextNovelID:   1,
		nextChapterID: 1,
		nextCommentID: 1,
		nextRatingID:  1,
		nextUserID:    1,
		nextAuthUserID: 1,
		nextHistoryID: 1,
		nextFollowID: 1,
		nextBookmarkID: 1,
		novels:        make(map[int]*Novel),
		chapters:      make(map[int]*Chapter),
		comments:      make(map[int]*Comment),
		ratings:       make(map[int]*Rating),
		users:         make(map[int]*User),
		authUsers:     make(map[int]*AuthUser),
		authUsersByEmail: make(map[string]int),
		history:       make(map[int]*ReadingHistory),
		follows:       make(map[int]*Follow),
		bookmarks:     make(map[int]*Bookmark),
		announcements: make(map[int]*Announcement),
		nextAnnouncementID: 1,
	}
	s.seed()
	return s
}

func (s *Store) seed() {
	admin, _ := s.CreateUser("Admin", "admin")
	novel, _ := s.CreateNovel(NovelInput{
		Title:   "Iron Verse",
		Author:  "A. Rahman",
		Summary: "A courier maps the quiet war between city-states and spirits.",
		Tags:    []string{"Mythpunk", "War", "Found Family"},
		Status:  "ongoing",
		Slug:    "iron-verse",
	})

	chapter, _ := s.CreateChapter(novel.ID, ChapterInput{
		Number:  1,
		Title:   "The Cipher District",
		Content: "Neon rain ran down the archive walls as the courier listened.",
	})

	s.CreateComment(chapter.ID, CommentInput{UserID: admin.ID, Body: "Welcome to the first chapter."})
	s.CreateRating(novel.ID, RatingInput{UserID: admin.ID, Score: 5, Note: "Launch day."})
}

func (s *Store) CreateAuthUser(input AuthRegisterInput) (*AuthUser, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	email := normalizeEmail(input.Email)
	if email == "" {
		return nil, errors.New("email required")
	}
	if _, ok := s.authUsersByEmail[email]; ok {
		return nil, errConflict
	}
	hash, err := hashPassword(input.Password)
	if err != nil {
		return nil, err
	}
	role := "user"
	if strings.TrimSpace(input.Role) != "" {
		role = strings.TrimSpace(input.Role)
	}
	user := &AuthUser{
		ID:           s.nextAuthUserID,
		Name:         strings.TrimSpace(input.Name),
		Email:        email,
		PasswordHash: hash,
		Role:         role,
		CreatedAt:    time.Now(),
	}
	s.authUsers[user.ID] = user
	s.authUsersByEmail[email] = user.ID
	s.nextAuthUserID++
	return user, nil
}

func (s *Store) GetAuthUserByEmail(email string) (*AuthUser, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	key := normalizeEmail(email)
	if key == "" {
		return nil, errNotFound
	}
	userID, ok := s.authUsersByEmail[key]
	if !ok {
		return nil, errNotFound
	}
	user, ok := s.authUsers[userID]
	if !ok {
		return nil, errNotFound
	}
	return user, nil
}

func (s *Store) ListReadingHistory(userID int) []*ReadingHistory {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]*ReadingHistory, 0)
	for _, entry := range s.history {
		if entry.UserID == userID {
			items = append(items, entry)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ReadAt.After(items[j].ReadAt) })
	return items
}

func (s *Store) AddReadingHistory(userID int, input ReadingHistoryInput) (*ReadingHistory, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	entry := &ReadingHistory{
		ID:           s.nextHistoryID,
		UserID:       userID,
		NovelSlug:    strings.TrimSpace(input.NovelSlug),
		NovelTitle:   strings.TrimSpace(input.NovelTitle),
		ChapterID:    input.ChapterID,
		ChapterTitle: strings.TrimSpace(input.ChapterTitle),
		ReadAt:       time.Now(),
	}
	s.history[entry.ID] = entry
	s.nextHistoryID++
	return entry, nil
}

func (s *Store) ListFollows(userID int) []*Follow {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]*Follow, 0)
	for _, entry := range s.follows {
		if entry.UserID == userID {
			items = append(items, entry)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt.After(items[j].CreatedAt) })
	return items
}

func (s *Store) AddFollow(userID int, novelID int) (*Follow, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, entry := range s.follows {
		if entry.UserID == userID && entry.NovelID == novelID {
			entry.CreatedAt = time.Now()
			return entry, nil
		}
	}
	entry := &Follow{
		ID:        s.nextFollowID,
		UserID:    userID,
		NovelID:   novelID,
		CreatedAt: time.Now(),
	}
	s.follows[entry.ID] = entry
	s.nextFollowID++
	return entry, nil
}

func (s *Store) RemoveFollow(userID int, novelID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for id, entry := range s.follows {
		if entry.UserID == userID && entry.NovelID == novelID {
			delete(s.follows, id)
			return nil
		}
	}
	return errNotFound
}

func (s *Store) ListBookmarks(userID int) []*Bookmark {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]*Bookmark, 0)
	for _, entry := range s.bookmarks {
		if entry.UserID == userID {
			items = append(items, entry)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt.After(items[j].CreatedAt) })
	return items
}

func (s *Store) AddBookmark(userID int, novelID int) (*Bookmark, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, entry := range s.bookmarks {
		if entry.UserID == userID && entry.NovelID == novelID {
			entry.CreatedAt = time.Now()
			return entry, nil
		}
	}
	entry := &Bookmark{
		ID:        s.nextBookmarkID,
		UserID:    userID,
		NovelID:   novelID,
		CreatedAt: time.Now(),
	}
	s.bookmarks[entry.ID] = entry
	s.nextBookmarkID++
	return entry, nil
}

func (s *Store) RemoveBookmark(userID int, novelID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for id, entry := range s.bookmarks {
		if entry.UserID == userID && entry.NovelID == novelID {
			delete(s.bookmarks, id)
			return nil
		}
	}
	return errNotFound
}

func (s *Store) GetSiteSettings() (*SiteSettings, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.settings == nil {
		return &SiteSettings{ID: 1, Title: "Nocturne Shelf", Tagline: "A minimalist novel reader.", LogoURL: "", UpdatedAt: time.Now()}, nil
	}
	return s.settings, nil
}

func (s *Store) UpdateSiteSettings(input SiteSettingsInput) (*SiteSettings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.settings = &SiteSettings{
		ID:        1,
		Title:     strings.TrimSpace(input.Title),
		Tagline:   strings.TrimSpace(input.Tagline),
		LogoURL:   strings.TrimSpace(input.LogoURL),
		UpdatedAt: time.Now(),
	}
	return s.settings, nil
}

func (s *Store) ListAnnouncements() []*Announcement {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]*Announcement, 0)
	for _, item := range s.announcements {
		items = append(items, item)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt.After(items[j].CreatedAt) })
	return items
}

func (s *Store) CreateAnnouncement(input AnnouncementInput) (*Announcement, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	item := &Announcement{
		ID:        s.nextAnnouncementID,
		Title:     strings.TrimSpace(input.Title),
		Body:      strings.TrimSpace(input.Body),
		CreatedAt: time.Now(),
	}
	s.announcements[item.ID] = item
	s.nextAnnouncementID++
	return item, nil
}

func (s *Store) UpdateAnnouncement(id int, input AnnouncementInput) (*Announcement, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	item, ok := s.announcements[id]
	if !ok {
		return nil, errNotFound
	}
	item.Title = strings.TrimSpace(input.Title)
	item.Body = strings.TrimSpace(input.Body)
	return item, nil
}

func (s *Store) DeleteAnnouncement(id int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.announcements[id]; !ok {
		return errNotFound
	}
	delete(s.announcements, id)
	return nil
}

func (s *Store) ListNovels() []*Novel {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]*Novel, 0, len(s.novels))
	for _, novel := range s.novels {
		items = append(items, novel)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	return items
}

func (s *Store) GetNovel(id int) (*Novel, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	novel, ok := s.novels[id]
	if !ok {
		return nil, errNotFound
	}
	return novel, nil
}

func (s *Store) CreateNovel(input NovelInput) (*Novel, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	novel := &Novel{
		ID:        s.nextNovelID,
		Slug:      strings.TrimSpace(input.Slug),
		Title:     strings.TrimSpace(input.Title),
		Author:    strings.TrimSpace(input.Author),
		Summary:   strings.TrimSpace(input.Summary),
		Tags:      input.Tags,
		CoverURL:  strings.TrimSpace(input.CoverURL),
		Status:    strings.TrimSpace(input.Status),
		CreatedAt: now,
		UpdatedAt: now,
	}
	if novel.Slug == "" {
		novel.Slug = slugify(novel.Title)
	}
	s.novels[novel.ID] = novel
	s.nextNovelID++
	return novel, nil
}

func (s *Store) UpdateNovel(id int, input NovelInput) (*Novel, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	novel, ok := s.novels[id]
	if !ok {
		return nil, errNotFound
	}
	novel.Title = strings.TrimSpace(input.Title)
	novel.Author = strings.TrimSpace(input.Author)
	novel.Summary = strings.TrimSpace(input.Summary)
	novel.Tags = input.Tags
	novel.CoverURL = strings.TrimSpace(input.CoverURL)
	novel.Status = strings.TrimSpace(input.Status)
	if input.Slug != "" {
		novel.Slug = strings.TrimSpace(input.Slug)
	}
	novel.UpdatedAt = time.Now()
	return novel, nil
}

func (s *Store) DeleteNovel(id int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.novels[id]; !ok {
		return errNotFound
	}
	delete(s.novels, id)
	for chapterID, chapter := range s.chapters {
		if chapter.NovelID == id {
			delete(s.chapters, chapterID)
			for commentID, comment := range s.comments {
				if comment.ChapterID == chapterID {
					delete(s.comments, commentID)
				}
			}
		}
	}
	for ratingID, rating := range s.ratings {
		if rating.NovelID == id {
			delete(s.ratings, ratingID)
		}
	}
	return nil
}

func (s *Store) ListChaptersByNovel(novelID int) ([]*Chapter, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if _, ok := s.novels[novelID]; !ok {
		return nil, errNotFound
	}
	items := make([]*Chapter, 0)
	for _, chapter := range s.chapters {
		if chapter.NovelID == novelID {
			items = append(items, chapter)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].Number < items[j].Number })
	return items, nil
}

func (s *Store) GetChapter(id int) (*Chapter, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	chapter, ok := s.chapters[id]
	if !ok {
		return nil, errNotFound
	}
	return chapter, nil
}

func (s *Store) CreateChapter(novelID int, input ChapterInput) (*Chapter, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.novels[novelID]; !ok {
		return nil, errNotFound
	}
	now := time.Now()
	chapter := &Chapter{
		ID:        s.nextChapterID,
		NovelID:   novelID,
		Number:    input.Number,
		Title:     strings.TrimSpace(input.Title),
		Content:   strings.TrimSpace(input.Content),
		WordCount: len(strings.Fields(input.Content)),
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.chapters[chapter.ID] = chapter
	s.nextChapterID++
	return chapter, nil
}

func (s *Store) UpdateChapter(id int, input ChapterInput) (*Chapter, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	chapter, ok := s.chapters[id]
	if !ok {
		return nil, errNotFound
	}
	chapter.Number = input.Number
	chapter.Title = strings.TrimSpace(input.Title)
	chapter.Content = strings.TrimSpace(input.Content)
	chapter.WordCount = len(strings.Fields(input.Content))
	chapter.UpdatedAt = time.Now()
	return chapter, nil
}

func (s *Store) DeleteChapter(id int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.chapters[id]; !ok {
		return errNotFound
	}
	delete(s.chapters, id)
	for commentID, comment := range s.comments {
		if comment.ChapterID == id {
			delete(s.comments, commentID)
		}
	}
	return nil
}

func (s *Store) ListCommentsByChapter(chapterID int) ([]*Comment, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if _, ok := s.chapters[chapterID]; !ok {
		return nil, errNotFound
	}
	items := make([]*Comment, 0)
	for _, comment := range s.comments {
		if comment.ChapterID == chapterID {
			items = append(items, comment)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	return items, nil
}

func (s *Store) CreateComment(chapterID int, input CommentInput) (*Comment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.chapters[chapterID]; !ok {
		return nil, errNotFound
	}
	comment := &Comment{
		ID:        s.nextCommentID,
		ChapterID: chapterID,
		UserID:    input.UserID,
		Body:      strings.TrimSpace(input.Body),
		CreatedAt: time.Now(),
	}
	s.comments[comment.ID] = comment
	s.nextCommentID++
	return comment, nil
}

func (s *Store) ListRatingsByNovel(novelID int) ([]*Rating, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if _, ok := s.novels[novelID]; !ok {
		return nil, errNotFound
	}
	items := make([]*Rating, 0)
	for _, rating := range s.ratings {
		if rating.NovelID == novelID {
			items = append(items, rating)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	return items, nil
}

func (s *Store) CreateRating(novelID int, input RatingInput) (*Rating, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.novels[novelID]; !ok {
		return nil, errNotFound
	}
	rating := &Rating{
		ID:      s.nextRatingID,
		NovelID: novelID,
		UserID:  input.UserID,
		Score:   input.Score,
		Note:    strings.TrimSpace(input.Note),
		At:      time.Now(),
	}
	s.ratings[rating.ID] = rating
	s.nextRatingID++
	return rating, nil
}

func (s *Store) ListUsers() []*User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]*User, 0, len(s.users))
	for _, user := range s.users {
		items = append(items, user)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	return items
}

func (s *Store) CreateUser(name, role string) (*User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	user := &User{
		ID:        s.nextUserID,
		Name:      strings.TrimSpace(name),
		Role:      strings.TrimSpace(role),
		CreatedAt: time.Now(),
	}
	s.users[user.ID] = user
	s.nextUserID++
	return user, nil
}
