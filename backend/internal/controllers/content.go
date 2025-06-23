// backend/internal/controllers/content.go
package controllers

import (
	"context"
	"fmt"
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
)

type ContentController struct {
	services *services.Services
}

func NewContentController(services *services.Services) *ContentController {
	return &ContentController{
		services: services,
	}
}

// Public Browse Content
func (cc *ContentController) BrowseContent(c *gin.Context) {
	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, limit, _ = utils.ValidatePaginationParams(page, limit)

	// Filters
	contentType := c.Query("type") // movie, tv_show
	genre := c.Query("genre")
	year := c.Query("year")
	maturityRating := c.Query("maturity_rating")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	// Build filter
	filter := bson.M{"status": models.ContentStatusPublished}

	if contentType != "" {
		filter["type"] = contentType
	}

	if genre != "" {
		filter["genres"] = bson.M{"$in": []string{genre}}
	}

	if year != "" {
		if yearInt, err := strconv.Atoi(year); err == nil {
			startOfYear := time.Date(yearInt, 1, 1, 0, 0, 0, 0, time.UTC)
			endOfYear := time.Date(yearInt+1, 1, 1, 0, 0, 0, 0, time.UTC)
			filter["release_date"] = bson.M{
				"$gte": startOfYear,
				"$lt":  endOfYear,
			}
		}
	}

	if maturityRating != "" {
		filter["maturity_rating"] = maturityRating
	}

	// Sort options
	sortOptions := bson.M{}
	switch sortBy {
	case "title":
		sortOptions["title"] = 1
		if sortOrder == "desc" {
			sortOptions["title"] = -1
		}
	case "rating":
		sortOptions["rating"] = -1
		if sortOrder == "asc" {
			sortOptions["rating"] = 1
		}
	case "release_date":
		sortOptions["release_date"] = -1
		if sortOrder == "asc" {
			sortOptions["release_date"] = 1
		}
	case "view_count":
		sortOptions["view_count"] = -1
		if sortOrder == "asc" {
			sortOptions["view_count"] = 1
		}
	default:
		sortOptions["created_at"] = -1
		if sortOrder == "asc" {
			sortOptions["created_at"] = 1
		}
	}

	// Count total documents
	totalCount, err := cc.services.DB.Collection("content").CountDocuments(context.Background(), filter)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Find content with pagination
	skip := (page - 1) * limit
	findOptions := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(sortOptions)

	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(context.Background(), filter, findOptions)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.PaginatedResponse(c, http.StatusOK, "Content retrieved successfully", content, page, limit, totalCount)
}

func (cc *ContentController) GetFeaturedContent(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit > 50 {
		limit = 50
	}

	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{
			"status":      models.ContentStatusPublished,
			"is_featured": true,
		},
		options.Find().SetLimit(int64(limit)).SetSort(bson.M{"created_at": -1}),
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Featured content retrieved successfully", content)
}

func (cc *ContentController) GetTrendingContent(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 50 {
		limit = 50
	}

	// Get trending based on view count in the last 7 days
	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{
			"status": models.ContentStatusPublished,
		},
		options.Find().
			SetLimit(int64(limit)).
			SetSort(bson.M{"view_count": -1, "created_at": -1}),
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Trending content retrieved successfully", content)
}

func (cc *ContentController) GetNewReleases(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 50 {
		limit = 50
	}

	// Get content released in the last 30 days
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)

	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{
			"status":       models.ContentStatusPublished,
			"release_date": bson.M{"$gte": thirtyDaysAgo},
		},
		options.Find().
			SetLimit(int64(limit)).
			SetSort(bson.M{"release_date": -1}),
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "New releases retrieved successfully", content)
}

func (cc *ContentController) GetOriginals(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 50 {
		limit = 50
	}

	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{
			"status":      models.ContentStatusPublished,
			"is_original": true,
		},
		options.Find().
			SetLimit(int64(limit)).
			SetSort(bson.M{"created_at": -1}),
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Original content retrieved successfully", content)
}

