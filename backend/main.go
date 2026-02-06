package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := LoadConfig()
	store := NewStore()
	db, err := OpenDB(cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	if err := RunMigrations(db); err != nil {
		log.Fatal(err)
	}
	repo := NewAppRepository(store, db)
	router := gin.Default()
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowHeaders = append(corsConfig.AllowHeaders, "Authorization", "X-API-Key")
	router.Use(cors.New(corsConfig))
	router.Static("/uploads", "./uploads")
	registerRoutes(router, repo, cfg)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
