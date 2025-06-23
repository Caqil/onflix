// backend/scripts/seed.go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"onflix/internal/config"
	"onflix/internal/database"
	"onflix/internal/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := database.Connect(cfg.MongoDB.URI)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Starting database seeding...")

	// Clear existing data (optional - comment out for production)
	if err := clearDatabase(db); err != nil {
		log.Printf("Warning: Failed to clear database: %v", err)
	}

	// Seed data in order
	if err := seedSubscriptionPlans(db); err != nil {
		log.Fatal("Failed to seed subscription plans:", err)
	}

	userIDs, err := seedUsers(db)
	if err != nil {
		log.Fatal("Failed to seed users:", err)
	}

	contentIDs, err := seedContent(db)
	if err != nil {
		log.Fatal("Failed to seed content:", err)
	}

	if err := seedSubscriptions(db, userIDs); err != nil {
		log.Fatal("Failed to seed subscriptions:", err)
	}

	if err := seedPayments(db, userIDs); err != nil {
		log.Fatal("Failed to seed payments:", err)
	}

	if err := seedWatchHistory(db, userIDs, contentIDs); err != nil {
		log.Fatal("Failed to seed watch history:", err)
	}

	if err := seedVideoMetrics(db, userIDs, contentIDs); err != nil {
		log.Fatal("Failed to seed video metrics:", err)
	}

	fmt.Println("✅ Database seeding completed successfully!")
	fmt.Println("\n📋 Sample Accounts Created:")
	fmt.Println("👤 Admin: admin@netflix-clone.com / password123")
	fmt.Println("👤 User 1: john.doe@example.com / password123")
	fmt.Println("👤 User 2: jane.smith@example.com / password123")
	fmt.Println("👤 User 3: mike.johnson@example.com / password123")
}

func clearDatabase(db *mongo.Database) error {
	collections := []string{
		"users", "content", "subscription_plans", "subscriptions",
		"payments", "invoices", "login_attempts", "video_metrics",
		"subscription_usage",
	}

	for _, collection := range collections {
		_, err := db.Collection(collection).DeleteMany(context.Background(), primitive.M{})
		if err != nil {
			return fmt.Errorf("failed to clear %s collection: %v", collection, err)
		}
	}

	fmt.Println("🗑️  Cleared existing data")
	return nil
}

func seedSubscriptionPlans(db *mongo.Database) error {
	plans := []models.SubscriptionPlan{
		{
			ID:          primitive.NewObjectID(),
			Name:        "Basic",
			Description: "Watch on 1 screen at a time in HD",
			Price:       8.99,
			Currency:    "USD",
			Interval:    models.IntervalMonthly,
			Features: models.PlanFeatures{
				VideoQuality:    []models.VideoQuality{models.Quality480p, models.Quality720p},
				HDSupport:       true,
				UltraHDSupport:  false,
				DownloadSupport: true,
				AdFree:          true,
				EarlyAccess:     false,
			},
			Limits: models.PlanLimits{
				MaxProfiles:          2,
				MaxConcurrentStreams: 1,
				MaxDownloads:         5,
			},
			StripePriceID: "price_basic_monthly",
			IsActive:      true,
			IsPopular:     false,
			SortOrder:     1,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		},
		{
			ID:          primitive.NewObjectID(),
			Name:        "Standard",
			Description: "Watch on 2 screens at the same time in HD",
			Price:       13.99,
			Currency:    "USD",
			Interval:    models.IntervalMonthly,
			Features: models.PlanFeatures{
				VideoQuality:    []models.VideoQuality{models.Quality480p, models.Quality720p, models.Quality1080p},
				HDSupport:       true,
				UltraHDSupport:  false,
				DownloadSupport: true,
				AdFree:          true,
				EarlyAccess:     false,
			},
			Limits: models.PlanLimits{
				MaxProfiles:          3,
				MaxConcurrentStreams: 2,
				MaxDownloads:         10,
			},
			StripePriceID: "price_standard_monthly",
			IsActive:      true,
			IsPopular:     true,
			SortOrder:     2,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		},
		{
			ID:          primitive.NewObjectID(),
			Name:        "Premium",
			Description: "Watch on 4 screens at the same time in Ultra HD",
			Price:       17.99,
			Currency:    "USD",
			Interval:    models.IntervalMonthly,
			Features: models.PlanFeatures{
				VideoQuality:    []models.VideoQuality{models.Quality480p, models.Quality720p, models.Quality1080p, models.Quality4K},
				HDSupport:       true,
				UltraHDSupport:  true,
				DownloadSupport: true,
				AdFree:          true,
				EarlyAccess:     true,
			},
			Limits: models.PlanLimits{
				MaxProfiles:          5,
				MaxConcurrentStreams: 4,
				MaxDownloads:         20,
			},
			StripePriceID: "price_premium_monthly",
			IsActive:      true,
			IsPopular:     false,
			SortOrder:     3,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		},
	}

	for _, plan := range plans {
		_, err := db.Collection("subscription_plans").InsertOne(context.Background(), plan)
		if err != nil {
			return fmt.Errorf("failed to insert subscription plan %s: %v", plan.Name, err)
		}
	}

	fmt.Println("💳 Created subscription plans")
	return nil
}