// Content Details
func (cc *ContentController) GetContentDetails(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	var content models.Content
	err := cc.services.DB.Collection("content").FindOne(
		context.Background(),
		bson.M{
			"_id":    contentObjID,
			"status": models.ContentStatusPublished,
		},
	).Decode(&content)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			utils.NotFoundResponse(c, "Content")
		} else {
			utils.InternalServerErrorResponse(c)
		}
		return
	}

	// Increment view count
	go func() {
		cc.services.DB.Collection("content").UpdateOne(
			context.Background(),
			bson.M{"_id": contentObjID},
			bson.M{"$inc": bson.M{"view_count": 1}},
		)
	}()

	utils.SuccessResponse(c, http.StatusOK, "Content details retrieved successfully", content)
}

func (cc *ContentController) GetSimilarContent(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit > 20 {
		limit = 20
	}

	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	// Get the original content to find similar items
	var originalContent models.Content
	err := cc.services.DB.Collection("content").FindOne(
		context.Background(),
		bson.M{"_id": contentObjID},
	).Decode(&originalContent)

	if err != nil {
		utils.NotFoundResponse(c, "Content")
		return
	}

	// Find similar content based on genres and type
	var similarContent []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{
			"_id":    bson.M{"$ne": contentObjID},
			"status": models.ContentStatusPublished,
			"type":   originalContent.Type,
			"genres": bson.M{"$in": originalContent.Genres},
		},
		options.Find().
			SetLimit(int64(limit)).
			SetSort(bson.M{"rating": -1, "view_count": -1}),
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &similarContent); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Similar content retrieved successfully", similarContent)
}

func (cc *ContentController) GetTrailers(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	var content models.Content
	err := cc.services.DB.Collection("content").FindOne(
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

	// Filter videos for trailers and teasers
	var trailers []models.ContentVideo
	for _, video := range content.Videos {
		if video.Type == models.VideoTypeTrailer || video.Type == models.VideoTypeTeaser {
			trailers = append(trailers, video)
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Trailers retrieved successfully", trailers)
}

// Search
func (cc *ContentController) SearchContent(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.BadRequestResponse(c, "Search query is required")
		return
	}

	if !utils.ValidateSearchQuery(query) {
		utils.BadRequestResponse(c, "Invalid search query")
		return
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, limit, _ = utils.ValidatePaginationParams(page, limit)

	// Filters
	contentType := c.Query("type")
	genre := c.Query("genre")

	// Build search filter
	searchFilter := bson.M{
		"status": models.ContentStatusPublished,
		"$or": []bson.M{
			{"title": bson.M{"$regex": query, "$options": "i"}},
			{"original_title": bson.M{"$regex": query, "$options": "i"}},
			{"description": bson.M{"$regex": query, "$options": "i"}},
			{"cast.name": bson.M{"$regex": query, "$options": "i"}},
			{"director": bson.M{"$regex": query, "$options": "i"}},
			{"genres": bson.M{"$regex": query, "$options": "i"}},
			{"keywords": bson.M{"$regex": query, "$options": "i"}},
		},
	}

	if contentType != "" {
		searchFilter["type"] = contentType
	}

	if genre != "" {
		searchFilter["genres"] = bson.M{"$in": []string{genre}}
	}

	// Count total results
	totalCount, err := cc.services.DB.Collection("content").CountDocuments(context.Background(), searchFilter)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Find content with pagination
	skip := (page - 1) * limit
	findOptions := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"view_count": -1, "rating": -1})

	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(context.Background(), searchFilter, findOptions)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.PaginatedResponse(c, http.StatusOK, "Search results retrieved successfully", content, page, limit, totalCount)
}

func (cc *ContentController) GetSearchSuggestions(c *gin.Context) {
	query := c.Query("q")
	if query == "" || len(query) < 2 {
		utils.SuccessResponse(c, http.StatusOK, "Search suggestions retrieved successfully", []interface{}{})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit > 20 {
		limit = 20
	}

	// Find content titles that match the query
	var suggestions []string
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{
			"status": models.ContentStatusPublished,
			"title":  bson.M{"$regex": "^" + query, "$options": "i"},
		},
		options.Find().
			SetLimit(int64(limit)).
			SetProjection(bson.M{"title": 1}).
			SetSort(bson.M{"view_count": -1}),
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	var results []struct {
		Title string `bson:"title"`
	}

	if err = cursor.All(context.Background(), &results); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	for _, result := range results {
		suggestions = append(suggestions, result.Title)
	}

	utils.SuccessResponse(c, http.StatusOK, "Search suggestions retrieved successfully", suggestions)
}

// Genres and Categories
func (cc *ContentController) GetGenres(c *gin.Context) {
	// Aggregate unique genres
	pipeline := []bson.M{
		{"$match": bson.M{"status": models.ContentStatusPublished}},
		{"$unwind": "$genres"},
		{"$group": bson.M{
			"_id":   "$genres",
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"count": -1}},
		{"$project": bson.M{
			"_id":   0,
			"genre": "$_id",
			"count": 1,
		}},
	}

	cursor, err := cc.services.DB.Collection("content").Aggregate(context.Background(), pipeline)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	var genres []bson.M
	if err = cursor.All(context.Background(), &genres); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Genres retrieved successfully", genres)
}

func (cc *ContentController) GetContentByGenre(c *gin.Context) {
	genre := c.Param("genre")
	if genre == "" {
		utils.BadRequestResponse(c, "Genre is required")
		return
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, limit, _ = utils.ValidatePaginationParams(page, limit)

	filter := bson.M{
		"status": models.ContentStatusPublished,
		"genres": bson.M{"$in": []string{genre}},
	}

	// Count total documents
	totalCount, err := cc.services.DB.Collection("content").CountDocuments(context.Background(), filter)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Find content with pagination
	skip := (page - 1) * limit
	findOptions := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"rating": -1, "view_count": -1})

	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(context.Background(), filter, findOptions)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	if err = cursor.All(context.Background(), &content); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.PaginatedResponse(c, http.StatusOK, fmt.Sprintf("Content for genre '%s' retrieved successfully", genre), content, page, limit, totalCount)
}

func (cc *ContentController) GetCategories(c *gin.Context) {
	categories := []gin.H{
		{"name": "Trending Now", "key": "trending"},
		{"name": "New Releases", "key": "new"},
		{"name": "Top Rated", "key": "top_rated"},
		{"name": "Recently Added", "key": "recent"},
		{"name": "Because You Watched", "key": "recommendations"},
		{"name": "Continue Watching", "key": "continue"},
		{"name": "My List", "key": "watchlist"},
	}

	utils.SuccessResponse(c, http.StatusOK, "Categories retrieved successfully", categories)
}

func (cc *ContentController) GetContentByCategory(c *gin.Context) {
	category := c.Param("category")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 50 {
		limit = 50
	}

	var content []models.Content
	var err error

	switch category {
	case "trending":
		content, err = cc.getTrendingContent(limit)
	case "new":
		content, err = cc.getNewContent(limit)
	case "top_rated":
		content, err = cc.getTopRatedContent(limit)
	case "recent":
		content, err = cc.getRecentlyAddedContent(limit)
	default:
		utils.BadRequestResponse(c, "Invalid category")
		return
	}

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, fmt.Sprintf("Content for category '%s' retrieved successfully", category), content)
}

