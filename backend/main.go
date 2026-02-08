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
	if len(cfg.CorsOrigins) > 0 {
		corsConfig.AllowAllOrigins = false
		corsConfig.AllowOrigins = cfg.CorsOrigins
	} else {
		corsConfig.AllowAllOrigins = true
	}
	corsConfig.AllowHeaders = append(corsConfig.AllowHeaders, "Authorization", "X-API-Key", "X-Moderation-Password")
	router.Use(cors.New(corsConfig))
	if len(cfg.TrustedProxies) > 0 {
		if err := router.SetTrustedProxies(cfg.TrustedProxies); err != nil {
			log.Fatal(err)
		}
	}
	router.Static("/uploads", "./uploads")
	registerRoutes(router, repo, cfg)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
