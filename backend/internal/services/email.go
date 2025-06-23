// backend/internal/services/email.go
package services

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"net/smtp"
	"onflix/internal/config"
	"strings"
)

type EmailService struct {
	config *config.Config
	auth   smtp.Auth
	client *smtp.Client
}

type EmailTemplate struct {
	Subject  string
	HTMLBody string
	TextBody string
}

type EmailData struct {
	Name            string
	Email           string
	Token           string
	ResetURL        string
	VerificationURL string
	Amount          float64
	Currency        string
	CompanyName     string
	SupportEmail    string
	AppURL          string
}

func NewEmailService(cfg *config.Config) *EmailService {
	auth := smtp.PlainAuth("", cfg.Email.SMTPUsername, cfg.Email.SMTPPassword, cfg.Email.SMTPHost)

	return &EmailService{
		config: cfg,
		auth:   auth,
	}
}

func (es *EmailService) Close() {
	if es.client != nil {
		es.client.Close()
	}
}

// Core email sending functionality
func (es *EmailService) sendEmail(to, subject, htmlBody, textBody string) error {
	from := es.config.Email.FromEmail

	// Prepare message
	msg := es.buildEmailMessage(from, to, subject, htmlBody, textBody)

	// Connect to SMTP server
	addr := fmt.Sprintf("%s:%s", es.config.Email.SMTPHost, es.config.Email.SMTPPort)

	// Create TLS connection
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         es.config.Email.SMTPHost,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %v", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, es.config.Email.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	// Authenticate
	if err = client.Auth(es.auth); err != nil {
		return fmt.Errorf("SMTP authentication failed: %v", err)
	}

	// Set sender and recipient
	if err = client.Mail(from); err != nil {
		return fmt.Errorf("failed to set sender: %v", err)
	}

	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %v", err)
	}

	// Send message
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to create data writer: %v", err)
	}

	_, err = writer.Write([]byte(msg))
	if err != nil {
		return fmt.Errorf("failed to write message: %v", err)
	}

	err = writer.Close()
	if err != nil {
		return fmt.Errorf("failed to close writer: %v", err)
	}

	return nil
}

func (es *EmailService) buildEmailMessage(from, to, subject, htmlBody, textBody string) string {
	var msg strings.Builder

	msg.WriteString(fmt.Sprintf("From: %s\r\n", from))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", to))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: multipart/alternative; boundary=boundary123\r\n")
	msg.WriteString("\r\n")

	// Text version
	if textBody != "" {
		msg.WriteString("--boundary123\r\n")
		msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
		msg.WriteString("\r\n")
		msg.WriteString(textBody)
		msg.WriteString("\r\n")
	}

	// HTML version
	if htmlBody != "" {
		msg.WriteString("--boundary123\r\n")
		msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
		msg.WriteString("\r\n")
		msg.WriteString(htmlBody)
		msg.WriteString("\r\n")
	}

	msg.WriteString("--boundary123--\r\n")

	return msg.String()
}

// Template processing
func (es *EmailService) processTemplate(templateStr string, data EmailData) (string, error) {
	tmpl, err := template.New("email").Parse(templateStr)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}

// Email sending methods used by controllers
func (es *EmailService) SendVerificationEmail(email, token string) error {
	data := EmailData{
		Email:           email,
		Token:           token,
		VerificationURL: fmt.Sprintf("%s/verify-email?token=%s", es.config.Server.AppURL, token),
		CompanyName:     "Netflix Clone",
		SupportEmail:    es.config.Email.FromEmail,
		AppURL:          es.config.Server.AppURL,
	}

	subject := "Verify Your Email Address"

	htmlTemplate := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #e50914;">Welcome to {{.CompanyName}}!</h1>
        
        <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{.VerificationURL}}" 
               style="background-color: #e50914; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
            </a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">{{.VerificationURL}}</p>
        
        <p>This verification link will expire in 24 hours.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
            If you didn't create an account with {{.CompanyName}}, you can safely ignore this email.
        </p>
        
        <p style="font-size: 12px; color: #666;">
            Need help? Contact us at <a href="mailto:{{.SupportEmail}}">{{.SupportEmail}}</a>
        </p>
    </div>
</body>
</html>`

	textTemplate := `Welcome to {{.CompanyName}}!

