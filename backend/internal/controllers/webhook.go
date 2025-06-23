// backend/internal/controllers/webhook.go
package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"onflix/internal/models"
	"onflix/internal/services"
	"onflix/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v75/webhook"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type WebhookController struct {
	services *services.Services
}

func NewWebhookController(services *services.Services) *WebhookController {
	return &WebhookController{
		services: services,
	}
}

// Stripe Webhook Handler
func (wc *WebhookController) StripeWebhook(c *gin.Context) {
	payload, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// Verify webhook signature
	event, err := webhook.ConstructEvent(payload, c.GetHeader("Stripe-Signature"), wc.services.Config.Stripe.WebhookSecret)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		return
	}

	// Handle the event
	switch event.Type {
	case "customer.subscription.created":
		wc.handleSubscriptionCreated(event.Data.Object)
	case "customer.subscription.updated":
		wc.handleSubscriptionUpdated(event.Data.Object)
	case "customer.subscription.deleted":
		wc.handleSubscriptionDeleted(event.Data.Object)
	case "invoice.payment_succeeded":
		wc.handleInvoicePaymentSucceeded(event.Data.Object)
	case "invoice.payment_failed":
		wc.handleInvoicePaymentFailed(event.Data.Object)
	case "payment_intent.succeeded":
		wc.handlePaymentIntentSucceeded(event.Data.Object)
	case "payment_intent.payment_failed":
		wc.handlePaymentIntentFailed(event.Data.Object)
	case "setup_intent.succeeded":
		wc.handleSetupIntentSucceeded(event.Data.Object)
	case "customer.created":
		wc.handleCustomerCreated(event.Data.Object)
	case "customer.updated":
		wc.handleCustomerUpdated(event.Data.Object)
	case "payment_method.attached":
		wc.handlePaymentMethodAttached(event.Data.Object)
	case "payment_method.detached":
		wc.handlePaymentMethodDetached(event.Data.Object)
	default:
		fmt.Printf("Unhandled Stripe event type: %s\n", event.Type)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (wc *WebhookController) handleSubscriptionCreated(data interface{}) {
	subscription := data.(map[string]interface{})
	customerID := subscription["customer"].(string)
	subscriptionID := subscription["id"].(string)

	// Find user by Stripe customer ID
	var user models.User
	err := wc.services.DB.Collection("users").FindOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customerID},
	).Decode(&user)

	if err != nil {
		fmt.Printf("Error finding user for subscription created: %v\n", err)
		return
	}

	// Update subscription status
	now := time.Now()
	_, err = wc.services.DB.Collection("subscriptions").UpdateOne(
		context.Background(),
		bson.M{"stripe_subscription_id": subscriptionID},
		bson.M{
			"$set": bson.M{
				"status":     subscription["status"],
				"updated_at": now,
			},
		},
	)

	if err != nil {
		fmt.Printf("Error updating subscription: %v\n", err)
	}

	// Send welcome email
	go wc.services.EmailService.SendWelcomeEmail(user.Email, user.FirstName)
}

