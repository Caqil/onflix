// backend/internal/services/auth.go
package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"onflix/internal/config"
	"onflix/internal/models"
	"onflix/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	config *config.Config
	db     *mongo.Database
}

type LoginAttempt struct {
	Email     string    `bson:"email"`
	IP        string    `bson:"ip"`
	Success   bool      `bson:"success"`
	Timestamp time.Time `bson:"timestamp"`
	UserAgent string    `bson:"user_agent"`
}

type SecuritySettings struct {
	MaxLoginAttempts    int           `json:"max_login_attempts"`
	LockoutDuration     time.Duration `json:"lockout_duration"`
	PasswordMinLength   int           `json:"password_min_length"`
	RequireSpecialChars bool          `json:"require_special_chars"`
	RequireNumbers      bool          `json:"require_numbers"`
	RequireUppercase    bool          `json:"require_uppercase"`
	SessionTimeout      time.Duration `json:"session_timeout"`
	RequireMFA          bool          `json:"require_mfa"`
}

type AuthResult struct {
	Success      bool         `json:"success"`
	User         *models.User `json:"user,omitempty"`
	AccessToken  string       `json:"access_token,omitempty"`
	RefreshToken string       `json:"refresh_token,omitempty"`
	ExpiresAt    time.Time    `json:"expires_at,omitempty"`
	Message      string       `json:"message"`
	Error        string       `json:"error,omitempty"`
	RequiresMFA  bool         `json:"requires_mfa,omitempty"`
}

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,password"`
	FirstName string `json:"first_name" validate:"required,min=2,max=50"`
	LastName  string `json:"last_name" validate:"required,min=2,max=50"`
	Phone     string `json:"phone,omitempty" validate:"omitempty,phone"`
}

type LoginRequest struct {
	Email      string `json:"email" validate:"required,email"`
	Password   string `json:"password" validate:"required"`
	RememberMe bool   `json:"remember_me"`
	IP         string `json:"ip"`
	UserAgent  string `json:"user_agent"`
}

func NewAuthService(cfg *config.Config, db *mongo.Database) *AuthService {
	return &AuthService{
		config: cfg,
		db:     db,
	}
}

// User Registration
func (as *AuthService) RegisterUser(req RegisterRequest) (*AuthResult, error) {
	// Validate request
	if errors := utils.ValidateStruct(req); errors != nil {
		return &AuthResult{
			Success: false,
			Error:   "Validation failed",
		}, fmt.Errorf("validation errors: %v", errors)
	}

	// Check if user already exists
	existingUser, err := as.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		return &AuthResult{
			Success: false,
			Error:   "User with this email already exists",
		}, nil
	}

	// Hash password
	hashedPassword, err := as.HashPassword(req.Password)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Failed to process password",
		}, err
	}

	// Generate email verification token
	verificationToken, err := as.GenerateSecureToken(32)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Failed to generate verification token",
		}, err
	}

	// Create user
	user := models.User{
		ID:              primitive.NewObjectID(),
		Email:           req.Email,
		Password:        hashedPassword,
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

	// Insert user into database
	_, err = as.db.Collection("users").InsertOne(context.Background(), user)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Failed to create user account",
		}, err
	}

	// Generate tokens
	accessToken, err := utils.GenerateJWT(
		user.ID.Hex(),
		user.Email,
		string(user.Role),
		as.config.JWT.Secret,
		as.config.JWT.ExpiryDays,
	)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Failed to generate access token",
		}, err
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID.Hex(), as.config.JWT.Secret)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Failed to generate refresh token",
		}, err
	}

	// Remove password from response
	user.Password = ""

	return &AuthResult{
		Success:      true,
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(as.config.JWT.ExpiryDays) * 24 * time.Hour),
		Message:      "User registered successfully",
	}, nil
}

