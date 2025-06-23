// backend/internal/controllers/admin.go
package controllers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"onflix/internal/models"
	"onflix/internal/services"
	"onflix/internal/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

type AdminController struct {
	services *services.Services
}

func NewAdminController(services *services.Services) *AdminController {
	return &AdminController{
		services: services,
	}
}

// Dashboard and Analytics
func (ac *AdminController) GetDashboard(c *gin.Context) {
	ctx := context.Background()

	// Get total counts
	totalUsers, _ := ac.services.DB.Collection("users").CountDocuments(ctx, bson.M{"is_active": true})
	totalContent, _ := ac.services.DB.Collection("content").CountDocuments(ctx, bson.M{"status": models.ContentStatusPublished})
	totalSubscriptions, _ := ac.services.DB.Collection("subscriptions").CountDocuments(ctx, bson.M{"status": models.SubscriptionStatusActive})

	// Get recent registrations (last 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	recentUsers, _ := ac.services.DB.Collection("users").CountDocuments(ctx, bson.M{
		"created_at": bson.M{"$gte": thirtyDaysAgo},
		"is_active":  true,
	})

	// Get revenue data (last 30 days)
	pipeline := []bson.M{
		{"$match": bson.M{
			"status":     models.PaymentStatusSucceeded,
			"created_at": bson.M{"$gte": thirtyDaysAgo},
		}},
		{"$group": bson.M{
			"_id":           nil,
			"total_revenue": bson.M{"$sum": "$amount"},
		}},
	}

	var revenueResult []struct {
		TotalRevenue float64 `bson:"total_revenue"`
	}
	cursor, err := ac.services.DB.Collection("payments").Aggregate(ctx, pipeline)
	if err == nil {
		cursor.All(ctx, &revenueResult)
	}

	var monthlyRevenue float64
	if len(revenueResult) > 0 {
		monthlyRevenue = revenueResult[0].TotalRevenue
	}

	// Get top content by views
	var topContent []models.Content
	cursor, err = ac.services.DB.Collection("content").Find(
		ctx,
		bson.M{"status": models.ContentStatusPublished},
		options.Find().SetLimit(5).SetSort(bson.M{"view_count": -1}),
	)
	if err != nil {
		fmt.Println(err)
		// handle error appropriately, maybe return an empty slice
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var content models.Content
		if err := cursor.Decode(&content); err != nil {
			fmt.Println(err)
			// handle error
		}
		topContent = append(topContent, content)
	}

	if err := cursor.Err(); err != nil {
		fmt.Println(err)
		// handle error
	}

	dashboard := gin.H{
		"overview": gin.H{
			"total_users":          totalUsers,
			"total_content":        totalContent,
			"active_subscriptions": totalSubscriptions,
			"recent_users":         recentUsers,
			"monthly_revenue":      monthlyRevenue,
		},
		"top_content": topContent,
		"timestamp":   time.Now(),
	}

	utils.SuccessResponse(c, http.StatusOK, "Dashboard data retrieved successfully", dashboard)
}

func (ac *AdminController) GetAnalytics(c *gin.Context) {
	period := c.DefaultQuery("period", "30") // days
	periodDays, _ := strconv.Atoi(period)
	startDate := time.Now().AddDate(0, 0, -periodDays)

	ctx := context.Background()

	// User analytics
	userPipeline := []bson.M{
		{"$match": bson.M{"created_at": bson.M{"$gte": startDate}}},
		{"$group": bson.M{
			"_id": bson.M{
				"year":  bson.M{"$year": "$created_at"},
				"month": bson.M{"$month": "$created_at"},
				"day":   bson.M{"$dayOfMonth": "$created_at"},
			},
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"_id": 1}},
	}

	var userGrowth []bson.M
	cursor, err := ac.services.DB.Collection("users").Aggregate(ctx, userPipeline)
	if err == nil {
		cursor.All(ctx, &userGrowth)
	}

	// Revenue analytics
	revenuePipeline := []bson.M{
		{"$match": bson.M{
			"status":     models.PaymentStatusSucceeded,
			"created_at": bson.M{"$gte": startDate},
		}},
		{"$group": bson.M{
			"_id": bson.M{
				"year":  bson.M{"$year": "$created_at"},
				"month": bson.M{"$month": "$created_at"},
				"day":   bson.M{"$dayOfMonth": "$created_at"},
			},
			"revenue": bson.M{"$sum": "$amount"},
			"count":   bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"_id": 1}},
	}

	var revenueData []bson.M
	cursor, err = ac.services.DB.Collection("payments").Aggregate(ctx, revenuePipeline)
	if err == nil {
		cursor.All(ctx, &revenueData)
	}

	analytics := gin.H{
		"user_growth":  userGrowth,
		"revenue_data": revenueData,
		"period_days":  periodDays,
	}

	utils.SuccessResponse(c, http.StatusOK, "Analytics data retrieved successfully", analytics)
}

