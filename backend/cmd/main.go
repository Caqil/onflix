package main

import (
	"log"
	"onflix/internal/config"
	"onflix/internal/database"
	"onflix/internal/routes"
	"onflix/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Connect(cfg.MongoDB.URI)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Initialize services
	services := &services.Services{
		DB:     db,
		Config: cfg,
	}

	// Initialize Gin router
	router := gin.Default()

	// Setup routes
	routes.SetupRoutes(router, services)

	// Start server
	log.Printf("Server starting on port %s", cfg.Server.Port)
	log.Fatal(router.Run(":" + cfg.Server.Port))
}
