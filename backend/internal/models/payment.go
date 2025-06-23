package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Payment struct {
	ID                    primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID                primitive.ObjectID `json:"user_id" bson:"user_id"`
	SubscriptionID        primitive.ObjectID `json:"subscription_id" bson:"subscription_id"`
	StripePaymentIntentID string             `json:"stripe_payment_intent_id" bson:"stripe_payment_intent_id"`
	StripeChargeID        string             `json:"stripe_charge_id" bson:"stripe_charge_id"`
	Amount                float64            `json:"amount" bson:"amount"`
	Currency              string             `json:"currency" bson:"currency"`
	Status                PaymentStatus      `json:"status" bson:"status"`
	PaymentMethod         PaymentMethod      `json:"payment_method" bson:"payment_method"`
	Description           string             `json:"description" bson:"description"`
	FailureReason         string             `json:"failure_reason" bson:"failure_reason"`
	RefundedAmount        float64            `json:"refunded_amount" bson:"refunded_amount"`
	RefundedAt            *time.Time         `json:"refunded_at" bson:"refunded_at"`
	ProcessedAt           *time.Time         `json:"processed_at" bson:"processed_at"`
	CreatedAt             time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt             time.Time          `json:"updated_at" bson:"updated_at"`
}

type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusSucceeded PaymentStatus = "succeeded"
	PaymentStatusFailed    PaymentStatus = "failed"
	PaymentStatusRefunded  PaymentStatus = "refunded"
	PaymentStatusCancelled PaymentStatus = "cancelled"
)

type PaymentMethod struct {
	Type        string             `json:"type" bson:"type"` // card, bank_account, etc.
	Card        *CardPaymentMethod `json:"card,omitempty" bson:"card,omitempty"`
	BankAccount *BankPaymentMethod `json:"bank_account,omitempty" bson:"bank_account,omitempty"`
}

type CardPaymentMethod struct {
	Brand       string `json:"brand" bson:"brand"`
	Last4       string `json:"last4" bson:"last4"`
	ExpMonth    int    `json:"exp_month" bson:"exp_month"`
	ExpYear     int    `json:"exp_year" bson:"exp_year"`
	Country     string `json:"country" bson:"country"`
	Fingerprint string `json:"fingerprint" bson:"fingerprint"`
}

type BankPaymentMethod struct {
	BankName    string `json:"bank_name" bson:"bank_name"`
	Last4       string `json:"last4" bson:"last4"`
	AccountType string `json:"account_type" bson:"account_type"`
	Country     string `json:"country" bson:"country"`
}

type Invoice struct {
	ID              primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID          primitive.ObjectID `json:"user_id" bson:"user_id"`
	SubscriptionID  primitive.ObjectID `json:"subscription_id" bson:"subscription_id"`
	StripeInvoiceID string             `json:"stripe_invoice_id" bson:"stripe_invoice_id"`
	InvoiceNumber   string             `json:"invoice_number" bson:"invoice_number"`
	Amount          float64            `json:"amount" bson:"amount"`
	Tax             float64            `json:"tax" bson:"tax"`
	Discount        float64            `json:"discount" bson:"discount"`
	Total           float64            `json:"total" bson:"total"`
	Currency        string             `json:"currency" bson:"currency"`
	Status          InvoiceStatus      `json:"status" bson:"status"`
	DueDate         time.Time          `json:"due_date" bson:"due_date"`
	PaidAt          *time.Time         `json:"paid_at" bson:"paid_at"`
	Items           []InvoiceItem      `json:"items" bson:"items"`
	BillingAddress  BillingAddress     `json:"billing_address" bson:"billing_address"`
	CreatedAt       time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at" bson:"updated_at"`
}

type InvoiceStatus string

const (
	InvoiceStatusDraft         InvoiceStatus = "draft"
	InvoiceStatusOpen          InvoiceStatus = "open"
	InvoiceStatusPaid          InvoiceStatus = "paid"
	InvoiceStatusUncollectible InvoiceStatus = "uncollectible"
	InvoiceStatusVoid          InvoiceStatus = "void"
)

type InvoiceItem struct {
	Description string    `json:"description" bson:"description"`
	Amount      float64   `json:"amount" bson:"amount"`
	Quantity    int       `json:"quantity" bson:"quantity"`
	PeriodStart time.Time `json:"period_start" bson:"period_start"`
	PeriodEnd   time.Time `json:"period_end" bson:"period_end"`
}

type BillingAddress struct {
	Name       string `json:"name" bson:"name"`
	Line1      string `json:"line1" bson:"line1"`
	Line2      string `json:"line2" bson:"line2"`
	City       string `json:"city" bson:"city"`
	State      string `json:"state" bson:"state"`
	PostalCode string `json:"postal_code" bson:"postal_code"`
	Country    string `json:"country" bson:"country"`
}

type PaymentHistory struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID         primitive.ObjectID `json:"user_id" bson:"user_id"`
	PaymentID      primitive.ObjectID `json:"payment_id" bson:"payment_id"`
	Action         string             `json:"action" bson:"action"` // created, updated, succeeded, failed, refunded
	PreviousStatus PaymentStatus      `json:"previous_status" bson:"previous_status"`
	NewStatus      PaymentStatus      `json:"new_status" bson:"new_status"`
	Notes          string             `json:"notes" bson:"notes"`
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
}

// Common response structures
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data"`
	Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
	CurrentPage  int   `json:"current_page"`
	TotalPages   int   `json:"total_pages"`
	TotalItems   int64 `json:"total_items"`
	ItemsPerPage int   `json:"items_per_page"`
	HasNext      bool  `json:"has_next"`
	HasPrevious  bool  `json:"has_previous"`
}
