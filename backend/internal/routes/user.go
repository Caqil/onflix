package routes

import (
	"onflix/internal/controllers"
	"onflix/internal/middleware"
	"onflix/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupUserRoutes(rg *gin.RouterGroup, services *services.Services) {
	userController := controllers.NewUserController(services)
	authMiddleware := middleware.NewAuthMiddleware(services.DB, services.Config.JWT.Secret)

	user := rg.Group("/user")
	{
		// Profile management
		user.GET("/profile", userController.GetProfile)
		user.PUT("/profile", userController.UpdateProfile)
		user.DELETE("/profile", userController.DeleteAccount)
		user.POST("/upload-avatar", userController.UploadAvatar)

		// Multiple profiles support
		profiles := user.Group("/profiles")
		{
			profiles.GET("", userController.GetProfiles)
			profiles.POST("", userController.CreateProfile)
			profiles.GET("/:profileID", userController.GetProfile)
			profiles.PUT("/:profileID", userController.UpdateProfile)
			profiles.DELETE("/:profileID", userController.DeleteProfile)
			profiles.POST("/:profileID/avatar", userController.UpdateProfileAvatar)
		}

		// Watchlist management
		watchlist := user.Group("/watchlist")
		{
			watchlist.GET("", userController.GetWatchlist)
			watchlist.POST("/:contentID", userController.AddToWatchlist)
			watchlist.DELETE("/:contentID", userController.RemoveFromWatchlist)
			watchlist.POST("/clear", userController.ClearWatchlist)
		}

		// Watch history
		history := user.Group("/history")
		{
			history.GET("", userController.GetWatchHistory)
			history.POST("/progress", userController.UpdateWatchProgress)
			history.DELETE("/:contentID", userController.RemoveFromHistory)
			history.POST("/clear", userController.ClearWatchHistory)
		}

		// Preferences
		preferences := user.Group("/preferences")
		{
			preferences.GET("", userController.GetPreferences)
			preferences.PUT("", userController.UpdatePreferences)
			preferences.PUT("/language", userController.UpdateLanguage)
			preferences.PUT("/maturity-rating", userController.UpdateMaturityRating)
		}

		// Subscription management
		subscription := user.Group("/subscription")
		subscription.Use(authMiddleware.RequireSubscription())
		{
			subscription.GET("", userController.GetSubscription)
			subscription.GET("/plans", userController.GetSubscriptionPlans)
			subscription.POST("/subscribe", userController.Subscribe)
			subscription.PUT("/change-plan", userController.ChangePlan)
			subscription.POST("/cancel", userController.CancelSubscription)
			subscription.POST("/pause", userController.PauseSubscription)
			subscription.POST("/resume", userController.ResumeSubscription)
			subscription.GET("/invoices", userController.GetInvoices)
			subscription.GET("/usage", userController.GetUsage)
		}

		// Payment methods
		payment := user.Group("/payment")
		{
			payment.GET("/methods", userController.GetPaymentMethods)
			payment.POST("/methods", userController.AddPaymentMethod)
			payment.DELETE("/methods/:methodID", userController.RemovePaymentMethod)
			payment.PUT("/methods/:methodID/default", userController.SetDefaultPaymentMethod)
		}

		// Notifications
		notifications := user.Group("/notifications")
		{
			notifications.GET("", userController.GetNotifications)
			notifications.PUT("/:notificationID/read", userController.MarkNotificationAsRead)
			notifications.POST("/mark-all-read", userController.MarkAllNotificationsAsRead)
			notifications.DELETE("/:notificationID", userController.DeleteNotification)
		}

		// Device management
		devices := user.Group("/devices")
		{
			devices.GET("", userController.GetDevices)
			devices.POST("/register", userController.RegisterDevice)
			devices.DELETE("/:deviceID", userController.RemoveDevice)
			devices.POST("/logout-all", userController.LogoutAllDevices)
		}
	}
}