func (wc *WebhookController) handleSubscriptionUpdated(data interface{}) {
	subscription := data.(map[string]interface{})
	subscriptionID := subscription["id"].(string)
	customerID := subscription["customer"].(string)

	// Update subscription in database
	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"status":               subscription["status"],
			"current_period_start": time.Unix(int64(subscription["current_period_start"].(float64)), 0),
			"current_period_end":   time.Unix(int64(subscription["current_period_end"].(float64)), 0),
			"updated_at":           now,
		},
	}

	// Handle cancellation
	if cancelAt, exists := subscription["cancel_at"]; exists && cancelAt != nil {
		update["$set"].(bson.M)["cancel_at"] = time.Unix(int64(cancelAt.(float64)), 0)
	}

	if cancelledAt, exists := subscription["canceled_at"]; exists && cancelledAt != nil {
		update["$set"].(bson.M)["cancelled_at"] = time.Unix(int64(cancelledAt.(float64)), 0)
	}

	// Update subscription record
	_, err := wc.services.DB.Collection("subscriptions").UpdateOne(
		context.Background(),
		bson.M{"stripe_subscription_id": subscriptionID},
		update,
	)

	if err != nil {
		fmt.Printf("Error updating subscription: %v\n", err)
		return
	}

	// Update user subscription
	userUpdate := bson.M{
		"$set": bson.M{
			"subscription.status":               subscription["status"],
			"subscription.current_period_start": time.Unix(int64(subscription["current_period_start"].(float64)), 0),
			"subscription.current_period_end":   time.Unix(int64(subscription["current_period_end"].(float64)), 0),
			"subscription.updated_at":           now,
			"updated_at":                        now,
		},
	}

	if cancelAt, exists := subscription["cancel_at"]; exists && cancelAt != nil {
		userUpdate["$set"].(bson.M)["subscription.cancel_at"] = time.Unix(int64(cancelAt.(float64)), 0)
	}

	if cancelledAt, exists := subscription["canceled_at"]; exists && cancelledAt != nil {
		userUpdate["$set"].(bson.M)["subscription.cancelled_at"] = time.Unix(int64(cancelledAt.(float64)), 0)
	}

	_, err = wc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customerID},
		userUpdate,
	)

	if err != nil {
		fmt.Printf("Error updating user subscription: %v\n", err)
	}
}

func (wc *WebhookController) handleSubscriptionDeleted(data interface{}) {
	subscription := data.(map[string]interface{})
	subscriptionID := subscription["id"].(string)
	customerID := subscription["customer"].(string)

	now := time.Now()

	// Update subscription status to cancelled
	_, err := wc.services.DB.Collection("subscriptions").UpdateOne(
		context.Background(),
		bson.M{"stripe_subscription_id": subscriptionID},
		bson.M{
			"$set": bson.M{
				"status":       models.SubscriptionStatusCancelled,
				"cancelled_at": now,
				"updated_at":   now,
			},
		},
	)

	if err != nil {
		fmt.Printf("Error updating subscription: %v\n", err)
	}

	// Update user subscription
	_, err = wc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customerID},
		bson.M{
			"$set": bson.M{
				"subscription.status":       models.SubscriptionStatusCancelled,
				"subscription.cancelled_at": now,
				"subscription.updated_at":   now,
				"updated_at":                now,
			},
		},
	)

	if err != nil {
		fmt.Printf("Error updating user subscription: %v\n", err)
		return
	}

	// Find user and send cancellation email
	var user models.User
	err = wc.services.DB.Collection("users").FindOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customerID},
	).Decode(&user)

	if err == nil {
		go wc.services.EmailService.SendSubscriptionCancelledEmail(user.Email, user.FirstName)
	}
}

func (wc *WebhookController) handleInvoicePaymentSucceeded(data interface{}) {
	invoice := data.(map[string]interface{})
	customerID := invoice["customer"].(string)
	subscriptionID := invoice["subscription"].(string)

	// Find user
	var user models.User
	err := wc.services.DB.Collection("users").FindOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customerID},
	).Decode(&user)

	if err != nil {
		fmt.Printf("Error finding user for invoice payment: %v\n", err)
		return
	}

	// Find subscription
	var subscription models.Subscription
	err = wc.services.DB.Collection("subscriptions").FindOne(
		context.Background(),
		bson.M{"stripe_subscription_id": subscriptionID},
	).Decode(&subscription)

	if err != nil {
		fmt.Printf("Error finding subscription for invoice payment: %v\n", err)
		return
	}

	// Create payment record
	payment := models.Payment{
		ID:                    primitive.NewObjectID(),
		UserID:                user.ID,
		SubscriptionID:        subscription.ID,
		StripePaymentIntentID: invoice["payment_intent"].(string),
		Amount:                invoice["amount_paid"].(float64) / 100, // Convert from cents
		Currency:              invoice["currency"].(string),
		Status:                models.PaymentStatusSucceeded,
		Description:           fmt.Sprintf("Subscription payment for %s", subscription.ID.Hex()),
		ProcessedAt:           &[]time.Time{time.Now()}[0],
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
	}

	_, err = wc.services.DB.Collection("payments").InsertOne(context.Background(), payment)
	if err != nil {
		fmt.Printf("Error creating payment record: %v\n", err)
	}

	// Create invoice record
	invoiceRecord := models.Invoice{
		ID:              primitive.NewObjectID(),
		UserID:          user.ID,
		SubscriptionID:  subscription.ID,
		StripeInvoiceID: invoice["id"].(string),
		InvoiceNumber:   invoice["number"].(string),
		Amount:          invoice["amount_due"].(float64) / 100,
		Total:           invoice["total"].(float64) / 100,
		Currency:        invoice["currency"].(string),
		Status:          models.InvoiceStatus(invoice["status"].(string)),
		PaidAt:          &[]time.Time{time.Unix(int64(invoice["status_transitions"].(map[string]interface{})["paid_at"].(float64)), 0)}[0],
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if dueDate, exists := invoice["due_date"]; exists && dueDate != nil {
		invoiceRecord.DueDate = time.Unix(int64(dueDate.(float64)), 0)
	}

	_, err = wc.services.DB.Collection("invoices").InsertOne(context.Background(), invoiceRecord)
	if err != nil {
		fmt.Printf("Error creating invoice record: %v\n", err)
	}

	// Send payment confirmation email
	go wc.services.EmailService.SendPaymentConfirmationEmail(user.Email, user.FirstName, payment.Amount, payment.Currency)
}