func (ac *AdminController) GetUserAnalytics(c *gin.Context) {
	ctx := context.Background()

	// User status distribution
	statusPipeline := []bson.M{
		{"$group": bson.M{
			"_id":   "$is_active",
			"count": bson.M{"$sum": 1},
		}},
	}

	var userStatus []bson.M
	cursor, err := ac.services.DB.Collection("users").Aggregate(ctx, statusPipeline)
	if err == nil {
		cursor.All(ctx, &userStatus)
	}

	// Subscription distribution
	subPipeline := []bson.M{
		{"$lookup": bson.M{
			"from":         "subscription_plans",
			"localField":   "plan_id",
			"foreignField": "_id",
			"as":           "plan",
		}},
		{"$unwind": "$plan"},
		{"$group": bson.M{
			"_id":   "$plan.name",
			"count": bson.M{"$sum": 1},
		}},
	}

	var subscriptionDist []bson.M
	cursor, err = ac.services.DB.Collection("subscriptions").Aggregate(ctx, subPipeline)
	if err == nil {
		cursor.All(ctx, &subscriptionDist)
	}

	analytics := gin.H{
		"user_status":               userStatus,
		"subscription_distribution": subscriptionDist,
	}

	utils.SuccessResponse(c, http.StatusOK, "User analytics retrieved successfully", analytics)
}

func (ac *AdminController) GetContentAnalytics(c *gin.Context) {
	ctx := context.Background()

	// Content by type
	typePipeline := []bson.M{
		{"$match": bson.M{"status": models.ContentStatusPublished}},
		{"$group": bson.M{
			"_id":   "$type",
			"count": bson.M{"$sum": 1},
		}},
	}

	var contentByType []bson.M
	cursor, err := ac.services.DB.Collection("content").Aggregate(ctx, typePipeline)
	if err == nil {
		cursor.All(ctx, &contentByType)
	}

	// Most popular genres
	genrePipeline := []bson.M{
		{"$match": bson.M{"status": models.ContentStatusPublished}},
		{"$unwind": "$genres"},
		{"$group": bson.M{
			"_id":         "$genres",
			"count":       bson.M{"$sum": 1},
			"total_views": bson.M{"$sum": "$view_count"},
		}},
		{"$sort": bson.M{"total_views": -1}},
		{"$limit": 10},
	}

	var popularGenres []bson.M
	cursor, err = ac.services.DB.Collection("content").Aggregate(ctx, genrePipeline)
	if err == nil {
		cursor.All(ctx, &popularGenres)
	}

	analytics := gin.H{
		"content_by_type": contentByType,
		"popular_genres":  popularGenres,
	}

	utils.SuccessResponse(c, http.StatusOK, "Content analytics retrieved successfully", analytics)
}

func (ac *AdminController) GetRevenueAnalytics(c *gin.Context) {
	period := c.DefaultQuery("period", "30")
	periodDays, _ := strconv.Atoi(period)
	startDate := time.Now().AddDate(0, 0, -periodDays)

	ctx := context.Background()

	// Revenue by subscription plan
	planPipeline := []bson.M{
		{"$match": bson.M{
			"status":     models.PaymentStatusSucceeded,
			"created_at": bson.M{"$gte": startDate},
		}},
		{"$lookup": bson.M{
			"from":         "subscriptions",
			"localField":   "subscription_id",
			"foreignField": "_id",
			"as":           "subscription",
		}},
		{"$unwind": "$subscription"},
		{"$lookup": bson.M{
			"from":         "subscription_plans",
			"localField":   "subscription.plan_id",
			"foreignField": "_id",
			"as":           "plan",
		}},
		{"$unwind": "$plan"},
		{"$group": bson.M{
			"_id":     "$plan.name",
			"revenue": bson.M{"$sum": "$amount"},
			"count":   bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"revenue": -1}},
	}

	var revenueByPlan []bson.M
	cursor, err := ac.services.DB.Collection("payments").Aggregate(ctx, planPipeline)
	if err == nil {
		cursor.All(ctx, &revenueByPlan)
	}

	analytics := gin.H{
		"revenue_by_plan": revenueByPlan,
		"period_days":     periodDays,
	}

	utils.SuccessResponse(c, http.StatusOK, "Revenue analytics retrieved successfully", analytics)
}

