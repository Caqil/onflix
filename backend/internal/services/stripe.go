// backend/internal/services/stripe.go
package services

import (
	"fmt"
	"onflix/internal/config"

	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/customer"
	"github.com/stripe/stripe-go/v75/paymentmethod"
	"github.com/stripe/stripe-go/v75/price"
	"github.com/stripe/stripe-go/v75/product"
	"github.com/stripe/stripe-go/v75/subscription"
	"github.com/stripe/stripe-go/v75/webhook"
)

type StripeService struct {
	config *config.Config
}

func NewStripeService(cfg *config.Config) *StripeService {
	// Set Stripe API key
	stripe.Key = cfg.Stripe.SecretKey

	return &StripeService{
		config: cfg,
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

func (ss *StripeService) UpdatePrice(priceID string, params *stripe.PriceParams) (*stripe.Price, error) {
	return price.Update(priceID, params)
}

// Payment Method Management
func (ss *StripeService) AttachPaymentMethod(paymentMethodID, customerID string) error {
	params := &stripe.PaymentMethodAttachParams{
		Customer: stripe.String(customerID),
	}

	_, err := paymentmethod.Attach(paymentMethodID, params)
	return err
}

func (ss *StripeService) DetachPaymentMethod(paymentMethodID string) error {
	_, err := paymentmethod.Detach(paymentMethodID, nil)
	return err
}

func (ss *StripeService) ListPaymentMethods(customerID string) *paymentmethod.Iter {
	params := &stripe.PaymentMethodListParams{
		Customer: stripe.String(customerID),
		Type:     stripe.String("card"),
	}

	return paymentmethod.List(params)
}

func (ss *StripeService) GetPaymentMethod(paymentMethodID string) (*stripe.PaymentMethod, error) {
	return paymentmethod.Get(paymentMethodID, nil)
}

// Subscription Management
func (ss *StripeService) CreateSubscription(customerID, priceID string, trialDays int64) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		Customer: stripe.String(customerID),
		Items: []*stripe.SubscriptionItemsParams{
			{
				Price: stripe.String(priceID),
			},
		},
		Expand: []*string{stripe.String("latest_invoice.payment_intent")},
	}

	if trialDays > 0 {
		params.TrialPeriodDays = stripe.Int64(trialDays)
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

func (ss *StripeService) CancelSubscription(subscriptionID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionCancelParams{}
	return subscription.Cancel(subscriptionID, params)
}

func (ss *StripeService) CancelSubscriptionAtPeriodEnd(subscriptionID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		CancelAtPeriodEnd: stripe.Bool(true),
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
	subscription, err := ss.GetSubscription(subscriptionID)
	if err != nil {
		return nil, err
	}

	// Update the subscription item with new price
	params := &stripe.SubscriptionParams{
		Items: []*stripe.SubscriptionItemsParams{
			{
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
	params := &stripe.InvoiceParams{
		Customer: stripe.String(customerID),
	}

	return stripe.Invoice{}, nil // Placeholder - implement based on Stripe API
}

func (ss *StripeService) ListInvoices(customerID string) ([]*stripe.Invoice, error) {
	params := &stripe.InvoiceListParams{
		Customer: stripe.String(customerID),
	}
	params.Filters.AddFilter("limit", "", "100")

	var invoices []*stripe.Invoice
	i := stripe.Invoice{}.List(params)
	for i.Next() {
		invoices = append(invoices, i.Invoice())
	}

	return invoices, i.Err()
}

// Payment Intent Management
func (ss *StripeService) CreatePaymentIntent(amount int64, currency, customerID string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(amount),
		Currency: stripe.String(currency),
		Customer: stripe.String(customerID),
	}

	return stripe.PaymentIntent{}, nil // Placeholder - implement based on Stripe API
}

func (ss *StripeService) ConfirmPaymentIntent(paymentIntentID string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentConfirmParams{}
	return stripe.PaymentIntent{}, nil // Placeholder - implement based on Stripe API
}

// Setup Intent Management (for adding payment methods)
func (ss *StripeService) CreateSetupIntent(customerID string) (*stripe.SetupIntent, error) {
	params := &stripe.SetupIntentParams{
		Customer: stripe.String(customerID),
		Usage:    stripe.String("off_session"),
	}

	return stripe.SetupIntent{}, nil // Placeholder - implement based on Stripe API
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
		PercentOff: stripe.Int64(percentOff),
		Duration:   stripe.String(duration),
	}

	return stripe.Coupon{}, nil // Placeholder - implement based on Stripe API
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

	subscriptions := subscription.List(params)
	usage := make(map[string]interface{})

	for subscriptions.Next() {
		sub := subscriptions.Subscription()
		usage[subscription.ID] = map[string]interface{}{
			"status":               subscription.Status,
			"current_period_start": subscription.CurrentPeriodStart,
			"current_period_end":   subscription.CurrentPeriodEnd,
			"cancel_at":            subscription.CancelAt,
		}
	}

	return usage, subscriptions.Err()
}

func (ss *StripeService) GetRevenueMetrics(startDate, endDate int64) (map[string]interface{}, error) {
	// This would typically use Stripe's Sigma or reporting features
	// For now, return basic structure
	metrics := map[string]interface{}{
		"total_revenue":        0.0,
		"subscription_revenue": 0.0,
		"one_time_revenue":     0.0,
		"refunds":              0.0,
		"net_revenue":          0.0,
	}

	return metrics, nil
}

// Tax Management
func (ss *StripeService) CalculateTax(amount int64, currency, customerID string) (*stripe.TaxRate, error) {
	// Placeholder for tax calculation
	// In production, you might use Stripe Tax or integrate with a tax service
	return &stripe.TaxRate{}, nil
}

// Fraud Prevention
func (ss *StripeService) GetRadarRiskScore(paymentIntentID string) (int64, error) {
	// Get Radar risk score for a payment
	// This would integrate with Stripe Radar
	return 0, nil
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
	// Create a billing portal session for customer self-service
	// This would use Stripe's Customer Portal
	portalURL := fmt.Sprintf("https://billing.stripe.com/session/%s", customerID)
	return portalURL, nil
}

// Connect Accounts (for marketplace scenarios)
func (ss *StripeService) CreateConnectAccount(email, country string) (*stripe.Account, error) {
	params := &stripe.AccountParams{
		Type:    stripe.String("express"),
		Email:   stripe.String(email),
		Country: stripe.String(country),
	}

	return stripe.Account{}, nil // Placeholder - implement based on Stripe API
}

// Webhook Event Handlers (used by webhook controller)
func (ss *StripeService) HandleInvoicePaymentSucceeded(invoice *stripe.Invoice) error {
	// Process successful invoice payment
	// Update subscription status, send confirmation email, etc.
	return nil
}

func (ss *StripeService) HandleInvoicePaymentFailed(invoice *stripe.Invoice) error {
	// Process failed invoice payment
	// Update subscription status, send failure notification, etc.
	return nil
}

func (ss *StripeService) HandleSubscriptionUpdated(subscription *stripe.Subscription) error {
	// Process subscription updates
	// Update local database, send notifications, etc.
	return nil
}

func (ss *StripeService) HandleSubscriptionDeleted(subscription *stripe.Subscription) error {
	// Process subscription cancellation
	// Update local database, send cancellation email, etc.
	return nil
}

func (ss *StripeService) HandleCustomerUpdated(customer *stripe.Customer) error {
	// Process customer updates
	// Sync customer data with local database
	return nil
}

func (ss *StripeService) HandlePaymentMethodAttached(paymentMethod *stripe.PaymentMethod) error {
	// Process payment method attachment
	// Send confirmation email, update customer preferences, etc.
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

// Testing and Development
func (ss *StripeService) CreateTestCustomer() (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Email: stripe.String("test@example.com"),
		Name:  stripe.String("Test Customer"),
	}

	return customer.New(params)
}

func (ss *StripeService) CreateTestSubscription(customerID, priceID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		Customer: stripe.String(customerID),
		Items: []*stripe.SubscriptionItemParams{
			{
				Price: stripe.String(priceID),
			},
		},
		TrialPeriodDays: stripe.Int64(7), // 7-day trial for testing
	}

	return subscription.New(params)
}

// Health Check
func (ss *StripeService) HealthCheck() error {
	// Test Stripe API connectivity
	_, err := stripe.Account{}.Get()
	return err
}