func seedUsers(db *mongo.Database) ([]primitive.ObjectID, error) {
	// Hash password for all users
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %v", err)
	}

	users := []models.User{
		{
			ID:              primitive.NewObjectID(),
			Email:           "admin@netflix-clone.com",
			Password:        string(hashedPassword),
			FirstName:       "Admin",
			LastName:        "User",
			Phone:           "+1234567890",
			IsActive:        true,
			IsEmailVerified: true,
			EmailVerifiedAt: &[]time.Time{time.Now()}[0],
			Role:            models.RoleAdmin,
			Preferences: models.UserPreferences{
				Language:         "en",
				AutoPlay:         true,
				AutoPlayPreviews: true,
				DataSaver:        false,
				PreferredGenres:  []string{"Action", "Drama", "Sci-Fi"},
				MaturityRating:   "R",
			},
			Profiles: []models.UserProfile{
				{
					ID:            primitive.NewObjectID(),
					Name:          "Admin",
					IsKidsProfile: false,
					Language:      "en",
					Watchlist:     []primitive.ObjectID{},
					WatchHistory:  []models.WatchHistoryItem{},
					Preferences: models.ProfilePreferences{
						MaturityRating:  "R",
						PreferredGenres: []string{"Action", "Drama"},
						AutoPlay:        true,
					},
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				},
			},
			LastLoginAt: &[]time.Time{time.Now().Add(-1 * time.Hour)}[0],
			CreatedAt:   time.Now().AddDate(0, -6, 0),
			UpdatedAt:   time.Now(),
		},
		{
			ID:              primitive.NewObjectID(),
			Email:           "john.doe@example.com",
			Password:        string(hashedPassword),
			FirstName:       "John",
			LastName:        "Doe",
			Phone:           "+1234567891",
			IsActive:        true,
			IsEmailVerified: true,
			EmailVerifiedAt: &[]time.Time{time.Now().AddDate(0, -3, 0)}[0],
			Role:            models.RoleUser,
			Preferences: models.UserPreferences{
				Language:         "en",
				AutoPlay:         true,
				AutoPlayPreviews: false,
				DataSaver:        false,
				PreferredGenres:  []string{"Action", "Comedy", "Thriller"},
				MaturityRating:   "PG-13",
			},
			Profiles: []models.UserProfile{
				{
					ID:            primitive.NewObjectID(),
					Name:          "John",
					IsKidsProfile: false,
					Language:      "en",
					Watchlist:     []primitive.ObjectID{},
					WatchHistory:  []models.WatchHistoryItem{},
					Preferences: models.ProfilePreferences{
						MaturityRating:  "PG-13",
						PreferredGenres: []string{"Action", "Comedy"},
						AutoPlay:        true,
					},
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				},
				{
					ID:            primitive.NewObjectID(),
					Name:          "Kids",
					IsKidsProfile: true,
					Language:      "en",
					Watchlist:     []primitive.ObjectID{},
					WatchHistory:  []models.WatchHistoryItem{},
					Preferences: models.ProfilePreferences{
						MaturityRating:  "G",
						PreferredGenres: []string{"Animation", "Family"},
						AutoPlay:        true,
					},
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				},
			},
			LastLoginAt: &[]time.Time{time.Now().Add(-2 * time.Hour)}[0],
			CreatedAt:   time.Now().AddDate(0, -3, 0),
			UpdatedAt:   time.Now(),
		},
		{
			ID:              primitive.NewObjectID(),
			Email:           "jane.smith@example.com",
			Password:        string(hashedPassword),
			FirstName:       "Jane",
			LastName:        "Smith",
			Phone:           "+1234567892",
			IsActive:        true,
			IsEmailVerified: true,
			EmailVerifiedAt: &[]time.Time{time.Now().AddDate(0, -2, 0)}[0],
			Role:            models.RoleUser,
			Preferences: models.UserPreferences{
				Language:         "en",
				AutoPlay:         false,
				AutoPlayPreviews: true,
				DataSaver:        true,
				PreferredGenres:  []string{"Drama", "Romance", "Documentary"},
				MaturityRating:   "PG-13",
			},
			Profiles: []models.UserProfile{
				{
					ID:            primitive.NewObjectID(),
					Name:          "Jane",
					IsKidsProfile: false,
					Language:      "en",
					Watchlist:     []primitive.ObjectID{},
					WatchHistory:  []models.WatchHistoryItem{},
					Preferences: models.ProfilePreferences{
						MaturityRating:  "PG-13",
						PreferredGenres: []string{"Drama", "Romance"},
						AutoPlay:        false,
					},
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				},
			},
			LastLoginAt: &[]time.Time{time.Now().Add(-30 * time.Minute)}[0],
			CreatedAt:   time.Now().AddDate(0, -2, 0),
			UpdatedAt:   time.Now(),
		},
		{
			ID:              primitive.NewObjectID(),
			Email:           "mike.johnson@example.com",
			Password:        string(hashedPassword),
			FirstName:       "Mike",
			LastName:        "Johnson",
			Phone:           "+1234567893",
			IsActive:        true,
			IsEmailVerified: true,
			EmailVerifiedAt: &[]time.Time{time.Now().AddDate(0, -1, 0)}[0],
			Role:            models.RoleUser,
			Preferences: models.UserPreferences{
				Language:         "en",
				AutoPlay:         true,
				AutoPlayPreviews: true,
				DataSaver:        false,
				PreferredGenres:  []string{"Horror", "Sci-Fi", "Fantasy"},
				MaturityRating:   "R",
			},
			Profiles: []models.UserProfile{
				{
					ID:            primitive.NewObjectID(),
					Name:          "Mike",
					IsKidsProfile: false,
					Language:      "en",
					Watchlist:     []primitive.ObjectID{},
					WatchHistory:  []models.WatchHistoryItem{},
					Preferences: models.ProfilePreferences{
						MaturityRating:  "R",
						PreferredGenres: []string{"Horror", "Sci-Fi"},
						AutoPlay:        true,
					},
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				},
			},
			LastLoginAt: &[]time.Time{time.Now().Add(-4 * time.Hour)}[0],
			CreatedAt:   time.Now().AddDate(0, -1, 0),
			UpdatedAt:   time.Now(),
		},
	}

	var userIDs []primitive.ObjectID
	for _, user := range users {
		userIDs = append(userIDs, user.ID)
		_, err := db.Collection("users").InsertOne(context.Background(), user)
		if err != nil {
			return nil, fmt.Errorf("failed to insert user %s: %v", user.Email, err)
		}
	}

	fmt.Println("👥 Created users")
	return userIDs, nil
}

