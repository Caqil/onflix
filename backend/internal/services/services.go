// backend/internal/services/services.go
package services

import (
	"onflix/internal/config"

	"go.mongodb.org/mongo-driver/mongo"
)

// Services holds all service dependencies
type Services struct {
	DB             *mongo.Database
	Config         *config.Config
	EmailService   *EmailService
	StripeService  *StripeService
	TMDBService    *TMDBService
	VideoService   *VideoService
	StorageService *StorageService
	AuthService    *AuthService
}

// NewServices initializes all services
func NewServices(db *mongo.Database, cfg *config.Config) *Services {
	// Initialize individual services
	emailService := NewEmailService(cfg)
	stripeService := NewStripeService(cfg, db)
	tmdbService := NewTMDBService(cfg)
	videoService := NewVideoService(cfg, db)
	storageService := NewStorageService(cfg)
	authService := NewAuthService(cfg, db)

	return &Services{
		DB:             db,
		Config:         cfg,
		EmailService:   emailService,
		StripeService:  stripeService,
		TMDBService:    tmdbService,
		VideoService:   videoService,
		StorageService: storageService,
		AuthService:    authService,
	}
}

// Cleanup performs cleanup of all services
func (s *Services) Cleanup() {
	// Cleanup individual services if needed
	if s.EmailService != nil {
		s.EmailService.Close()
	}
	if s.VideoService != nil {
		s.VideoService.Close()
	}
	if s.StorageService != nil {
		s.StorageService.Close()
	}
}
