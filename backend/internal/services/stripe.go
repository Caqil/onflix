// backend/internal/services/stripe.go
package services

import (
	"context"
	"fmt"
	"onflix/internal/config"
	"onflix/internal/models"
	"time"

	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/account"
	"github.com/stripe/stripe-go/v75/billingportal/session"
	"github.com/stripe/stripe-go/v75/coupon"
	"github.com/stripe/stripe-go/v75/customer"
	"github.com/stripe/stripe-go/v75/invoice"
	"github.com/stripe/stripe-go/v75/paymentintent"
	"github.com/stripe/stripe-go/v75/paymentmethod"
	"github.com/stripe/stripe-go/v75/price"
	"github.com/stripe/stripe-go/v75/product"
	"github.com/stripe/stripe-go/v75/setupintent"
	"github.com/stripe/stripe-go/v75/subscription"
	"github.com/stripe/stripe-go/v75/webhook"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type StripeService struct {
	config *config.Config
	db     *mongo.Database // Add this line
}

func NewStripeService(cfg *config.Config, db *mongo.Database) *StripeService {
	// Set Stripe API key
	stripe.Key = cfg.Stripe.SecretKey

	return &StripeService{
		config: cfg,
		db:     db, // Add this line
	}
}

// Customer Management
func (ss *StripeService) CreateCustomer(email, name string) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Email: stripe.String(email),
		Name:  stripe.String(name),
	}

	return customer.New(params)
}

func (ss *StripeService) GetCustomer(customerID string) (*stripe.Customer, error) {
	return customer.Get(customerID, nil)
}

func (ss *StripeService) UpdateCustomer(customerID string, params *stripe.CustomerParams) (*stripe.Customer, error) {
	return customer.Update(customerID, params)
}

func (ss *StripeService) DeleteCustomer(customerID string) (*stripe.Customer, error) {
	return customer.Del(customerID, nil)
}

// Product and Price Management
func (ss *StripeService) CreateProduct(name, description string) (*stripe.Product, error) {
	params := &stripe.ProductParams{
		Name:        stripe.String(name),
		Description: stripe.String(description),
		Type:        stripe.String("service"),
	}

	return product.New(params)
}

func (ss *StripeService) CreatePrice(productName string, amount float64, currency, interval string) (*stripe.Price, error) {
	// First create or get the product
	prod, err := ss.CreateProduct(productName, fmt.Sprintf("Subscription plan: %s", productName))
	if err != nil {
		return nil, fmt.Errorf("failed to create product: %v", err)
	}

	// Convert amount to cents
	unitAmount := int64(amount * 100)

	params := &stripe.PriceParams{
		Currency:   stripe.String(currency),
		Product:    stripe.String(prod.ID),
		UnitAmount: stripe.Int64(unitAmount),
	}

	// Set recurring interval if provided
	if interval != "" {
		params.Recurring = &stripe.PriceRecurringParams{
			Interval: stripe.String(interval),
		}
	}

	return price.New(params)
}

func (ss *StripeService) GetPrice(priceID string) (*stripe.Price, error) {
	return price.Get(priceID, nil)
}

func (ss *StripeService) ListPrices(productID string) ([]*stripe.Price, error) {
	params := &stripe.PriceListParams{
		Product: stripe.String(productID),
	}
	params.Filters.AddFilter("limit", "", "100")

	var prices []*stripe.Price
	i := price.List(params)
	for i.Next() {
		prices = append(prices, i.Price())
	}

	return prices, i.Err()
}

// Payment Method Management
func (ss *StripeService) AttachPaymentMethod(paymentMethodID, customerID string) (*stripe.PaymentMethod, error) {
	params := &stripe.PaymentMethodAttachParams{
		Customer: stripe.String(customerID),
	}

	return paymentmethod.Attach(paymentMethodID, params)
}