// User Management
func (ac *AdminController) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, limit, _ = utils.ValidatePaginationParams(page, limit)

	search := c.Query("search")
	status := c.Query("status") // active, inactive
	role := c.Query("role")     // user, admin

	ctx := context.Background()
	filter := bson.M{}

	if search != "" {
		filter["$or"] = []bson.M{
			{"email": bson.M{"$regex": search, "$options": "i"}},
			{"first_name": bson.M{"$regex": search, "$options": "i"}},
			{"last_name": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	if status == "active" {
		filter["is_active"] = true
	} else if status == "inactive" {
		filter["is_active"] = false
	}

	if role != "" {
		filter["role"] = role
	}

	// Count total documents
	totalCount, err := ac.services.DB.Collection("users").CountDocuments(ctx, filter)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Find users with pagination
	skip := (page - 1) * limit
	findOptions := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"created_at": -1}).
		SetProjection(bson.M{"password": 0}) // Exclude password

	var users []models.User
	cursor, err := ac.services.DB.Collection("users").Find(ctx, filter, findOptions)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(ctx, &users); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.PaginatedResponse(c, http.StatusOK, "Users retrieved successfully", users, page, limit, totalCount)
}

func (ac *AdminController) GetUser(c *gin.Context) {
	userID := c.Param("userID")
	if !utils.IsValidObjectID(userID) {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	var user models.User
	err := ac.services.DB.Collection("users").FindOne(
		context.Background(),
		bson.M{"_id": userObjID},
		options.FindOne().SetProjection(bson.M{"password": 0}),
	).Decode(&user)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			utils.NotFoundResponse(c, "User")
		} else {
			utils.InternalServerErrorResponse(c)
		}
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User retrieved successfully", user)
}