func (wc *WebhookController) handleInvoicePaymentFailed(data interface{}) {
	invoice := data.(map[string]interface{})
	customerID := invoice["customer"].(string)
	subscriptionID := invoice["subscription"].(string)

	// Find user
	var user models.User
	err := wc.services.DB.Collection("users").FindOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customerID},
	).Decode(&user)

	if err != nil {
		fmt.Printf("Error finding user for failed payment: %v\n", err)
		return
	}

	// Find subscription
	var subscription models.Subscription
	err = wc.services.DB.Collection("subscriptions").FindOne(
		context.Background(),
		bson.M{"stripe_subscription_id": subscriptionID},
	).Decode(&subscription)

	if err != nil {
		fmt.Printf("Error finding subscription for failed payment: %v\n", err)
		return
	}

	// Create failed payment record
	payment := models.Payment{
		ID:             primitive.NewObjectID(),
		UserID:         user.ID,
		SubscriptionID: subscription.ID,
		Amount:         invoice["amount_due"].(float64) / 100,
		Currency:       invoice["currency"].(string),
		Status:         models.PaymentStatusFailed,
		Description:    fmt.Sprintf("Failed subscription payment for %s", subscription.ID.Hex()),
		FailureReason:  "Payment failed",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	_, err = wc.services.DB.Collection("payments").InsertOne(context.Background(), payment)
	if err != nil {
		fmt.Printf("Error creating failed payment record: %v\n", err)
	}

	// Update subscription status if needed
	now := time.Now()
	_, err = wc.services.DB.Collection("subscriptions").UpdateOne(
		context.Background(),
		bson.M{"stripe_subscription_id": subscriptionID},
		bson.M{
			"$set": bson.M{
				"status":     models.SubscriptionStatusPastDue,
				"updated_at": now,
			},
		},
	)

	if err != nil {
		fmt.Printf("Error updating subscription status: %v\n", err)
	}

	// Send payment failed notification
	go wc.services.EmailService.SendPaymentFailedEmail(user.Email, user.FirstName, payment.Amount, payment.Currency)
}

func (wc *WebhookController) handlePaymentIntentSucceeded(data interface{}) {
	paymentIntent := data.(map[string]interface{})
	customerID := paymentIntent["customer"].(string)

	// Find user
	var user models.User
	err := wc.services.DB.Collection("users").FindOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customerID},
	).Decode(&user)

	if err != nil {
		fmt.Printf("Error finding user for payment intent: %v\n", err)
		return
	}

	// Update payment record if exists
	_, err = wc.services.DB.Collection("payments").UpdateOne(
		context.Background(),
		bson.M{"stripe_payment_intent_id": paymentIntent["id"].(string)},
		bson.M{
			"$set": bson.M{
				"status":       models.PaymentStatusSucceeded,
				"processed_at": time.Now(),
				"updated_at":   time.Now(),
			},
		},
	)

	if err != nil && err != mongo.ErrNoDocuments {
		fmt.Printf("Error updating payment record: %v\n", err)
	}
}

