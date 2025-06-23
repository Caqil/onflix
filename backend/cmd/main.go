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

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		log.Fatal("Configuration validation failed:", err)
	}

	// Initialize database connection
	db, err := database.Connect(cfg.MongoDB.URI)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	log.Println("Successfully connected to MongoDB")

	// Run database migrations
	log.Println("Running database migrations...")
	if err := database.RunMigrations(db); err != nil {
		log.Printf("Migration warning: %v", err)
		// Don't fail startup on migration errors, just log them
		// In production, you might want to fail depending on your migration strategy
	} else {
		log.Println("Database migrations completed successfully")
	}

	// Run health check to ensure database is working
	if err := database.HealthCheck(db); err != nil {
		log.Fatal("Database health check failed:", err)
	}
	log.Println("Database health check passed")

	// Initialize services
	services := &services.Services{
		DB:     db,
		Config: cfg,
	}

	// Set Gin mode based on environment
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Initialize Gin router
	router := gin.Default()

	// Setup routes
	routes.SetupRoutes(router, services)

	// Start server
	log.Printf("🚀 Server starting on port %s (Environment: %s)", cfg.Server.Port, cfg.Server.Env)
	log.Printf("📊 Database: %s", cfg.GetDatabaseName())
	log.Printf("🌐 App URL: %s", cfg.Server.AppURL)

	if err := router.Run(cfg.GetServerAddress()); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
