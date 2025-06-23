// backend/internal/controllers/subscription.go
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
	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/customer"
	"github.com/stripe/stripe-go/v75/invoice"
	"github.com/stripe/stripe-go/v75/paymentmethod"
	"github.com/stripe/stripe-go/v75/setupintent"
	"github.com/stripe/stripe-go/v75/subscription"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SubscriptionController struct {
	services *services.Services
}

func NewSubscriptionController(services *services.Services) *SubscriptionController {
	return &SubscriptionController{
		services: services,
	}
}

// Subscription Plans
func (sc *SubscriptionController) GetSubscriptionPlans(c *gin.Context) {
	var plans []models.SubscriptionPlan
	cursor, err := sc.services.DB.Collection("subscription_plans").Find(
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

func (sc *SubscriptionController) CreateSubscriptionPlan(c *gin.Context) {
	var req struct {
		Name        string              `json:"name" validate:"required,min=3,max=50"`
		Description string              `json:"description" validate:"required,min=10,max=500"`
		Price       float64             `json:"price" validate:"required,min=0"`
		Currency    string              `json:"currency" validate:"required,len=3"`
		Interval    models.PlanInterval `json:"interval" validate:"required"`
		Features    models.PlanFeatures `json:"features" validate:"required"`
		Limits      models.PlanLimits   `json:"limits" validate:"required"`
		IsPopular   bool                `json:"is_popular"`
		SortOrder   int                 `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	// Create Stripe price
	stripePrice, err := sc.services.StripeService.CreatePrice(
		req.Name,
		req.Price,
		req.Currency,
		string(req.Interval),
	)
	if err != nil {
		utils.BadRequestResponse(c, fmt.Sprintf("Failed to create Stripe price: %v", err))
		return
	}

	// Create subscription plan
	plan := models.SubscriptionPlan{
		ID:            primitive.NewObjectID(),
		Name:          req.Name,
		Description:   req.Description,
		Price:         req.Price,
		Currency:      req.Currency,
		Interval:      req.Interval,
		Features:      req.Features,
		Limits:        req.Limits,
		StripePriceID: stripePrice.ID,
		IsActive:      true,
		IsPopular:     req.IsPopular,
		SortOrder:     req.SortOrder,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	_, err = sc.services.DB.Collection("subscription_plans").InsertOne(context.Background(), plan)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.CreatedResponse(c, "Subscription plan created successfully", plan)
}

func (sc *SubscriptionController) UpdateSubscriptionPlan(c *gin.Context) {
	planID := c.Param("planID")
	if !utils.IsValidObjectID(planID) {
		utils.BadRequestResponse(c, "Invalid plan ID")
		return
	}

	var req struct {
		Name        string              `json:"name" validate:"required,min=3,max=50"`
		Description string              `json:"description" validate:"required,min=10,max=500"`
		Features    models.PlanFeatures `json:"features" validate:"required"`
		Limits      models.PlanLimits   `json:"limits" validate:"required"`
		IsPopular   bool                `json:"is_popular"`
		SortOrder   int                 `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	planObjID, _ := primitive.ObjectIDFromHex(planID)

	// Update plan
	now := time.Now()
	_, err := sc.services.DB.Collection("subscription_plans").UpdateOne(
		context.Background(),
		bson.M{"_id": planObjID},
		bson.M{
			"$set": bson.M{
				"name":        req.Name,
				"description": req.Description,
				"features":    req.Features,
				"limits":      req.Limits,
				"is_popular":  req.IsPopular,
				"sort_order":  req.SortOrder,
				"updated_at":  now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Subscription plan updated successfully", nil)
}

// Subscription Management
func (sc *SubscriptionController) Subscribe(c *gin.Context) {
	var req struct {
		PlanID          string `json:"plan_id" validate:"required"`
		PaymentMethodID string `json:"payment_method_id" validate:"required"`
		TrialDays       int    `json:"trial_days,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if errors := utils.ValidateStruct(req); errors != nil {
		utils.ValidationErrorResponse(c, errors)
		return
	}

	if !utils.IsValidObjectID(req.PlanID) {
		utils.BadRequestResponse(c, "Invalid plan ID")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	// Check if user already has an active subscription
	if u.Subscription != nil &&
		(u.Subscription.Status == models.SubscriptionStatusActive ||
			u.Subscription.Status == models.SubscriptionStatusTrialing) {
		utils.ConflictResponse(c, "User already has an active subscription")
		return
	}

	planObjID, _ := primitive.ObjectIDFromHex(req.PlanID)

	// Get subscription plan
	var plan models.SubscriptionPlan
	err := sc.services.DB.Collection("subscription_plans").FindOne(
		context.Background(),
		bson.M{"_id": planObjID, "is_active": true},
	).Decode(&plan)

	if err != nil {
		utils.NotFoundResponse(c, "Subscription plan")
		return
	}

	// Create or get Stripe customer
	var stripeCustomerID string
	if u.Subscription != nil && u.Subscription.StripeCustomerID != "" {
		stripeCustomerID = u.Subscription.StripeCustomerID
	} else {
		customer, err := sc.services.StripeService.CreateCustomer(u.Email, u.FirstName+" "+u.LastName)
		if err != nil {
			utils.InternalServerErrorResponse(c)
			return
		}
		stripeCustomerID = customer.ID
	}

	// Attach payment method to customer
	_, err = sc.services.StripeService.AttachPaymentMethod(req.PaymentMethodID, stripeCustomerID)
	if err != nil {
		utils.BadRequestResponse(c, fmt.Sprintf("Failed to attach payment method: %v", err))
		return
	}

	// Create Stripe subscription
	subscriptionParams := &stripe.SubscriptionParams{
		Customer: stripe.String(stripeCustomerID),
		Items: []*stripe.SubscriptionItemsParams{
			{
				Price: stripe.String(plan.StripePriceID),
			},
		},
		DefaultPaymentMethod: stripe.String(req.PaymentMethodID),
		Expand:               []*string{stripe.String("latest_invoice.payment_intent")},
	}

	if req.TrialDays > 0 {
		subscriptionParams.TrialPeriodDays = stripe.Int64(int64(req.TrialDays))
	}
	stripeSubscription, err := subscription.New(subscriptionParams)
	if err != nil {
		utils.BadRequestResponse(c, fmt.Sprintf("Failed to create subscription: %v", err))
		return

	}

	// Create subscription record
	subscription := models.Subscription{
		ID:                   primitive.NewObjectID(),
		UserID:               u.ID,
		PlanID:               planObjID,
		StripeSubscriptionID: stripeSubscription.ID,
		StripeCustomerID:     stripeCustomerID,
		Status:               models.SubscriptionStatus(stripeSubscription.Status),
		CurrentPeriodStart:   time.Unix(stripeSubscription.CurrentPeriodStart, 0),
		CurrentPeriodEnd:     time.Unix(stripeSubscription.CurrentPeriodEnd, 0),
		AutoRenew:            true,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	if stripeSubscription.TrialStart != 0 {
		trialStart := time.Unix(stripeSubscription.TrialStart, 0)
		subscription.TrialStart = &trialStart
	}

	if stripeSubscription.TrialEnd != 0 {
		trialEnd := time.Unix(stripeSubscription.TrialEnd, 0)
		subscription.TrialEnd = &trialEnd
	}

	// Insert subscription
	_, err = sc.services.DB.Collection("subscriptions").InsertOne(context.Background(), subscription)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update user subscription
	userSubscription := models.UserSubscription{
		PlanID:               planObjID,
		StripeCustomerID:     stripeCustomerID,
		StripeSubscriptionID: stripeSubscription.ID,
		Status:               models.SubscriptionStatus(stripeSubscription.Status),
		CurrentPeriodStart:   time.Unix(stripeSubscription.CurrentPeriodStart, 0),
		CurrentPeriodEnd:     time.Unix(stripeSubscription.CurrentPeriodEnd, 0),
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	_, err = sc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$set": bson.M{
				"subscription": userSubscription,
				"updated_at":   time.Now(),
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	response := gin.H{
		"subscription":        subscription,
		"plan":                plan,
		"stripe_subscription": stripeSubscription,
	}

	utils.CreatedResponse(c, "Subscription created successfully", response)
}

func (sc *SubscriptionController) GetCurrentSubscription(c *gin.Context) {
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

	// Get full subscription details
	var subscription models.Subscription
	err := sc.services.DB.Collection("subscriptions").FindOne(
		context.Background(),
		bson.M{"user_id": u.ID},
		options.FindOne().SetSort(bson.M{"created_at": -1}),
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
	err = sc.services.DB.Collection("subscription_plans").FindOne(
		context.Background(),
		bson.M{"_id": subscription.PlanID},
	).Decode(&plan)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Get current usage
	var usage models.SubscriptionUsage
	sc.services.DB.Collection("subscription_usage").FindOne(
		context.Background(),
		bson.M{
			"subscription_id": subscription.ID,
			"period.start":    bson.M{"$lte": time.Now()},
			"period.end":      bson.M{"$gte": time.Now()},
		},
	).Decode(&usage)

	response := gin.H{
		"subscription": subscription,
		"plan":         plan,
		"usage":        usage,
	}

	utils.SuccessResponse(c, http.StatusOK, "Subscription retrieved successfully", response)
}

func (sc *SubscriptionController) ChangePlan(c *gin.Context) {
	var req struct {
		PlanID string `json:"plan_id" validate:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestResponse(c, "Invalid request format")
		return
	}

	if !utils.IsValidObjectID(req.PlanID) {
		utils.BadRequestResponse(c, "Invalid plan ID")
		return
	}

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

	planObjID, _ := primitive.ObjectIDFromHex(req.PlanID)

	// Get new plan
	var newPlan models.SubscriptionPlan
	err := sc.services.DB.Collection("subscription_plans").FindOne(
		context.Background(),
		bson.M{"_id": planObjID, "is_active": true},
	).Decode(&newPlan)

	if err != nil {
		utils.NotFoundResponse(c, "Subscription plan")
		return
	}
	// Update Stripe subscription
	_, err = subscription.Update(u.Subscription.StripeSubscriptionID, &stripe.SubscriptionParams{
		Items: []*stripe.SubscriptionItemsParams{
			{
				Price: stripe.String(newPlan.StripePriceID),
			},
		},
		ProrationBehavior: stripe.String("always_invoice"),
	})

	if err != nil {
		utils.BadRequestResponse(c, fmt.Sprintf("Failed to update subscription: %v", err))
		return

	}

	// Update subscription in database
	now := time.Now()
	_, err = sc.services.DB.Collection("subscriptions").UpdateOne(
		context.Background(),
		bson.M{"user_id": u.ID, "status": bson.M{"$in": []string{
			string(models.SubscriptionStatusActive),
			string(models.SubscriptionStatusTrialing),
		}}},
		bson.M{
			"$set": bson.M{
				"plan_id":    planObjID,
				"updated_at": now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update user subscription
	_, err = sc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$set": bson.M{
				"subscription.plan_id":    planObjID,
				"subscription.updated_at": now,
				"updated_at":              now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Subscription plan changed successfully", nil)
}

func (sc *SubscriptionController) CancelSubscription(c *gin.Context) {
	var req struct {
		CancelAt  time.Time `json:"cancel_at,omitempty"`
		Reason    string    `json:"reason,omitempty" validate:"max=500"`
		Immediate bool      `json:"immediate"`
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

	if u.Subscription == nil {
		utils.NotFoundResponse(c, "Subscription")
		return
	}
	// Cancel Stripe subscription
	var stripeParams *stripe.SubscriptionParams
	if req.Immediate {
		// Cancel immediately
		stripeParams = &stripe.SubscriptionParams{}
	} else {
		// Cancel at period end
		stripeParams = &stripe.SubscriptionParams{
			CancelAtPeriodEnd: stripe.Bool(true),
		}
	}

	stripeSubscription, err := subscription.Update(u.Subscription.StripeSubscriptionID, stripeParams)
	if err != nil {
		utils.BadRequestResponse(c, fmt.Sprintf("Failed to cancel subscription: %v", err))
		return

	}

	// Update subscription in database
	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"updated_at": now,
		},
	}

	if req.Immediate {
		update["$set"].(bson.M)["status"] = models.SubscriptionStatusCancelled
		update["$set"].(bson.M)["cancelled_at"] = now
	} else {
		update["$set"].(bson.M)["cancel_at"] = time.Unix(stripeSubscription.CancelAt, 0)
	}

	if req.Reason != "" {
		update["$set"].(bson.M)["cancellation_reason"] = req.Reason
	}

	_, err = sc.services.DB.Collection("subscriptions").UpdateOne(
		context.Background(),
		bson.M{"user_id": u.ID, "status": bson.M{"$in": []string{
			string(models.SubscriptionStatusActive),
			string(models.SubscriptionStatusTrialing),
		}}},
		update,
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update user subscription
	userUpdate := bson.M{
		"$set": bson.M{
			"subscription.updated_at": now,
			"updated_at":              now,
		},
	}

	if req.Immediate {
		userUpdate["$set"].(bson.M)["subscription.status"] = models.SubscriptionStatusCancelled
		userUpdate["$set"].(bson.M)["subscription.cancelled_at"] = now
	} else {
		userUpdate["$set"].(bson.M)["subscription.cancel_at"] = time.Unix(stripeSubscription.CancelAt, 0)
	}

	_, err = sc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		userUpdate,
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	message := "Subscription cancelled successfully"
	if !req.Immediate {
		message = "Subscription will be cancelled at the end of the current period"
	}

	utils.SuccessResponse(c, http.StatusOK, message, nil)
}

func (sc *SubscriptionController) PauseSubscription(c *gin.Context) {
	var req struct {
		ResumesAt time.Time `json:"resumes_at" validate:"required"`
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

	if u.Subscription == nil {
		utils.NotFoundResponse(c, "Subscription")
		return
	}

	// Pause subscription
	now := time.Now()
	_, err := sc.services.DB.Collection("subscriptions").UpdateOne(
		context.Background(),
		bson.M{"user_id": u.ID},
		bson.M{
			"$set": bson.M{
				"status":     models.SubscriptionStatusPaused,
				"paused_at":  now,
				"updated_at": now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update user subscription
	_, err = sc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$set": bson.M{
				"subscription.status":     models.SubscriptionStatusPaused,
				"subscription.paused_at":  now,
				"subscription.updated_at": now,
				"updated_at":              now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Subscription paused successfully", nil)
}

func (sc *SubscriptionController) ResumeSubscription(c *gin.Context) {
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

	// Resume subscription
	now := time.Now()
	_, err := sc.services.DB.Collection("subscriptions").UpdateOne(
		context.Background(),
		bson.M{"user_id": u.ID},
		bson.M{
			"$set": bson.M{
				"status":     models.SubscriptionStatusActive,
				"resumed_at": now,
				"updated_at": now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	// Update user subscription
	_, err = sc.services.DB.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"_id": u.ID},
		bson.M{
			"$set": bson.M{
				"subscription.status":     models.SubscriptionStatusActive,
				"subscription.resumed_at": now,
				"subscription.updated_at": now,
				"updated_at":              now,
			},
		},
	)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Subscription resumed successfully", nil)
}

// Payment Methods
func (sc *SubscriptionController) GetPaymentMethods(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	if u.Subscription == nil || u.Subscription.StripeCustomerID == "" {
		utils.SuccessResponse(c, http.StatusOK, "Payment methods retrieved successfully", []interface{}{})
		return
	}

	// Get payment methods from Stripe
	params := &stripe.PaymentMethodListParams{
		Customer: stripe.String(u.Subscription.StripeCustomerID),
		Type:     stripe.String("card"),
	}

	iter := paymentmethod.List(params)
	var paymentMethods []interface{}

	for iter.Next() {
		pm := iter.PaymentMethod()
		paymentMethods = append(paymentMethods, gin.H{
			"id":   pm.ID,
			"type": pm.Type,
			"card": gin.H{
				"brand":     pm.Card.Brand,
				"last4":     pm.Card.Last4,
				"exp_month": pm.Card.ExpMonth,
				"exp_year":  pm.Card.ExpYear,
			},
			"created": pm.Created,
		})
	}

	if err := iter.Err(); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Payment methods retrieved successfully", paymentMethods)
}

func (sc *SubscriptionController) AddPaymentMethod(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	if u.Subscription == nil || u.Subscription.StripeCustomerID == "" {
		utils.BadRequestResponse(c, "No active subscription found")
		return
	}

	// Create setup intent for adding payment method
	params := &stripe.SetupIntentParams{
		Customer: stripe.String(u.Subscription.StripeCustomerID),
		Usage:    stripe.String("off_session"),
	}

	si, err := setupintent.New(params)
	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	response := gin.H{
		"client_secret":   si.ClientSecret,
		"setup_intent_id": si.ID,
	}

	utils.SuccessResponse(c, http.StatusOK, "Setup intent created successfully", response)
}

func (sc *SubscriptionController) RemovePaymentMethod(c *gin.Context) {
	methodID := c.Param("methodID")
	if methodID == "" {
		utils.BadRequestResponse(c, "Payment method ID is required")
		return
	}

	_, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	// Detach payment method
	_, err := paymentmethod.Detach(methodID, nil)
	if err != nil {
		utils.BadRequestResponse(c, fmt.Sprintf("Failed to remove payment method: %v", err))
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Payment method removed successfully", nil)
}

func (sc *SubscriptionController) SetDefaultPaymentMethod(c *gin.Context) {
	methodID := c.Param("methodID")
	if methodID == "" {
		utils.BadRequestResponse(c, "Payment method ID is required")
		return
	}

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	if u.Subscription == nil || u.Subscription.StripeCustomerID == "" {
		utils.BadRequestResponse(c, "No active subscription found")
		return
	}

	// Update customer's default payment method
	_, err := customer.Update(u.Subscription.StripeCustomerID, &stripe.CustomerParams{
		InvoiceSettings: &stripe.CustomerInvoiceSettingsParams{
			DefaultPaymentMethod: stripe.String(methodID),
		},
	})

	if err != nil {
		utils.BadRequestResponse(c, fmt.Sprintf("Failed to set default payment method: %v", err))
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Default payment method updated successfully", nil)
}

// Invoices and Billing
func (sc *SubscriptionController) GetInvoices(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, limit, _ = utils.ValidatePaginationParams(page, limit)

	user, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedResponse(c)
		return
	}

	u := user.(*models.User)

	if u.Subscription == nil || u.Subscription.StripeCustomerID == "" {
		utils.PaginatedResponse(c, http.StatusOK, "Invoices retrieved successfully", []interface{}{}, page, limit, 0)
		return
	}

	// Get invoices from Stripe
	params := &stripe.InvoiceListParams{
		Customer: stripe.String(u.Subscription.StripeCustomerID),
	}
	params.Filters.AddFilter("limit", "", strconv.Itoa(limit))

	iter := invoice.List(params)
	var invoices []interface{}
	totalCount := 0

	for iter.Next() {
		inv := iter.Invoice()
		invoices = append(invoices, gin.H{
			"id":                 inv.ID,
			"amount_due":         inv.AmountDue,
			"amount_paid":        inv.AmountPaid,
			"currency":           inv.Currency,
			"status":             inv.Status,
			"created":            inv.Created,
			"due_date":           inv.DueDate,
			"hosted_invoice_url": inv.HostedInvoiceURL,
			"invoice_pdf":        inv.InvoicePDF,
			"number":             inv.Number,
			"period_start":       inv.PeriodStart,
			"period_end":         inv.PeriodEnd,
		})
		totalCount++
	}

	if err := iter.Err(); err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	utils.PaginatedResponse(c, http.StatusOK, "Invoices retrieved successfully", invoices, page, limit, int64(totalCount))
}

func (sc *SubscriptionController) GetUsage(c *gin.Context) {
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

	// Get current period usage
	var usage models.SubscriptionUsage
	err := sc.services.DB.Collection("subscription_usage").FindOne(
		context.Background(),
		bson.M{
			"user_id":      u.ID,
			"period.start": bson.M{"$lte": time.Now()},
			"period.end":   bson.M{"$gte": time.Now()},
		},
	).Decode(&usage)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Create initial usage record
			usage = models.SubscriptionUsage{
				ID:     primitive.NewObjectID(),
				UserID: u.ID,
				Period: models.UsagePeriod{
					Start: u.Subscription.CurrentPeriodStart,
					End:   u.Subscription.CurrentPeriodEnd,
				},
				StreamingHours: 0,
				Downloads:      0,
				ProfilesUsed:   len(u.Profiles),
				ConcurrentPeak: 1,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}

			sc.services.DB.Collection("subscription_usage").InsertOne(context.Background(), usage)
		} else {
			utils.InternalServerErrorResponse(c)
			return
		}
	}

	// Get plan limits
	var plan models.SubscriptionPlan
	err = sc.services.DB.Collection("subscription_plans").FindOne(
		context.Background(),
		bson.M{"_id": u.Subscription.PlanID},
	).Decode(&plan)

	if err != nil {
		utils.InternalServerErrorResponse(c)
		return
	}

	response := gin.H{
		"current_usage": usage,
		"limits":        plan.Limits,
		"utilization": gin.H{
			"profiles": gin.H{
				"used":       usage.ProfilesUsed,
				"limit":      plan.Limits.MaxProfiles,
				"percentage": float64(usage.ProfilesUsed) / float64(plan.Limits.MaxProfiles) * 100,
			},
			"downloads": gin.H{
				"used":       usage.Downloads,
				"limit":      plan.Limits.MaxDownloads,
				"percentage": float64(usage.Downloads) / float64(plan.Limits.MaxDownloads) * 100,
			},
		},
	}

	utils.SuccessResponse(c, http.StatusOK, "Usage information retrieved successfully", response)
}

// Webhook handling
func (sc *SubscriptionController) HandleStripeWebhook(c *gin.Context) {
	payload, err := c.GetRawData()
	if err != nil {
		utils.BadRequestResponse(c, "Invalid payload")
		return
	}

	event, err := sc.services.StripeService.ConstructEvent(payload, c.GetHeader("Stripe-Signature"))
	if err != nil {
		utils.BadRequestResponse(c, "Invalid signature")
		return
	}

	switch event.Type {
	case "invoice.payment_succeeded":
		sc.handleInvoicePaymentSucceeded(event.Data.Object)
	case "invoice.payment_failed":
		sc.handleInvoicePaymentFailed(event.Data.Object)
	case "customer.subscription.updated":
		sc.handleSubscriptionUpdated(event.Data.Object)
	case "customer.subscription.deleted":
		sc.handleSubscriptionDeleted(event.Data.Object)
	default:
		// Unhandled event type
	}

	utils.SuccessResponse(c, http.StatusOK, "Webhook processed successfully", nil)
}

// Helper methods for webhook handling
func (sc *SubscriptionController) handleInvoicePaymentSucceeded(data interface{}) {
	// Process successful payment
	// Update subscription status, create payment record, etc.
}

func (sc *SubscriptionController) handleInvoicePaymentFailed(data interface{}) {
	// Process failed payment
	// Update subscription status, send notification, etc.
}

func (sc *SubscriptionController) handleSubscriptionUpdated(data interface{}) {
	// Update subscription in database
}

func (sc *SubscriptionController) handleSubscriptionDeleted(data interface{}) {
	// Handle subscription cancellation
}

// Subscription Analytics (for admin use)
func (sc *SubscriptionController) GetSubscriptionAnalytics(c *gin.Context) {
	period := c.DefaultQuery("period", "30")
	periodDays, _ := strconv.Atoi(period)
	startDate := time.Now().AddDate(0, 0, -periodDays)

	ctx := context.Background()

	// Subscription status distribution
	statusPipeline := []bson.M{
		{"$group": bson.M{
			"_id":   "$status",
			"count": bson.M{"$sum": 1},
		}},
	}

	var statusDist []bson.M
	cursor, err := sc.services.DB.Collection("subscriptions").Aggregate(ctx, statusPipeline)
	if err == nil {
		cursor.All(ctx, &statusDist)
	}

	// New subscriptions over time
	newSubsPipeline := []bson.M{
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

	var newSubs []bson.M
	cursor, err = sc.services.DB.Collection("subscriptions").Aggregate(ctx, newSubsPipeline)
	if err == nil {
		cursor.All(ctx, &newSubs)
	}

	// Churn rate
	churnPipeline := []bson.M{
		{"$match": bson.M{
			"cancelled_at": bson.M{"$gte": startDate},
		}},
		{"$group": bson.M{
			"_id":   nil,
			"count": bson.M{"$sum": 1},
		}},
	}

	var churnResult []struct {
		Count int `bson:"count"`
	}
	cursor, err = sc.services.DB.Collection("subscriptions").Aggregate(ctx, churnPipeline)
	if err == nil {
		cursor.All(ctx, &churnResult)
	}

	churnCount := 0
	if len(churnResult) > 0 {
		churnCount = churnResult[0].Count
	}

	analytics := gin.H{
		"status_distribution": statusDist,
		"new_subscriptions":   newSubs,
		"churn_count":         churnCount,
		"period_days":         periodDays,
	}

	utils.SuccessResponse(c, http.StatusOK, "Subscription analytics retrieved successfully", analytics)
}