// TV Show specific endpoints
func (cc *ContentController) GetSeasons(c *gin.Context) {
	showID := c.Param("showID")
	if !utils.IsValidObjectID(showID) {
		utils.BadRequestResponse(c, "Invalid show ID")
		return
	}

	showObjID, _ := primitive.ObjectIDFromHex(showID)

	var show models.Content
	err := cc.services.DB.Collection("content").FindOne(
		context.Background(),
		bson.M{
			"_id":    showObjID,
			"type":   models.ContentTypeTVShow,
			"status": models.ContentStatusPublished,
		},
	).Decode(&show)

	if err != nil {
		utils.NotFoundResponse(c, "TV Show")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Seasons retrieved successfully", show.Seasons)
}

func (cc *ContentController) GetSeason(c *gin.Context) {
	showID := c.Param("showID")
	seasonNumberStr := c.Param("seasonNumber")

	if !utils.IsValidObjectID(showID) {
		utils.BadRequestResponse(c, "Invalid show ID")
		return
	}

	seasonNumber, err := strconv.Atoi(seasonNumberStr)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid season number")
		return
	}

	showObjID, _ := primitive.ObjectIDFromHex(showID)

	var show models.Content
	err = cc.services.DB.Collection("content").FindOne(
		context.Background(),
		bson.M{
			"_id":    showObjID,
			"type":   models.ContentTypeTVShow,
			"status": models.ContentStatusPublished,
		},
	).Decode(&show)

	if err != nil {
		utils.NotFoundResponse(c, "TV Show")
		return
	}

	// Find the specific season
	var season *models.Season
	for _, s := range show.Seasons {
		if s.SeasonNumber == seasonNumber {
			season = &s
			break
		}
	}

	if season == nil {
		utils.NotFoundResponse(c, "Season")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Season retrieved successfully", season)
}

func (cc *ContentController) GetEpisodes(c *gin.Context) {
	showID := c.Param("showID")
	seasonNumberStr := c.Param("seasonNumber")

	if !utils.IsValidObjectID(showID) {
		utils.BadRequestResponse(c, "Invalid show ID")
		return
	}

	seasonNumber, err := strconv.Atoi(seasonNumberStr)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid season number")
		return
	}

	showObjID, _ := primitive.ObjectIDFromHex(showID)

	var show models.Content
	err = cc.services.DB.Collection("content").FindOne(
		context.Background(),
		bson.M{
			"_id":    showObjID,
			"type":   models.ContentTypeTVShow,
			"status": models.ContentStatusPublished,
		},
	).Decode(&show)

	if err != nil {
		utils.NotFoundResponse(c, "TV Show")
		return
	}

	// Find the specific season
	var season *models.Season
	for _, s := range show.Seasons {
		if s.SeasonNumber == seasonNumber {
			season = &s
			break
		}
	}

	if season == nil {
		utils.NotFoundResponse(c, "Season")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Episodes retrieved successfully", season.Episodes)
}

func (cc *ContentController) GetEpisode(c *gin.Context) {
	showID := c.Param("showID")
	seasonNumberStr := c.Param("seasonNumber")
	episodeNumberStr := c.Param("episodeNumber")

	if !utils.IsValidObjectID(showID) {
		utils.BadRequestResponse(c, "Invalid show ID")
		return
	}

	seasonNumber, err := strconv.Atoi(seasonNumberStr)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid season number")
		return
	}

	episodeNumber, err := strconv.Atoi(episodeNumberStr)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid episode number")
		return
	}

	showObjID, _ := primitive.ObjectIDFromHex(showID)

	var show models.Content
	err = cc.services.DB.Collection("content").FindOne(
		context.Background(),
		bson.M{
			"_id":    showObjID,
			"type":   models.ContentTypeTVShow,
			"status": models.ContentStatusPublished,
		},
	).Decode(&show)

	if err != nil {
		utils.NotFoundResponse(c, "TV Show")
		return
	}

	// Find the specific season and episode
	var episode *models.Episode
	for _, s := range show.Seasons {
		if s.SeasonNumber == seasonNumber {
			for _, e := range s.Episodes {
				if e.EpisodeNumber == episodeNumber {
					episode = &e
					break
				}
			}
			break
		}
	}

	if episode == nil {
		utils.NotFoundResponse(c, "Episode")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Episode retrieved successfully", episode)
}