func seedContent(db *mongo.Database) ([]primitive.ObjectID, error) {
	content := []models.Content{
		{
			ID:             primitive.NewObjectID(),
			TMDBID:         550,
			Title:          "Fight Club",
			OriginalTitle:  "Fight Club",
			Description:    "An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.",
			Type:           models.ContentTypeMovie,
			Genres:         []string{"Drama", "Thriller"},
			ReleaseDate:    time.Date(1999, 10, 15, 0, 0, 0, 0, time.UTC),
			Runtime:        139,
			Rating:         8.8,
			MaturityRating: "R",
			Country:        "US",
			Language:       "en",
			Cast: []models.CastMember{
				{Name: "Brad Pitt", Character: "Tyler Durden", Order: 0},
				{Name: "Edward Norton", Character: "The Narrator", Order: 1},
				{Name: "Helena Bonham Carter", Character: "Marla Singer", Order: 2},
			},
			Director: []string{"David Fincher"},
			Producer: []string{"Art Linson", "Ceán Chaffin"},
			Writer:   []string{"Chuck Palahniuk", "Jim Uhls"},
			Images: models.ContentImages{
				PosterPath:   "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
				BackdropPath: "https://image.tmdb.org/t/p/w500/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
			},
			Videos: []models.ContentVideo{
				{
					ID:       primitive.NewObjectID(),
					Title:    "Fight Club - Official Trailer",
					Type:     models.VideoTypeTrailer,
					Quality:  models.Quality1080p,
					Duration: 7200,
					FileURL:  "https://example.com/fight-club-trailer.mp4",
				},
				{
					ID:       primitive.NewObjectID(),
					Title:    "Fight Club - Full Movie",
					Type:     models.VideoTypeFull,
					Quality:  models.Quality1080p,
					Duration: 8340,
					FileURL:  "https://example.com/fight-club-full.mp4",
				},
			},
			Status:     models.ContentStatusPublished,
			IsFeatured: true,
			IsOriginal: false,
			ViewCount:  50420,
			LikeCount:  8932,
			Tags:       []string{"cult-classic", "psychological", "drama"},
			Keywords:   []string{"fight", "club", "identity", "consumerism"},
			CreatedAt:  time.Now().AddDate(0, -6, 0),
			UpdatedAt:  time.Now(),
		},
		{
			ID:             primitive.NewObjectID(),
			TMDBID:         238,
			Title:          "The Shawshank Redemption",
			OriginalTitle:  "The Shawshank Redemption",
			Description:    "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
			Type:           models.ContentTypeMovie,
			Genres:         []string{"Drama"},
			ReleaseDate:    time.Date(1994, 9, 23, 0, 0, 0, 0, time.UTC),
			Runtime:        142,
			Rating:         9.3,
			MaturityRating: "R",
			Country:        "US",
			Language:       "en",
			Cast: []models.CastMember{
				{Name: "Tim Robbins", Character: "Andy Dufresne", Order: 0},
				{Name: "Morgan Freeman", Character: "Ellis Boyd 'Red' Redding", Order: 1},
				{Name: "Bob Gunton", Character: "Warden Norton", Order: 2},
			},
			Director: []string{"Frank Darabont"},
			Producer: []string{"Niki Marvin"},
			Writer:   []string{"Stephen King", "Frank Darabont"},
			Images: models.ContentImages{
				PosterPath:   "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
				BackdropPath: "https://image.tmdb.org/t/p/w500/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg",
			},
			Videos: []models.ContentVideo{
				{
					ID:       primitive.NewObjectID(),
					Title:    "The Shawshank Redemption - Full Movie",
					Type:     models.VideoTypeFull,
					Quality:  models.Quality1080p,
					Duration: 8520,
					FileURL:  "https://example.com/shawshank-full.mp4",
				},
			},
			Status:     models.ContentStatusPublished,
			IsFeatured: true,
			IsOriginal: false,
			ViewCount:  78234,
			LikeCount:  15672,
			Tags:       []string{"classic", "drama", "prison"},
			Keywords:   []string{"prison", "friendship", "hope", "redemption"},
			CreatedAt:  time.Now().AddDate(0, -5, 0),
			UpdatedAt:  time.Now(),
		},
		{
			ID:             primitive.NewObjectID(),
			TMDBID:         1399,
			Title:          "Game of Thrones",
			OriginalTitle:  "Game of Thrones",
			Description:    "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.",
			Type:           models.ContentTypeTVShow,
			Genres:         []string{"Drama", "Fantasy", "Action"},
			ReleaseDate:    time.Date(2011, 4, 17, 0, 0, 0, 0, time.UTC),
			Runtime:        60,
			Rating:         9.2,
			MaturityRating: "TV-MA",
			Country:        "US",
			Language:       "en",
			Cast: []models.CastMember{
				{Name: "Emilia Clarke", Character: "Daenerys Targaryen", Order: 0},
				{Name: "Kit Harington", Character: "Jon Snow", Order: 1},
				{Name: "Peter Dinklage", Character: "Tyrion Lannister", Order: 2},
			},
			Director: []string{"David Benioff", "D.B. Weiss"},
			Producer: []string{"David Benioff", "D.B. Weiss", "Carolyn Strauss"},
			Writer:   []string{"George R.R. Martin", "David Benioff", "D.B. Weiss"},
			Images: models.ContentImages{
				PosterPath:   "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
				BackdropPath: "https://image.tmdb.org/t/p/w500/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
			},
			Seasons: []models.Season{
				{
					ID:           primitive.NewObjectID(),
					SeasonNumber: 1,
					Name:         "Season 1",
					Overview:     "Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon.",
					AirDate:      time.Date(2011, 4, 17, 0, 0, 0, 0, time.UTC),
					Episodes: []models.Episode{
						{
							ID:            primitive.NewObjectID(),
							EpisodeNumber: 1,
							Name:          "Winter Is Coming",
							Overview:      "Jon Arryn, the Hand of the King, is dead. King Robert Baratheon plans to ask his oldest friend, Eddard Stark, to take Jon's place.",
							AirDate:       time.Date(2011, 4, 17, 0, 0, 0, 0, time.UTC),
							Runtime:       62,
							Videos: []models.ContentVideo{
								{
									ID:       primitive.NewObjectID(),
									Title:    "Winter Is Coming - Full Episode",
									Type:     models.VideoTypeFull,
									Quality:  models.Quality1080p,
									Duration: 3720,
									FileURL:  "https://example.com/got-s1e1.mp4",
								},
							},
							CreatedAt: time.Now(),
						},
					},
					CreatedAt: time.Now(),
				},
			},
			Status:     models.ContentStatusPublished,
			IsFeatured: true,
			IsOriginal: false,
			ViewCount:  125678,
			LikeCount:  23456,
			Tags:       []string{"fantasy", "epic", "medieval"},
			Keywords:   []string{"dragons", "politics", "war", "fantasy", "medieval"},
			CreatedAt:  time.Now().AddDate(0, -4, 0),
			UpdatedAt:  time.Now(),
		},
		{
			ID:             primitive.NewObjectID(),
			Title:          "Stranger Things",
			OriginalTitle:  "Stranger Things",
			Description:    "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
			Type:           models.ContentTypeTVShow,
			Genres:         []string{"Sci-Fi", "Horror", "Drama"},
			ReleaseDate:    time.Date(2016, 7, 15, 0, 0, 0, 0, time.UTC),
			Runtime:        50,
			Rating:         8.7,
			MaturityRating: "TV-14",
			Country:        "US",
			Language:       "en",
			Cast: []models.CastMember{
				{Name: "Millie Bobby Brown", Character: "Eleven", Order: 0},
				{Name: "Finn Wolfhard", Character: "Mike Wheeler", Order: 1},
				{Name: "Winona Ryder", Character: "Joyce Byers", Order: 2},
			},
			Director: []string{"The Duffer Brothers"},
			Producer: []string{"Shawn Levy", "Dan Cohen"},
			Writer:   []string{"The Duffer Brothers"},
			Images: models.ContentImages{
				PosterPath:   "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
				BackdropPath: "https://image.tmdb.org/t/p/w500/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
			},
			Status:     models.ContentStatusPublished,
			IsFeatured: true,
			IsOriginal: true,
			ViewCount:  89456,
			LikeCount:  18234,
			Tags:       []string{"original", "supernatural", "80s"},
			Keywords:   []string{"supernatural", "mystery", "80s", "kids", "horror"},
			CreatedAt:  time.Now().AddDate(0, -3, 0),
			UpdatedAt:  time.Now(),
		},
		{
			ID:             primitive.NewObjectID(),
			Title:          "The Dark Knight",
			OriginalTitle:  "The Dark Knight",
			Description:    "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
			Type:           models.ContentTypeMovie,
			Genres:         []string{"Action", "Crime", "Drama"},
			ReleaseDate:    time.Date(2008, 7, 18, 0, 0, 0, 0, time.UTC),
			Runtime:        152,
			Rating:         9.0,
			MaturityRating: "PG-13",
			Country:        "US",
			Language:       "en",
			Cast: []models.CastMember{
				{Name: "Christian Bale", Character: "Bruce Wayne / Batman", Order: 0},
				{Name: "Heath Ledger", Character: "Joker", Order: 1},
				{Name: "Aaron Eckhart", Character: "Harvey Dent / Two-Face", Order: 2},
			},
			Director: []string{"Christopher Nolan"},
			Producer: []string{"Emma Thomas", "Charles Roven", "Christopher Nolan"},
			Writer:   []string{"Jonathan Nolan", "Christopher Nolan"},
			Images: models.ContentImages{
				PosterPath:   "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
				BackdropPath: "https://image.tmdb.org/t/p/w500/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg",
			},
			Videos: []models.ContentVideo{
				{
					ID:       primitive.NewObjectID(),
					Title:    "The Dark Knight - Full Movie",
					Type:     models.VideoTypeFull,
					Quality:  models.Quality1080p,
					Duration: 9120,
					FileURL:  "https://example.com/dark-knight-full.mp4",
				},
			},
			Status:     models.ContentStatusPublished,
			IsFeatured: false,
			IsOriginal: false,
			ViewCount:  67890,
			LikeCount:  12345,
			Tags:       []string{"superhero", "crime", "batman"},
			Keywords:   []string{"batman", "joker", "gotham", "superhero"},
			CreatedAt:  time.Now().AddDate(0, -2, 0),
			UpdatedAt:  time.Now(),
		},
	}

	var contentIDs []primitive.ObjectID
	for _, c := range content {
		contentIDs = append(contentIDs, c.ID)
		_, err := db.Collection("content").InsertOne(context.Background(), c)
		if err != nil {
			return nil, fmt.Errorf("failed to insert content %s: %v", c.Title, err)
		}
	}

	fmt.Println("🎬 Created content")
	return contentIDs, nil
}