func (ss *StripeService) DetachPaymentMethod(paymentMethodID string) (*stripe.PaymentMethod, error) {
	return paymentmethod.Detach(paymentMethodID, nil)
}

func (ss *StripeService) ListPaymentMethods(customerID string) ([]*stripe.PaymentMethod, error) {
	params := &stripe.PaymentMethodListParams{
		Customer: stripe.String(customerID),
		Type:     stripe.String("card"),
	}

	var paymentMethods []*stripe.PaymentMethod
	i := paymentmethod.List(params)
	for i.Next() {
		paymentMethods = append(paymentMethods, i.PaymentMethod())
	}

	return paymentMethods, i.Err()
}

// Subscription Management
func (ss *StripeService) CreateSubscription(customerID, priceID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		Customer: stripe.String(customerID),
		Items: []*stripe.SubscriptionItemsParams{
			{
				Price: stripe.String(priceID),
			},
		},
		PaymentBehavior: stripe.String("default_incomplete"),
		PaymentSettings: &stripe.SubscriptionPaymentSettingsParams{
			SaveDefaultPaymentMethod: stripe.String("on_subscription"),
		},
		Expand: []*string{stripe.String("latest_invoice.payment_intent")},
	}

	return subscription.New(params)
}

func (ss *StripeService) GetSubscription(subscriptionID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{}
	params.AddExpand("latest_invoice")
	params.AddExpand("customer")

	return subscription.Get(subscriptionID, params)
}

func (ss *StripeService) UpdateSubscription(subscriptionID string, params *stripe.SubscriptionParams) (*stripe.Subscription, error) {
	return subscription.Update(subscriptionID, params)
}

func (ss *StripeService) CancelSubscription(subscriptionID string, cancelAtPeriodEnd bool) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		CancelAtPeriodEnd: stripe.Bool(cancelAtPeriodEnd),
	}

	if !cancelAtPeriodEnd {
		// Cancel immediately
		return subscription.Cancel(subscriptionID, &stripe.SubscriptionCancelParams{})
	}

	return subscription.Update(subscriptionID, params)
}

func (ss *StripeService) ReactivateSubscription(subscriptionID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		CancelAtPeriodEnd: stripe.Bool(false),
	}
	return subscription.Update(subscriptionID, params)
}

func (ss *StripeService) ChangeSubscriptionPrice(subscriptionID, newPriceID string) (*stripe.Subscription, error) {
	// Get current subscription
	sub, err := ss.GetSubscription(subscriptionID)
	if err != nil {
		return nil, err
	}

	// Update the subscription item with new price
	params := &stripe.SubscriptionParams{
		Items: []*stripe.SubscriptionItemsParams{
			{
				ID:    stripe.String(sub.Items.Data[0].ID),
				Price: stripe.String(newPriceID),
			},
		},
		ProrationBehavior: stripe.String("always_invoice"),
	}

	return subscription.Update(subscriptionID, params)
}

func (ss *StripeService) PauseSubscription(subscriptionID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		PauseCollection: &stripe.SubscriptionPauseCollectionParams{
			Behavior: stripe.String("void"),
		},
	}
	return subscription.Update(subscriptionID, params)
}

func (ss *StripeService) ResumeSubscription(subscriptionID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		PauseCollection: &stripe.SubscriptionPauseCollectionParams{},
	}
	// Setting PauseCollection to empty resumes the subscription
	return subscription.Update(subscriptionID, params)
}

// Invoice Management
func (ss *StripeService) GetUpcomingInvoice(customerID string) (*stripe.Invoice, error) {
	params := &stripe.InvoiceUpcomingParams{
		Customer: stripe.String(customerID),
	}

	return invoice.Upcoming(params)
}

func (ss *StripeService) ListInvoices(customerID string) ([]*stripe.Invoice, error) {
	params := &stripe.InvoiceListParams{
		Customer: stripe.String(customerID),
	}
	params.Filters.AddFilter("limit", "", "100")

	var invoices []*stripe.Invoice
	i := invoice.List(params)
	for i.Next() {
		invoices = append(invoices, i.Invoice())
	}

	return invoices, i.Err()
}

