package middleware

import (
	"context"
	"net/http"
	"strings"

	"onflix/internal/models"
	"onflix/internal/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuthMiddleware struct {
	db        *mongo.Database
	jwtSecret string
}

func NewAuthMiddleware(db *mongo.Database, jwtSecret string) *AuthMiddleware {
	return &AuthMiddleware{
		db:        db,
		jwtSecret: jwtSecret,
	}
}

func (am *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Authorization header required")
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid authorization header format")
			c.Abort()
			return
		}

		token := parts[1]
		claims, err := utils.ValidateJWT(token, am.jwtSecret)
		if err != nil {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid or expired token")
			c.Abort()
			return
		}

		// Get user from database
		userID, err := primitive.ObjectIDFromHex(claims.UserID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid user ID in token")
			c.Abort()
			return
		}

		var user models.User
		err = am.db.Collection("users").FindOne(context.Background(), bson.M{
			"_id":       userID,
			"is_active": true,
		}).Decode(&user)

		if err != nil {
			if err == mongo.ErrNoDocuments {
				utils.ErrorResponse(c, http.StatusUnauthorized, "User not found or inactive")
			} else {
				utils.ErrorResponse(c, http.StatusInternalServerError, "Database error")
			}
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user", &user)
		c.Set("userID", user.ID.Hex())
		c.Next()
	}
}

func (am *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		token := parts[1]
		claims, err := utils.ValidateJWT(token, am.jwtSecret)
		if err != nil {
			c.Next()
			return
		}

		// Get user from database
		userID, err := primitive.ObjectIDFromHex(claims.UserID)
		if err != nil {
			c.Next()
			return
		}

		var user models.User
		err = am.db.Collection("users").FindOne(context.Background(), bson.M{
			"_id":       userID,
			"is_active": true,
		}).Decode(&user)

		if err == nil {
			c.Set("user", &user)
			c.Set("userID", user.ID.Hex())
		}

		c.Next()
	}
}

func (am *AuthMiddleware) RequireSubscription() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Authentication required")
			c.Abort()
			return
		}

		u := user.(*models.User)
		if u.Subscription == nil {
			utils.ErrorResponse(c, http.StatusForbidden, "Active subscription required")
			c.Abort()
			return
		}

		if u.Subscription.Status != models.SubscriptionStatusActive &&
			u.Subscription.Status != models.SubscriptionStatusTrialing {
			utils.ErrorResponse(c, http.StatusForbidden, "Active subscription required")
			c.Abort()
			return
		}

		c.Next()
	}
}
