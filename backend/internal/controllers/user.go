// backend/internal/controllers/user.go
package controllers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"onflix/internal/models"
	"onflix/internal/services"
	"onflix/internal/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserController struct {
	services *services.Services
}

func NewUserController(services *services.Services) *UserController {
	return &UserController{
		services: services,
	}
}

// Profile Management
func (uc *UserController) GetProfile(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	u.Password = "" // Remove password from response

	utils.SuccessResponse(c, http.StatusOK, "Profile retrieved successfully", u)
}


func (uc *UserController) DeleteAccount(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Soft delete - mark as inactive
	now := time.Now()
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{"$set": bson.M{
			"is_active":  false,
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Cancel subscription if active
	if u.Subscription != nil && u.Subscription.Status == models.SubscriptionStatusActive {
		go uc.services.StripeService.CancelSubscription(u.Subscription.StripeSubscriptionID)
	}

	utils.SuccessResponse(c, http.StatusOK, "Account deleted successfully", nil)
}

func (uc *UserController) UploadAvatar(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Parse multipart form
	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		utils.BadRequestResponse(c, "No file uploaded")
		return
	}
	defer file.Close()

	// Validate file type
	allowedTypes := []string{".jpg", ".jpeg", ".png", ".gif"}
	if !utils.ValidateFileType(header.Filename, allowedTypes) {
		utils.BadRequestResponse(c, "Invalid file type. Only JPG, PNG, and GIF are allowed")
		return
	}

	// Read file content
	fileContent, err := io.ReadAll(file)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Upload to storage service
	avatarURL, err := uc.services.StorageService.UploadFile(
		fmt.Sprintf("avatars/%s%s", u.ID.Hex(), filepath.Ext(header.Filename)),
		fileContent,
	)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update user avatar
	now := time.Now()
	_, err = uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{"$set": bson.M{
			"avatar":     avatarURL,
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Avatar uploaded successfully", gin.H{"avatar_url": avatarURL})
}

// Multiple Profiles Management
func (uc *UserController) GetProfiles(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	utils.SuccessResponse(c, http.StatusOK, "Profiles retrieved successfully", u.Profiles)
}

func (uc *UserController) CreateProfile(c *gin.Context) {
	var req struct {
		Name            string   `json:"name" validate:"required,min=1,max=50"`
		IsKidsProfile   bool     `json:"is_kids_profile"`
		Language        string   `json:"language" validate:"required,len=2"`
		Avatar          string   `json:"avatar,omitempty"`
		PreferredGenres []string `json:"preferred_genres,omitempty"`
		MaturityRating  string   `json:"maturity_rating" validate:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Check profile limit
	if len(u.Profiles) >= 5 {
		utils.BadRequestResponse(c, "Maximum 5 profiles allowed")
		return
	}

	// Create new profile
	profile := models.UserProfile{
		ID:            primitive.NewObjectID(),
		Name:          req.Name,
		Avatar:        req.Avatar,
		IsKidsProfile: req.IsKidsProfile,
		Language:      req.Language,
		Watchlist:     []primitive.ObjectID{},
		WatchHistory:  []models.WatchHistoryItem{},
		Preferences: models.ProfilePreferences{
			MaturityRating:  req.MaturityRating,
			PreferredGenres: req.PreferredGenres,
			AutoPlay:        true,
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Add profile to user
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$push": bson.M{"profiles": profile},
			"$set":  bson.M{"updated_at": time.Now()},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.CreatedResponse(c, "Profile created successfully", profile)
}

func (uc *UserController) UpdateProfile(c *gin.Context) {
	profileID := c.Param("profileID")
	if !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Invalid profile ID")
		return
	}

	var req struct {
		Name            string   `json:"name" validate:"required,min=1,max=50"`
		Avatar          string   `json:"avatar,omitempty"`
		Language        string   `json:"language" validate:"required,len=2"`
		PreferredGenres []string `json:"preferred_genres,omitempty"`
		MaturityRating  string   `json:"maturity_rating" validate:"required"`
		AutoPlay        bool     `json:"auto_play"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Update profile
	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"profiles.$[elem].name":                         req.Name,
			"profiles.$[elem].language":                     req.Language,
			"profiles.$[elem].preferences.maturity_rating":  req.MaturityRating,
			"profiles.$[elem].preferences.preferred_genres": req.PreferredGenres,
			"profiles.$[elem].preferences.auto_play":        req.AutoPlay,
			"profiles.$[elem].updated_at":                   now,
			"updated_at":                                    now,
		},
	}

	if req.Avatar != "" {
		update["$set"].(bson.M)["profiles.$[elem].avatar"] = req.Avatar
	}

	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		update,
		options.Update().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{
				bson.M{"elem._id": profileObjID},
			},
		}),
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Profile updated successfully", nil)
}