func (ss *StripeService) GetInvoice(invoiceID string) (*stripe.Invoice, error) {
	return invoice.Get(invoiceID, nil)
}

func (ss *StripeService) PayInvoice(invoiceID string) (*stripe.Invoice, error) {
	return invoice.Pay(invoiceID, nil)
}

// Payment Intent Management
func (ss *StripeService) CreatePaymentIntent(amount int64, currency, customerID string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amount),
		Currency: stripe.String(currency),
		Customer: stripe.String(customerID),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}

	return paymentintent.New(params)
}

func (ss *StripeService) ConfirmPaymentIntent(paymentIntentID string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentConfirmParams{}
	return paymentintent.Confirm(paymentIntentID, params)
}

func (ss *StripeService) GetPaymentIntent(paymentIntentID string) (*stripe.PaymentIntent, error) {
	return paymentintent.Get(paymentIntentID, nil)
}

// Setup Intent Management (for adding payment methods)
func (ss *StripeService) CreateSetupIntent(customerID string) (*stripe.SetupIntent, error) {
	params := &stripe.SetupIntentParams{
		Customer: stripe.String(customerID),
		Usage:    stripe.String("off_session"),
		AutomaticPaymentMethods: &stripe.SetupIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}

	return setupintent.New(params)
}

func (ss *StripeService) ConfirmSetupIntent(setupIntentID string) (*stripe.SetupIntent, error) {
	params := &stripe.SetupIntentConfirmParams{}
	return setupintent.Confirm(setupIntentID, params)
}

// Webhook Management
func (ss *StripeService) ConstructEvent(payload []byte, signature string) (stripe.Event, error) {
	return webhook.ConstructEvent(payload, signature, ss.config.Stripe.WebhookSecret)
}

func (ss *StripeService) VerifyWebhookSignature(payload []byte, signature string) bool {
	_, err := webhook.ConstructEvent(payload, signature, ss.config.Stripe.WebhookSecret)
	return err == nil
}

// Coupon and Discount Management
func (ss *StripeService) CreateCoupon(id, name string, percentOff int64, duration string) (*stripe.Coupon, error) {
	params := &stripe.CouponParams{
		ID:         stripe.String(id),
		Name:       stripe.String(name),
		PercentOff: stripe.Float64(float64(percentOff)),
		Duration:   stripe.String(duration),
	}

	return coupon.New(params)
}

func (ss *StripeService) GetCoupon(couponID string) (*stripe.Coupon, error) {
	return coupon.Get(couponID, nil)
}

func (ss *StripeService) ApplyCouponToCustomer(customerID, couponID string) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Coupon: stripe.String(couponID),
	}

	return customer.Update(customerID, params)
}

// Analytics and Reporting
func (ss *StripeService) GetCustomerUsage(customerID string) (map[string]interface{}, error) {
	// Get customer's subscription and usage data
	params := &stripe.SubscriptionListParams{
		Customer: stripe.String(customerID),
	}

	usage := make(map[string]interface{})
	i := subscription.List(params)

	for i.Next() {
		sub := i.Subscription()
		usage[sub.ID] = map[string]interface{}{
			"status":               sub.Status,
			"current_period_start": sub.CurrentPeriodStart,
			"current_period_end":   sub.CurrentPeriodEnd,
			"cancel_at":            sub.CancelAt,
		}
	}

	return usage, i.Err()
}