func seedSubscriptions(db *mongo.Database, userIDs []primitive.ObjectID) error {
	// Get subscription plans
	var plans []models.SubscriptionPlan
	cursor, err := db.Collection("subscription_plans").Find(context.Background(), primitive.M{})
	if err != nil {
		return err
	}
	if err = cursor.All(context.Background(), &plans); err != nil {
		return err
	}

	// Create subscriptions for users (skip admin)
	subscriptions := []models.Subscription{
		{
			ID:                   primitive.NewObjectID(),
			UserID:               userIDs[1],  // John Doe
			PlanID:               plans[1].ID, // Standard plan
			StripeSubscriptionID: "sub_john_standard_123",
			StripeCustomerID:     "cus_john_123",
			Status:               models.SubscriptionStatusActive,
			CurrentPeriodStart:   time.Now().AddDate(0, -1, 0),
			CurrentPeriodEnd:     time.Now().AddDate(0, 0, 15),
			AutoRenew:            true,
			CreatedAt:            time.Now().AddDate(0, -1, 0),
			UpdatedAt:            time.Now(),
		},
		{
			ID:                   primitive.NewObjectID(),
			UserID:               userIDs[2],  // Jane Smith
			PlanID:               plans[0].ID, // Basic plan
			StripeSubscriptionID: "sub_jane_basic_456",
			StripeCustomerID:     "cus_jane_456",
			Status:               models.SubscriptionStatusActive,
			CurrentPeriodStart:   time.Now().AddDate(0, 0, -15),
			CurrentPeriodEnd:     time.Now().AddDate(0, 0, 15),
			AutoRenew:            true,
			CreatedAt:            time.Now().AddDate(0, 0, -15),
			UpdatedAt:            time.Now(),
		},
		{
			ID:                   primitive.NewObjectID(),
			UserID:               userIDs[3],  // Mike Johnson
			PlanID:               plans[2].ID, // Premium plan
			StripeSubscriptionID: "sub_mike_premium_789",
			StripeCustomerID:     "cus_mike_789",
			Status:               models.SubscriptionStatusTrialing,
			CurrentPeriodStart:   time.Now().AddDate(0, 0, -7),
			CurrentPeriodEnd:     time.Now().AddDate(0, 0, 23),
			TrialStart:           &[]time.Time{time.Now().AddDate(0, 0, -7)}[0],
			TrialEnd:             &[]time.Time{time.Now().AddDate(0, 0, 23)}[0],
			AutoRenew:            true,
			CreatedAt:            time.Now().AddDate(0, 0, -7),
			UpdatedAt:            time.Now(),
		},
	}

	for _, subscription := range subscriptions {
		_, err := db.Collection("subscriptions").InsertOne(context.Background(), subscription)
		if err != nil {
			return fmt.Errorf("failed to insert subscription: %v", err)
		}

		// Update user with subscription info
		userSubscription := models.UserSubscription{
			PlanID:               subscription.PlanID,
			StripeCustomerID:     subscription.StripeCustomerID,
			StripeSubscriptionID: subscription.StripeSubscriptionID,
			Status:               subscription.Status,
			CurrentPeriodStart:   subscription.CurrentPeriodStart,
			CurrentPeriodEnd:     subscription.CurrentPeriodEnd,
			CreatedAt:            subscription.CreatedAt,
			UpdatedAt:            subscription.UpdatedAt,
		}

		_, err = db.Collection("users").UpdateOne(
			context.Background(),
			primitive.M{"_id": subscription.UserID},
			primitive.M{"$set": primitive.M{"subscription": userSubscription}},
		)
		if err != nil {
			return fmt.Errorf("failed to update user subscription: %v", err)
		}
	}

	fmt.Println("💰 Created subscriptions")
	return nil
}