func (wc *WebhookController) handlePaymentIntentFailed(data interface{}) {
	paymentIntent := data.(map[string]interface{})

	// Update payment record
	failureReason := "Payment failed"
	if lastPaymentError, exists := paymentIntent["last_payment_error"]; exists && lastPaymentError != nil {
		if errorMap, ok := lastPaymentError.(map[string]interface{}); ok {
			if message, exists := errorMap["message"]; exists {
				failureReason = message.(string)
			}
		}
	}

	_, err := wc.services.DB.Collection("payments").UpdateOne(
		context.Background(),
		bson.M{"stripe_payment_intent_id": paymentIntent["id"].(string)},
		bson.M{
			"$set": bson.M{
				"status":         models.PaymentStatusFailed,
				"failure_reason": failureReason,
				"updated_at":     time.Now(),
			},
		},
	)

	if err != nil && err != mongo.ErrNoDocuments {
		fmt.Printf("Error updating failed payment record: %v\n", err)
	}
}

func (wc *WebhookController) handleSetupIntentSucceeded(data interface{}) {
	setupIntent := data.(map[string]interface{})
	customerID := setupIntent["customer"].(string)

	// Find user
	var user models.User
	err := wc.services.DB.Collection("users").FindOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customerID},
	).Decode(&user)

	if err != nil {
		fmt.Printf("Error finding user for setup intent: %v\n", err)
		return
	}

	// Send confirmation that payment method was added
	go wc.services.EmailService.SendPaymentMethodAddedEmail(user.Email, user.FirstName)
}

func (wc *WebhookController) handleCustomerCreated(data interface{}) {
	customer := data.(map[string]interface{})
	// Log customer creation or perform any necessary actions
	fmt.Printf("New Stripe customer created: %s\n", customer["id"].(string))
}

func (wc *WebhookController) handleCustomerUpdated(data interface{}) {
	customer := data.(map[string]interface{})
	customerID := customer["id"].(string)

	// Update user information if customer details changed
	update := bson.M{}
	if email, exists := customer["email"]; exists && email != nil {
		update["email"] = email.(string)
	}

	if name, exists := customer["name"]; exists && name != nil {
		// Split name into first and last name
		// This is a simple implementation
		update["updated_at"] = time.Now()
	}

	if len(update) > 0 {
		_, err := wc.services.DB.Collection("users").UpdateOne(
			context.Background(),
			bson.M{"subscription.stripe_customer_id": customerID},
			bson.M{"$set": update},
		)

		if err != nil {
			fmt.Printf("Error updating user from customer update: %v\n", err)
		}
	}
}

func (wc *WebhookController) handlePaymentMethodAttached(data interface{}) {
	paymentMethod := data.(map[string]interface{})
	customerID := paymentMethod["customer"].(string)

	// Find user
	var user models.User
	err := wc.services.DB.Collection("users").FindOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customerID},
	).Decode(&user)

	if err != nil {
		fmt.Printf("Error finding user for payment method attachment: %v\n", err)
		return
	}

	// Log payment method attachment
	fmt.Printf("Payment method attached for user: %s\n", user.Email)
}

func (wc *WebhookController) handlePaymentMethodDetached(data interface{}) {
	paymentMethod := data.(map[string]interface{})

	// Log payment method detachment
	fmt.Printf("Payment method detached: %s\n", paymentMethod["id"].(string))
}

// TMDB Webhook Handler (if TMDB supports webhooks in the future)
func (wc *WebhookController) TMDBWebhook(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.BadRequestResponse(c, "Invalid JSON payload")
		return
	}

	// Handle TMDB webhook events
	eventType, exists := payload["event_type"]
	if !exists {
		utils.BadRequestResponse(c, "Missing event_type")
		return
	}

	switch eventType {
	case "content_updated":
		wc.handleTMDBContentUpdated(payload)
	case "content_deleted":
		wc.handleTMDBContentDeleted(payload)
	default:
		fmt.Printf("Unhandled TMDB event type: %s\n", eventType)
	}

	utils.SuccessResponse(c, http.StatusOK, "TMDB webhook processed successfully", nil)
}