func (ss *StripeService) GetRevenueMetrics(startDate, endDate int64) (map[string]interface{}, error) {
	// Get invoices in date range
	params := &stripe.InvoiceListParams{
		Created: stripe.Int64(startDate),
		//Created: &stripe.RangeQueryParams{
		//	GTE: startDate,
		//	LTE: endDate,
		//},
	}
	params.Filters.AddFilter("limit", "", "100")
	params.Filters.AddFilter("status", "", "paid")

	var totalRevenue int64
	var subscriptionRevenue int64
	var oneTimeRevenue int64

	i := invoice.List(params)
	for i.Next() {
		inv := i.Invoice()
		totalRevenue += inv.AmountPaid

		if inv.Subscription != nil {
			subscriptionRevenue += inv.AmountPaid
		} else {
			oneTimeRevenue += inv.AmountPaid
		}
	}

	metrics := map[string]interface{}{
		"total_revenue":        ss.FormatAmountFromCents(totalRevenue),
		"subscription_revenue": ss.FormatAmountFromCents(subscriptionRevenue),
		"one_time_revenue":     ss.FormatAmountFromCents(oneTimeRevenue),
		"net_revenue":          ss.FormatAmountFromCents(totalRevenue),
	}

	return metrics, i.Err()
}

// Subscription Trial Management
func (ss *StripeService) ExtendTrial(subscriptionID string, trialEnd int64) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		TrialEnd: stripe.Int64(trialEnd),
	}

	return subscription.Update(subscriptionID, params)
}

// Billing Portal
func (ss *StripeService) CreateBillingPortalSession(customerID, returnURL string) (string, error) {
	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(customerID),
		ReturnURL: stripe.String(returnURL),
	}

	s, err := session.New(params)
	if err != nil {
		return "", err
	}

	return s.URL, nil
}

// Connect Accounts (for marketplace scenarios)
func (ss *StripeService) CreateConnectAccount(email, country string) (*stripe.Account, error) {
	params := &stripe.AccountParams{
		Type:    stripe.String("express"),
		Email:   stripe.String(email),
		Country: stripe.String(country),
	}

	return account.New(params)
}

// Webhook Event Handlers
func (ss *StripeService) HandleInvoicePaymentSucceeded(invoice *stripe.Invoice) error {
	// Process successful invoice payment
	if invoice.Subscription != nil {
		// Update subscription status in database
		_, err := ss.db.Collection("users").UpdateOne(
			context.Background(),
			bson.M{"subscription.stripe_subscription_id": invoice.Subscription.ID},
			bson.M{"$set": bson.M{
				"subscription.status":       models.SubscriptionStatusActive,
				"subscription.last_payment": time.Unix(invoice.StatusTransitions.PaidAt, 0),
				"subscription.updated_at":   time.Now(),
			}},
		)
		return err
	}
	return nil
}

func (ss *StripeService) HandleInvoicePaymentFailed(invoice *stripe.Invoice) error {
	// Process failed invoice payment
	if invoice.Subscription != nil {
		// Update subscription status in database
		_, err := ss.db.Collection("users").UpdateOne(
			context.Background(),
			bson.M{"subscription.stripe_subscription_id": invoice.Subscription.ID},
			bson.M{"$set": bson.M{
				"subscription.status":     models.SubscriptionStatusPastDue,
				"subscription.updated_at": time.Now(),
			}},
		)
		return err
	}
	return nil
}

func (ss *StripeService) HandleSubscriptionUpdated(subscription *stripe.Subscription) error {
	// Process subscription updates
	updateFields := bson.M{
		"subscription.status":     models.SubscriptionStatus(subscription.Status),
		"subscription.updated_at": time.Now(),
	}

	if subscription.CancelAt > 0 {
		updateFields["subscription.cancel_at"] = time.Unix(subscription.CancelAt, 0)
	}

	if subscription.CurrentPeriodEnd > 0 {
		updateFields["subscription.current_period_end"] = time.Unix(subscription.CurrentPeriodEnd, 0)
	}

	_, err := ss.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"subscription.stripe_subscription_id": subscription.ID},
		bson.M{"$set": updateFields},
	)
	return err
}