// Protected Streaming Endpoints (require subscription)
func (cc *ContentController) StreamVideo(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	// Get content
	var content models.Content
	err := cc.services.DB.Collection("content").FindOne(
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

	// Check subscription access
	if !cc.hasStreamingAccess(u, &content) {
		utils.ForbiddenResponse(c)
		return
	}

	// Find default video or best quality
	var video *models.ContentVideo
	for _, v := range content.Videos {
		if v.Type == models.VideoTypeFull {
			if video == nil || v.Quality > video.Quality {
				video = &v
			}
		}
	}

	if video == nil {
		utils.NotFoundResponse(c, "Video")
		return
	}

	// Generate streaming URL (signed URL for security)
	streamingURL, err := cc.services.VideoService.GenerateStreamingURL(video.FileURL, u.ID.Hex())
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	response := gin.H{
		"streaming_url": streamingURL,
		"video_info":    video,
		"content":       content,
	}

	utils.SuccessResponse(c, http.StatusOK, "Streaming URL generated successfully", response)
}

func (cc *ContentController) StreamVideoQuality(c *gin.Context) {
	contentID := c.Param("contentID")
	quality := c.Param("quality")

	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	contentObjID, _ := primitive.ObjectIDFromHex(contentID)

	// Get content
	var content models.Content
	err := cc.services.DB.Collection("content").FindOne(
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

	// Check subscription access
	if !cc.hasStreamingAccess(u, &content) {
		utils.ForbiddenResponse(c)
		return
	}

	// Find video with specific quality
	var video *models.ContentVideo
	for _, v := range content.Videos {
		if v.Type == models.VideoTypeFull && string(v.Quality) == quality {
			video = &v
			break
		}
	}

	if video == nil {
		utils.NotFoundResponse(c, "Video with specified quality")
		return
	}

	// Check if user's plan supports this quality
	if !cc.qualityAllowed(u, video.Quality) {
		utils.ForbiddenResponse(c)
		return
	}

	// Generate streaming URL
	streamingURL, err := cc.services.VideoService.GenerateStreamingURL(video.FileURL, u.ID.Hex())
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	response := gin.H{
		"streaming_url": streamingURL,
		"video_info":    video,
		"content":       content,
	}

	utils.SuccessResponse(c, http.StatusOK, "Streaming URL generated successfully", response)
}

func (cc *ContentController) GetStreamingToken(c *gin.Context) {
	contentID := c.Param("contentID")
	if !utils.IsValidObjectID(contentID) {
		utils.BadRequestResponse(c, "Invalid content ID")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Generate streaming token for HLS/DASH streaming
	token, err := cc.services.VideoService.GenerateStreamingToken(contentID, u.ID.Hex())
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	response := gin.H{
		"token":      token,
		"expires_at": time.Now().Add(6 * time.Hour),
	}

	utils.SuccessResponse(c, http.StatusOK, "Streaming token generated successfully", response)
}

func (cc *ContentController) StreamEpisode(c *gin.Context) {
	showID := c.Param("showID")
	seasonNumberStr := c.Param("seasonNumber")
	episodeNumberStr := c.Param("episodeNumber")

	if !utils.IsValidObjectID(showID) {
		utils.BadRequestResponse(c, "Invalid show ID")
		return
	}

	seasonNumber, err := strconv.Atoi(seasonNumberStr)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid season number")
		return
	}

	episodeNumber, err := strconv.Atoi(episodeNumberStr)
	if err != nil {
		utils.BadRequestResponse(c, "Invalid episode number")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)
	showObjID, _ := primitive.ObjectIDFromHex(showID)

	// Get show
	var show models.Content
	err = cc.services.DB.Collection("content").FindOne(
		context.Background(),
		bson.M{
			"_id":    showObjID,
			"type":   models.ContentTypeTVShow,
			"status": models.ContentStatusPublished,
		},
	).Decode(&show)

	if err != nil {
		utils.NotFoundResponse(c, "TV Show")
		return
	}

	// Check subscription access
	if !cc.hasStreamingAccess(u, &show) {
		utils.ForbiddenResponse(c)
		return
	}

	// Find the specific episode
	var episode *models.Episode
	for _, s := range show.Seasons {
		if s.SeasonNumber == seasonNumber {
			for _, e := range s.Episodes {
				if e.EpisodeNumber == episodeNumber {
					episode = &e
					break
				}
			}
			break
		}
	}

	if episode == nil {
		utils.NotFoundResponse(c, "Episode")
		return
	}

	// Find video for episode
	var video *models.ContentVideo
	for _, v := range episode.Videos {
		if v.Type == models.VideoTypeFull {
			video = &v
			break
		}
	}

	if video == nil {
		utils.NotFoundResponse(c, "Episode video")
		return
	}

	// Generate streaming URL
	streamingURL, err := cc.services.VideoService.GenerateStreamingURL(video.FileURL, u.ID.Hex())
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	response := gin.H{
		"streaming_url": streamingURL,
		"video_info":    video,
		"episode":       episode,
		"show":          show,
	}

	utils.SuccessResponse(c, http.StatusOK, "Episode streaming URL generated successfully", response)
}

// Helper methods for category content
func (cc *ContentController) getTrendingContent(limit int) ([]models.Content, error) {
	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{"status": models.ContentStatusPublished},
		options.Find().
			SetLimit(int64(limit)).
			SetSort(bson.M{"view_count": -1}),
	)

	if err != nil {
		return nil, err
	}

	err = cursor.All(context.Background(), &content)
	return content, err
}

func (cc *ContentController) getNewContent(limit int) ([]models.Content, error) {
	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{"status": models.ContentStatusPublished},
		options.Find().
			SetLimit(int64(limit)).
			SetSort(bson.M{"release_date": -1}),
	)

	if err != nil {
		return nil, err
	}

	err = cursor.All(context.Background(), &content)
	return content, err
}