func (uc *UserController) DeleteProfile(c *gin.Context) {
	profileID := c.Param("profileID")
	if !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Invalid profile ID")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Don't allow deleting if it's the only profile
	if len(u.Profiles) <= 1 {
		utils.BadRequestResponse(c, "Cannot delete the last profile")
		return
	}

	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Remove profile
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$pull": bson.M{"profiles": bson.M{"_id": profileObjID}},
			"$set":  bson.M{"updated_at": time.Now()},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Profile deleted successfully", nil)
}

func (uc *UserController) UpdateProfileAvatar(c *gin.Context) {
	profileID := c.Param("profileID")
	if !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Invalid profile ID")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Parse multipart form
	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		utils.BadRequestResponse(c, "No file uploaded")
		return
	}
	defer file.Close()

	// Validate file type
	allowedTypes := []string{".jpg", ".jpeg", ".png", ".gif"}
	if !utils.ValidateFileType(header.Filename, allowedTypes) {
		utils.BadRequestResponse(c, "Invalid file type. Only JPG, PNG, and GIF are allowed")
		return
	}

	// Read file content
	fileContent, err := io.ReadAll(file)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Upload to storage service
	avatarURL, err := uc.services.StorageService.UploadFile(
		fmt.Sprintf("profile-avatars/%s-%s%s", u.ID.Hex(), profileID, filepath.Ext(header.Filename)),
		fileContent,
	)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Update profile avatar
	now := time.Now()
	_, err = uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$set": bson.M{
				"profiles.$[elem].avatar":     avatarURL,
				"profiles.$[elem].updated_at": now,
				"updated_at":                  now,
			},
		},
		options.Update().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{
				bson.M{"elem._id": profileObjID},
			},
		}),
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Profile avatar updated successfully", gin.H{"avatar_url": avatarURL})
}

