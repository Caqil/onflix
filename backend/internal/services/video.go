// backend/internal/services/video.go
package services

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/url"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"onflix/internal/config"
	"onflix/internal/models"

	"go.mongodb.org/mongo-driver/mongo"
)

type VideoService struct {
	config *config.Config
	db     *mongo.Database
}

type StreamingToken struct {
	UserID      string    `json:"user_id"`
	ContentID   string    `json:"content_id"`
	Quality     string    `json:"quality"`
	ExpiresAt   time.Time `json:"expires_at"`
	Signature   string    `json:"signature"`
	TokenString string    `json:"token"`
}

type VideoMetrics struct {
	ContentID     string        `json:"content_id"`
	UserID        string        `json:"user_id"`
	Quality       string        `json:"quality"`
	WatchDuration time.Duration `json:"watch_duration"`
	TotalDuration time.Duration `json:"total_duration"`
	BufferEvents  int           `json:"buffer_events"`
	BitrateKbps   int           `json:"bitrate_kbps"`
	CDNNode       string        `json:"cdn_node"`
	ClientIP      string        `json:"client_ip"`
	UserAgent     string        `json:"user_agent"`
	Timestamp     time.Time     `json:"timestamp"`
}

type HLSPlaylist struct {
	Version        int           `json:"version"`
	Sequences      []HLSSequence `json:"sequences"`
	TargetDuration int           `json:"target_duration"`
	EndList        bool          `json:"end_list"`
	PlaylistType   string        `json:"playlist_type"`
	Variants       []HLSVariant  `json:"variants,omitempty"`
}

type HLSSequence struct {
	Duration float64 `json:"duration"`
	URI      string  `json:"uri"`
	Sequence int     `json:"sequence"`
}

type HLSVariant struct {
	Bandwidth  int    `json:"bandwidth"`
	Resolution string `json:"resolution"`
	Codecs     string `json:"codecs"`
	URI        string `json:"uri"`
}

type DASHManifest struct {
	Type           string              `json:"type"`
	MediaDuration  string              `json:"media_duration"`
	MinBufferTime  string              `json:"min_buffer_time"`
	Profiles       string              `json:"profiles"`
	AdaptationSets []DASHAdaptationSet `json:"adaptation_sets"`
}

type DASHAdaptationSet struct {
	ID                 string               `json:"id"`
	ContentType        string               `json:"content_type"`
	SegmentAlignment   bool                 `json:"segment_alignment"`
	BitstreamSwitching bool                 `json:"bitstream_switching"`
	Representations    []DASHRepresentation `json:"representations"`
}

type DASHRepresentation struct {
	ID        string `json:"id"`
	Bandwidth int    `json:"bandwidth"`
	Width     int    `json:"width,omitempty"`
	Height    int    `json:"height,omitempty"`
	FrameRate string `json:"frame_rate,omitempty"`
	Codecs    string `json:"codecs"`
	BaseURL   string `json:"base_url"`
}

func NewVideoService(cfg *config.Config, db *mongo.Database) *VideoService {
	return &VideoService{
		config: cfg,
		db:     db,
	}
}

func (vs *VideoService) Close() {
	// Cleanup resources if needed
}

// Streaming URL Generation
func (vs *VideoService) GenerateStreamingURL(videoFileURL, userID string) (string, error) {
	if videoFileURL == "" || userID == "" {
		return "", fmt.Errorf("video URL and user ID are required")
	}

	// Parse the original URL
	parsedURL, err := url.Parse(videoFileURL)
	if err != nil {
		return "", fmt.Errorf("invalid video URL: %v", err)
	}

	// Generate signed URL parameters
	expiration := time.Now().Add(6 * time.Hour) // 6 hour expiration
	signature, err := vs.generateSignature(videoFileURL, userID, expiration)
	if err != nil {
		return "", fmt.Errorf("failed to generate signature: %v", err)
	}

	// Add security parameters
	query := parsedURL.Query()
	query.Set("user_id", userID)
	query.Set("expires", strconv.FormatInt(expiration.Unix(), 10))
	query.Set("signature", signature)
	query.Set("token", vs.generateAccessToken(userID, expiration))

	parsedURL.RawQuery = query.Encode()

	return parsedURL.String(), nil
}

