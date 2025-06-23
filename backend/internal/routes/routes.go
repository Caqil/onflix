package routes

import (
	"onflix/internal/middleware"
	"onflix/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, services *services.Services) {
	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(services.DB, services.Config.JWT.Secret)

	// Global middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "onflix"})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes
		SetupAuthRoutes(v1, services)
		SetupPublicContentRoutes(v1, services)

		// Protected routes
		protected := v1.Group("")
		protected.Use(authMiddleware.RequireAuth())
		{
			SetupUserRoutes(protected, services)
			SetupContentRoutes(protected, services)
		}

		// Admin routes
		admin := v1.Group("/admin")
		admin.Use(authMiddleware.RequireAuth())
		admin.Use(middleware.RequireAdmin())
		{
			SetupAdminRoutes(admin, services)
		}
	}
}
