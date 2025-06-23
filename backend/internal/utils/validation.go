package utils

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()

	// Register custom validators
	validate.RegisterValidation("password", validatePassword)
	validate.RegisterValidation("phone", validatePhone)
	validate.RegisterValidation("content_type", validateContentType)
	validate.RegisterValidation("video_quality", validateVideoQuality)
	validate.RegisterValidation("subscription_status", validateSubscriptionStatus)
}

// ValidateStruct validates a struct using the validator package
func ValidateStruct(s interface{}) map[string]string {
	err := validate.Struct(s)
	if err == nil {
		return nil
	}

	errors := make(map[string]string)
	for _, err := range err.(validator.ValidationErrors) {
		field := strings.ToLower(err.Field())
		errors[field] = getValidationMessage(err)
	}

	return errors
}

func getValidationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", fe.Field())
	case "email":
		return "Invalid email format"
	case "min":
		return fmt.Sprintf("%s must be at least %s characters long", fe.Field(), fe.Param())
	case "max":
		return fmt.Sprintf("%s must be at most %s characters long", fe.Field(), fe.Param())
	case "password":
		return "Password must contain at least 8 characters with uppercase, lowercase, number and special character"
	case "phone":
		return "Invalid phone number format"
	case "content_type":
		return "Content type must be either 'movie' or 'tv_show'"
	case "video_quality":
		return "Video quality must be one of: 480p, 720p, 1080p, 4k"
	case "subscription_status":
		return "Invalid subscription status"
	default:
		return fmt.Sprintf("%s is invalid", fe.Field())
	}
}

// Custom validation functions
func validatePassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()

	if len(password) < 8 {
		return false
	}

	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	return hasUpper && hasLower && hasNumber && hasSpecial
}

func validatePhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	phoneRegex := regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)
	return phoneRegex.MatchString(phone)
}

func validateContentType(fl validator.FieldLevel) bool {
	contentType := fl.Field().String()
	return contentType == "movie" || contentType == "tv_show"
}

func validateVideoQuality(fl validator.FieldLevel) bool {
	quality := fl.Field().String()
	validQualities := []string{"480p", "720p", "1080p", "4k"}

	for _, valid := range validQualities {
		if quality == valid {
			return true
		}
	}
	return false
}

func validateSubscriptionStatus(fl validator.FieldLevel) bool {
	status := fl.Field().String()
	validStatuses := []string{
		"active", "past_due", "unpaid", "cancelled",
		"incomplete", "incomplete_expired", "trialing", "paused",
	}

	for _, valid := range validStatuses {
		if status == valid {
			return true
		}
	}
	return false
}

// Utility validation functions
func IsValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

func IsValidURL(url string) bool {
	urlRegex := regexp.MustCompile(`^https?://[^\s/$.?#].[^\s]*$`)
	return urlRegex.MatchString(url)
}

func IsValidObjectID(id string) bool {
	objectIDRegex := regexp.MustCompile(`^[0-9a-fA-F]{24}$`)
	return objectIDRegex.MatchString(id)
}

func SanitizeString(s string) string {
	// Remove any potentially harmful characters
	s = strings.TrimSpace(s)
	s = regexp.MustCompile(`[<>\"'&]`).ReplaceAllString(s, "")
	return s
}

func ValidateSearchQuery(query string) bool {
	if len(query) < 2 || len(query) > 100 {
		return false
	}

	// Allow alphanumeric, spaces, and basic punctuation
	validQuery := regexp.MustCompile(`^[a-zA-Z0-9\s\-\.\,\!\?]+$`)
	return validQuery.MatchString(query)
}

func ValidatePaginationParams(page, limit int) (int, int, bool) {
	if page < 1 {
		page = 1
	}

	if limit < 1 || limit > 100 {
		limit = 20
	}

	return page, limit, true
}

func ValidateFileType(filename string, allowedTypes []string) bool {
	for _, allowedType := range allowedTypes {
		if strings.HasSuffix(strings.ToLower(filename), strings.ToLower(allowedType)) {
			return true
		}
	}
	return false
}

// Validation for subscription plans
type CreatePlanRequest struct {
	Name        string  `json:"name" validate:"required,min=3,max=50"`
	Description string  `json:"description" validate:"required,min=10,max=500"`
	Price       float64 `json:"price" validate:"required,min=0"`
	Currency    string  `json:"currency" validate:"required,len=3"`
	Interval    string  `json:"interval" validate:"required,oneof=monthly yearly"`
}

// Validation for user registration
type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,password"`
	FirstName string `json:"first_name" validate:"required,min=2,max=50"`
	LastName  string `json:"last_name" validate:"required,min=2,max=50"`
	Phone     string `json:"phone,omitempty" validate:"omitempty,phone"`
}

// Validation for content creation
type CreateContentRequest struct {
	Title          string   `json:"title" validate:"required,min=1,max=200"`
	Description    string   `json:"description" validate:"required,min=10,max=2000"`
	Type           string   `json:"type" validate:"required,content_type"`
	Genres         []string `json:"genres" validate:"required,min=1"`
	MaturityRating string   `json:"maturity_rating" validate:"required,oneof=G PG PG-13 R NC-17 TV-Y TV-Y7 TV-G TV-PG TV-14 TV-MA"`
	Language       string   `json:"language" validate:"required,len=2"`
	Country        string   `json:"country" validate:"required,len=2"`
}
