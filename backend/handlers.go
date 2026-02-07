package main

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type NovelInput struct {
	Title    string   `json:"title"`
	Author   string   `json:"author"`
	Summary  string   `json:"summary"`
	Tags     []string `json:"tags"`
	CoverURL string   `json:"coverUrl"`
	Status   string   `json:"status"`
	Slug     string   `json:"slug"`
}

type ChapterInput struct {
	Number  int    `json:"number"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type CommentInput struct {
	UserID int    `json:"userId"`
	Body   string `json:"body"`
}

type RatingInput struct {
	UserID int    `json:"userId"`
	Score  int    `json:"score"`
	Note   string `json:"note"`
}

type UserInput struct {
	Name string `json:"name"`
	Role string `json:"role"`
}

type AuthRegisterInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"-"`
}

type AuthLoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthUserInfo struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  AuthUserInfo `json:"user"`
}

type ReadingHistoryInput struct {
	NovelSlug    string `json:"novelSlug"`
	NovelTitle   string `json:"novelTitle"`
	ChapterID    int    `json:"chapterId"`
	ChapterTitle string `json:"chapterTitle"`
}

type NovelActionInput struct {
	NovelID int `json:"novelId"`
}

type SiteSettingsInput struct {
	Title   string `json:"title"`
	Tagline string `json:"tagline"`
	LogoURL string `json:"logoUrl"`
}

type AnnouncementInput struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

type ReleaseQueueInput struct {
	NovelID       int    `json:"novelId"`
	ChapterNumber int    `json:"chapterNumber"`
	Title         string `json:"title"`
	Status        string `json:"status"`
	Eta           string `json:"eta"`
	Notes         string `json:"notes"`
}

type ReleaseQueueStatusInput struct {
	Status string `json:"status"`
}

type ModerationReportInput struct {
	NovelID    int    `json:"novelId"`
	NovelTitle string `json:"novelTitle"`
	Note       string `json:"note"`
}

type IllustrationInput struct {
	URL          string `json:"url"`
	OriginalName string `json:"originalName"`
}

