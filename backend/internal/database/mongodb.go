package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
	Config   *MongoConfig
}

type MongoConfig struct {
	URI                    string
	Database               string
	MaxPoolSize            uint64
	MinPoolSize            uint64
	MaxConnIdleTime        time.Duration
	ConnectionTimeout      time.Duration
	ServerSelectionTimeout time.Duration
	SocketTimeout          time.Duration
}

// Connect establishes connection to MongoDB
func Connect(uri string) (*mongo.Database, error) {
	config := &MongoConfig{
		URI:                    uri,
		Database:               "netflix_clone",
		MaxPoolSize:            100,
		MinPoolSize:            5,
		MaxConnIdleTime:        30 * time.Minute,
		ConnectionTimeout:      10 * time.Second,
		ServerSelectionTimeout: 5 * time.Second,
		SocketTimeout:          30 * time.Second,
	}

	return ConnectWithConfig(config)
}

// ConnectWithConfig establishes connection with custom configuration
func ConnectWithConfig(config *MongoConfig) (*mongo.Database, error) {
	// Set client options
	clientOptions := options.Client().ApplyURI(config.URI)

	// Connection pool settings
	clientOptions.SetMaxPoolSize(config.MaxPoolSize)
	clientOptions.SetMinPoolSize(config.MinPoolSize)
	clientOptions.SetMaxConnIdleTime(config.MaxConnIdleTime)

	// Timeout settings
	clientOptions.SetConnectTimeout(config.ConnectionTimeout)
	clientOptions.SetServerSelectionTimeout(config.ServerSelectionTimeout)
	clientOptions.SetSocketTimeout(config.SocketTimeout)

	// Retry settings
	clientOptions.SetRetryWrites(true)
	clientOptions.SetRetryReads(true)

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), config.ConnectionTimeout)
	defer cancel()

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	// Test the connection
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	database := client.Database(config.Database)

	// Create indexes
	if err := createIndexes(database); err != nil {
		fmt.Printf("Warning: Failed to create some indexes: %v\n", err)
	}

	fmt.Printf("Successfully connected to MongoDB database: %s\n", config.Database)

	return database, nil
}

