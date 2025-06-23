package routes

import (
	"onflix/internal/controllers"
	"onflix/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupAuthRoutes(rg *gin.RouterGroup, services *services.Services) {
	authController := controllers.NewAuthController(services)

	auth := rg.Group("/auth")
	{
		// Registration and login
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
		auth.POST("/logout", authController.Logout)

		// Email verification
		auth.POST("/verify-email", authController.VerifyEmail)
		auth.POST("/resend-verification", authController.ResendVerification)

		// Password management
		auth.POST("/forgot-password", authController.ForgotPassword)
		auth.POST("/reset-password", authController.ResetPassword)
		auth.POST("/change-password", authController.ChangePassword)

		// Token management
		auth.POST("/refresh", authController.RefreshToken)
		auth.POST("/validate", authController.ValidateToken)

		// Social login (for future implementation)
		auth.POST("/google", authController.GoogleLogin)
		auth.POST("/facebook", authController.FacebookLogin)

		// Two-factor authentication
		auth.POST("/2fa/enable", authController.Enable2FA)
		auth.POST("/2fa/verify", authController.Verify2FA)
		auth.POST("/2fa/disable", authController.Disable2FA)
	}
}