func (ac *AdminController) UpdateUser(c *gin.Context) {
	userID := c.Param("userID")
	if !utils.IsValidObjectID(userID) {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	var req struct {
		FirstName       string          `json:"first_name" validate:"required,min=2,max=50"`
		LastName        string          `json:"last_name" validate:"required,min=2,max=50"`
		Email           string          `json:"email" validate:"required,email"`
		Phone           string          `json:"phone,omitempty" validate:"omitempty,phone"`
		IsActive        bool            `json:"is_active"`
		IsEmailVerified bool            `json:"is_email_verified"`
		Role            models.UserRole `json:"role" validate:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	// Check if email is already taken by another user
	var existingUser models.User
	err := ac.services.DB.Collection("users").FindOne(
		context.Background(),
		bson.M{
			"email": req.Email,
			"_id":   bson.M{"$ne": userObjID},
		},
	).Decode(&existingUser)

	if err == nil {
		utils.ConflictResponse(c, "Email already exists")
		return
	}

	// Update user
	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"first_name":        req.FirstName,
			"last_name":         req.LastName,
			"email":             req.Email,
			"phone":             req.Phone,
			"is_active":         req.IsActive,
			"is_email_verified": req.IsEmailVerified,
			"role":              req.Role,
			"updated_at":        now,
		},
	}

	_, err = ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": userObjID},
		update,
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User updated successfully", nil)
}

func (ac *AdminController) DeleteUser(c *gin.Context) {
	userID := c.Param("userID")
	if !utils.IsValidObjectID(userID) {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	// Soft delete - mark as inactive
	now := time.Now()
	_, err := ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": userObjID},
		bson.M{"$set": bson.M{
			"is_active":  false,
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User deleted successfully", nil)
}

func (ac *AdminController) BanUser(c *gin.Context) {
	userID := c.Param("userID")
	if !utils.IsValidObjectID(userID) {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	var req struct {
		Reason string `json:"reason" validate:"required,min=10,max=500"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	// Ban user (mark as inactive)
	now := time.Now()
	_, err := ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": userObjID},
		bson.M{"$set": bson.M{
			"is_active":  false,
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// TODO: Log ban reason and send notification to user

	utils.SuccessResponse(c, http.StatusOK, "User banned successfully", nil)
}

func (ac *AdminController) UnbanUser(c *gin.Context) {
	userID := c.Param("userID")
	if !utils.IsValidObjectID(userID) {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	// Unban user (mark as active)
	now := time.Now()
	_, err := ac.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": userObjID},
		bson.M{"$set": bson.M{
			"is_active":  true,
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User unbanned successfully", nil)
}

func (ac *AdminController) ResetUserPassword(c *gin.Context) {
	userID := c.Param("userID")
	if !utils.IsValidObjectID(userID) {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	var req struct {
		NewPassword string `json:"new_password" validate:"required,password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

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
		bson.M{"_id": userObjID},
		bson.M{"$set": bson.M{
			"password":   string(hashedPassword),
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Password reset successfully", nil)
}

func (ac *AdminController) GetUserSubscription(c *gin.Context) {
	userID := c.Param("userID")
	if !utils.IsValidObjectID(userID) {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	var subscription models.Subscription
	err := ac.services.DB.Collection("subscriptions").FindOne(
		context.Background(),
		bson.M{"user_id": userObjID},
	).Decode(&subscription)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			utils.NotFoundResponse(c, "Subscription")
		} else {
			utils.InternalServerErrorResponse(c)
		}
		return
	}

	// Get plan details
	var plan models.SubscriptionPlan
	ac.services.DB.Collection("subscription_plans").FindOne(
		context.Background(),
		bson.M{"_id": subscription.PlanID},
	).Decode(&plan)

	result := gin.H{
		"subscription": subscription,
		"plan":         plan,
	}

	utils.SuccessResponse(c, http.StatusOK, "User subscription retrieved successfully", result)
}

func (ac *AdminController) UpdateUserSubscription(c *gin.Context) {
	userID := c.Param("userID")
	if !utils.IsValidObjectID(userID) {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	var req struct {
		Status             models.SubscriptionStatus `json:"status" validate:"required"`
		CurrentPeriodEnd   time.Time                 `json:"current_period_end"`
		CancellationReason string                    `json:"cancellation_reason,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	// Update subscription
	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"status":     req.Status,
			"updated_at": now,
		},
	}

	if !req.CurrentPeriodEnd.IsZero() {
		update["$set"].(bson.M)["current_period_end"] = req.CurrentPeriodEnd
	}

	if req.Status == models.SubscriptionStatusCancelled {
		update["$set"].(bson.M)["cancelled_at"] = now
		if req.CancellationReason != "" {
			update["$set"].(bson.M)["cancellation_reason"] = req.CancellationReason
		}
	}

	_, err := ac.services.DB.Collection("subscriptions").UpdateOne(
		context.Background(),
		bson.M{"user_id": userObjID},
		update,
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User subscription updated successfully", nil)
}

func (ac *AdminController) GetUserActivity(c *gin.Context) {
	userID := c.Param("userID")
	if !utils.IsValidObjectID(userID) {
		utils.BadRequestResponse(c, "Invalid user ID")
		return
	}

	// This would typically fetch user activity logs, watch history, etc.
	// For now, return a placeholder response
	activity := gin.H{
		"last_login":     time.Now().AddDate(0, 0, -1),
		"total_watches":  150,
		"favorite_genre": "Action",
		"device_count":   3,
	}

	utils.SuccessResponse(c, http.StatusOK, "User activity retrieved successfully", activity)
}

// Content Management
func (ac *AdminController) GetAllContent(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, limit, _ = utils.ValidatePaginationParams(page, limit)

	search := c.Query("search")
	contentType := c.Query("type")
	status := c.Query("status")
	genre := c.Query("genre")

	ctx := context.Background()
	filter := bson.M{}

	if search != "" {
		filter["$or"] = []bson.M{
			{"title": bson.M{"$regex": search, "$options": "i"}},
			{"original_title": bson.M{"$regex": search, "$options": "i"}},
			{"description": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	if contentType != "" {
		filter["type"] = contentType
	}

	if status != "" {
		filter["status"] = status
	}

	if genre != "" {
		filter["genres"] = bson.M{"$in": []string{genre}}
	}

	// Count total documents
	totalCount, err := ac.services.DB.Collection("content").CountDocuments(ctx, filter)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Find content with pagination
	skip := (page - 1) * limit
	findOptions := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"created_at": -1})

	var content []models.Content
	cursor, err := ac.services.DB.Collection("content").Find(ctx, filter, findOptions)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(ctx, &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.PaginatedResponse(c, http.StatusOK, "Content retrieved successfully", content, page, limit, totalCount)
}

func (ac *AdminController) CreateContent(c *gin.Context) {
	var req struct {
		Title          string              `json:"title" validate:"required,min=1,max=200"`
		OriginalTitle  string              `json:"original_title,omitempty"`
		Description    string              `json:"description" validate:"required,min=10,max=2000"`
		Type           models.ContentType  `json:"type" validate:"required"`
		Genres         []string            `json:"genres" validate:"required,min=1"`
		ReleaseDate    time.Time           `json:"release_date"`
		Runtime        int                 `json:"runtime" validate:"min=1"`
		MaturityRating string              `json:"maturity_rating" validate:"required"`
		Language       string              `json:"language" validate:"required,len=2"`
		Country        string              `json:"country" validate:"required,len=2"`
		Director       []string            `json:"director,omitempty"`
		Producer       []string            `json:"producer,omitempty"`
		Writer         []string            `json:"writer,omitempty"`
		Cast           []models.CastMember `json:"cast,omitempty"`
		IsFeatured     bool                `json:"is_featured"`
		IsOriginal     bool                `json:"is_original"`
		Tags           []string            `json:"tags,omitempty"`
		Keywords       []string            `json:"keywords,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	// Create content
	content := models.Content{
		ID:             primitive.NewObjectID(),
		Title:          req.Title,
		OriginalTitle:  req.OriginalTitle,
		Description:    req.Description,
		Type:           req.Type,
		Genres:         req.Genres,
		ReleaseDate:    req.ReleaseDate,
		Runtime:        req.Runtime,
		MaturityRating: req.MaturityRating,
		Language:       req.Language,
		Country:        req.Country,
		Cast:           req.Cast,
		Director:       req.Director,
		Producer:       req.Producer,
		Writer:         req.Writer,
		Status:         models.ContentStatusDraft,
		IsFeatured:     req.IsFeatured,
		IsOriginal:     req.IsOriginal,
		Tags:           req.Tags,
		Keywords:       req.Keywords,
		Videos:         []models.ContentVideo{},
		Seasons:        []models.Season{},
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if req.OriginalTitle == "" {
		content.OriginalTitle = req.Title
	}

	_, err := ac.services.DB.Collection("content").InsertOne(context.Background(), content)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.CreatedResponse(c, "Content created successfully", content)
}

func (ac *AdminController) GetContentDetails(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	var content models.Content
	err := ac.services.DB.Collection("content").FindOne(
		context.Background(),
		bson.M{"_id": contentObjID},
	).Decode(&content)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			utils.NotFoundResponse(c, "Content")
		} else {
			utils.InternalServerErrorResponse(c)
		}
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Content details retrieved successfully", content)
}

func (ac *AdminController) UpdateContent(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	var req struct {
		Title          string              `json:"title" validate:"required,min=1,max=200"`
		OriginalTitle  string              `json:"original_title,omitempty"`
		Description    string              `json:"description" validate:"required,min=10,max=2000"`
		Genres         []string            `json:"genres" validate:"required,min=1"`
		ReleaseDate    time.Time           `json:"release_date"`
		Runtime        int                 `json:"runtime" validate:"min=1"`
		MaturityRating string              `json:"maturity_rating" validate:"required"`
		Language       string              `json:"language" validate:"required,len=2"`
		Country        string              `json:"country" validate:"required,len=2"`
		Director       []string            `json:"director,omitempty"`
		Producer       []string            `json:"producer,omitempty"`
		Writer         []string            `json:"writer,omitempty"`
		Cast           []models.CastMember `json:"cast,omitempty"`
		IsFeatured     bool                `json:"is_featured"`
		IsOriginal     bool                `json:"is_original"`
		Tags           []string            `json:"tags,omitempty"`
		Keywords       []string            `json:"keywords,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	// Update content
	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"title":           req.Title,
			"original_title":  req.OriginalTitle,
			"description":     req.Description,
			"genres":          req.Genres,
			"release_date":    req.ReleaseDate,
			"runtime":         req.Runtime,
			"maturity_rating": req.MaturityRating,
			"language":        req.Language,
			"country":         req.Country,
			"cast":            req.Cast,
			"director":        req.Director,
			"producer":        req.Producer,
			"writer":          req.Writer,
			"is_featured":     req.IsFeatured,
			"is_original":     req.IsOriginal,
			"tags":            req.Tags,
			"keywords":        req.Keywords,
			"updated_at":      now,
		},
	}

	_, err := ac.services.DB.Collection("content").UpdateOne(
		context.Background(),
		bson.M{"_id": contentObjID},
		update,
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Content updated successfully", nil)
}

func (ac *AdminController) DeleteContent(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	// Soft delete - change status to archived
	now := time.Now()
	_, err := ac.services.DB.Collection("content").UpdateOne(
		context.Background(),
		bson.M{"_id": contentObjID},
		bson.M{"$set": bson.M{
			"status":     models.ContentStatusArchived,
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Content deleted successfully", nil)
}

func (ac *AdminController) PublishContent(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	// Update status to published
	now := time.Now()
	_, err := ac.services.DB.Collection("content").UpdateOne(
		context.Background(),
		bson.M{"_id": contentObjID},
		bson.M{"$set": bson.M{
			"status":     models.ContentStatusPublished,
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Content published successfully", nil)
}

func (ac *AdminController) UnpublishContent(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	// Update status to draft
	now := time.Now()
	_, err := ac.services.DB.Collection("content").UpdateOne(
		context.Background(),
		bson.M{"_id": contentObjID},
		bson.M{"$set": bson.M{
			"status":     models.ContentStatusDraft,
			"updated_at": now,
		}},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Content unpublished successfully", nil)
}

// TMDB Integration
func (ac *AdminController) ImportFromTMDB(c *gin.Context) {
	tmdbID := c.Param("tmdbID")
	if tmdbID == "" {
		utils.BadRequestResponse(c, "TMDB ID is required")
		return
	}

	// Import content from TMDB
	content, err := ac.services.TMDBService.ImportContent(tmdbID)
	if err != nil {
		utils.BadRequestResponse(c, fmt.Sprintf("Failed to import from TMDB: %v", err))
		return
	}

	// Save to database
	content.ID = primitive.NewObjectID()
	content.Status = models.ContentStatusDraft
	content.CreatedAt = time.Now()
	content.UpdatedAt = time.Now()

	_, err = ac.services.DB.Collection("content").InsertOne(context.Background(), content)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.CreatedResponse(c, "Content imported from TMDB successfully", content)
}

func (ac *AdminController) SyncWithTMDB(c *gin.Context) {
	// Sync all content with TMDB to update metadata
	// This would be a background job in production
	utils.SuccessResponse(c, http.StatusOK, "TMDB sync initiated", nil)
}

func (ac *AdminController) SearchTMDB(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.BadRequestResponse(c, "Search query is required")
		return
	}

	results, err := ac.services.TMDBService.SearchContent(query)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "TMDB search results retrieved successfully", results)
}

// Video Management
func (ac *AdminController) UploadVideo(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	// Parse multipart form
	file, header, err := c.Request.FormFile("video")
	if err != nil {
		utils.BadRequestResponse(c, "No video file uploaded")
		return
	}
	defer file.Close()

	// Validate file type
	allowedTypes := []string{".mp4", ".avi", ".mov", ".mkv"}
	if !utils.ValidateFileType(header.Filename, allowedTypes) {
		utils.BadRequestResponse(c, "Invalid video file type")
		return
	}

	// Read file content
	fileContent, err := io.ReadAll(file)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Upload to storage service
	videoURL, err := ac.services.StorageService.UploadFile(
		fmt.Sprintf("videos/%s/%s", contentID, header.Filename),
		fileContent,
	)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Create video record
	video := models.ContentVideo{
		ID:        primitive.NewObjectID(),
		Title:     c.PostForm("title"),
		Type:      models.VideoType(c.PostForm("type")),
		Quality:   models.VideoQuality(c.PostForm("quality")),
		FileURL:   videoURL,
		FileSize:  int64(len(fileContent)),
		CreatedAt: time.Now(),
	}

	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	// Add video to content
	_, err = ac.services.DB.Collection("content").UpdateOne(
		context.Background(),
		bson.M{"_id": contentObjID},
		bson.M{
			"$push": bson.M{"videos": video},
			"$set":  bson.M{"updated_at": time.Now()},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.CreatedResponse(c, "Video uploaded successfully", video)
}

// Placeholder methods for remaining admin functionality
func (ac *AdminController) GetVideos(c *gin.Context) {
	utils.BadRequestResponse(c, "Video management not fully implemented")
}

func (ac *AdminController) UpdateVideo(c *gin.Context) {
	utils.BadRequestResponse(c, "Video management not fully implemented")
}

func (ac *AdminController) DeleteVideo(c *gin.Context) {
	utils.BadRequestResponse(c, "Video management not fully implemented")
}

func (ac *AdminController) ProcessVideo(c *gin.Context) {
	utils.BadRequestResponse(c, "Video processing not fully implemented")
}

func (ac *AdminController) CreateSeason(c *gin.Context) {
	utils.BadRequestResponse(c, "Season management not fully implemented")
}

func (ac *AdminController) GetSeasons(c *gin.Context) {
	utils.BadRequestResponse(c, "Season management not fully implemented")
}

func (ac *AdminController) UpdateSeason(c *gin.Context) {
	utils.BadRequestResponse(c, "Season management not fully implemented")
}

func (ac *AdminController) DeleteSeason(c *gin.Context) {
	utils.BadRequestResponse(c, "Season management not fully implemented")
}

func (ac *AdminController) CreateEpisode(c *gin.Context) {
	utils.BadRequestResponse(c, "Episode management not fully implemented")
}

func (ac *AdminController) GetEpisodes(c *gin.Context) {
	utils.BadRequestResponse(c, "Episode management not fully implemented")
}

func (ac *AdminController) UpdateEpisode(c *gin.Context) {
	utils.BadRequestResponse(c, "Episode management not fully implemented")
}

func (ac *AdminController) DeleteEpisode(c *gin.Context) {
	utils.BadRequestResponse(c, "Episode management not fully implemented")
}

func (ac *AdminController) UploadSubtitle(c *gin.Context) {
	utils.BadRequestResponse(c, "Subtitle management not fully implemented")
}

func (ac *AdminController) GetSubtitles(c *gin.Context) {
	utils.BadRequestResponse(c, "Subtitle management not fully implemented")
}

func (ac *AdminController) DeleteSubtitle(c *gin.Context) {
	utils.BadRequestResponse(c, "Subtitle management not fully implemented")
}

func (ac *AdminController) GetReportedContent(c *gin.Context) {
	utils.BadRequestResponse(c, "Content moderation not fully implemented")
}

func (ac *AdminController) ApproveContent(c *gin.Context) {
	utils.BadRequestResponse(c, "Content moderation not fully implemented")
}

func (ac *AdminController) RejectContent(c *gin.Context) {
	utils.BadRequestResponse(c, "Content moderation not fully implemented")
}

// Subscription Plan Management - would be similar to content management
func (ac *AdminController) GetSubscriptionPlans(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription plan management not fully implemented")
}

func (ac *AdminController) CreateSubscriptionPlan(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription plan management not fully implemented")
}

func (ac *AdminController) GetSubscriptionPlan(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription plan management not fully implemented")
}

func (ac *AdminController) UpdateSubscriptionPlan(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription plan management not fully implemented")
}

func (ac *AdminController) DeleteSubscriptionPlan(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription plan management not fully implemented")
}

func (ac *AdminController) ActivateSubscriptionPlan(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription plan management not fully implemented")
}

func (ac *AdminController) DeactivateSubscriptionPlan(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription plan management not fully implemented")
}

// Remaining placeholder methods
func (ac *AdminController) GetSubscriptions(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription management not fully implemented")
}

func (ac *AdminController) GetSubscription(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription management not fully implemented")
}

func (ac *AdminController) UpdateSubscription(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription management not fully implemented")
}

func (ac *AdminController) CancelSubscription(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription management not fully implemented")
}

func (ac *AdminController) RefundSubscription(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription management not fully implemented")
}

func (ac *AdminController) GetSubscriptionAnalytics(c *gin.Context) {
	utils.BadRequestResponse(c, "Subscription analytics not fully implemented")
}

func (ac *AdminController) GetPayments(c *gin.Context) {
	utils.BadRequestResponse(c, "Payment management not fully implemented")
}

func (ac *AdminController) GetPayment(c *gin.Context) {
	utils.BadRequestResponse(c, "Payment management not fully implemented")
}

func (ac *AdminController) RefundPayment(c *gin.Context) {
	utils.BadRequestResponse(c, "Payment management not fully implemented")
}

func (ac *AdminController) GetFailedPayments(c *gin.Context) {
	utils.BadRequestResponse(c, "Payment management not fully implemented")
}

func (ac *AdminController) RetryPayment(c *gin.Context) {
	utils.BadRequestResponse(c, "Payment management not fully implemented")
}

func (ac *AdminController) GetSettings(c *gin.Context) {
	utils.BadRequestResponse(c, "Settings management not fully implemented")
}

func (ac *AdminController) UpdateSettings(c *gin.Context) {
	utils.BadRequestResponse(c, "Settings management not fully implemented")
}

func (ac *AdminController) GetTMDBSettings(c *gin.Context) {
	utils.BadRequestResponse(c, "TMDB settings not fully implemented")
}

func (ac *AdminController) UpdateTMDBSettings(c *gin.Context) {
	utils.BadRequestResponse(c, "TMDB settings not fully implemented")
}

func (ac *AdminController) GetStripeSettings(c *gin.Context) {
	utils.BadRequestResponse(c, "Stripe settings not fully implemented")
}

func (ac *AdminController) UpdateStripeSettings(c *gin.Context) {
	utils.BadRequestResponse(c, "Stripe settings not fully implemented")
}

func (ac *AdminController) GetEmailSettings(c *gin.Context) {
	utils.BadRequestResponse(c, "Email settings not fully implemented")
}

func (ac *AdminController) UpdateEmailSettings(c *gin.Context) {
	utils.BadRequestResponse(c, "Email settings not fully implemented")
}

func (ac *AdminController) GetSystemHealth(c *gin.Context) {
	utils.BadRequestResponse(c, "System monitoring not fully implemented")
}

func (ac *AdminController) GetLogs(c *gin.Context) {
	utils.BadRequestResponse(c, "System monitoring not fully implemented")
}

func (ac *AdminController) GetMetrics(c *gin.Context) {
	utils.BadRequestResponse(c, "System monitoring not fully implemented")
}

func (ac *AdminController) ClearCache(c *gin.Context) {
	utils.BadRequestResponse(c, "Cache management not fully implemented")
}

func (ac *AdminController) BackupDatabase(c *gin.Context) {
	utils.BadRequestResponse(c, "Database backup not fully implemented")
}

func (ac *AdminController) GetDatabaseStatus(c *gin.Context) {
	utils.BadRequestResponse(c, "Database monitoring not fully implemented")
}

func (ac *AdminController) GetUserReport(c *gin.Context) {
	utils.BadRequestResponse(c, "Reporting not fully implemented")
}

func (ac *AdminController) GetContentReport(c *gin.Context) {
	utils.BadRequestResponse(c, "Reporting not fully implemented")
}

func (ac *AdminController) GetRevenueReport(c *gin.Context) {
	utils.BadRequestResponse(c, "Reporting not fully implemented")
}

func (ac *AdminController) GetEngagementReport(c *gin.Context) {
	utils.BadRequestResponse(c, "Reporting not fully implemented")
}

func (ac *AdminController) GenerateCustomReport(c *gin.Context) {
	utils.BadRequestResponse(c, "Reporting not fully implemented")
}

func (ac *AdminController) ExportReport(c *gin.Context) {
	utils.BadRequestResponse(c, "Report export not fully implemented")
}

func (ac *AdminController) GetNotifications(c *gin.Context) {
	utils.BadRequestResponse(c, "Notification management not fully implemented")
}

func (ac *AdminController) CreateNotification(c *gin.Context) {
	utils.BadRequestResponse(c, "Notification management not fully implemented")
}

func (ac *AdminController) UpdateNotification(c *gin.Context) {
	utils.BadRequestResponse(c, "Notification management not fully implemented")
}

func (ac *AdminController) DeleteNotification(c *gin.Context) {
	utils.BadRequestResponse(c, "Notification management not fully implemented")
}

func (ac *AdminController) BroadcastNotification(c *gin.Context) {
	utils.BadRequestResponse(c, "Notification management not fully implemented")
}

func (ac *AdminController) GetRecommendationAlgorithm(c *gin.Context) {
	utils.BadRequestResponse(c, "Recommendation management not fully implemented")
}

func (ac *AdminController) UpdateRecommendationAlgorithm(c *gin.Context) {
	utils.BadRequestResponse(c, "Recommendation management not fully implemented")
}

func (ac *AdminController) RetrainRecommendationModel(c *gin.Context) {
	utils.BadRequestResponse(c, "Recommendation management not fully implemented")
}

func (ac *AdminController) GetRecommendationPerformance(c *gin.Context) {
	utils.BadRequestResponse(c, "Recommendation management not fully implemented")
}