// createIndexes creates necessary database indexes for optimal performance
func createIndexes(db *mongo.Database) error {
	ctx := context.Background()

	// Users collection indexes
	userIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "is_active", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "role", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "subscription.stripe_customer_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "subscription.status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "profiles._id", Value: 1}},
		},
	}

	_, err := db.Collection("users").Indexes().CreateMany(ctx, userIndexes)
	if err != nil {
		return fmt.Errorf("failed to create users indexes: %v", err)
	}

	// Content collection indexes
	contentIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "type", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "genres", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "tmdb_id", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "release_date", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "rating", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "view_count", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "is_featured", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "is_original", Value: 1}},
		},
		{
			Keys: bson.D{
				{Key: "title", Value: "text"},
				{Key: "description", Value: "text"},
				{Key: "cast.name", Value: "text"},
				{Key: "director", Value: "text"},
				{Key: "keywords", Value: "text"},
			},
			Options: options.Index().SetName("content_text_search"),
		},
	}

	_, err = db.Collection("content").Indexes().CreateMany(ctx, contentIndexes)
	if err != nil {
		return fmt.Errorf("failed to create content indexes: %v", err)
	}

	// Subscriptions collection indexes
	subscriptionIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "stripe_subscription_id", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true),
		},
		{
			Keys: bson.D{{Key: "stripe_customer_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "plan_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "current_period_end", Value: 1}},
		},
	}

	_, err = db.Collection("subscriptions").Indexes().CreateMany(ctx, subscriptionIndexes)
	if err != nil {
		return fmt.Errorf("failed to create subscriptions indexes: %v", err)
	}

	// Subscription plans collection indexes
	planIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "is_active", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "sort_order", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "stripe_price_id", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
	}

	_, err = db.Collection("subscription_plans").Indexes().CreateMany(ctx, planIndexes)
	if err != nil {
		return fmt.Errorf("failed to create subscription_plans indexes: %v", err)
	}

	// Payments collection indexes
	paymentIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "subscription_id", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "stripe_payment_intent_id", Value: 1}},
			Options: options.Index().SetSparse(true),
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "processed_at", Value: -1}},
		},
	}

	_, err = db.Collection("payments").Indexes().CreateMany(ctx, paymentIndexes)
	if err != nil {
		return fmt.Errorf("failed to create payments indexes: %v", err)
	}

	// Invoices collection indexes
	invoiceIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "subscription_id", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "stripe_invoice_id", Value: 1}},
			Options: options.Index().SetUnique(true).SetSparse(true),
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "created_at", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "due_date", Value: 1}},
		},
	}

	_, err = db.Collection("invoices").Indexes().CreateMany(ctx, invoiceIndexes)
	if err != nil {
		return fmt.Errorf("failed to create invoices indexes: %v", err)
	}

	// Login attempts collection indexes (for security)
	loginIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "email", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "ip", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "timestamp", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "success", Value: 1}},
		},
		{
			Keys:    bson.D{{Key: "timestamp", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(24 * 60 * 60), // 24 hours TTL
		},
	}

	_, err = db.Collection("login_attempts").Indexes().CreateMany(ctx, loginIndexes)
	if err != nil {
		return fmt.Errorf("failed to create login_attempts indexes: %v", err)
	}

	// Video metrics collection indexes
	metricsIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "content_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "timestamp", Value: -1}},
		},
		{
			Keys:    bson.D{{Key: "timestamp", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(90 * 24 * 60 * 60), // 90 days TTL
		},
	}

	_, err = db.Collection("video_metrics").Indexes().CreateMany(ctx, metricsIndexes)
	if err != nil {
		return fmt.Errorf("failed to create video_metrics indexes: %v", err)
	}

	// Subscription usage collection indexes
	usageIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "user_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "subscription_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "period.start", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "period.end", Value: 1}},
		},
	}

	_, err = db.Collection("subscription_usage").Indexes().CreateMany(ctx, usageIndexes)
	if err != nil {
		return fmt.Errorf("failed to create subscription_usage indexes: %v", err)
	}

	fmt.Println("Successfully created database indexes")
	return nil
}

// Migration functions for database updates
func RunMigrations(db *mongo.Database) error {
	ctx := context.Background()

	// Example migration: Add default preferences to users without them
	_, err := db.Collection("users").UpdateMany(
		ctx,
		bson.M{"preferences": bson.M{"$exists": false}},
		bson.M{"$set": bson.M{
			"preferences": bson.M{
				"language":           "en",
				"auto_play":          true,
				"auto_play_previews": true,
				"data_saver":         false,
				"maturity_rating":    "PG-13",
			},
		}},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate user preferences: %v", err)
	}

	// Add default profiles to users without them
	cursor, err := db.Collection("users").Find(ctx, bson.M{
		"profiles": bson.M{"$exists": false},
	})
	if err != nil {
		return fmt.Errorf("failed to find users without profiles: %v", err)
	}

	for cursor.Next(ctx) {
		var user bson.M
		if err := cursor.Decode(&user); err != nil {
			continue
		}

		userID := user["_id"]
		firstName, _ := user["first_name"].(string)
		if firstName == "" {
			firstName = "Profile 1"
		}

		defaultProfile := bson.M{
			"_id":             bson.M{"$oid": fmt.Sprintf("%x", time.Now().UnixNano())},
			"name":            firstName,
			"is_kids_profile": false,
			"language":        "en",
			"watchlist":       bson.A{},
			"watch_history":   bson.A{},
			"preferences": bson.M{
				"maturity_rating": "PG-13",
				"auto_play":       true,
			},
			"created_at": time.Now(),
			"updated_at": time.Now(),
		}

		_, err = db.Collection("users").UpdateOne(
			ctx,
			bson.M{"_id": userID},
			bson.M{"$set": bson.M{"profiles": bson.A{defaultProfile}}},
		)
		if err != nil {
			fmt.Printf("Failed to add default profile for user %v: %v\n", userID, err)
		}
	}

	fmt.Println("Successfully ran database migrations")
	return nil
}

