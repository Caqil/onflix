package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SubscriptionPlan struct {
	ID            primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name          string             `json:"name" bson:"name" validate:"required"`
	Description   string             `json:"description" bson:"description"`
	Price         float64            `json:"price" bson:"price" validate:"required"`
	Currency      string             `json:"currency" bson:"currency"`
	Interval      PlanInterval       `json:"interval" bson:"interval" validate:"required"`
	Features      PlanFeatures       `json:"features" bson:"features"`
	Limits        PlanLimits         `json:"limits" bson:"limits"`
	StripePriceID string             `json:"stripe_price_id" bson:"stripe_price_id"`
	IsActive      bool               `json:"is_active" bson:"is_active"`
	IsPopular     bool               `json:"is_popular" bson:"is_popular"`
	SortOrder     int                `json:"sort_order" bson:"sort_order"`
	CreatedAt     time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at" bson:"updated_at"`
}

type PlanInterval string

const (
	IntervalMonthly PlanInterval = "monthly"
	IntervalYearly  PlanInterval = "yearly"
)

type PlanFeatures struct {
	VideoQuality    []VideoQuality `json:"video_quality" bson:"video_quality"`
	HDSupport       bool           `json:"hd_support" bson:"hd_support"`
	UltraHDSupport  bool           `json:"ultra_hd_support" bson:"ultra_hd_support"`
	DownloadSupport bool           `json:"download_support" bson:"download_support"`
	AdFree          bool           `json:"ad_free" bson:"ad_free"`
	EarlyAccess     bool           `json:"early_access" bson:"early_access"`
}

type PlanLimits struct {
	MaxProfiles          int `json:"max_profiles" bson:"max_profiles"`
	MaxConcurrentStreams int `json:"max_concurrent_streams" bson:"max_concurrent_streams"`
	MaxDownloads         int `json:"max_downloads" bson:"max_downloads"`
}

type Subscription struct {
	ID                   primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID               primitive.ObjectID `json:"user_id" bson:"user_id"`
	PlanID               primitive.ObjectID `json:"plan_id" bson:"plan_id"`
	StripeSubscriptionID string             `json:"stripe_subscription_id" bson:"stripe_subscription_id"`
	StripeCustomerID     string             `json:"stripe_customer_id" bson:"stripe_customer_id"`
	Status               SubscriptionStatus `json:"status" bson:"status"`
	CurrentPeriodStart   time.Time          `json:"current_period_start" bson:"current_period_start"`
	CurrentPeriodEnd     time.Time          `json:"current_period_end" bson:"current_period_end"`
	TrialStart           *time.Time         `json:"trial_start" bson:"trial_start"`
	TrialEnd             *time.Time         `json:"trial_end" bson:"trial_end"`
	CancelAt             *time.Time         `json:"cancel_at" bson:"cancel_at"`
	CancelledAt          *time.Time         `json:"cancelled_at" bson:"cancelled_at"`
	CancellationReason   string             `json:"cancellation_reason" bson:"cancellation_reason"`
	PausedAt             *time.Time         `json:"paused_at" bson:"paused_at"`
	ResumedAt            *time.Time         `json:"resumed_at" bson:"resumed_at"`
	AutoRenew            bool               `json:"auto_renew" bson:"auto_renew"`
	CreatedAt            time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt            time.Time          `json:"updated_at" bson:"updated_at"`
}

type SubscriptionStatus string

const (
	SubscriptionStatusActive            SubscriptionStatus = "active"
	SubscriptionStatusPastDue           SubscriptionStatus = "past_due"
	SubscriptionStatusUnpaid            SubscriptionStatus = "unpaid"
	SubscriptionStatusCancelled         SubscriptionStatus = "cancelled"
	SubscriptionStatusIncomplete        SubscriptionStatus = "incomplete"
	SubscriptionStatusIncompleteExpired SubscriptionStatus = "incomplete_expired"
	SubscriptionStatusTrialing          SubscriptionStatus = "trialing"
	SubscriptionStatusPaused            SubscriptionStatus = "paused"
)

type SubscriptionUsage struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	SubscriptionID primitive.ObjectID `json:"subscription_id" bson:"subscription_id"`
	UserID         primitive.ObjectID `json:"user_id" bson:"user_id"`
	Period         UsagePeriod        `json:"period" bson:"period"`
	StreamingHours float64            `json:"streaming_hours" bson:"streaming_hours"`
	Downloads      int                `json:"downloads" bson:"downloads"`
	ProfilesUsed   int                `json:"profiles_used" bson:"profiles_used"`
	ConcurrentPeak int                `json:"concurrent_peak" bson:"concurrent_peak"`
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}

type UsagePeriod struct {
	Start time.Time `json:"start" bson:"start"`
	End   time.Time `json:"end" bson:"end"`
}
