// backend/internal/models/user.go
package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID                primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Email             string             `json:"email" bson:"email" validate:"required,email"`
	Password          string             `json:"-" bson:"password" validate:"required,min=6"`
	FirstName         string             `json:"first_name" bson:"first_name" validate:"required"`
	LastName          string             `json:"last_name" bson:"last_name" validate:"required"`
	Phone             string             `json:"phone" bson:"phone"`
	Avatar            string             `json:"avatar" bson:"avatar"`
	IsActive          bool               `json:"is_active" bson:"is_active"`
	IsEmailVerified   bool               `json:"is_email_verified" bson:"is_email_verified"`
	EmailVerifiedAt   *time.Time         `json:"email_verified_at" bson:"email_verified_at"`
	Role              UserRole           `json:"role" bson:"role"`
	Subscription      *UserSubscription  `json:"subscription" bson:"subscription"`
	Profiles          []UserProfile      `json:"profiles" bson:"profiles"`
	Preferences       UserPreferences    `json:"preferences" bson:"preferences"`
	LastLoginAt       *time.Time         `json:"last_login_at" bson:"last_login_at"`
	PasswordResetToken string            `json:"-" bson:"password_reset_token"`
	PasswordResetExpiry *time.Time       `json:"-" bson:"password_reset_expiry"`
	CreatedAt         time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt         time.Time          `json:"updated_at" bson:"updated_at"`
}

type UserRole string

const (
	RoleUser  UserRole = "user"
	RoleAdmin UserRole = "admin"
)

type UserSubscription struct {
	PlanID          primitive.ObjectID `json:"plan_id" bson:"plan_id"`
	StripeCustomerID string            `json:"stripe_customer_id" bson:"stripe_customer_id"`
	StripeSubscriptionID string        `json:"stripe_subscription_id" bson:"stripe_subscription_id"`
	Status          SubscriptionStatus `json:"status" bson:"status"`
	CurrentPeriodStart time.Time       `json:"current_period_start" bson:"current_period_start"`
	CurrentPeriodEnd   time.Time       `json:"current_period_end" bson:"current_period_end"`
	CancelAt        *time.Time         `json:"cancel_at" bson:"cancel_at"`
	CancelledAt     *time.Time         `json:"cancelled_at" bson:"cancelled_at"`
	CreatedAt       time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at" bson:"updated_at"`
}

type UserProfile struct {
	ID           primitive.ObjectID   `json:"id" bson:"_id,omitempty"`
	Name         string               `json:"name" bson:"name" validate:"required"`
	Avatar       string               `json:"avatar" bson:"avatar"`
	IsKidsProfile bool                `json:"is_kids_profile" bson:"is_kids_profile"`
	Language     string               `json:"language" bson:"language"`
	Watchlist    []primitive.ObjectID `json:"watchlist" bson:"watchlist"`
	WatchHistory []WatchHistoryItem   `json:"watch_history" bson:"watch_history"`
	Preferences  ProfilePreferences   `json:"preferences" bson:"preferences"`
	CreatedAt    time.Time            `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time            `json:"updated_at" bson:"updated_at"`
}

type WatchHistoryItem struct {
	ContentID     primitive.ObjectID `json:"content_id" bson:"content_id"`
	Progress      float64            `json:"progress" bson:"progress"` // Percentage watched (0-100)
	Duration      int                `json:"duration" bson:"duration"` // Total duration in seconds
	WatchedAt     time.Time          `json:"watched_at" bson:"watched_at"`
	LastWatchedAt time.Time          `json:"last_watched_at" bson:"last_watched_at"`
}

type UserPreferences struct {
	Language        string   `json:"language" bson:"language"`
	AutoPlay        bool     `json:"auto_play" bson:"auto_play"`
	AutoPlayPreviews bool    `json:"auto_play_previews" bson:"auto_play_previews"`
	DataSaver       bool     `json:"data_saver" bson:"data_saver"`
	PreferredGenres []string `json:"preferred_genres" bson:"preferred_genres"`
	MaturityRating  string   `json:"maturity_rating" bson:"maturity_rating"`
}

type ProfilePreferences struct {
	MaturityRating string   `json:"maturity_rating" bson:"maturity_rating"`
	PreferredGenres []string `json:"preferred_genres" bson:"preferred_genres"`
	AutoPlay       bool     `json:"auto_play" bson:"auto_play"`
}
