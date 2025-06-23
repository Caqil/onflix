package routes

import (
	"onflix/internal/controllers"
	"onflix/internal/middleware"
	"onflix/internal/services"

	"github.com/gin-gonic/gin"
)

func SetupPublicContentRoutes(rg *gin.RouterGroup, services *services.Services) {
	contentController := controllers.NewContentController(services)
	authMiddleware := middleware.NewAuthMiddleware(services.DB, services.Config.JWT.Secret)

	// Public content routes (for browsing without subscription)
	content := rg.Group("/content")
	content.Use(authMiddleware.OptionalAuth())
	{
		// Browse content
		content.GET("", contentController.BrowseContent)
		content.GET("/featured", contentController.GetFeaturedContent)
		content.GET("/trending", contentController.GetTrendingContent)
		content.GET("/new-releases", contentController.GetNewReleases)
		content.GET("/originals", contentController.GetOriginals)

		// Content details
		content.GET("/:contentID", contentController.GetContentDetails)
		content.GET("/:contentID/similar", contentController.GetSimilarContent)
		content.GET("/:contentID/trailers", contentController.GetTrailers)

		// Search
		content.GET("/search", contentController.SearchContent)
		content.GET("/search/suggestions", contentController.GetSearchSuggestions)

		// Genres and categories
		content.GET("/genres", contentController.GetGenres)
		content.GET("/genres/:genre", contentController.GetContentByGenre)
		content.GET("/categories", contentController.GetCategories)
		content.GET("/categories/:category", contentController.GetContentByCategory)

		// TV Show specific
		tvshows := content.Group("/tv-shows")
		{
			tvshows.GET("/:showID/seasons", contentController.GetSeasons)
			tvshows.GET("/:showID/seasons/:seasonNumber", contentController.GetSeason)
			tvshows.GET("/:showID/seasons/:seasonNumber/episodes", contentController.GetEpisodes)
			tvshows.GET("/:showID/seasons/:seasonNumber/episodes/:episodeNumber", contentController.GetEpisode)
		}
	}
}

func SetupContentRoutes(rg *gin.RouterGroup, services *services.Services) {
	contentController := controllers.NewContentController(services)
	authMiddleware := middleware.NewAuthMiddleware(services.DB, services.Config.JWT.Secret)

	// Protected content routes (require subscription)
	content := rg.Group("/content")
	content.Use(authMiddleware.RequireSubscription())
	{
		// Video streaming
		content.GET("/:contentID/stream", contentController.StreamVideo)
		content.GET("/:contentID/stream/:quality", contentController.StreamVideoQuality)
		content.POST("/:contentID/stream/token", contentController.GetStreamingToken)

		// TV Show streaming
		content.GET("/tv-shows/:showID/seasons/:seasonNumber/episodes/:episodeNumber/stream", contentController.StreamEpisode)

		// Download for offline viewing
		content.POST("/:contentID/download", contentController.DownloadContent)
		content.GET("/downloads", contentController.GetDownloads)
		content.DELETE("/downloads/:downloadID", contentController.RemoveDownload)

		// Subtitles
		content.GET("/:contentID/subtitles", contentController.GetSubtitles)
		content.GET("/:contentID/subtitles/:language", contentController.GetSubtitleFile)

		// User interactions
		interactions := content.Group("/:contentID")
		{
			interactions.POST("/like", contentController.LikeContent)
			interactions.DELETE("/like", contentController.UnlikeContent)
			interactions.POST("/rate", contentController.RateContent)
			interactions.POST("/review", contentController.AddReview)
			interactions.GET("/reviews", contentController.GetReviews)
		}

		// Continue watching
		content.GET("/continue-watching", contentController.GetContinueWatching)
		content.POST("/:contentID/watch-progress", contentController.UpdateWatchProgress)
	}

	// Recommendations (require auth but not necessarily subscription)
	recommendations := rg.Group("/recommendations")
	{
		recommendations.GET("", contentController.GetRecommendations)
		recommendations.GET("/trending", contentController.GetTrendingRecommendations)
		recommendations.GET("/because-you-watched/:contentID", contentController.GetBecauseYouWatchedRecommendations)
		recommendations.POST("/feedback", contentController.SubmitRecommendationFeedback)
	}
}