func (wc *WebhookController) handleTMDBContentUpdated(payload map[string]interface{}) {
	// Update content from TMDB
	if tmdbID, exists := payload["tmdb_id"]; exists {
		// Find content by TMDB ID and update metadata
		_, err := wc.services.DB.Collection("content").UpdateOne(
			context.Background(),
			bson.M{"tmdb_id": tmdbID},
			bson.M{"$set": bson.M{"updated_at": time.Now()}},
		)

		if err != nil {
			fmt.Printf("Error updating content from TMDB webhook: %v\n", err)
		}
	}
}

func (wc *WebhookController) handleTMDBContentDeleted(payload map[string]interface{}) {
	// Handle content deletion from TMDB
	if tmdbID, exists := payload["tmdb_id"]; exists {
		// Mark content as archived
		_, err := wc.services.DB.Collection("content").UpdateOne(
			context.Background(),
			bson.M{"tmdb_id": tmdbID},
			bson.M{"$set": bson.M{
				"status":     models.ContentStatusArchived,
				"updated_at": time.Now(),
			}},
		)

		if err != nil {
			fmt.Printf("Error archiving content from TMDB webhook: %v\n", err)
		}
	}
}

// Generic Payment Provider Webhook Handler
func (wc *WebhookController) PaymentWebhook(c *gin.Context) {
	provider := c.Param("provider")

	switch provider {
	case "stripe":
		wc.StripeWebhook(c)
	case "paypal":
		wc.handlePayPalWebhook(c)
	case "apple":
		wc.handleAppleWebhook(c)
	case "google":
		wc.handleGoogleWebhook(c)
	default:
		utils.BadRequestResponse(c, "Unsupported payment provider")
	}
}

func (wc *WebhookController) handlePayPalWebhook(c *gin.Context) {
	// Handle PayPal webhook events
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.BadRequestResponse(c, "Invalid JSON payload")
		return
	}

	// Verify PayPal webhook signature
	// Implementation would depend on PayPal's webhook verification

	utils.SuccessResponse(c, http.StatusOK, "PayPal webhook processed", nil)
}

func (wc *WebhookController) handleAppleWebhook(c *gin.Context) {
	// Handle Apple In-App Purchase webhook events
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.BadRequestResponse(c, "Invalid JSON payload")
		return
	}

	// Verify Apple webhook signature
	// Implementation would depend on Apple's webhook verification

	utils.SuccessResponse(c, http.StatusOK, "Apple webhook processed", nil)
}

func (wc *WebhookController) handleGoogleWebhook(c *gin.Context) {
	// Handle Google Play webhook events
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		utils.BadRequestResponse(c, "Invalid JSON payload")
		return
	}

	// Verify Google webhook signature
	// Implementation would depend on Google's webhook verification

	utils.SuccessResponse(c, http.StatusOK, "Google webhook processed", nil)
}

// Webhook Security and Logging
func (wc *WebhookController) logWebhookEvent(provider, eventType string, payload interface{}) {
	// Log webhook event for monitoring and debugging
	logEntry := map[string]interface{}{
		"provider":   provider,
		"event_type": eventType,
		"timestamp":  time.Now(),
		"payload":    payload,
	}

	// Convert to JSON for logging
	logJSON, _ := json.Marshal(logEntry)
	fmt.Printf("Webhook event: %s\n", string(logJSON))

	// In production, you might want to store this in a separate webhook_logs collection
	// for monitoring and debugging purposes
}

func (wc *WebhookController) verifyWebhookSignature(provider, signature string, payload []byte) bool {
	switch provider {
	case "stripe":
		_, err := webhook.ConstructEvent(payload, signature, wc.services.Config.Stripe.WebhookSecret)
		return err == nil
	default:
		// Implement verification for other providers
		return true
	}
}