func (vs *VideoService) GenerateStreamingToken(contentID, userID string) (string, error) {
	if contentID == "" || userID == "" {
		return "", fmt.Errorf("content ID and user ID are required")
	}

	token := &StreamingToken{
		UserID:    userID,
		ContentID: contentID,
		Quality:   "auto",
		ExpiresAt: time.Now().Add(6 * time.Hour),
	}

	// Generate token string
	tokenData := fmt.Sprintf("%s:%s:%s:%d", token.UserID, token.ContentID, token.Quality, token.ExpiresAt.Unix())
	tokenBytes := []byte(tokenData)

	// Create signature
	signature, err := vs.signData(tokenBytes)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %v", err)
	}

	token.Signature = signature
	token.TokenString = base64.URLEncoding.EncodeToString(append(tokenBytes, []byte(":"+signature)...))

	return token.TokenString, nil
}

func (vs *VideoService) ValidateStreamingToken(tokenString string) (*StreamingToken, error) {
	// Decode token
	tokenBytes, err := base64.URLEncoding.DecodeString(tokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid token format: %v", err)
	}

	// Parse token components
	tokenStr := string(tokenBytes)
	parts := strings.Split(tokenStr, ":")
	if len(parts) != 5 {
		return nil, fmt.Errorf("invalid token structure")
	}

	userID := parts[0]
	contentID := parts[1]
	quality := parts[2]
	expiresAt, err := strconv.ParseInt(parts[3], 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid expiration time: %v", err)
	}
	signature := parts[4]

	// Check expiration
	if time.Now().Unix() > expiresAt {
		return nil, fmt.Errorf("token expired")
	}

	// Verify signature
	tokenData := fmt.Sprintf("%s:%s:%s:%d", userID, contentID, quality, expiresAt)
	expectedSignature, err := vs.signData([]byte(tokenData))
	if err != nil {
		return nil, fmt.Errorf("failed to verify signature: %v", err)
	}

	if signature != expectedSignature {
		return nil, fmt.Errorf("invalid token signature")
	}

	return &StreamingToken{
		UserID:      userID,
		ContentID:   contentID,
		Quality:     quality,
		ExpiresAt:   time.Unix(expiresAt, 0),
		Signature:   signature,
		TokenString: tokenString,
	}, nil
}

// HLS Playlist Generation
func (vs *VideoService) GenerateHLSPlaylist(videoFileURL string, quality models.VideoQuality) (*HLSPlaylist, error) {
	playlist := &HLSPlaylist{
		Version:        3,
		TargetDuration: 10,
		PlaylistType:   "VOD",
		EndList:        true,
	}

	// Generate base URL without file extension
	baseURL := strings.TrimSuffix(videoFileURL, filepath.Ext(videoFileURL))

	// Generate segments (simulate 10-second segments)
	totalDuration := 7200 // 2 hours in seconds (example)
	segmentDuration := 10
	numSegments := totalDuration / segmentDuration

	for i := 0; i < numSegments; i++ {
		sequence := HLSSequence{
			Duration: float64(segmentDuration),
			URI:      fmt.Sprintf("%s_%s_seg_%d.ts", baseURL, quality, i),
			Sequence: i,
		}
		playlist.Sequences = append(playlist.Sequences, sequence)
	}

	return playlist, nil
}