func (cc *ContentController) getTopRatedContent(limit int) ([]models.Content, error) {
	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{
			"status": models.ContentStatusPublished,
			"rating": bson.M{"$gte": 7.0},
		},
		options.Find().
			SetLimit(int64(limit)).
			SetSort(bson.M{"rating": -1}),
	)

	if err != nil {
		return nil, err
	}

	err = cursor.All(context.Background(), &content)
	return content, err
}

func (cc *ContentController) getRecentlyAddedContent(limit int) ([]models.Content, error) {
	var content []models.Content
	cursor, err := cc.services.DB.Collection("content").Find(
		context.Background(),
		bson.M{"status": models.ContentStatusPublished},
		options.Find().
			SetLimit(int64(limit)).
			SetSort(bson.M{"created_at": -1}),
	)

	if err != nil {
		return nil, err
	}

	err = cursor.All(context.Background(), &content)
	return content, err
}

// Helper methods for access control
func (cc *ContentController) hasStreamingAccess(user *models.User, content *models.Content) bool {
	if user.Subscription == nil {
		return false
	}

	if user.Subscription.Status != models.SubscriptionStatusActive &&
		user.Subscription.Status != models.SubscriptionStatusTrialing {
		return false
	}

	// Check if subscription is not expired
	if time.Now().After(user.Subscription.CurrentPeriodEnd) {
		return false
	}

	return true
}