// Watchlist Management
func (uc *UserController) GetWatchlist(c *gin.Context) {
	profileID := c.Query("profile_id")
	if profileID == "" || !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Valid profile_id is required")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Find the profile
	var profile *models.UserProfile
	for _, p := range u.Profiles {
		if p.ID == profileObjID {
			profile = &p
			break
		}
	}

	if profile == nil {
		utils.NotFoundResponse(c, "Profile")
		return
	}

	// Get content details for watchlist items
	if len(profile.Watchlist) == 0 {
		utils.SuccessResponse(c, http.StatusOK, "Watchlist retrieved successfully", []interface{}{})
		return
	}

	var content []models.Content
	cursor, err := uc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{
			"_id":    bson.M{"$in": profile.Watchlist},
			"status": models.ContentStatusPublished,
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Watchlist retrieved successfully", content)
}

func (uc *UserController) AddToWatchlist(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	profileID := c.Query("profile_id")
	if profileID == "" || !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Valid profile_id is required")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	contentObjID, _ := primitive.ObjectIDFromHex(contentID)
	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Check if content exists
	var content models.Content
	err := uc.services.DB.Collection("content").FindOne(
		context.Background(),
		bson.M{
			"_id":    contentObjID,
			"status": models.ContentStatusPublished,
		},
	).Decode(&content)

	if err != nil {
		utils.NotFoundResponse(c, "Content")
		return
	}

	// Add to watchlist (if not already present)
	_, err = uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{
			"_id":          u.ID,
			"profiles._id": profileObjID,
		},
		bson.M{
			"$addToSet": bson.M{"profiles.$.watchlist": contentObjID},
			"$set":      bson.M{"updated_at": time.Now()},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Content added to watchlist", nil)
}

func (uc *UserController) RemoveFromWatchlist(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	profileID := c.Query("profile_id")
	if profileID == "" || !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Valid profile_id is required")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	contentObjID, _ := primitive.ObjectIDFromHex(contentID)
	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Remove from watchlist
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{
			"_id":          u.ID,
			"profiles._id": profileObjID,
		},
		bson.M{
			"$pull": bson.M{"profiles.$.watchlist": contentObjID},
			"$set":  bson.M{"updated_at": time.Now()},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Content removed from watchlist", nil)
}

func (uc *UserController) ClearWatchlist(c *gin.Context) {
	profileID := c.Query("profile_id")
	if profileID == "" || !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Valid profile_id is required")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Clear watchlist
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{
			"_id":          u.ID,
			"profiles._id": profileObjID,
		},
		bson.M{
			"$set": bson.M{
				"profiles.$.watchlist": []primitive.ObjectID{},
				"updated_at":           time.Now(),
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Watchlist cleared successfully", nil)
}

// Watch History
func (uc *UserController) GetWatchHistory(c *gin.Context) {
	profileID := c.Query("profile_id")
	if profileID == "" || !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Valid profile_id is required")
		return
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, limit, _ = utils.ValidatePaginationParams(page, limit)

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Find the profile
	var profile *models.UserProfile
	for _, p := range u.Profiles {
		if p.ID == profileObjID {
			profile = &p
			break
		}
	}

	if profile == nil {
		utils.NotFoundResponse(c, "Profile")
		return
	}

	// Sort by last watched and paginate
	historyItems := profile.WatchHistory

	// Sort by last watched (most recent first)
	for i := 0; i < len(historyItems)-1; i++ {
		for j := i + 1; j < len(historyItems); j++ {
			if historyItems[i].LastWatchedAt.Before(historyItems[j].LastWatchedAt) {
				historyItems[i], historyItems[j] = historyItems[j], historyItems[i]
			}
		}
	}

	// Apply pagination
	start := (page - 1) * limit
	end := start + limit
	if start >= len(historyItems) {
		utils.PaginatedResponse(c, http.StatusOK, "Watch history retrieved successfully", []interface{}{}, page, limit, int64(len(historyItems)))
		return
	}
	if end > len(historyItems) {
		end = len(historyItems)
	}

	paginatedHistory := historyItems[start:end]

	// Get content details
	contentIDs := make([]primitive.ObjectID, len(paginatedHistory))
	for i, item := range paginatedHistory {
		contentIDs[i] = item.ContentID
	}

	var content []models.Content
	cursor, err := uc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{"_id": bson.M{"$in": contentIDs}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Combine history with content details
	result := make([]gin.H, len(paginatedHistory))
	for i, item := range paginatedHistory {
		var matchedContent *models.Content
		for _, c := range content {
			if c.ID == item.ContentID {
				matchedContent = &c
				break
			}
		}

		result[i] = gin.H{
			"content":         matchedContent,
			"progress":        item.Progress,
			"duration":        item.Duration,
			"watched_at":      item.WatchedAt,
			"last_watched_at": item.LastWatchedAt,
		}
	}

	utils.PaginatedResponse(c, http.StatusOK, "Watch history retrieved successfully", result, page, limit, int64(len(historyItems)))
}

func (uc *UserController) UpdateWatchProgress(c *gin.Context) {
	var req struct {
		ContentID string  `json:"content_id" validate:"required"`
		ProfileID string  `json:"profile_id" validate:"required"`
		Progress  float64 `json:"progress" validate:"required,min=0,max=100"`
		Duration  int     `json:"duration" validate:"required,min=0"`
		EpisodeID string  `json:"episode_id,omitempty"`
		SeasonID  string  `json:"season_id,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	if !utils.IsValidObjectID(req.ContentID) || !utils.IsValidObjectID(req.ProfileID) {
		utils.BadRequestResponse(c, "Invalid content or profile ID")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	contentObjID, _ := primitive.ObjectIDFromHex(req.ContentID)
	profileObjID, _ := primitive.ObjectIDFromHex(req.ProfileID)

	// Create watch history item
	watchItem := models.WatchHistoryItem{
		ContentID:     contentObjID,
		Progress:      req.Progress,
		Duration:      req.Duration,
		WatchedAt:     time.Now(),
		LastWatchedAt: time.Now(),
	}

	// Update or add watch history
	now := time.Now()
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{
			"_id":                               u.ID,
			"profiles._id":                      profileObjID,
			"profiles.watch_history.content_id": contentObjID,
		},
		bson.M{
			"$set": bson.M{
				"profiles.$[profile].watch_history.$[history].progress":        req.Progress,
				"profiles.$[profile].watch_history.$[history].duration":        req.Duration,
				"profiles.$[profile].watch_history.$[history].last_watched_at": now,
				"updated_at": now,
			},
		},
		options.Update().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{
				bson.M{"profile._id": profileObjID},
				bson.M{"history.content_id": contentObjID},
			},
		}),
	)

	// If no existing history item found, add new one
	if err != nil {
		_, err = uc.services.DB.Collection("users").UpdateOne(
			context.Background(),
			bson.M{
				"_id":          u.ID,
				"profiles._id": profileObjID,
			},
			bson.M{
				"$push": bson.M{"profiles.$.watch_history": watchItem},
				"$set":  bson.M{"updated_at": now},
			},
		)
	}

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Watch progress updated successfully", nil)
}

func (uc *UserController) RemoveFromHistory(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	profileID := c.Query("profile_id")
	if profileID == "" || !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Valid profile_id is required")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	contentObjID, _ := primitive.ObjectIDFromHex(contentID)
	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Remove from watch history
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{
			"_id":          u.ID,
			"profiles._id": profileObjID,
		},
		bson.M{
			"$pull": bson.M{"profiles.$.watch_history": bson.M{"content_id": contentObjID}},
			"$set":  bson.M{"updated_at": time.Now()},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Content removed from watch history", nil)
}

func (uc *UserController) ClearWatchHistory(c *gin.Context) {
	profileID := c.Query("profile_id")
	if profileID == "" || !utils.IsValidObjectID(profileID) {
		utils.BadRequestResponse(c, "Valid profile_id is required")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	profileObjID, _ := primitive.ObjectIDFromHex(profileID)

	// Clear watch history
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{
			"_id":          u.ID,
			"profiles._id": profileObjID,
		},
		bson.M{
			"$set": bson.M{
				"profiles.$.watch_history": []models.WatchHistoryItem{},
				"updated_at":               time.Now(),
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Watch history cleared successfully", nil)
}

// Preferences Management
func (uc *UserController) GetPreferences(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	utils.SuccessResponse(c, http.StatusOK, "Preferences retrieved successfully", u.Preferences)
}

func (uc *UserController) UpdatePreferences(c *gin.Context) {
	var req struct {
		Language         string   `json:"language" validate:"required,len=2"`
		AutoPlay         bool     `json:"auto_play"`
		AutoPlayPreviews bool     `json:"auto_play_previews"`
		DataSaver        bool     `json:"data_saver"`
		PreferredGenres  []string `json:"preferred_genres,omitempty"`
		MaturityRating   string   `json:"maturity_rating" validate:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Update preferences
	now := time.Now()
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$set": bson.M{
				"preferences.language":           req.Language,
				"preferences.auto_play":          req.AutoPlay,
				"preferences.auto_play_previews": req.AutoPlayPreviews,
				"preferences.data_saver":         req.DataSaver,
				"preferences.preferred_genres":   req.PreferredGenres,
				"preferences.maturity_rating":    req.MaturityRating,
				"updated_at":                     now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Preferences updated successfully", nil)
}

func (uc *UserController) UpdateLanguage(c *gin.Context) {
	var req struct {
		Language string `json:"language" validate:"required,len=2"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Update language
	now := time.Now()
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$set": bson.M{
				"preferences.language": req.Language,
				"updated_at":           now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Language updated successfully", nil)
}

func (uc *UserController) UpdateMaturityRating(c *gin.Context) {
	var req struct {
		MaturityRating string `json:"maturity_rating" validate:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Update maturity rating
	now := time.Now()
	_, err := uc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$set": bson.M{
				"preferences.maturity_rating": req.MaturityRating,
				"updated_at":                  now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Maturity rating updated successfully", nil)
}

// Subscription Management (basic methods - detailed implementation would be in subscription controller)
func (uc *UserController) GetSubscription(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	if u.Subscription == nil {
		utils.NotFoundResponse(c, "Subscription")
		return
	}

	// Get subscription plan details
	var plan models.SubscriptionPlan
	err := uc.services.DB.Collection("subscription_plans").FindOne(
		context.Background(),
		bson.M{"_id": u.Subscription.PlanID},
	).Decode(&plan)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	result := gin.H{
		"subscription": u.Subscription,
		"plan":         plan,
	}

	utils.SuccessResponse(c, http.StatusOK, "Subscription retrieved successfully", result)
}

func (uc *UserController) GetSubscriptionPlans(c *gin.Context) {
	var plans []models.SubscriptionPlan
	cursor, err := uc.services.DB.Collection("subscription_plans").Find(
		context.Background(),
		bson.M{"is_active": true},
		options.Find().SetSort(bson.M{"sort_order": 1}),
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &plans); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Subscription plans retrieved successfully", plans)
}

// Payment Methods, Notifications, and Device Management would follow similar patterns
// For brevity, I'll implement stub methods that indicate the expected functionality

func (uc *UserController) Subscribe(c *gin.Context) {
	// This would integrate with Stripe and create subscription
	utils.BadRequestResponse(c, "Subscription creation should be handled by subscription controller")
}

func (uc *UserController) ChangePlan(c *gin.Context) {
	utils.BadRequestResponse(c, "Plan changes should be handled by subscription controller")
}

func (uc *UserController) CancelSubscription(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription cancellation should be handled by subscription controller")
}

func (uc *UserController) PauseSubscription(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription pausing should be handled by subscription controller")
}

func (uc *UserController) ResumeSubscription(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription resuming should be handled by subscription controller")
}

func (uc *UserController) GetInvoices(c *gin.Context) {
	utils.BadRequestResponse(c, "Invoice management should be handled by subscription controller")
}

func (uc *UserController) GetUsage(c *gin.Context) {
	utils.BadRequestResponse(c, "Usage tracking should be handled by subscription controller")
}

func (uc *UserController) GetPaymentMethods(c *gin.Context) {
	utils.BadRequestResponse(c, "Payment methods should be handled by subscription controller")
}

func (uc *UserController) AddPaymentMethod(c *gin.Context) {
	utils.BadRequestResponse(c, "Payment methods should be handled by subscription controller")
}

func (uc *UserController) RemovePaymentMethod(c *gin.Context) {
	utils.BadRequestResponse(c, "Payment methods should be handled by subscription controller")
}

func (uc *UserController) SetDefaultPaymentMethod(c *gin.Context) {
	utils.BadRequestResponse(c, "Payment methods should be handled by subscription controller")
}

func (uc *UserController) GetNotifications(c *gin.Context) {
	utils.BadRequestResponse(c, "Notifications not yet implemented")
}

func (uc *UserController) MarkNotificationAsRead(c *gin.Context) {
	utils.BadRequestResponse(c, "Notifications not yet implemented")
}

func (uc *UserController) MarkAllNotificationsAsRead(c *gin.Context) {
	utils.BadRequestResponse(c, "Notifications not yet implemented")
}

func (uc *UserController) DeleteNotification(c *gin.Context) {
	utils.BadRequestResponse(c, "Notifications not yet implemented")
}

func (uc *UserController) GetDevices(c *gin.Context) {
	utils.BadRequestResponse(c, "Device management not yet implemented")
}

func (uc *UserController) RegisterDevice(c *gin.Context) {
	utils.BadRequestResponse(c, "Device management not yet implemented")
}

func (uc *UserController) RemoveDevice(c *gin.Context) {
	utils.BadRequestResponse(c, "Device management not yet implemented")
}

func (uc *UserController) LogoutAllDevices(c *gin.Context) {
	utils.BadRequestResponse(c, "Device management not yet implemented")
}