func (vs *VideoService) GenerateHLSMasterPlaylist(videoFileURL string, availableQualities []models.VideoQuality) (*HLSPlaylist, error) {
	playlist := &HLSPlaylist{
		Version: 3,
	}

	baseURL := strings.TrimSuffix(videoFileURL, filepath.Ext(videoFileURL))

	// Quality to bitrate mapping
	qualityBandwidth := map[models.VideoQuality]int{
		models.Quality480p:  1000000,  // 1 Mbps
		models.Quality720p:  3000000,  // 3 Mbps
		models.Quality1080p: 6000000,  // 6 Mbps
		models.Quality4K:    15000000, // 15 Mbps
	}

	qualityResolution := map[models.VideoQuality]string{
		models.Quality480p:  "854x480",
		models.Quality720p:  "1280x720",
		models.Quality1080p: "1920x1080",
		models.Quality4K:    "3840x2160",
	}

	for _, quality := range availableQualities {
		variant := HLSVariant{
			Bandwidth:  qualityBandwidth[quality],
			Resolution: qualityResolution[quality],
			Codecs:     "avc1.42E01E,mp4a.40.2",
			URI:        fmt.Sprintf("%s_%s.m3u8", baseURL, quality),
		}
		playlist.Variants = append(playlist.Variants, variant)
	}

	return playlist, nil
}

// DASH Manifest Generation
func (vs *VideoService) GenerateDASHManifest(videoFileURL string, availableQualities []models.VideoQuality) (*DASHManifest, error) {
	manifest := &DASHManifest{
		Type:          "static",
		MediaDuration: "PT2H0M0S", // 2 hours
		MinBufferTime: "PT2S",     // 2 seconds
		Profiles:      "urn:mpeg:dash:profile:isoff-main:2011",
	}

	baseURL := strings.TrimSuffix(videoFileURL, filepath.Ext(videoFileURL))

	// Video adaptation set
	videoAdaptationSet := DASHAdaptationSet{
		ID:                 "video",
		ContentType:        "video",
		SegmentAlignment:   true,
		BitstreamSwitching: true,
	}

	qualityBandwidth := map[models.VideoQuality]int{
		models.Quality480p:  1000000,
		models.Quality720p:  3000000,
		models.Quality1080p: 6000000,
		models.Quality4K:    15000000,
	}

	qualityDimensions := map[models.VideoQuality][2]int{
		models.Quality480p:  {854, 480},
		models.Quality720p:  {1280, 720},
		models.Quality1080p: {1920, 1080},
		models.Quality4K:    {3840, 2160},
	}

	for i, quality := range availableQualities {
		dimensions := qualityDimensions[quality]
		representation := DASHRepresentation{
			ID:        fmt.Sprintf("video_%d", i),
			Bandwidth: qualityBandwidth[quality],
			Width:     dimensions[0],
			Height:    dimensions[1],
			FrameRate: "24000/1001",
			Codecs:    "avc1.42E01E",
			BaseURL:   fmt.Sprintf("%s_%s.mpd", baseURL, quality),
		}
		videoAdaptationSet.Representations = append(videoAdaptationSet.Representations, representation)
	}

	// Audio adaptation set
	audioAdaptationSet := DASHAdaptationSet{
		ID:                 "audio",
		ContentType:        "audio",
		SegmentAlignment:   true,
		BitstreamSwitching: true,
		Representations: []DASHRepresentation{
			{
				ID:        "audio_0",
				Bandwidth: 128000,
				Codecs:    "mp4a.40.2",
				BaseURL:   fmt.Sprintf("%s_audio.mpd", baseURL),
			},
		},
	}

	manifest.AdaptationSets = []DASHAdaptationSet{videoAdaptationSet, audioAdaptationSet}

	return manifest, nil
}

// Video Analytics and Metrics
func (vs *VideoService) RecordVideoMetrics(metrics VideoMetrics) error {
	// Store metrics in database for analytics
	// In production, you might use a time-series database or analytics service

	// Basic validation
	if metrics.ContentID == "" || metrics.UserID == "" {
		return fmt.Errorf("content ID and user ID are required")
	}

	// Set timestamp if not provided
	if metrics.Timestamp.IsZero() {
		metrics.Timestamp = time.Now()
	}

	// Store in MongoDB (simplified)
	_, err := vs.db.Collection("video_metrics").InsertOne(nil, metrics)
	return err
}