Thank you for signing up! To complete your registration, please verify your email address by visiting this link:

{{.VerificationURL}}

This verification link will expire in 24 hours.

If you didn't create an account with {{.CompanyName}}, you can safely ignore this email.

Need help? Contact us at {{.SupportEmail}}`

	htmlBody, err := es.processTemplate(htmlTemplate, data)
	if err != nil {
		return err
	}

	textBody, err := es.processTemplate(textTemplate, data)
	if err != nil {
		return err
	}

	return es.sendEmail(email, subject, htmlBody, textBody)
}

func (es *EmailService) SendPasswordResetEmail(email, token string) error {
	data := EmailData{
		Email:        email,
		Token:        token,
		ResetURL:     fmt.Sprintf("%s/reset-password?token=%s", es.config.Server.AppURL, token),
		CompanyName:  "Netflix Clone",
		SupportEmail: es.config.Email.FromEmail,
		AppURL:       es.config.Server.AppURL,
	}

	subject := "Reset Your Password"

	htmlTemplate := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #e50914;">Password Reset Request</h1>
        
        <p>We received a request to reset your password for your {{.CompanyName}} account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{.ResetURL}}" 
               style="background-color: #e50914; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
            </a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">{{.ResetURL}}</p>
        
        <p>This password reset link will expire in 1 hour for security reasons.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
        </p>
        
        <p style="font-size: 12px; color: #666;">
            Need help? Contact us at <a href="mailto:{{.SupportEmail}}">{{.SupportEmail}}</a>
        </p>
    </div>
</body>
</html>`

	textTemplate := `Password Reset Request

We received a request to reset your password for your {{.CompanyName}} account.

To reset your password, visit this link:
{{.ResetURL}}

This password reset link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

Need help? Contact us at {{.SupportEmail}}`

	htmlBody, err := es.processTemplate(htmlTemplate, data)
	if err != nil {
		return err
	}

	textBody, err := es.processTemplate(textTemplate, data)
	if err != nil {
		return err
	}

	return es.sendEmail(email, subject, htmlBody, textBody)
}

func (es *EmailService) SendWelcomeEmail(email, name string) error {
	data := EmailData{
		Email:        email,
		Name:         name,
		CompanyName:  "Netflix Clone",
		SupportEmail: es.config.Email.FromEmail,
		AppURL:       es.config.Server.AppURL,
	}

	subject := fmt.Sprintf("Welcome to %s, %s! 🎬", data.CompanyName, name)

	htmlTemplate := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #e50914;">Welcome to {{.CompanyName}}, {{.Name}}! 🎬</h1>
        
        <p>Congratulations! Your subscription is now active and you have access to thousands of movies and TV shows.</p>
        
        <h2 style="color: #333;">What's Next?</h2>
        <ul>
            <li>Create multiple profiles for your family</li>
            <li>Add movies and shows to your watchlist</li>
            <li>Enjoy unlimited streaming in HD and 4K</li>
            <li>Download content for offline viewing</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{.AppURL}}" 
               style="background-color: #e50914; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Start Watching Now
            </a>
        </div>
        
        <h3 style="color: #333;">Need Help?</h3>
        <p>Our support team is here to help you get the most out of your subscription.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
            Questions? Contact us at <a href="mailto:{{.SupportEmail}}">{{.SupportEmail}}</a>
        </p>
    </div>
</body>
</html>`

	textTemplate := `Welcome to {{.CompanyName}}, {{.Name}}!

Congratulations! Your subscription is now active and you have access to thousands of movies and TV shows.

What's Next?
- Create multiple profiles for your family
- Add movies and shows to your watchlist
- Enjoy unlimited streaming in HD and 4K
- Download content for offline viewing

Start watching now: {{.AppURL}}

Need Help?
Our support team is here to help you get the most out of your subscription.

