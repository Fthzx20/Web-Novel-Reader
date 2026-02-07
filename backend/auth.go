package main

import (
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type authClaims struct {
	UserID int    `json:"uid"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func generateToken(userID int, role, secret string, ttl time.Duration) (string, error) {
	if strings.TrimSpace(secret) == "" {
		return "", errors.New("jwt secret not configured")
	}
	now := time.Now()
	claims := authClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func hashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

func checkPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func toAuthUserInfo(user *AuthUser) AuthUserInfo {
	return AuthUserInfo{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		Status:    user.Status,
		CreatedAt: user.CreatedAt,
	}
}

func parseToken(tokenString, secret string) (*authClaims, error) {
	if strings.TrimSpace(secret) == "" {
		return nil, errors.New("jwt secret not configured")
	}
	claims := &authClaims{}
	_, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("invalid signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	return claims, nil
}