func (cc *ContentController) qualityAllowed(user *models.User, quality models.VideoQuality) bool {
	if user.Subscription == nil {
		return false
	}

	// Get subscription plan to check allowed qualities
	var plan models.SubscriptionPlan
	err := cc.services.DB.Collection("subscription_plans").FindOne(
		context.Background(),
		bson.M{"_id": user.Subscription.PlanID},
	).Decode(&plan)

	if err != nil {
		return false
	}

	// Check if quality is in allowed list
	for _, allowedQuality := range plan.Features.VideoQuality {
		if allowedQuality == quality {
			return true
		}
	}

	return false
}

// Placeholder methods for remaining functionality
func (cc *ContentController) DownloadContent(c *gin.Context) {
	utils.BadRequestResponse(c, "Download functionality not yet implemented")
}

func (cc *ContentController) GetDownloads(c *gin.Context) {
	utils.BadRequestResponse(c, "Download functionality not yet implemented")
}

func (cc *ContentController) RemoveDownload(c *gin.Context) {
	utils.BadRequestResponse(c, "Download functionality not yet implemented")
}

func (cc *ContentController) GetSubtitles(c *gin.Context) {
	utils.BadRequestResponse(c, "Subtitle functionality not yet implemented")
}

func (cc *ContentController) GetSubtitleFile(c *gin.Context) {
	utils.BadRequestResponse(c, "Subtitle functionality not yet implemented")
}

func (cc *ContentController) LikeContent(c *gin.Context) {
	utils.BadRequestResponse(c, "Like functionality not yet implemented")
}

func (cc *ContentController) UnlikeContent(c *gin.Context) {
	utils.BadRequestResponse(c, "Like functionality not yet implemented")
}

func (cc *ContentController) RateContent(c *gin.Context) {
	utils.BadRequestResponse(c, "Rating functionality not yet implemented")
}

func (cc *ContentController) AddReview(c *gin.Context) {
	utils.BadRequestResponse(c, "Review functionality not yet implemented")
}

func (cc *ContentController) GetReviews(c *gin.Context) {
	utils.BadRequestResponse(c, "Review functionality not yet implemented")
}

func (cc *ContentController) GetContinueWatching(c *gin.Context) {
	utils.BadRequestResponse(c, "Continue watching not yet implemented")
}

func (cc *ContentController) UpdateWatchProgress(c *gin.Context) {
	utils.BadRequestResponse(c, "Watch progress tracking not yet implemented")
}

func (cc *ContentController) GetRecommendations(c *gin.Context) {
	utils.BadRequestResponse(c, "Recommendations not yet implemented")
}

func (cc *ContentController) GetTrendingRecommendations(c *gin.Context) {
	utils.BadRequestResponse(c, "Recommendations not yet implemented")
}

func (cc *ContentController) GetBecauseYouWatchedRecommendations(c *gin.Context) {
	utils.BadRequestResponse(c, "Recommendations not yet implemented")
}

func (cc *ContentController) SubmitRecommendationFeedback(c *gin.Context) {
	utils.BadRequestResponse(c, "Recommendation feedback not yet implemented")
}