Questions? Contact us at {{.SupportEmail}}`

	htmlBody, err := es.processTemplate(htmlTemplate, data)
	if err != nil {
		return err
	}

	textBody, err := es.processTemplate(textTemplate, data)
	if err != nil {
		return err
	}

	return es.sendEmail(email, subject, htmlBody, textBody)
}

func (es *EmailService) SendSubscriptionCancelledEmail(email, name string) error {
	data := EmailData{
		Email:        email,
		Name:         name,
		CompanyName:  "Netflix Clone",
		SupportEmail: es.config.Email.FromEmail,
		AppURL:       es.config.Server.AppURL,
	}

	subject := "Your Subscription Has Been Cancelled"

	htmlTemplate := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Subscription Cancelled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #e50914;">We're Sorry to See You Go, {{.Name}}</h1>
        
        <p>Your {{.CompanyName}} subscription has been successfully cancelled.</p>
        
        <h3 style="color: #333;">What Happens Next?</h3>
        <ul>
            <li>You'll continue to have access until the end of your current billing period</li>
            <li>No further charges will be made to your payment method</li>
            <li>Your account and watchlist will be saved for 10 months</li>
        </ul>
        
        <h3 style="color: #333;">Changed Your Mind?</h3>
        <p>You can reactivate your subscription anytime before your access expires.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{.AppURL}}/subscribe" 
               style="background-color: #e50914; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reactivate Subscription
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
            Questions? Contact us at <a href="mailto:{{.SupportEmail}}">{{.SupportEmail}}</a>
        </p>
    </div>
</body>
</html>`

	textTemplate := `We're Sorry to See You Go, {{.Name}}

Your {{.CompanyName}} subscription has been successfully cancelled.

What Happens Next?
- You'll continue to have access until the end of your current billing period
- No further charges will be made to your payment method
- Your account and watchlist will be saved for 10 months

Changed Your Mind?
You can reactivate your subscription anytime before your access expires.

Reactivate: {{.AppURL}}/subscribe

Questions? Contact us at {{.SupportEmail}}`

	htmlBody, err := es.processTemplate(htmlTemplate, data)
	if err != nil {
		return err
	}

	textBody, err := es.processTemplate(textTemplate, data)
	if err != nil {
		return err
	}

	return es.sendEmail(email, subject, htmlBody, textBody)
}

func (es *EmailService) SendPaymentConfirmationEmail(email, name string, amount float64, currency string) error {
	data := EmailData{
		Email:        email,
		Name:         name,
		Amount:       amount,
		Currency:     strings.ToUpper(currency),
		CompanyName:  "Netflix Clone",
		SupportEmail: es.config.Email.FromEmail,
		AppURL:       es.config.Server.AppURL,
	}

	subject := "Payment Confirmation"

	htmlTemplate := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #e50914;">Payment Received</h1>
        
        <p>Hi {{.Name}},</p>
        
        <p>Thank you for your payment! We've successfully processed your subscription payment.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
            <p><strong>Amount:</strong> {{.Currency}} {{printf "%.2f" .Amount}}</p>
            <p><strong>Status:</strong> <span style="color: #28a745;">Paid</span></p>
        </div>
        
        <p>Your subscription remains active and you can continue enjoying unlimited streaming.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{.AppURL}}" 
               style="background-color: #e50914; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Continue Watching
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
            Questions about your payment? Contact us at <a href="mailto:{{.SupportEmail}}">{{.SupportEmail}}</a>
        </p>
    </div>
</body>
</html>`

	textTemplate := `Payment Received

Hi {{.Name}},

Thank you for your payment! We've successfully processed your subscription payment.

Payment Details:
Amount: {{.Currency}} {{printf "%.2f" .Amount}}
Status: Paid

Your subscription remains active and you can continue enjoying unlimited streaming.

Continue watching: {{.AppURL}}