func seedPayments(db *mongo.Database, userIDs []primitive.ObjectID) error {
	// Get subscriptions
	var subscriptions []models.Subscription
	cursor, err := db.Collection("subscriptions").Find(context.Background(), primitive.M{})
	if err != nil {
		return err
	}
	if err = cursor.All(context.Background(), &subscriptions); err != nil {
		return err
	}

	payments := []models.Payment{
		{
			ID:                    primitive.NewObjectID(),
			UserID:                userIDs[1],
			SubscriptionID:        subscriptions[0].ID,
			StripePaymentIntentID: "pi_john_payment_123",
			Amount:                13.99,
			Currency:              "USD",
			Status:                models.PaymentStatusSucceeded,
			Description:           "Monthly subscription payment",
			ProcessedAt:           &[]time.Time{time.Now().AddDate(0, -1, 0)}[0],
			CreatedAt:             time.Now().AddDate(0, -1, 0),
			UpdatedAt:             time.Now().AddDate(0, -1, 0),
		},
		{
			ID:                    primitive.NewObjectID(),
			UserID:                userIDs[2],
			SubscriptionID:        subscriptions[1].ID,
			StripePaymentIntentID: "pi_jane_payment_456",
			Amount:                8.99,
			Currency:              "USD",
			Status:                models.PaymentStatusSucceeded,
			Description:           "Monthly subscription payment",
			ProcessedAt:           &[]time.Time{time.Now().AddDate(0, 0, -15)}[0],
			CreatedAt:             time.Now().AddDate(0, 0, -15),
			UpdatedAt:             time.Now().AddDate(0, 0, -15),
		},
	}

	for _, payment := range payments {
		_, err := db.Collection("payments").InsertOne(context.Background(), payment)
		if err != nil {
			return fmt.Errorf("failed to insert payment: %v", err)
		}
	}

	fmt.Println("💳 Created payments")
	return nil
}

