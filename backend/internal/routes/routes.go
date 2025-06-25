package routes

import (
	"net/http"
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
	// Serve static files
	router.Static("/static", "./web/static")
	router.StaticFS("/templates", http.Dir("./web/templates"))

	// Frontend routes
	router.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/app")
	})

	router.GET("/app", func(c *gin.Context) {
		c.File("./web/templates/user/index.html")
	})

	router.GET("/app/*path", func(c *gin.Context) {
		c.File("./web/templates/user/index.html")
	})

	router.GET("/admin", func(c *gin.Context) {
		c.File("./web/templates/admin/index.html")
	})

	router.GET("/admin/*path", func(c *gin.Context) {
		c.File("./web/templates/admin/index.html")
	})
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