// User Login
func (as *AuthService) LoginUser(req LoginRequest) (*AuthResult, error) {
	// Validate request
	if errors := utils.ValidateStruct(req); errors != nil {
		return &AuthResult{
			Success: false,
			Error:   "Invalid login credentials",
		}, fmt.Errorf("validation errors: %v", errors)
	}

	// Check rate limiting
	if locked, err := as.IsAccountLocked(req.Email, req.IP); err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Service temporarily unavailable",
		}, err
	} else if locked {
		return &AuthResult{
			Success: false,
			Error:   "Account temporarily locked due to multiple failed login attempts",
		}, nil
	}

	// Find user
	user, err := as.GetUserByEmail(req.Email)
	if err != nil || user == nil {
		// Log failed attempt
		as.LogLoginAttempt(req.Email, req.IP, req.UserAgent, false)
		return &AuthResult{
			Success: false,
			Error:   "Invalid email or password",
		}, nil
	}

	// Check if user is active
	if !user.IsActive {
		as.LogLoginAttempt(req.Email, req.IP, req.UserAgent, false)
		return &AuthResult{
			Success: false,
			Error:   "Account is deactivated",
		}, nil
	}

	// Verify password
	if !as.VerifyPassword(req.Password, user.Password) {
		as.LogLoginAttempt(req.Email, req.IP, req.UserAgent, false)
		return &AuthResult{
			Success: false,
			Error:   "Invalid email or password",
		}, nil
	}

	// Log successful attempt
	as.LogLoginAttempt(req.Email, req.IP, req.UserAgent, true)

	// Update last login
	now := time.Now()
	_, err = as.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{"last_login_at": now, "updated_at": now}},
	)
	if err != nil {
		// Log but don't fail login
		fmt.Printf("Failed to update last login: %v\n", err)
	}

	// Determine token expiry based on remember me
	expiryDays := as.config.JWT.ExpiryDays
	if req.RememberMe {
		expiryDays = 30 // 30 days for remember me
	}

	// Generate tokens
	accessToken, err := utils.GenerateJWT(
		user.ID.Hex(),
		user.Email,
		string(user.Role),
		as.config.JWT.Secret,
		expiryDays,
	)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Failed to generate access token",
		}, err
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID.Hex(), as.config.JWT.Secret)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Failed to generate refresh token",
		}, err
	}

	// Remove password from response
	user.Password = ""

	return &AuthResult{
		Success:      true,
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(expiryDays) * 24 * time.Hour),
		Message:      "Login successful",
	}, nil
}

// Password Management
func (as *AuthService) HashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %v", err)
	}
	return string(hashedBytes), nil
}

func (as *AuthService) VerifyPassword(plainPassword, hashedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
	return err == nil
}

func (as *AuthService) ValidatePasswordStrength(password string) (bool, []string) {
	var errors []string

	if len(password) < 8 {
		errors = append(errors, "Password must be at least 8 characters long")
	}

	if len(password) > 128 {
		errors = append(errors, "Password must be less than 128 characters")
	}

	// Check for required character types
	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case char >= 32 && char <= 126: // Printable ASCII special chars
			if !((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
				hasSpecial = true
			}
		}
	}

	if !hasUpper {
		errors = append(errors, "Password must contain at least one uppercase letter")
	}
	if !hasLower {
		errors = append(errors, "Password must contain at least one lowercase letter")
	}
	if !hasNumber {
		errors = append(errors, "Password must contain at least one number")
	}
	if !hasSpecial {
		errors = append(errors, "Password must contain at least one special character")
	}

	return len(errors) == 0, errors
}

// Token Management
func (as *AuthService) RefreshToken(refreshToken string) (*AuthResult, error) {
	// Validate refresh token
	claims, err := utils.ValidateJWT(refreshToken, as.config.JWT.Secret)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Invalid refresh token",
		}, nil
	}

	// Get user
	userID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Invalid user ID in token",
		}, nil
	}

	user, err := as.GetUserByID(userID)
	if err != nil || user == nil {
		return &AuthResult{
			Success: false,
			Error:   "User not found",
		}, nil
	}

	if !user.IsActive {
		return &AuthResult{
			Success: false,
			Error:   "Account is deactivated",
		}, nil
	}

	// Generate new access token
	accessToken, err := utils.GenerateJWT(
		user.ID.Hex(),
		user.Email,
		string(user.Role),
		as.config.JWT.Secret,
		as.config.JWT.ExpiryDays,
	)
	if err != nil {
		return &AuthResult{
			Success: false,
			Error:   "Failed to generate access token",
		}, err
	}

	// Remove password from response
	user.Password = ""

	return &AuthResult{
		Success:     true,
		User:        user,
		AccessToken: accessToken,
		ExpiresAt:   time.Now().Add(time.Duration(as.config.JWT.ExpiryDays) * 24 * time.Hour),
		Message:     "Token refreshed successfully",
	}, nil
}

