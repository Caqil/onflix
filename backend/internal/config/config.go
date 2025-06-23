package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Server  ServerConfig
	MongoDB MongoConfig
	JWT     JWTConfig
	TMDB    TMDBConfig
	Stripe  StripeConfig
	Email   EmailConfig
	Storage StorageConfig
	Redis   RedisConfig
	AWS     AWSConfig
}

type ServerConfig struct {
	Port   string
	Env    string
	AppURL string
}

type MongoConfig struct {
	URI      string
	Database string
}

type JWTConfig struct {
	Secret     string
	ExpiryDays int
}

type TMDBConfig struct {
	APIKey  string
	BaseURL string
}

type StripeConfig struct {
	SecretKey      string
	PublishableKey string
	WebhookSecret  string
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
}

type StorageConfig struct {
	BasePath     string
	MaxFileSize  int64
	AllowedTypes []string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type AWSConfig struct {
	AccessKeyID     string
	SecretAccessKey string
	Region          string
	S3Bucket        string
	CloudFrontURL   string
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:   getEnv("PORT", "8080"),
			Env:    getEnv("ENV", "development"),
			AppURL: getEnv("APP_URL", "http://localhost:3000"),
		},
		MongoDB: MongoConfig{
			URI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Database: getEnv("MONGODB_DATABASE", "netflix_clone"),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "your-secret-key"),
			ExpiryDays: 7,
		},
		TMDB: TMDBConfig{
			APIKey:  getEnv("TMDB_API_KEY", ""),
			BaseURL: "https://api.themoviedb.org/3",
		},
		Stripe: StripeConfig{
			SecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
			PublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
			WebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),
		},
		Email: EmailConfig{
			SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:     getEnv("SMTP_PORT", "587"),
			SMTPUsername: getEnv("SMTP_USERNAME", ""),
			SMTPPassword: getEnv("SMTP_PASSWORD", ""),
			FromEmail:    getEnv("FROM_EMAIL", "noreply@netflix-clone.com"),
		},
		Storage: StorageConfig{
			BasePath:     getEnv("STORAGE_BASE_PATH", "./uploads"),
			MaxFileSize:  parseFileSize(getEnv("STORAGE_MAX_FILE_SIZE", "500MB")),
			AllowedTypes: parseAllowedTypes(getEnv("STORAGE_ALLOWED_TYPES", ".jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.mkv,.webm,.srt,.vtt")),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       parseInt(getEnv("REDIS_DB", "0")),
		},
		AWS: AWSConfig{
			AccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
			SecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
			Region:          getEnv("AWS_REGION", "us-east-1"),
			S3Bucket:        getEnv("AWS_S3_BUCKET", ""),
			CloudFrontURL:   getEnv("AWS_CLOUDFRONT_URL", ""),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func parseFileSize(sizeStr string) int64 {
	// Simple file size parser (supports MB, GB)
	sizeStr = strings.ToUpper(strings.TrimSpace(sizeStr))

	if strings.HasSuffix(sizeStr, "MB") {
		if size, err := strconv.ParseFloat(strings.TrimSuffix(sizeStr, "MB"), 64); err == nil {
			return int64(size * 1024 * 1024)
		}
	} else if strings.HasSuffix(sizeStr, "GB") {
		if size, err := strconv.ParseFloat(strings.TrimSuffix(sizeStr, "GB"), 64); err == nil {
			return int64(size * 1024 * 1024 * 1024)
		}
	} else if size, err := strconv.ParseInt(sizeStr, 10, 64); err == nil {
		return size
	}

	return 500 * 1024 * 1024 // 500MB default
}

func parseInt(intStr string) int {
	if value, err := strconv.Atoi(intStr); err == nil {
		return value
	}
	return 0
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.JWT.Secret == "" {
		return fmt.Errorf("JWT secret is required")
	}

	if c.MongoDB.URI == "" {
		return fmt.Errorf("MongoDB URI is required")
	}

	if c.Email.SMTPHost == "" || c.Email.SMTPUsername == "" || c.Email.SMTPPassword == "" {
		fmt.Println("Warning: Email configuration is incomplete - email functionality may not work")
	}

	if c.TMDB.APIKey == "" {
		fmt.Println("Warning: TMDB API key is not set - content import functionality will not work")
	}

	if c.Stripe.SecretKey == "" {
		fmt.Println("Warning: Stripe configuration is incomplete - payment functionality will not work")
	}

	return nil
}

func parseAllowedTypes(typesStr string) []string {
	if typesStr == "" {
		return []string{}
	}

	types := strings.Split(typesStr, ",")
	var result []string
	for _, t := range types {
		t = strings.TrimSpace(t)
		if t != "" {
			if !strings.HasPrefix(t, ".") {
				t = "." + t
			}
			result = append(result, strings.ToLower(t))
		}
	}
	return result
}

// IsProduction returns true if running in production environment
func (c *Config) IsProduction() bool {
	return strings.ToLower(c.Server.Env) == "production"
}

// IsDevelopment returns true if running in development environment
func (c *Config) IsDevelopment() bool {
	return strings.ToLower(c.Server.Env) == "development"
}

// GetDatabaseName returns the appropriate database name
func (c *Config) GetDatabaseName() string {
	if c.MongoDB.Database != "" {
		return c.MongoDB.Database
	}

	if c.IsProduction() {
		return "netflix_clone_prod"
	}

	return "netflix_clone_dev"
}

// GetServerAddress returns the full server address
func (c *Config) GetServerAddress() string {
	return ":" + c.Server.Port
}

// LoadFromFile loads configuration from environment file
func LoadFromFile(filename string) (*Config, error) {
	// This would load from a .env file or similar
	// For now, just return the standard Load() function
	return Load(), nil
}