func seedWatchHistory(db *mongo.Database, userIDs []primitive.ObjectID, contentIDs []primitive.ObjectID) error {
	// Add watch history to user profiles
	watchHistoryItems := []models.WatchHistoryItem{
		{
			ContentID:     contentIDs[0], // Fight Club
			Progress:      75.5,
			Duration:      8340,
			WatchedAt:     time.Now().AddDate(0, 0, -2),
			LastWatchedAt: time.Now().AddDate(0, 0, -2),
		},
		{
			ContentID:     contentIDs[1], // Shawshank Redemption
			Progress:      100.0,
			Duration:      8520,
			WatchedAt:     time.Now().AddDate(0, 0, -5),
			LastWatchedAt: time.Now().AddDate(0, 0, -3),
		},
	}

	// Update John Doe's first profile with watch history
	_, err := db.Collection("users").UpdateOne(
		context.Background(),
		primitive.M{
			"_id":        userIDs[1],
			"profiles.0": primitive.M{"$exists": true},
		},
		primitive.M{
			"$set": primitive.M{
				"profiles.0.watch_history": watchHistoryItems,
				"profiles.0.watchlist":     []primitive.ObjectID{contentIDs[2], contentIDs[3], contentIDs[4]},
			},
		},
	)

	if err != nil {
		return fmt.Errorf("failed to update watch history: %v", err)
	}

	fmt.Println("📺 Created watch history")
	return nil
}