func (as *AuthService) ValidateToken(tokenString string) (*models.User, error) {
	claims, err := utils.ValidateJWT(tokenString, as.config.JWT.Secret)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %v", err)
	}

	userID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID in token: %v", err)
	}

	user, err := as.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	if !user.IsActive {
		return nil, fmt.Errorf("user account is deactivated")
	}

	return user, nil
}

// Email Verification
func (as *AuthService) VerifyEmail(token string) error {
	var user models.User
	err := as.db.Collection("users").FindOne(
		context.Background(),
		bson.M{
			"password_reset_token":  token,
			"password_reset_expiry": bson.M{"$gt": time.Now()},
		},
	).Decode(&user)

	if err != nil {
		return fmt.Errorf("invalid or expired verification token")
	}

	// Update user as verified
	now := time.Now()
	_, err = as.db.Collection("users").UpdateOne(
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

	return err
}

func (as *AuthService) SendVerificationEmail(email string) error {
	user, err := as.GetUserByEmail(email)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	if user.IsEmailVerified {
		return fmt.Errorf("email is already verified")
	}

	// Generate new verification token
	token, err := as.GenerateSecureToken(32)
	if err != nil {
		return err
	}

	// Update user with new token
	now := time.Now()
	_, err = as.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{
			"password_reset_token":  token,
			"password_reset_expiry": now.Add(24 * time.Hour),
			"updated_at":            now,
		}},
	)

	return err
}

// Password Reset
func (as *AuthService) InitiatePasswordReset(email string) error {
	user, err := as.GetUserByEmail(email)
	if err != nil {
		// Don't reveal if user exists for security
		return nil
	}

	// Generate reset token
	token, err := as.GenerateSecureToken(32)
	if err != nil {
		return err
	}

	// Update user with reset token
	now := time.Now()
	_, err = as.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{
			"password_reset_token":  token,
			"password_reset_expiry": now.Add(1 * time.Hour),
			"updated_at":            now,
		}},
	)

	return err
}

func (as *AuthService) ResetPassword(token, newPassword string) error {
	// Validate password strength
	if valid, errors := as.ValidatePasswordStrength(newPassword); !valid {
		return fmt.Errorf("password validation failed: %v", errors)
	}

	// Find user with reset token
	var user models.User
	err := as.db.Collection("users").FindOne(
		context.Background(),
		bson.M{
			"password_reset_token":  token,
			"password_reset_expiry": bson.M{"$gt": time.Now()},
		},
	).Decode(&user)

	if err != nil {
		return fmt.Errorf("invalid or expired reset token")
	}

	// Hash new password
	hashedPassword, err := as.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// Update user
	now := time.Now()
	_, err = as.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{
			"password":              hashedPassword,
			"password_reset_token":  "",
			"password_reset_expiry": nil,
			"updated_at":            now,
		}},
	)

	return err
}

func (as *AuthService) ChangePassword(userID primitive.ObjectID, currentPassword, newPassword string) error {
	// Get user
	user, err := as.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("user not found")
	}

	// Verify current password
	if !as.VerifyPassword(currentPassword, user.Password) {
		return fmt.Errorf("current password is incorrect")
	}

	// Validate new password strength
	if valid, errors := as.ValidatePasswordStrength(newPassword); !valid {
		return fmt.Errorf("password validation failed: %v", errors)
	}

	// Hash new password
	hashedPassword, err := as.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// Update password
	now := time.Now()
	_, err = as.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"password":   hashedPassword,
			"updated_at": now,
		}},
	)

	return err
}

// User Management
func (as *AuthService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := as.db.Collection("users").FindOne(
		context.Background(),
		bson.M{"email": email},
	).Decode(&user)

	if err == mongo.ErrNoDocuments {
		return nil, nil
	}

	return &user, err
}

func (as *AuthService) GetUserByID(userID primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := as.db.Collection("users").FindOne(
		context.Background(),
		bson.M{"_id": userID},
	).Decode(&user)

	if err == mongo.ErrNoDocuments {
		return nil, nil
	}

	return &user, err
}

