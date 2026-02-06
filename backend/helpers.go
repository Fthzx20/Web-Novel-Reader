package main

import "strings"

func slugify(input string) string {
	clean := strings.ToLower(strings.TrimSpace(input))
	clean = strings.ReplaceAll(clean, " ", "-")
	clean = strings.ReplaceAll(clean, "--", "-")
	return clean
}

func clampPagination(limit int, offset int) (int, int) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}
