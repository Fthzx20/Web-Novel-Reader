package main

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func saveUploadedFile(file *multipart.FileHeader, prefix string, c *gin.Context) (string, error) {
	if file == nil {
		return "", fmt.Errorf("file is required")
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == "" {
		ext = ".png"
	}

	if err := os.MkdirAll("uploads", 0o755); err != nil {
		return "", err
	}

	sanitized := strings.ReplaceAll(strings.ToLower(file.Filename), " ", "-")
	name := fmt.Sprintf("%s-%d-%s%s", prefix, time.Now().UnixNano(), strings.TrimSuffix(sanitized, ext), ext)
	name = strings.ReplaceAll(name, "..", "-")

	destination := filepath.Join("uploads", name)
	if err := c.SaveUploadedFile(file, destination); err != nil {
		return "", err
	}

	return "/uploads/" + name, nil
}