func (ss *StripeService) HandleSubscriptionDeleted(subscription *stripe.Subscription) error {
	// Process subscription cancellation
	_, err := ss.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"subscription.stripe_subscription_id": subscription.ID},
		bson.M{"$set": bson.M{
			"subscription.status":     models.SubscriptionStatus("canceled"),
			"subscription.updated_at": time.Now(),
		}},
	)
	return err
}

func (ss *StripeService) HandleCustomerUpdated(customer *stripe.Customer) error {
	// Process customer updates
	updateFields := bson.M{
		"updated_at": time.Now(),
	}

	if customer.Email != "" {
		updateFields["email"] = customer.Email
	}

	if customer.Name != "" {
		updateFields["first_name"] = customer.Name
	}

	_, err := ss.db.Collection("users").UpdateOne(
		context.Background(),
		bson.M{"subscription.stripe_customer_id": customer.ID},
		bson.M{"$set": updateFields},
	)
	return err
}

func (ss *StripeService) HandlePaymentMethodAttached(paymentMethod *stripe.PaymentMethod) error {
	// Process payment method attachment
	// You could send confirmation email or update preferences here
	return nil
}

// Utility Methods
func (ss *StripeService) FormatAmount(amount float64) int64 {
	// Convert amount to cents for Stripe API
	return int64(amount * 100)
}

func (ss *StripeService) FormatAmountFromCents(amount int64) float64 {
	// Convert cents to dollars/euros
	return float64(amount) / 100
}

func (ss *StripeService) ValidateWebhookEvent(eventType string) bool {
	allowedEvents := []string{
		"customer.subscription.created",
		"customer.subscription.updated",
		"customer.subscription.deleted",
		"invoice.payment_succeeded",
		"invoice.payment_failed",
		"payment_intent.succeeded",
		"payment_intent.payment_failed",
		"setup_intent.succeeded",
		"customer.created",
		"customer.updated",
		"payment_method.attached",
		"payment_method.detached",
	}

	for _, allowed := range allowedEvents {
		if eventType == allowed {
			return true
		}
	}

	return false
}

// Error Handling
type StripeError struct {
	Type    string
	Code    string
	Message string
}

func (e *StripeError) Error() string {
	return fmt.Sprintf("Stripe Error [%s:%s]: %s", e.Type, e.Code, e.Message)
}

func (ss *StripeService) HandleStripeError(err error) *StripeError {
	if stripeErr, ok := err.(*stripe.Error); ok {
		return &StripeError{
			Type:    string(stripeErr.Type),
			Code:    string(stripeErr.Code),
			Message: stripeErr.Msg,
		}
	}
	return &StripeError{
		Type:    "unknown",
		Code:    "unknown",
		Message: err.Error(),
	}
}

// Additional helper methods
func (ss *StripeService) CreateCustomerPortalURL(customerID, returnURL string) (string, error) {
	return ss.CreateBillingPortalSession(customerID, returnURL)
}

func (ss *StripeService) GetSubscriptionsByCustomer(customerID string) ([]*stripe.Subscription, error) {
	params := &stripe.SubscriptionListParams{
		Customer: stripe.String(customerID),
	}

	var subscriptions []*stripe.Subscription
	i := subscription.List(params)
	for i.Next() {
		subscriptions = append(subscriptions, i.Subscription())
	}

	return subscriptions, i.Err()
}

func (ss *StripeService) CreateTrialSubscription(customerID, priceID string, trialDays int64) (*stripe.Subscription, error) {
	trialEnd := time.Now().AddDate(0, 0, int(trialDays)).Unix()

	params := &stripe.SubscriptionParams{
		Customer: stripe.String(customerID),
		Items: []*stripe.SubscriptionItemsParams{
			{
				Price: stripe.String(priceID),
			},
		},
		TrialEnd: stripe.Int64(trialEnd),
		PaymentSettings: &stripe.SubscriptionPaymentSettingsParams{
			SaveDefaultPaymentMethod: stripe.String("on_subscription"),
		},
	}

	return subscription.New(params)
}