func (vs *VideoService) GetVideoAnalytics(contentID string, startDate, endDate time.Time) (map[string]interface{}, error) {
	// Aggregate video metrics for analytics
	analytics := map[string]interface{}{
		"content_id":       contentID,
		"total_views":      0,
		"total_watch_time": 0,
		"average_quality":  "720p",
		"buffer_ratio":     0.05,
		"completion_rate":  0.75,
		"unique_viewers":   0,
		"peak_concurrent":  0,
	}

	// In production, implement proper aggregation queries
	return analytics, nil
}

// Quality Adaptation
func (vs *VideoService) GetOptimalQuality(userBandwidth int, deviceCapabilities map[string]interface{}) models.VideoQuality {
	// Simple bandwidth-based quality selection
	switch {
	case userBandwidth >= 15000000: // 15 Mbps
		if deviceCapabilities["4k_support"] == true {
			return models.Quality4K
		}
		return models.Quality1080p
	case userBandwidth >= 6000000: // 6 Mbps
		return models.Quality1080p
	case userBandwidth >= 3000000: // 3 Mbps
		return models.Quality720p
	default:
		return models.Quality480p
	}
}

func (vs *VideoService) AdaptQualityBasedOnConditions(currentQuality models.VideoQuality, bufferHealth float64, bandwidth int) models.VideoQuality {
	// Adaptive bitrate logic
	if bufferHealth < 0.1 && bandwidth < 3000000 { // Low buffer and bandwidth
		// Step down quality
		switch currentQuality {
		case models.Quality4K:
			return models.Quality1080p
		case models.Quality1080p:
			return models.Quality720p
		case models.Quality720p:
			return models.Quality480p
		default:
			return currentQuality
		}
	} else if bufferHealth > 0.8 && bandwidth > 6000000 { // Good buffer and bandwidth
		// Step up quality
		switch currentQuality {
		case models.Quality480p:
			return models.Quality720p
		case models.Quality720p:
			return models.Quality1080p
		case models.Quality1080p:
			return models.Quality4K
		default:
			return currentQuality
		}
	}

	return currentQuality
}

// Subtitle Management
func (vs *VideoService) GenerateSubtitlePlaylist(subtitles []models.Subtitle) map[string]string {
	playlist := make(map[string]string)

	for _, subtitle := range subtitles {
		playlist[subtitle.Language] = subtitle.FileURL
	}

	return playlist
}

func (vs *VideoService) ConvertSubtitleFormat(inputFormat, outputFormat, content string) (string, error) {
	// Basic subtitle format conversion
	// In production, use a proper subtitle library

	switch inputFormat {
	case "srt":
		if outputFormat == "vtt" {
			return vs.convertSRTtoVTT(content), nil
		}
	case "vtt":
		if outputFormat == "srt" {
			return vs.convertVTTtoSRT(content), nil
		}
	}

	return content, nil
}

// Content Delivery Network (CDN) Integration
func (vs *VideoService) GetCDNURL(originalURL, userLocation string) string {
	// Simple CDN URL generation based on user location
	// In production, integrate with actual CDN service (CloudFront, CloudFlare, etc.)

	cdnDomains := map[string]string{
		"US": "us-cdn.example.com",
		"EU": "eu-cdn.example.com",
		"AS": "asia-cdn.example.com",
	}

	region := "US" // Default
	if userLocation != "" {
		// Simple location to region mapping
		if strings.Contains(userLocation, "EU") || strings.Contains(userLocation, "Europe") {
			region = "EU"
		} else if strings.Contains(userLocation, "AS") || strings.Contains(userLocation, "Asia") {
			region = "AS"
		}
	}

	if cdnDomain, exists := cdnDomains[region]; exists {
		parsedURL, err := url.Parse(originalURL)
		if err == nil {
			parsedURL.Host = cdnDomain
			return parsedURL.String()
		}
	}

	return originalURL
}