Questions about your payment? Contact us at {{.SupportEmail}}`

	htmlBody, err := es.processTemplate(htmlTemplate, data)
	if err != nil {
		return err
	}

	textBody, err := es.processTemplate(textTemplate, data)
	if err != nil {
		return err
	}

	return es.sendEmail(email, subject, htmlBody, textBody)
}

func (es *EmailService) SendPaymentFailedEmail(email, name string, amount float64, currency string) error {
	data := EmailData{
		Email:        email,
		Name:         name,
		Amount:       amount,
		Currency:     strings.ToUpper(currency),
		CompanyName:  "Netflix Clone",
		SupportEmail: es.config.Email.FromEmail,
		AppURL:       es.config.Server.AppURL,
	}

	subject := "Payment Failed - Action Required"

	htmlTemplate := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Failed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc3545;">Payment Failed</h1>
        
        <p>Hi {{.Name}},</p>
        
        <p>We were unable to process your subscription payment. Your account is still active, but please update your payment information to avoid service interruption.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="margin-top: 0; color: #721c24;">Payment Details</h3>
            <p><strong>Amount:</strong> {{.Currency}} {{printf "%.2f" .Amount}}</p>
            <p><strong>Status:</strong> <span style="color: #dc3545;">Failed</span></p>
        </div>
        
        <h3 style="color: #333;">What You Need to Do:</h3>
        <ol>
            <li>Check that your payment method has sufficient funds</li>
            <li>Verify your payment information is up to date</li>
            <li>Update your payment method if necessary</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{.AppURL}}/account/payment" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Update Payment Method
            </a>
        </div>
        
        <p><strong>Important:</strong> If payment isn't updated within 7 days, your account may be suspended.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
            Need help? Contact us at <a href="mailto:{{.SupportEmail}}">{{.SupportEmail}}</a>
        </p>
    </div>
</body>
</html>`

	textTemplate := `Payment Failed - Action Required

Hi {{.Name}},

We were unable to process your subscription payment. Your account is still active, but please update your payment information to avoid service interruption.

Payment Details:
Amount: {{.Currency}} {{printf "%.2f" .Amount}}
Status: Failed

What You Need to Do:
1. Check that your payment method has sufficient funds
2. Verify your payment information is up to date
3. Update your payment method if necessary

Update payment method: {{.AppURL}}/account/payment

Important: If payment isn't updated within 7 days, your account may be suspended.

Need help? Contact us at {{.SupportEmail}}`

	htmlBody, err := es.processTemplate(htmlTemplate, data)
	if err != nil {
		return err
	}

	textBody, err := es.processTemplate(textTemplate, data)
	if err != nil {
		return err
	}

	return es.sendEmail(email, subject, htmlBody, textBody)
}

func (es *EmailService) SendPaymentMethodAddedEmail(email, name string) error {
	data := EmailData{
		Email:        email,
		Name:         name,
		CompanyName:  "Netflix Clone",
		SupportEmail: es.config.Email.FromEmail,
		AppURL:       es.config.Server.AppURL,
	}

	subject := "Payment Method Added"

	htmlTemplate := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Method Added</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #e50914;">Payment Method Added</h1>
        
        <p>Hi {{.Name}},</p>
        
        <p>A new payment method has been successfully added to your {{.CompanyName}} account.</p>
        
        <p>If you didn't make this change, please contact our support team immediately.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{.AppURL}}/account/payment" 
               style="background-color: #e50914; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Manage Payment Methods
            </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
            Questions? Contact us at <a href="mailto:{{.SupportEmail}}">{{.SupportEmail}}</a>
        </p>
    </div>
</body>
</html>`

	textTemplate := `Payment Method Added

Hi {{.Name}},

A new payment method has been successfully added to your {{.CompanyName}} account.

If you didn't make this change, please contact our support team immediately.

Manage payment methods: {{.AppURL}}/account/payment

Questions? Contact us at {{.SupportEmail}}`

	htmlBody, err := es.processTemplate(htmlTemplate, data)
	if err != nil {
		return err
	}

	textBody, err := es.processTemplate(textTemplate, data)
	if err != nil {
		return err
	}

	return es.sendEmail(email, subject, htmlBody, textBody)
}

// Utility methods for bulk operations
func (es *EmailService) SendBulkEmail(emails []string, subject, htmlBody, textBody string) error {
	for _, email := range emails {
		if err := es.sendEmail(email, subject, htmlBody, textBody); err != nil {
			// Log error but continue with other emails
			fmt.Printf("Failed to send email to %s: %v\n", email, err)
		}
	}
	return nil
}

// Test email connectivity
func (es *EmailService) TestConnection() error {
	addr := fmt.Sprintf("%s:%s", es.config.Email.SMTPHost, es.config.Email.SMTPPort)

	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         es.config.Email.SMTPHost,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %v", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, es.config.Email.SMTPHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	if err = client.Auth(es.auth); err != nil {
		return fmt.Errorf("SMTP authentication failed: %v", err)
	}

	return nil
}