func seedVideoMetrics(db *mongo.Database, userIDs []primitive.ObjectID, contentIDs []primitive.ObjectID) error {
	metrics := []interface{}{
		primitive.M{
			"content_id":     contentIDs[0].Hex(),
			"user_id":        userIDs[1].Hex(),
			"quality":        "1080p",
			"watch_duration": 6300, // seconds
			"total_duration": 8340,
			"buffer_events":  2,
			"bitrate_kbps":   6000,
			"cdn_node":       "us-east-1",
			"client_ip":      "192.168.1.100",
			"user_agent":     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			"timestamp":      time.Now().AddDate(0, 0, -2),
		},
		primitive.M{
			"content_id":     contentIDs[1].Hex(),
			"user_id":        userIDs[1].Hex(),
			"quality":        "720p",
			"watch_duration": 8520,
			"total_duration": 8520,
			"buffer_events":  0,
			"bitrate_kbps":   3000,
			"cdn_node":       "us-east-1",
			"client_ip":      "192.168.1.100",
			"user_agent":     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			"timestamp":      time.Now().AddDate(0, 0, -5),
		},
	}

	_, err := db.Collection("video_metrics").InsertMany(context.Background(), metrics)
	if err != nil {
		return fmt.Errorf("failed to insert video metrics: %v", err)
	}

	fmt.Println("📊 Created video metrics")
	return nil
}