// DRM Integration (simplified)
func (vs *VideoService) GenerateDRMLicense(contentID, userID string) (map[string]string, error) {
	// Simplified DRM license generation
	// In production, integrate with actual DRM services (Widevine, FairPlay, PlayReady)

	license := map[string]string{
		"license_url": fmt.Sprintf("https://drm.example.com/license/%s", contentID),
		"key_id":      vs.generateKeyID(contentID),
		"key":         vs.generateEncryptionKey(contentID, userID),
		"expires_at":  time.Now().Add(24 * time.Hour).Format(time.RFC3339),
	}

	return license, nil
}

// Helper methods
func (vs *VideoService) generateSignature(videoURL, userID string, expiration time.Time) (string, error) {
	message := fmt.Sprintf("%s:%s:%d", videoURL, userID, expiration.Unix())
	return vs.signData([]byte(message))
}

func (vs *VideoService) signData(data []byte) (string, error) {
	key := []byte(vs.config.JWT.Secret) // Use JWT secret as signing key
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return hex.EncodeToString(h.Sum(nil)), nil
}

func (vs *VideoService) generateAccessToken(userID string, expiration time.Time) string {
	data := fmt.Sprintf("%s:%d", userID, expiration.Unix())
	return base64.URLEncoding.EncodeToString([]byte(data))
}

func (vs *VideoService) generateKeyID(contentID string) string {
	h := sha256.New()
	h.Write([]byte(contentID))
	return hex.EncodeToString(h.Sum(nil))[:16]
}

func (vs *VideoService) generateEncryptionKey(contentID, userID string) string {
	h := sha256.New()
	h.Write([]byte(contentID + userID + vs.config.JWT.Secret))
	return hex.EncodeToString(h.Sum(nil))[:32]
}

func (vs *VideoService) generateRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Subtitle conversion helpers
func (vs *VideoService) convertSRTtoVTT(srtContent string) string {
	// Basic SRT to VTT conversion
	vttContent := "WEBVTT\n\n"

	lines := strings.Split(srtContent, "\n")
	for _, line := range lines {
		// Convert timestamp format
		if strings.Contains(line, " --> ") {
			line = strings.ReplaceAll(line, ",", ".")
		}
		vttContent += line + "\n"
	}

	return vttContent
}

func (vs *VideoService) convertVTTtoSRT(vttContent string) string {
	// Basic VTT to SRT conversion
	lines := strings.Split(vttContent, "\n")
	srtContent := ""
	counter := 1

	for i, line := range lines {
		if line == "WEBVTT" {
			continue
		}

		if strings.Contains(line, " --> ") {
			srtContent += fmt.Sprintf("%d\n", counter)
			counter++
			line = strings.ReplaceAll(line, ".", ",")
		}

		if i > 0 {
			srtContent += line + "\n"
		}
	}

	return srtContent
}

// Video processing status
func (vs *VideoService) GetProcessingStatus(videoID string) (map[string]interface{}, error) {
	status := map[string]interface{}{
		"video_id":            videoID,
		"status":              "completed",
		"progress":            100,
		"qualities_available": []string{"480p", "720p", "1080p"},
		"duration":            7200,
		"file_size":           2048000000, // 2GB
		"created_at":          time.Now().Add(-2 * time.Hour),
		"updated_at":          time.Now(),
	}

	return status, nil
}

// Bandwidth estimation
func (vs *VideoService) EstimateBandwidth(downloadSize int64, downloadTime time.Duration) int {
	if downloadTime == 0 {
		return 0
	}

	// Calculate bandwidth in bits per second
	bitsDownloaded := downloadSize * 8
	seconds := downloadTime.Seconds()

	return int(float64(bitsDownloaded) / seconds)
}

// Health check
func (vs *VideoService) HealthCheck() error {
	// Test video service health
	// Check CDN connectivity, DRM services, etc.
	return nil
}