func registerRoutes(router *gin.Engine, repo Repository, cfg Config) {
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	router.POST("/auth/register", func(c *gin.Context) {
		var input AuthRegisterInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		input.Email = normalizeEmail(input.Email)
		if input.Name == "" || input.Email == "" || input.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name, email, and password are required"})
			return
		}
		if isAdminEmail(input.Email, cfg.AdminEmails) {
			input.Role = "admin"
		}
		user, err := repo.CreateAuthUser(input)
		if err != nil {
			if err == errConflict {
				c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		token, err := generateToken(user.ID, user.Role, cfg.JWTSecret, cfg.JWTTTL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, AuthResponse{Token: token, User: toAuthUserInfo(user)})
	})

	router.POST("/auth/login", func(c *gin.Context) {
		var input AuthLoginInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		input.Email = normalizeEmail(input.Email)
		if input.Email == "" || input.Password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email and password are required"})
			return
		}
		user, err := repo.GetAuthUserByEmail(input.Email)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		if !checkPassword(user.PasswordHash, input.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}
		token, err := generateToken(user.ID, user.Role, cfg.JWTSecret, cfg.JWTTTL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, AuthResponse{Token: token, User: toAuthUserInfo(user)})
	})

	me := router.Group("/me")
	me.Use(userAuth(cfg.JWTSecret))
	me.GET("/history", func(c *gin.Context) {
		userID := c.GetInt("userID")
		items := repo.ListReadingHistory(userID)
		c.JSON(http.StatusOK, items)
	})
	me.POST("/history", func(c *gin.Context) {
		userID := c.GetInt("userID")
		var input ReadingHistoryInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.TrimSpace(input.NovelSlug) == "" || strings.TrimSpace(input.ChapterTitle) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "novelSlug and chapterTitle are required"})
			return
		}
		entry, err := repo.AddReadingHistory(userID, input)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, entry)
	})
	me.DELETE("/history", func(c *gin.Context) {
		userID := c.GetInt("userID")
		if err := repo.ClearReadingHistory(userID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Status(http.StatusNoContent)
	})

	router.GET("/settings", func(c *gin.Context) {
		settings, err := repo.GetSiteSettings()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, settings)
	})

	router.GET("/announcements", func(c *gin.Context) {
		items := repo.ListAnnouncements()
		c.JSON(http.StatusOK, items)
	})

	router.GET("/novels", func(c *gin.Context) {
		items := repo.ListNovels()
		limit, offset := readPagination(c)
		start, end := sliceRange(len(items), limit, offset)
		c.JSON(http.StatusOK, items[start:end])
	})

	adminAuthed := router.Group("/")
	adminAuthed.Use(adminAccess(cfg.APIKey, cfg.JWTSecret))

	userAuthed := router.Group("/")
	userAuthed.Use(userAuth(cfg.JWTSecret))

	adminAuthed.POST("/novels", func(c *gin.Context) {
		var input NovelInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Author) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title and author are required"})
			return
		}
		if strings.TrimSpace(input.Summary) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "summary is required"})
			return
		}
		novel, err := repo.CreateNovel(input)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, novel)
	})

	adminAuthed.PUT("/settings", func(c *gin.Context) {
		var input SiteSettingsInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.TrimSpace(input.Title) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
			return
		}
		if strings.TrimSpace(input.Tagline) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "tagline is required"})
			return
		}
		settings, err := repo.UpdateSiteSettings(input)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, settings)
	})

	adminAuthed.POST("/uploads/logo", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
			return
		}
		url, err := saveUploadedFile(file, "logo", c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"url": url})
	})

	adminAuthed.POST("/uploads/cover", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
			return
		}
		url, err := saveUploadedFile(file, "cover", c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"url": url})
	})

	adminAuthed.POST("/uploads/illustration", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
			return
		}
		url, err := saveUploadedFile(file, "illustration", c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		_, err = repo.CreateIllustration(IllustrationInput{
			URL:          url,
			OriginalName: file.Filename,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"url": url})
	})

	adminAuthed.POST("/announcements", func(c *gin.Context) {
		var input AnnouncementInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Body) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title and body are required"})
			return
		}
		announcement, err := repo.CreateAnnouncement(input)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, announcement)
	})

	adminAuthed.GET("/release-queue", func(c *gin.Context) {
		items, err := repo.ListReleaseQueue()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, items)
	})

	adminAuthed.POST("/release-queue", func(c *gin.Context) {
		var input ReleaseQueueInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if input.NovelID <= 0 || input.ChapterNumber <= 0 || strings.TrimSpace(input.Title) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "novelId, chapterNumber, and title are required"})
			return
		}
		item, err := repo.CreateReleaseQueue(input)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusCreated, item)
	})

	adminAuthed.PUT("/release-queue/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		var input ReleaseQueueStatusInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.TrimSpace(input.Status) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
			return
		}
		item, err := repo.UpdateReleaseQueueStatus(id, input.Status)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusOK, item)
	})

	adminAuthed.DELETE("/release-queue/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		if err := repo.DeleteReleaseQueue(id); err != nil {
			respondNotFound(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	})

	adminAuthed.GET("/reports", func(c *gin.Context) {
		items, err := repo.ListModerationReports()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, items)
	})

	adminAuthed.POST("/reports", func(c *gin.Context) {
		var input ModerationReportInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.TrimSpace(input.Note) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "note is required"})
			return
		}
		item, err := repo.CreateModerationReport(input)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusCreated, item)
	})

	adminAuthed.DELETE("/reports/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		if err := repo.DeleteModerationReport(id); err != nil {
			respondNotFound(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	})

	adminAuthed.PUT("/announcements/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		var input AnnouncementInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Body) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title and body are required"})
			return
		}
		announcement, err := repo.UpdateAnnouncement(id, input)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusOK, announcement)
	})

	adminAuthed.DELETE("/announcements/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		if err := repo.DeleteAnnouncement(id); err != nil {
			respondNotFound(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	})

	router.GET("/novels/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		novel, err := repo.GetNovel(id)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusOK, novel)
	})

	adminAuthed.PUT("/novels/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		var input NovelInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Author) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title and author are required"})
			return
		}
		if strings.TrimSpace(input.Summary) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "summary is required"})
			return
		}
		novel, err := repo.UpdateNovel(id, input)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusOK, novel)
	})

	adminAuthed.DELETE("/novels/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		if err := repo.DeleteNovel(id); err != nil {
			respondNotFound(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	})

	router.GET("/novels/:id/chapters", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		chapters, err := repo.ListChaptersByNovel(id)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		limit, offset := readPagination(c)
		start, end := sliceRange(len(chapters), limit, offset)
		c.JSON(http.StatusOK, chapters[start:end])
	})

	adminAuthed.POST("/novels/:id/chapters", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		var input ChapterInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if input.Number <= 0 || strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Content) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "number, title, and content are required"})
			return
		}
		chapter, err := repo.CreateChapter(id, input)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusCreated, chapter)
	})

	router.GET("/chapters/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		chapter, err := repo.GetChapter(id)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusOK, chapter)
	})

	adminAuthed.PUT("/chapters/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		var input ChapterInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if input.Number <= 0 || strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Content) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "number, title, and content are required"})
			return
		}
		chapter, err := repo.UpdateChapter(id, input)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusOK, chapter)
	})

	adminAuthed.DELETE("/chapters/:id", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		if err := repo.DeleteChapter(id); err != nil {
			respondNotFound(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	})

	router.GET("/chapters/:id/comments", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		comments, err := repo.ListCommentsByChapter(id)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		limit, offset := readPagination(c)
		start, end := sliceRange(len(comments), limit, offset)
		c.JSON(http.StatusOK, comments[start:end])
	})

	userAuthed.POST("/chapters/:id/comments", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		var input CommentInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		input.UserID = c.GetInt("userID")
		if strings.TrimSpace(input.Body) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "comment body is required"})
			return
		}
		comment, err := repo.CreateComment(id, input)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusCreated, comment)
	})

	router.GET("/novels/:id/ratings", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		ratings, err := repo.ListRatingsByNovel(id)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		limit, offset := readPagination(c)
		start, end := sliceRange(len(ratings), limit, offset)
		c.JSON(http.StatusOK, ratings[start:end])
	})

	userAuthed.POST("/novels/:id/ratings", func(c *gin.Context) {
		id := parseID(c.Param("id"))
		var input RatingInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if input.Score < 1 || input.Score > 5 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "score must be 1-5"})
			return
		}
		input.UserID = c.GetInt("userID")
		rating, err := repo.CreateRating(id, input)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusCreated, rating)
	})

	userAuthed.GET("/me/follows", func(c *gin.Context) {
		userID := c.GetInt("userID")
		items := repo.ListFollows(userID)
		c.JSON(http.StatusOK, items)
	})
	userAuthed.POST("/me/follows", func(c *gin.Context) {
		userID := c.GetInt("userID")
		var input NovelActionInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if input.NovelID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "novelId is required"})
			return
		}
		follow, err := repo.AddFollow(userID, input.NovelID)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusCreated, follow)
	})
	userAuthed.DELETE("/me/follows/:novelId", func(c *gin.Context) {
		userID := c.GetInt("userID")
		novelID := parseID(c.Param("novelId"))
		if novelID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "novelId is required"})
			return
		}
		if err := repo.RemoveFollow(userID, novelID); err != nil {
			respondNotFound(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	})

	userAuthed.GET("/me/bookmarks", func(c *gin.Context) {
		userID := c.GetInt("userID")
		items := repo.ListBookmarks(userID)
		c.JSON(http.StatusOK, items)
	})
	userAuthed.POST("/me/bookmarks", func(c *gin.Context) {
		userID := c.GetInt("userID")
		var input NovelActionInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if input.NovelID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "novelId is required"})
			return
		}
		bookmark, err := repo.AddBookmark(userID, input.NovelID)
		if err != nil {
			respondNotFound(c, err)
			return
		}
		c.JSON(http.StatusCreated, bookmark)
	})
	userAuthed.DELETE("/me/bookmarks/:novelId", func(c *gin.Context) {
		userID := c.GetInt("userID")
		novelID := parseID(c.Param("novelId"))
		if novelID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "novelId is required"})
			return
		}
		if err := repo.RemoveBookmark(userID, novelID); err != nil {
			respondNotFound(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	})

	router.GET("/users", func(c *gin.Context) {
		c.JSON(http.StatusOK, repo.ListUsers())
	})

	adminAuthed.POST("/users", func(c *gin.Context) {
		var input UserInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		user, err := repo.CreateUser(input.Name, input.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, user)
	})
}

