package main

import "time"

type Novel struct {
	ID        int       `json:"id"`
	Slug      string    `json:"slug"`
	Title     string    `json:"title"`
	Author    string    `json:"author"`
	Summary   string    `json:"summary"`
	Tags      []string  `json:"tags"`
	CoverURL  string    `json:"coverUrl"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Chapter struct {
	ID        int       `json:"id"`
	NovelID   int       `json:"novelId"`
	Number    int       `json:"number"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	WordCount int       `json:"wordCount"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Comment struct {
	ID        int       `json:"id"`
	ChapterID int       `json:"chapterId"`
	UserID    int       `json:"userId"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

type Rating struct {
	ID      int       `json:"id"`
	NovelID int       `json:"novelId"`
	UserID  int       `json:"userId"`
	Score   int       `json:"score"`
	Note    string    `json:"note"`
	At      time.Time `json:"at"`
}

type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

type AuthUser struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
}

type ReadingHistory struct {
	ID           int       `json:"id"`
	UserID       int       `json:"userId"`
	NovelSlug    string    `json:"novelSlug"`
	NovelTitle   string    `json:"novelTitle"`
	ChapterID    int       `json:"chapterId"`
	ChapterTitle string    `json:"chapterTitle"`
	ReadAt       time.Time `json:"readAt"`
}

type Follow struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	NovelID   int       `json:"novelId"`
	CreatedAt time.Time `json:"createdAt"`
}

type Bookmark struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	NovelID   int       `json:"novelId"`
	CreatedAt time.Time `json:"createdAt"`
}

type SiteSettings struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Tagline   string    `json:"tagline"`
	LogoURL   string    `json:"logoUrl"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Announcement struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}
