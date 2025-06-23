// backend/internal/controllers/auth.go
package controllers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"onflix/internal/models"
	"onflix/internal/services"
	"onflix/internal/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type AuthController struct {
	services *services.Services
}

func NewAuthController(services *services.Services) *AuthController {
	return &AuthController{
		services: services,
	}
}

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,password"`
	FirstName string `json:"first_name" validate:"required,min=2,max=50"`
	LastName  string `json:"last_name" validate:"required,min=2,max=50"`
	Phone     string `json:"phone,omitempty" validate:"omitempty,phone"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,password"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,password"`
}

type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required"`
}

type AuthResponse struct {
	User         *models.User `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresAt    time.Time    `json:"expires_at"`
}

func (ac *AuthController) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	// Validate request
	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	// Check if user already exists
	var existingUser models.User
	err := ac.services.DB.Collection("users").FindOne(context.Background(), bson.M{
		"email": req.Email,
	}).Decode(&existingUser)

	if err != mongo.ErrNoDocuments {
		utils.ConflictResponse(c, "User with this email already exists")
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Generate email verification token
	verificationToken, err := generateRandomToken(32)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Create user
	user := models.User{
		ID:              primitive.NewObjectID(),
		Email:           req.Email,
		Password:        string(hashedPassword),
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Phone:           req.Phone,
		IsActive:        true,
		IsEmailVerified: false,
		Role:            models.RoleUser,
		Preferences: models.UserPreferences{
			Language:         "en",
			AutoPlay:         true,
			AutoPlayPreviews: true,
			DataSaver:        false,
			MaturityRating:   "PG-13",
		},
		PasswordResetToken:  verificationToken,
		PasswordResetExpiry: &[]time.Time{time.Now().Add(24 * time.Hour)}[0],
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	// Create default profile
	defaultProfile := models.UserProfile{
		ID:            primitive.NewObjectID(),
		Name:          req.FirstName,
		IsKidsProfile: false,
		Language:      "en",
		Watchlist:     []primitive.ObjectID{},
		WatchHistory:  []models.WatchHistoryItem{},
		Preferences: models.ProfilePreferences{
			MaturityRating: "PG-13",
			AutoPlay:       true,
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	user.Profiles = []models.UserProfile{defaultProfile}

	// Insert user
	_, err = ac.services.DB.Collection("users").InsertOne(context.Background(), user)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Send verification email
	go ac.services.EmailService.SendVerificationEmail(user.Email, verificationToken)

	// Generate tokens
	accessToken, err := utils.GenerateJWT(
		user.ID.Hex(),
		user.Email,
		string(user.Role),
		ac.services.Config.JWT.Secret,
		ac.services.Config.JWT.ExpiryDays,
	)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID.Hex(), ac.services.Config.JWT.Secret)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Remove password from response
	user.Password = ""

	response := AuthResponse{
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(ac.services.Config.JWT.ExpiryDays) * 24 * time.Hour),
	}

	utils.CreatedResponse(c, "User registered successfully. Please verify your email.", response)
}

func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	// Validate request
	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	// Find user
	var user models.User
	err := ac.services.DB.Collection("users").FindOne(context.Background(), bson.M{
		"email": req.Email,
	}).Decode(&user)

	if err != nil {
		utils.UnauthorizedResponse(c)
		return
	}

	// Check if user is active
	if !user.IsActive {
		utils.UnauthorizedResponse(c)
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		utils.UnauthorizedResponse(c)
		return
	}

	// Update last login
	now := time.Now()
	_, err = ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{"last_login_at": now, "updated_at": now}},
	)
	if err != nil {
		// Log error but don't fail login
		fmt.Printf("Failed to update last login: %v\n", err)
	}

	// Generate tokens
	accessToken, err := utils.GenerateJWT(
		user.ID.Hex(),
		user.Email,
		string(user.Role),
		ac.services.Config.JWT.Secret,
		ac.services.Config.JWT.ExpiryDays,
	)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID.Hex(), ac.services.Config.JWT.Secret)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Remove password from response
	user.Password = ""

	response := AuthResponse{
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(ac.services.Config.JWT.ExpiryDays) * 24 * time.Hour),
	}

	utils.SuccessResponse(c, http.StatusOK, "Login successful", response)
}

func (ac *AuthController) Logout(c *gin.Context) {
	// In a stateless JWT system, logout is handled client-side
	// For additional security, you could maintain a blacklist of tokens
	utils.SuccessResponse(c, http.StatusOK, "Logout successful", nil)
}

func (ac *AuthController) VerifyEmail(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	// Find user with verification token
	var user models.User
	err := ac.services.DB.Collection("users").FindOne(context.Background(), bson.M{
		"password_reset_token":  req.Token,
		"password_reset_expiry": bson.M{"$gt": time.Now()},
	}).Decode(&user)

	if err != nil {
		utils.BadRequestResponse(c, "Invalid or expired verification token")
		return
	}

	// Update user
	now := time.Now()
	_, err = ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{
			"is_email_verified":     true,
			"email_verified_at":     now,
			"password_reset_token":  "",
			"password_reset_expiry": nil,
			"updated_at":            now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Email verified successfully", nil)
}

func (ac *AuthController) ResendVerification(c *gin.Context) {
	var req struct {
		Email string `json:"email" validate:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	// Find user
	var user models.User
	err := ac.services.DB.Collection("users").FindOne(context.Background(), bson.M{
		"email": req.Email,
	}).Decode(&user)

	if err != nil {
		// Don't reveal if user exists
		utils.SuccessResponse(c, http.StatusOK, "If the email exists, verification email has been sent", nil)
		return
	}

	if user.IsEmailVerified {
		utils.BadRequestResponse(c, "Email is already verified")
		return
	}

	// Generate new verification token
	verificationToken, err := generateRandomToken(32)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update user with new token
	now := time.Now()
	_, err = ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{
			"password_reset_token":  verificationToken,
			"password_reset_expiry": now.Add(24 * time.Hour),
			"updated_at":            now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Send verification email
	go ac.services.EmailService.SendVerificationEmail(user.Email, verificationToken)

	utils.SuccessResponse(c, http.StatusOK, "Verification email sent", nil)
}

func (ac *AuthController) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	// Find user
	var user models.User
	err := ac.services.DB.Collection("users").FindOne(context.Background(), bson.M{
		"email": req.Email,
	}).Decode(&user)

	if err != nil {
		// Don't reveal if user exists
		utils.SuccessResponse(c, http.StatusOK, "If the email exists, password reset instructions have been sent", nil)
		return
	}

	// Generate reset token
	resetToken, err := generateRandomToken(32)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update user with reset token
	now := time.Now()
	_, err = ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{
			"password_reset_token":  resetToken,
			"password_reset_expiry": now.Add(1 * time.Hour),
			"updated_at":            now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Send reset email
	go ac.services.EmailService.SendPasswordResetEmail(user.Email, resetToken)

	utils.SuccessResponse(c, http.StatusOK, "Password reset instructions sent", nil)
}

func (ac *AuthController) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	// Validate request
	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	// Find user with reset token
	var user models.User
	err := ac.services.DB.Collection("users").FindOne(context.Background(), bson.M{
		"password_reset_token":  req.Token,
		"password_reset_expiry": bson.M{"$gt": time.Now()},
	}).Decode(&user)

	if err != nil {
		utils.BadRequestResponse(c, "Invalid or expired reset token")
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update user
	now := time.Now()
	_, err = ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{
			"password":              string(hashedPassword),
			"password_reset_token":  "",
			"password_reset_expiry": nil,
			"updated_at":            now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Password reset successfully", nil)
}

func (ac *AuthController) ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	// Validate request
	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Get current user data (to get current password)
	var currentUser models.User
	err := ac.services.DB.Collection("users").FindOne(context.Background(), bson.M{
		"_id": u.ID,
	}).Decode(&currentUser)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(currentUser.Password), []byte(req.CurrentPassword))
	if err != nil {
		utils.BadRequestResponse(c, "Current password is incorrect")
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update password
	now := time.Now()
	_, err = ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{"$set": bson.M{
			"password":   string(hashedPassword),
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Password changed successfully", nil)
}

func (ac *AuthController) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	// Validate refresh token
	claims, err := utils.ValidateJWT(req.RefreshToken, ac.services.Config.JWT.Secret)
	if err != nil {
		utils.UnauthorizedResponse(c)
		return
	}

	// Get user
	userID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		utils.UnauthorizedResponse(c)
		return
	}

	var user models.User
	err = ac.services.DB.Collection("users").FindOne(context.Background(), bson.M{
		"_id":       userID,
		"is_active": true,
	}).Decode(&user)

	if err != nil {
		utils.UnauthorizedResponse(c)
		return
	}

	// Generate new access token
	accessToken, err := utils.GenerateJWT(
		user.ID.Hex(),
		user.Email,
		string(user.Role),
		ac.services.Config.JWT.Secret,
		ac.services.Config.JWT.ExpiryDays,
	)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	response := gin.H{
		"access_token": accessToken,
		"expires_at":   time.Now().Add(time.Duration(ac.services.Config.JWT.ExpiryDays) * 24 * time.Hour),
	}

	utils.SuccessResponse(c, http.StatusOK, "Token refreshed successfully", response)
}

func (ac *AuthController) ValidateToken(c *gin.Context) {
	// Token validation is handled by middleware
	// If we reach here, token is valid
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	u.Password = "" // Remove password from response

	utils.SuccessResponse(c, http.StatusOK, "Token is valid", u)
}

// Social login methods (basic structure for future implementation)
func (ac *AuthController) GoogleLogin(c *gin.Context) {
	// TODO: Implement Google OAuth flow
	utils.BadRequestResponse(c, "Google login not yet implemented")
}

func (ac *AuthController) FacebookLogin(c *gin.Context) {
	// TODO: Implement Facebook OAuth flow
	utils.BadRequestResponse(c, "Facebook login not yet implemented")
}

// Two-factor authentication methods (basic structure for future implementation)
func (ac *AuthController) Enable2FA(c *gin.Context) {
	// TODO: Implement 2FA setup
	utils.BadRequestResponse(c, "2FA not yet implemented")
}

func (ac *AuthController) Verify2FA(c *gin.Context) {
	// TODO: Implement 2FA verification
	utils.BadRequestResponse(c, "2FA not yet implemented")
}

func (ac *AuthController) Disable2FA(c *gin.Context) {
	// TODO: Implement 2FA disable
	utils.BadRequestResponse(c, "2FA not yet implemented")
}

// Helper function to generate random tokens
func generateRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
