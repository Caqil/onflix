
package routes

import (
	"onflix/internal/controllers"
	"onflix/internal/middleware"
	"onflix/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupAdminRoutes(rg *gin.RouterGroup, services *services.Services) {
	adminController := controllers.NewAdminController(services)

	// Dashboard and analytics
	rg.GET("/dashboard", adminController.GetDashboard)
	rg.GET("/analytics", adminController.GetAnalytics)
	rg.GET("/analytics/users", adminController.GetUserAnalytics)
	rg.GET("/analytics/content", adminController.GetContentAnalytics)
	rg.GET("/analytics/revenue", adminController.GetRevenueAnalytics)

	// User management
	users := rg.Group("/users")
	{
		users.GET("", adminController.GetUsers)
		users.GET("/:userID", adminController.GetUser)
		users.PUT("/:userID", adminController.UpdateUser)
		users.DELETE("/:userID", adminController.DeleteUser)
		users.POST("/:userID/ban", adminController.BanUser)
		users.POST("/:userID/unban", adminController.UnbanUser)
		users.POST("/:userID/reset-password", adminController.ResetUserPassword)
		users.GET("/:userID/subscription", adminController.GetUserSubscription)
		users.PUT("/:userID/subscription", adminController.UpdateUserSubscription)
		users.GET("/:userID/activity", adminController.GetUserActivity)
	}

	// Content management
	content := rg.Group("/content")
	{
		// CRUD operations
		content.GET("", adminController.GetAllContent)
		content.POST("", adminController.CreateContent)
		content.GET("/:contentID", adminController.GetContentDetails)
		content.PUT("/:contentID", adminController.UpdateContent)
		content.DELETE("/:contentID", adminController.DeleteContent)
		content.POST("/:contentID/publish", adminController.PublishContent)
		content.POST("/:contentID/unpublish", adminController.UnpublishContent)

		// TMDB integration
		content.POST("/import/tmdb/:tmdbID", adminController.ImportFromTMDB)
		content.POST("/sync/tmdb", adminController.SyncWithTMDB)
		content.GET("/tmdb/search", adminController.SearchTMDB)

		// Video management
		videos := content.Group("/:contentID/videos")
		{
			videos.POST("", adminController.UploadVideo)
			videos.GET("", adminController.GetVideos)
			videos.PUT("/:videoID", adminController.UpdateVideo)
			videos.DELETE("/:videoID", adminController.DeleteVideo)
			videos.POST("/:videoID/process", adminController.ProcessVideo)
		}

		// Season and episode management (for TV shows)
		seasons := content.Group("/:contentID/seasons")
		{
			seasons.POST("", adminController.CreateSeason)
			seasons.GET("", adminController.GetSeasons)
			seasons.PUT("/:seasonID", adminController.UpdateSeason)
			seasons.DELETE("/:seasonID", adminController.DeleteSeason)

			episodes := seasons.Group("/:seasonID/episodes")
			{
				episodes.POST("", adminController.CreateEpisode)
				episodes.GET("", adminController.GetEpisodes)
				episodes.PUT("/:episodeID", adminController.UpdateEpisode)
				episodes.DELETE("/:episodeID", adminController.DeleteEpisode)
			}
		}

		// Subtitle management
		subtitles := content.Group("/:contentID/subtitles")
		{
			subtitles.POST("", adminController.UploadSubtitle)
			subtitles.GET("", adminController.GetSubtitles)
			subtitles.DELETE("/:subtitleID", adminController.DeleteSubtitle)
		}

		// Content moderation
		moderation := content.Group("/moderation")
		{
			moderation.GET("/reported", adminController.GetReportedContent)
			moderation.POST("/:contentID/approve", adminController.ApproveContent)
			moderation.POST("/:contentID/reject", adminController.RejectContent)
		}
	}

	// Subscription plan management
	plans := rg.Group("/plans")
	{
		plans.GET("", adminController.GetSubscriptionPlans)
		plans.POST("", adminController.CreateSubscriptionPlan)
		plans.GET("/:planID", adminController.GetSubscriptionPlan)
		plans.PUT("/:planID", adminController.UpdateSubscriptionPlan)
		plans.DELETE("/:planID", adminController.DeleteSubscriptionPlan)
		plans.POST("/:planID/activate", adminController.ActivateSubscriptionPlan)
		plans.POST("/:planID/deactivate", adminController.DeactivateSubscriptionPlan)
	}

	// Subscription management
	subscriptions := rg.Group("/subscriptions")
	{
		subscriptions.GET("", adminController.GetSubscriptions)
		subscriptions.GET("/:subscriptionID", adminController.GetSubscription)
		subscriptions.PUT("/:subscriptionID", adminController.UpdateSubscription)
		subscriptions.POST("/:subscriptionID/cancel", adminController.CancelSubscription)
		subscriptions.POST("/:subscriptionID/refund", adminController.RefundSubscription)
		subscriptions.GET("/analytics", adminController.GetSubscriptionAnalytics)
	}

	// Payment management
	payments := rg.Group("/payments")
	{
		payments.GET("", adminController.GetPayments)
		payments.GET("/:paymentID", adminController.GetPayment)
		payments.POST("/:paymentID/refund", adminController.RefundPayment)
		payments.GET("/failed", adminController.GetFailedPayments)
		payments.POST("/:paymentID/retry", adminController.RetryPayment)
	}

	// System settings
	settings := rg.Group("/settings")
	{
		settings.GET("", adminController.GetSettings)
		settings.PUT("", adminController.UpdateSettings)
		settings.GET("/tmdb", adminController.GetTMDBSettings)
		settings.PUT("/tmdb", adminController.UpdateTMDBSettings)
		settings.GET("/stripe", adminController.GetStripeSettings)
		settings.PUT("/stripe", adminController.UpdateStripeSettings)
		settings.GET("/email", adminController.GetEmailSettings)
		settings.PUT("/email", adminController.UpdateEmailSettings)
	}

	// System monitoring
	system := rg.Group("/system")
	{
		system.GET("/health", adminController.GetSystemHealth)
		system.GET("/logs", adminController.GetLogs)
		system.GET("/metrics", adminController.GetMetrics)
		system.POST("/cache/clear", adminController.ClearCache)
		system.POST("/database/backup", adminController.BackupDatabase)
		system.GET("/database/status", adminController.GetDatabaseStatus)
	}

	// Reports
	reports := rg.Group("/reports")
	{
		reports.GET("/users", adminController.GetUserReport)
		reports.GET("/content", adminController.GetContentReport)
		reports.GET("/revenue", adminController.GetRevenueReport)
		reports.GET("/engagement", adminController.GetEngagementReport)
		reports.POST("/custom", adminController.GenerateCustomReport)
		reports.GET("/export/:reportID", adminController.ExportReport)
	}

	// Notifications and announcements
	notifications := rg.Group("/notifications")
	{
		notifications.GET("", adminController.GetNotifications)
		notifications.POST("", adminController.CreateNotification)
		notifications.PUT("/:notificationID", adminController.UpdateNotification)
		notifications.DELETE("/:notificationID", adminController.DeleteNotification)
		notifications.POST("/broadcast", adminController.BroadcastNotification)
	}

	// Content recommendations management
	recommendations := rg.Group("/recommendations")
	{
		recommendations.GET("/algorithm", adminController.GetRecommendationAlgorithm)
		recommendations.PUT("/algorithm", adminController.UpdateRecommendationAlgorithm)
		recommendations.POST("/retrain", adminController.RetrainRecommendationModel)
		recommendations.GET("/performance", adminController.GetRecommendationPerformance)
	}

	// Rate limiting and middleware for admin routes
	rg.Use(middleware.AdminRateLimit())
}

// Webhook routes (separate from main API)
func SetupWebhookRoutes(router *gin.Engine, services *services.Services) {
	webhookController := controllers.NewWebhookController(services)

	webhooks := router.Group("/webhooks")
	{
		// Stripe webhooks
		webhooks.POST("/stripe", webhookController.StripeWebhook)
		
		// TMDB webhooks (if available)
		webhooks.POST("/tmdb", webhookController.TMDBWebhook)
		
		// Payment provider webhooks
		webhooks.POST("/payment/:provider", webhookController.PaymentWebhook)
	}
}