package main

type Repository interface {
	ListNovels() []*Novel
	GetNovel(id int) (*Novel, error)
	CreateNovel(input NovelInput) (*Novel, error)
	UpdateNovel(id int, input NovelInput) (*Novel, error)
	DeleteNovel(id int) error
	ListChaptersByNovel(novelID int) ([]*Chapter, error)
	GetChapter(id int) (*Chapter, error)
	CreateChapter(novelID int, input ChapterInput) (*Chapter, error)
	UpdateChapter(id int, input ChapterInput) (*Chapter, error)
	DeleteChapter(id int) error
	ListCommentsByChapter(chapterID int) ([]*Comment, error)
	CreateComment(chapterID int, input CommentInput) (*Comment, error)
	ListRatingsByNovel(novelID int) ([]*Rating, error)
	CreateRating(novelID int, input RatingInput) (*Rating, error)
	ListUsers() []*User
	CreateUser(name, role string) (*User, error)
	CreateAuthUser(input AuthRegisterInput) (*AuthUser, error)
	GetAuthUserByEmail(email string) (*AuthUser, error)
	ListReadingHistory(userID int) []*ReadingHistory
	AddReadingHistory(userID int, input ReadingHistoryInput) (*ReadingHistory, error)
	ListFollows(userID int) []*Follow
	AddFollow(userID int, novelID int) (*Follow, error)
	RemoveFollow(userID int, novelID int) error
	ListBookmarks(userID int) []*Bookmark
	AddBookmark(userID int, novelID int) (*Bookmark, error)
	RemoveBookmark(userID int, novelID int) error
	GetSiteSettings() (*SiteSettings, error)
	UpdateSiteSettings(input SiteSettingsInput) (*SiteSettings, error)
	ListAnnouncements() []*Announcement
	CreateAnnouncement(input AnnouncementInput) (*Announcement, error)
	UpdateAnnouncement(id int, input AnnouncementInput) (*Announcement, error)
	DeleteAnnouncement(id int) error
	ListReleaseQueue() ([]*ReleaseQueueItem, error)
	CreateReleaseQueue(input ReleaseQueueInput) (*ReleaseQueueItem, error)
	UpdateReleaseQueueStatus(id int, status string) (*ReleaseQueueItem, error)
	DeleteReleaseQueue(id int) error
	ListModerationReports() ([]*ModerationReport, error)
	CreateModerationReport(input ModerationReportInput) (*ModerationReport, error)
	DeleteModerationReport(id int) error
	CreateIllustration(input IllustrationInput) (*Illustration, error)
}