// Health check function
func HealthCheck(db *mongo.Database) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Test connection
	err := db.Client().Ping(ctx, nil)
	if err != nil {
		return fmt.Errorf("database ping failed: %v", err)
	}

	// Test read operation
	_, err = db.Collection("users").CountDocuments(ctx, bson.M{})
	if err != nil {
		return fmt.Errorf("database read test failed: %v", err)
	}

	return nil
}

// Statistics function
func GetDatabaseStats(db *mongo.Database) (map[string]interface{}, error) {
	ctx := context.Background()

	stats := make(map[string]interface{})

	// Get database stats
	var dbStats bson.M
	err := db.RunCommand(ctx, bson.M{"dbStats": 1}).Decode(&dbStats)
	if err == nil {
		stats["database"] = dbStats
	}

	// Get collection counts
	collections := []string{"users", "content", "subscriptions", "payments", "invoices"}
	collectionStats := make(map[string]int64)

	for _, collection := range collections {
		count, err := db.Collection(collection).CountDocuments(ctx, bson.M{})
		if err == nil {
			collectionStats[collection] = count
		}
	}

	stats["collections"] = collectionStats

	// Get server status
	var serverStatus bson.M
	err = db.RunCommand(ctx, bson.M{"serverStatus": 1}).Decode(&serverStatus)
	if err == nil {
		// Extract relevant server information
		if connections, ok := serverStatus["connections"].(bson.M); ok {
			stats["connections"] = connections
		}
		if memory, ok := serverStatus["mem"].(bson.M); ok {
			stats["memory"] = memory
		}
	}

	return stats, nil
}

// Cleanup function for old data
func CleanupOldData(db *mongo.Database) error {
	ctx := context.Background()

	// Clean up old login attempts (older than 7 days)
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	_, err := db.Collection("login_attempts").DeleteMany(
		ctx,
		bson.M{"timestamp": bson.M{"$lt": sevenDaysAgo}},
	)
	if err != nil {
		return fmt.Errorf("failed to cleanup old login attempts: %v", err)
	}

	// Clean up old video metrics (older than 90 days)
	ninetyDaysAgo := time.Now().AddDate(0, 0, -90)
	_, err = db.Collection("video_metrics").DeleteMany(
		ctx,
		bson.M{"timestamp": bson.M{"$lt": ninetyDaysAgo}},
	)
	if err != nil {
		return fmt.Errorf("failed to cleanup old video metrics: %v", err)
	}

	// Archive old completed subscriptions (older than 2 years)
	twoYearsAgo := time.Now().AddDate(-2, 0, 0)
	_, err = db.Collection("subscriptions").UpdateMany(
		ctx,
		bson.M{
			"status":     bson.M{"$in": []string{"cancelled", "incomplete_expired"}},
			"created_at": bson.M{"$lt": twoYearsAgo},
		},
		bson.M{"$set": bson.M{"archived": true}},
	)
	if err != nil {
		return fmt.Errorf("failed to archive old subscriptions: %v", err)
	}

	fmt.Println("Successfully cleaned up old data")
	return nil
}

// Backup utilities
func CreateBackup(db *mongo.Database, backupPath string) error {
	// This would integrate with mongodump or similar tools
	// For now, return a placeholder
	return fmt.Errorf("backup functionality requires mongodump integration")
}

// Connection utilities
func Disconnect(client *mongo.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := client.Disconnect(ctx)
	if err != nil {
		return fmt.Errorf("failed to disconnect from MongoDB: %v", err)
	}

	fmt.Println("Successfully disconnected from MongoDB")
	return nil
}

// Transaction helper
func WithTransaction(db *mongo.Database, fn func(ctx mongo.SessionContext) error) error {
	session, err := db.Client().StartSession()
	if err != nil {
		return fmt.Errorf("failed to start session: %v", err)
	}
	defer session.EndSession(context.Background())

	_, err = session.WithTransaction(context.Background(), func(sc mongo.SessionContext) (interface{}, error) {
		return nil, fn(sc)
	})
	return err
}

// Aggregation helper
func AggregateWithTimeout(collection *mongo.Collection, pipeline interface{}, timeout time.Duration) (*mongo.Cursor, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	return collection.Aggregate(ctx, pipeline)
}
