package middleware

import (
	"net/http"

	"onflix/internal/models"
	"onflix/internal/utils"

	"github.com/gin-gonic/gin"
)

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Authentication required")
			c.Abort()
			return
		}

		u := user.(*models.User)
		if u.Role != models.RoleAdmin {
			utils.ErrorResponse(c, http.StatusForbidden, "Admin access required")
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequireAdminOrSelf() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Authentication required")
			c.Abort()
			return
		}

		u := user.(*models.User)
		targetUserID := c.Param("userID")

		// Allow if admin or accessing own data
		if u.Role == models.RoleAdmin || u.ID.Hex() == targetUserID {
			c.Next()
			return
		}

		utils.ErrorResponse(c, http.StatusForbidden, "Access denied")
		c.Abort()
	}
}

// Rate limiting middleware for admin actions
func AdminRateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Simple rate limiting - in production, use Redis-based rate limiting
		c.Next()
	}
}