func (as *AuthService) UpdateLastLogin(userID primitive.ObjectID, ip, userAgent string) error {
	now := time.Now()
	_, err := as.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"last_login_at": now,
			"updated_at":    now,
		}},
	)
	return err
}

// Security and Rate Limiting
func (as *AuthService) LogLoginAttempt(email, ip, userAgent string, success bool) {
	attempt := LoginAttempt{
		Email:     email,
		IP:        ip,
		Success:   success,
		Timestamp: time.Now(),
		UserAgent: userAgent,
	}

	// Store login attempt (don't fail if this fails)
	as.db.Collection("login_attempts").InsertOne(context.Background(), attempt)
}

func (as *AuthService) IsAccountLocked(email, ip string) (bool, error) {
	// Check failed attempts in the last hour
	oneHourAgo := time.Now().Add(-1 * time.Hour)

	// Count failed attempts by email
	emailCount, err := as.db.Collection("login_attempts").CountDocuments(
		context.Background(),
		bson.M{
			"email":     email,
			"success":   false,
			"timestamp": bson.M{"$gte": oneHourAgo},
		},
	)
	if err != nil {
		return false, err
	}

	// Count failed attempts by IP
	ipCount, err := as.db.Collection("login_attempts").CountDocuments(
		context.Background(),
		bson.M{
			"ip":        ip,
			"success":   false,
			"timestamp": bson.M{"$gte": oneHourAgo},
		},
	)
	if err != nil {
		return false, err
	}

	// Lock if more than 5 failed attempts
	return emailCount >= 5 || ipCount >= 10, nil
}

func (as *AuthService) ClearLoginAttempts(email, ip string) error {
	_, err := as.db.Collection("login_attempts").DeleteMany(
		context.Background(),
		bson.M{
			"$or": []bson.M{
				{"email": email},
				{"ip": ip},
			},
		},
	)
	return err
}

// Utility Methods
func (as *AuthService) GenerateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate secure token: %v", err)
	}
	return hex.EncodeToString(bytes), nil
}

func (as *AuthService) GetSecuritySettings() SecuritySettings {
	return SecuritySettings{
		MaxLoginAttempts:    5,
		LockoutDuration:     1 * time.Hour,
		PasswordMinLength:   8,
		RequireSpecialChars: true,
		RequireNumbers:      true,
		RequireUppercase:    true,
		SessionTimeout:      24 * time.Hour,
		RequireMFA:          false,
	}
}

// Account Management
func (as *AuthService) DeactivateAccount(userID primitive.ObjectID) error {
	now := time.Now()
	_, err := as.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"is_active":  false,
			"updated_at": now,
		}},
	)
	return err
}

func (as *AuthService) ReactivateAccount(userID primitive.ObjectID) error {
	now := time.Now()
	_, err := as.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"is_active":  true,
			"updated_at": now,
		}},
	)
	return err
}

// Session Management
func (as *AuthService) InvalidateAllUserSessions(userID primitive.ObjectID) error {
	// In a stateless JWT system, we would maintain a blacklist
	// For now, we could update a "session_version" field that invalidates old tokens
	now := time.Now()
	_, err := as.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"session_version": now.Unix(),
			"updated_at":      now,
		}},
	)
	return err
}

// Two-Factor Authentication (placeholder for future implementation)
func (as *AuthService) Enable2FA(userID primitive.ObjectID) (string, error) {
	// TODO: Implement 2FA setup
	return "", fmt.Errorf("2FA not yet implemented")
}

func (as *AuthService) Verify2FA(userID primitive.ObjectID, code string) (bool, error) {
	// TODO: Implement 2FA verification
	return false, fmt.Errorf("2FA not yet implemented")
}

func (as *AuthService) Disable2FA(userID primitive.ObjectID) error {
	// TODO: Implement 2FA disable
	return fmt.Errorf("2FA not yet implemented")
}

// Health Check
func (as *AuthService) HealthCheck() error {
	// Test database connectivity
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := as.db.Client().Ping(ctx, nil)
	if err != nil {
		return fmt.Errorf("database connection failed: %v", err)
	}

	return nil
}
