package main

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port               string
	APIKey             string
	DatabaseURL        string
	DBMaxConns         int
	DBMaxIdleConns     int
	DBConnMaxLifetime  time.Duration
	JWTSecret          string
	JWTTTL             time.Duration
	AdminEmails        []string
}

func LoadConfig() Config {
	loadDotEnv()
	return Config{
		Port:              getEnv("PORT", "8081"),
		APIKey:            os.Getenv("API_KEY"),
		DatabaseURL:       os.Getenv("DATABASE_URL"),
		DBMaxConns:        getEnvInt("DB_MAX_CONNS", 10),
		DBMaxIdleConns:    getEnvInt("DB_MAX_IDLE_CONNS", 5),
		DBConnMaxLifetime: getEnvDuration("DB_CONN_MAX_LIFETIME", "30m"),
		JWTSecret:         getEnv("JWT_SECRET", "dev-secret"),
		JWTTTL:            getEnvDuration("JWT_TTL", "24h"),
		AdminEmails:       getEnvList("ADMIN_EMAILS"),
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func getEnvInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func getEnvDuration(key, fallback string) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		value = fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return 30 * time.Minute
	}
	return parsed
}

func getEnvList(key string) []string {
	value := os.Getenv(key)
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	items := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			items = append(items, strings.ToLower(trimmed))
		}
	}
	return items
}
