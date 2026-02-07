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
	Volume    int       `json:"volume"`
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
	Status       string    `json:"status"`
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
	ID                 int       `json:"id"`
	Title              string    `json:"title"`
	Tagline            string    `json:"tagline"`
	LogoURL            string    `json:"logoUrl"`
	LogoAlt            string    `json:"logoAlt"`
	Headline           string    `json:"headline"`
	HeroText           string    `json:"heroDescription"`
	PrimaryCta         string    `json:"primaryButton"`
	SecondaryCta       string    `json:"secondaryButton"`
	AccentColor        string    `json:"accentColor"`
	HighlightLabel     string    `json:"highlightLabel"`
	FacebookUrl        string    `json:"facebookUrl"`
	DiscordUrl         string    `json:"discordUrl"`
	FooterUpdatesLabel string    `json:"footerUpdatesLabel"`
	FooterUpdatesUrl   string    `json:"footerUpdatesUrl"`
	FooterSeriesLabel  string    `json:"footerSeriesLabel"`
	FooterSeriesUrl    string    `json:"footerSeriesUrl"`
	FooterAdminLabel   string    `json:"footerAdminLabel"`
	FooterAdminUrl     string    `json:"footerAdminUrl"`
	FooterLink4Label   string    `json:"footerLink4Label"`
	FooterLink4Url     string    `json:"footerLink4Url"`
	FooterLink5Label   string    `json:"footerLink5Label"`
	FooterLink5Url     string    `json:"footerLink5Url"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type Announcement struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

type ReleaseQueueItem struct {
	ID            int       `json:"id"`
	NovelID       int       `json:"novelId"`
	NovelTitle    string    `json:"novelTitle"`
	ChapterNumber int       `json:"chapterNumber"`
	Title         string    `json:"title"`
	Status        string    `json:"status"`
	Eta           string    `json:"eta"`
	Notes         string    `json:"notes"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type ModerationReport struct {
	ID         int       `json:"id"`
	NovelID    int       `json:"novelId"`
	NovelTitle string    `json:"novelTitle"`
	Note       string    `json:"note"`
	CreatedAt  time.Time `json:"createdAt"`
}

type NovelChapterStat struct {
	NovelID         int `json:"novelId"`
	ChapterCount    int `json:"chapterCount"`
	LatestChapterID int `json:"latestChapterId"`
}

type Illustration struct {
	ID           int       `json:"id"`
	URL          string    `json:"url"`
	OriginalName string    `json:"originalName"`
	CreatedAt    time.Time `json:"createdAt"`
}