func apiKeyAuth(apiKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if apiKey == "" {
			c.Next()
			return
		}
		if c.GetHeader("X-API-Key") != apiKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func adminAccess(apiKey string, secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if apiKey != "" && c.GetHeader("X-API-Key") == apiKey {
			c.Next()
			return
		}
		header := c.GetHeader("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			claims, err := parseToken(strings.TrimPrefix(header, "Bearer "), secret)
			if err == nil && claims.Role == "admin" {
				c.Set("userID", claims.UserID)
				c.Set("role", claims.Role)
				c.Next()
				return
			}
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		c.Abort()
	}
}

func userAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			c.Abort()
			return
		}
		claims, err := parseToken(strings.TrimPrefix(header, "Bearer "), secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}
		c.Set("userID", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func isAdminEmail(email string, adminEmails []string) bool {
	if email == "" || len(adminEmails) == 0 {
		return false
	}
	for _, adminEmail := range adminEmails {
		if email == adminEmail {
			return true
		}
	}
	return false
}

func readPagination(c *gin.Context) (int, int) {
	limit, _ := strconv.Atoi(c.Query("limit"))
	offset, _ := strconv.Atoi(c.Query("offset"))
	return clampPagination(limit, offset)
}

func sliceRange(length int, limit int, offset int) (int, int) {
	if offset > length {
		return length, length
	}
	end := offset + limit
	if end > length {
		end = length
	}
	return offset, end
}

func respondNotFound(c *gin.Context, err error) {
	if err == errNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
}

func parseID(raw string) int {
	id, _ := strconv.Atoi(raw)
	return id
}
