// backend/internal/services/storage.go
package services

import (
	"bytes"
	"crypto/md5"
	"fmt"
	"io"
	"mime"
	"onflix/internal/config"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type StorageService struct {
	config       *config.Config
	basePath     string
	maxSize      int64 // Maximum file size in bytes
	allowedTypes map[string]bool
}

type StorageConfig struct {
	BasePath     string
	MaxFileSize  int64
	AllowedTypes []string
}

type FileMetadata struct {
	FileName     string    `json:"file_name"`
	OriginalName string    `json:"original_name"`
	Size         int64     `json:"size"`
	ContentType  string    `json:"content_type"`
	Extension    string    `json:"extension"`
	MD5Hash      string    `json:"md5_hash"`
	StoragePath  string    `json:"storage_path"`
	PublicURL    string    `json:"public_url"`
	UploadedAt   time.Time `json:"uploaded_at"`
}

type UploadResult struct {
	Success  bool          `json:"success"`
	Message  string        `json:"message"`
	Metadata *FileMetadata `json:"metadata,omitempty"`
	Error    string        `json:"error,omitempty"`
}

func NewStorageService(cfg *config.Config) *StorageService {
	// Default configuration
	basePath := "./uploads"
	if cfg.Storage.BasePath != "" {
		basePath = cfg.Storage.BasePath
	}

	maxSize := int64(500 * 1024 * 1024) // 500MB default
	if cfg.Storage.MaxFileSize > 0 {
		maxSize = cfg.Storage.MaxFileSize
	}

	// Default allowed file types
	allowedTypes := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
		".mp4":  true,
		".avi":  true,
		".mov":  true,
		".mkv":  true,
		".webm": true,
		".srt":  true,
		".vtt":  true,
		".pdf":  true,
		".txt":  true,
	}

	// Override with config if provided
	if len(cfg.Storage.AllowedTypes) > 0 {
		allowedTypes = make(map[string]bool)
		for _, ext := range cfg.Storage.AllowedTypes {
			allowedTypes[strings.ToLower(ext)] = true
		}
	}

	// Ensure base directory exists
	if err := os.MkdirAll(basePath, 0755); err != nil {
		fmt.Printf("Warning: Could not create storage directory %s: %v\n", basePath, err)
	}

	return &StorageService{
		config:       cfg,
		basePath:     basePath,
		maxSize:      maxSize,
		allowedTypes: allowedTypes,
	}
}

func (ss *StorageService) Close() {
	// Cleanup if needed
}

// Main file upload method
func (ss *StorageService) UploadFile(relativePath string, fileData []byte) (string, error) {
	// Validate file size
	if int64(len(fileData)) > ss.maxSize {
		return "", fmt.Errorf("file size exceeds maximum allowed size of %d bytes", ss.maxSize)
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(relativePath))
	if !ss.allowedTypes[ext] {
		return "", fmt.Errorf("file type %s is not allowed", ext)
	}

	// Generate unique filename
	fileName := ss.generateUniqueFileName(relativePath)
	fullPath := filepath.Join(ss.basePath, fileName)

	// Ensure directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("failed to create directory: %v", err)
	}

	// Write file
	if err := os.WriteFile(fullPath, fileData, 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %v", err)
	}

	// Generate public URL
	publicURL := ss.generatePublicURL(fileName)

	return publicURL, nil
}

// Upload with metadata
func (ss *StorageService) UploadFileWithMetadata(originalName, relativePath string, fileData []byte) (*UploadResult, error) {
	// Validate file size
	if int64(len(fileData)) > ss.maxSize {
		return &UploadResult{
			Success: false,
			Error:   fmt.Sprintf("file size exceeds maximum allowed size of %d bytes", ss.maxSize),
		}, nil
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(originalName))
	if !ss.allowedTypes[ext] {
		return &UploadResult{
			Success: false,
			Error:   fmt.Sprintf("file type %s is not allowed", ext),
		}, nil
	}

	// Generate unique filename
	fileName := ss.generateUniqueFileName(relativePath)
	fullPath := filepath.Join(ss.basePath, fileName)

	// Ensure directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return &UploadResult{
			Success: false,
			Error:   fmt.Sprintf("failed to create directory: %v", err),
		}, nil
	}

	// Calculate MD5 hash
	hash := md5.Sum(fileData)
	md5Hash := fmt.Sprintf("%x", hash)

	// Detect content type
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Write file
	if err := os.WriteFile(fullPath, fileData, 0644); err != nil {
		return &UploadResult{
			Success: false,
			Error:   fmt.Sprintf("failed to write file: %v", err),
		}, nil
	}

	// Create metadata
	metadata := &FileMetadata{
		FileName:     fileName,
		OriginalName: originalName,
		Size:         int64(len(fileData)),
		ContentType:  contentType,
		Extension:    ext,
		MD5Hash:      md5Hash,
		StoragePath:  fullPath,
		PublicURL:    ss.generatePublicURL(fileName),
		UploadedAt:   time.Now(),
	}

	return &UploadResult{
		Success:  true,
		Message:  "File uploaded successfully",
		Metadata: metadata,
	}, nil
}

// Specialized upload methods
func (ss *StorageService) UploadAvatar(userID string, imageData []byte) (string, error) {
	// Validate it's an image
	ext := ss.detectImageFormat(imageData)
	if ext == "" {
		return "", fmt.Errorf("invalid image format")
	}

	relativePath := fmt.Sprintf("avatars/%s%s", userID, ext)
	return ss.UploadFile(relativePath, imageData)
}

func (ss *StorageService) UploadVideo(contentID string, videoData []byte, quality string) (string, error) {
	// Detect video format
	ext := ss.detectVideoFormat(videoData)
	if ext == "" {
		return "", fmt.Errorf("invalid video format")
	}

	relativePath := fmt.Sprintf("videos/%s/%s%s", contentID, quality, ext)
	return ss.UploadFile(relativePath, videoData)
}

func (ss *StorageService) UploadSubtitle(contentID, language string, subtitleData []byte) (string, error) {
	// Detect subtitle format
	ext := ss.detectSubtitleFormat(subtitleData)
	if ext == "" {
		ext = ".srt" // Default to SRT
	}

	relativePath := fmt.Sprintf("subtitles/%s/%s%s", contentID, language, ext)
	return ss.UploadFile(relativePath, subtitleData)
}

func (ss *StorageService) UploadThumbnail(contentID string, imageData []byte) (string, error) {
	ext := ss.detectImageFormat(imageData)
	if ext == "" {
		return "", fmt.Errorf("invalid image format")
	}

	relativePath := fmt.Sprintf("thumbnails/%s%s", contentID, ext)
	return ss.UploadFile(relativePath, imageData)
}

// File operations
func (ss *StorageService) GetFile(filePath string) ([]byte, error) {
	fullPath := filepath.Join(ss.basePath, filePath)

	// Security check - ensure path is within base directory
	if !strings.HasPrefix(fullPath, ss.basePath) {
		return nil, fmt.Errorf("invalid file path")
	}

	data, err := os.ReadFile(fullPath)
	if err != nil {
		return nil, fmt.Errorf("file not found or cannot be read: %v", err)
	}

	return data, nil
}

func (ss *StorageService) DeleteFile(filePath string) error {
	fullPath := filepath.Join(ss.basePath, filePath)

	// Security check
	if !strings.HasPrefix(fullPath, ss.basePath) {
		return fmt.Errorf("invalid file path")
	}

	if err := os.Remove(fullPath); err != nil {
		return fmt.Errorf("failed to delete file: %v", err)
	}

	return nil
}

func (ss *StorageService) FileExists(filePath string) bool {
	fullPath := filepath.Join(ss.basePath, filePath)

	if !strings.HasPrefix(fullPath, ss.basePath) {
		return false
	}

	_, err := os.Stat(fullPath)
	return !os.IsNotExist(err)
}

func (ss *StorageService) GetFileInfo(filePath string) (*FileMetadata, error) {
	fullPath := filepath.Join(ss.basePath, filePath)

	if !strings.HasPrefix(fullPath, ss.basePath) {
		return nil, fmt.Errorf("invalid file path")
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		return nil, fmt.Errorf("file not found: %v", err)
	}

	ext := strings.ToLower(filepath.Ext(filePath))
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Calculate MD5 if file is small enough
	var md5Hash string
	if info.Size() < 100*1024*1024 { // Only for files < 100MB
		data, err := os.ReadFile(fullPath)
		if err == nil {
			hash := md5.Sum(data)
			md5Hash = fmt.Sprintf("%x", hash)
		}
	}

	metadata := &FileMetadata{
		FileName:     filepath.Base(filePath),
		OriginalName: filepath.Base(filePath),
		Size:         info.Size(),
		ContentType:  contentType,
		Extension:    ext,
		MD5Hash:      md5Hash,
		StoragePath:  fullPath,
		PublicURL:    ss.generatePublicURL(filePath),
		UploadedAt:   info.ModTime(),
	}

	return metadata, nil
}

// Batch operations
func (ss *StorageService) UploadMultipleFiles(files map[string][]byte) (map[string]*UploadResult, error) {
	results := make(map[string]*UploadResult)

	for filePath, fileData := range files {
		result, err := ss.UploadFileWithMetadata(filepath.Base(filePath), filePath, fileData)
		if err != nil {
			results[filePath] = &UploadResult{
				Success: false,
				Error:   err.Error(),
			}
		} else {
			results[filePath] = result
		}
	}

	return results, nil
}

func (ss *StorageService) DeleteMultipleFiles(filePaths []string) map[string]error {
	results := make(map[string]error)

	for _, filePath := range filePaths {
		err := ss.DeleteFile(filePath)
		results[filePath] = err
	}

	return results
}

// Directory operations
func (ss *StorageService) CreateDirectory(dirPath string) error {
	fullPath := filepath.Join(ss.basePath, dirPath)

	if !strings.HasPrefix(fullPath, ss.basePath) {
		return fmt.Errorf("invalid directory path")
	}

	return os.MkdirAll(fullPath, 0755)
}

func (ss *StorageService) ListFiles(dirPath string) ([]FileMetadata, error) {
	fullPath := filepath.Join(ss.basePath, dirPath)

	if !strings.HasPrefix(fullPath, ss.basePath) {
		return nil, fmt.Errorf("invalid directory path")
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %v", err)
	}

	var files []FileMetadata
	for _, entry := range entries {
		if !entry.IsDir() {
			info, err := entry.Info()
			if err != nil {
				continue
			}

			relativePath := filepath.Join(dirPath, entry.Name())
			ext := strings.ToLower(filepath.Ext(entry.Name()))
			contentType := mime.TypeByExtension(ext)
			if contentType == "" {
				contentType = "application/octet-stream"
			}

			metadata := FileMetadata{
				FileName:     entry.Name(),
				OriginalName: entry.Name(),
				Size:         info.Size(),
				ContentType:  contentType,
				Extension:    ext,
				StoragePath:  filepath.Join(fullPath, entry.Name()),
				PublicURL:    ss.generatePublicURL(relativePath),
				UploadedAt:   info.ModTime(),
			}

			files = append(files, metadata)
		}
	}

	return files, nil
}

func (ss *StorageService) GetDirectorySize(dirPath string) (int64, error) {
	fullPath := filepath.Join(ss.basePath, dirPath)

	if !strings.HasPrefix(fullPath, ss.basePath) {
		return 0, fmt.Errorf("invalid directory path")
	}

	var totalSize int64
	err := filepath.Walk(fullPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			totalSize += info.Size()
		}
		return nil
	})

	return totalSize, err
}

// Image processing helpers
func (ss *StorageService) ResizeImage(imageData []byte, width, height int) ([]byte, error) {
	// This is a placeholder - in production, use an image processing library
	// like github.com/disintegration/imaging or github.com/h2non/bimg

	// For now, return original image
	return imageData, nil
}

func (ss *StorageService) GenerateThumbnail(imageData []byte, size int) ([]byte, error) {
	// This is a placeholder - in production, generate actual thumbnail
	return ss.ResizeImage(imageData, size, size)
}

// Helper methods
func (ss *StorageService) generateUniqueFileName(originalPath string) string {
	ext := filepath.Ext(originalPath)
	baseName := strings.TrimSuffix(filepath.Base(originalPath), ext)
	dir := filepath.Dir(originalPath)

	// Add timestamp and random component for uniqueness
	timestamp := time.Now().Format("20060102_150405")
	unique := fmt.Sprintf("%s_%s%s", baseName, timestamp, ext)

	if dir == "." {
		return unique
	}

	return filepath.Join(dir, unique)
}

func (ss *StorageService) generatePublicURL(filePath string) string {
	// Generate URL based on configuration
	baseURL := ss.config.Server.AppURL
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	// Clean file path for URL
	urlPath := strings.ReplaceAll(filePath, "\\", "/")
	return fmt.Sprintf("%s/uploads/%s", baseURL, urlPath)
}

func (ss *StorageService) detectImageFormat(data []byte) string {
	if len(data) < 12 {
		return ""
	}

	// Check common image formats by magic bytes
	switch {
	case bytes.HasPrefix(data, []byte{0xFF, 0xD8, 0xFF}):
		return ".jpg"
	case bytes.HasPrefix(data, []byte{0x89, 0x50, 0x4E, 0x47}):
		return ".png"
	case bytes.HasPrefix(data, []byte{0x47, 0x49, 0x46}):
		return ".gif"
	case bytes.HasPrefix(data, []byte{0x52, 0x49, 0x46, 0x46}) && bytes.Contains(data[8:12], []byte("WEBP")):
		return ".webp"
	default:
		return ""
	}
}

func (ss *StorageService) detectVideoFormat(data []byte) string {
	if len(data) < 12 {
		return ""
	}

	// Check common video formats by magic bytes
	switch {
	case bytes.HasPrefix(data[4:12], []byte("ftyp")):
		return ".mp4"
	case bytes.HasPrefix(data, []byte{0x1A, 0x45, 0xDF, 0xA3}):
		return ".mkv"
	case bytes.HasPrefix(data, []byte{0x52, 0x49, 0x46, 0x46}) && bytes.Contains(data[8:12], []byte("AVI ")):
		return ".avi"
	default:
		return ".mp4" // Default to MP4
	}
}

func (ss *StorageService) detectSubtitleFormat(data []byte) string {
	content := string(data)

	// Check for WebVTT
	if strings.HasPrefix(content, "WEBVTT") {
		return ".vtt"
	}

	// Check for SRT pattern (number, timestamp, text)
	if strings.Contains(content, " --> ") {
		return ".srt"
	}

	return ".srt" // Default to SRT
}

// Storage statistics
func (ss *StorageService) GetStorageStats() (map[string]interface{}, error) {
	totalSize, err := ss.GetDirectorySize("")
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total_size_bytes": totalSize,
		"total_size_mb":    float64(totalSize) / (1024 * 1024),
		"base_path":        ss.basePath,
		"max_file_size":    ss.maxSize,
		"allowed_types":    ss.getAllowedTypes(),
	}

	return stats, nil
}

func (ss *StorageService) getAllowedTypes() []string {
	var types []string
	for ext := range ss.allowedTypes {
		types = append(types, ext)
	}
	return types
}

// Cleanup operations
func (ss *StorageService) CleanupOldFiles(olderThan time.Duration) (int, error) {
	cutoff := time.Now().Add(-olderThan)
	deletedCount := 0

	err := filepath.Walk(ss.basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && info.ModTime().Before(cutoff) {
			if err := os.Remove(path); err == nil {
				deletedCount++
			}
		}

		return nil
	})

	return deletedCount, err
}

func (ss *StorageService) CleanupEmptyDirectories() error {
	return filepath.Walk(ss.basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() && path != ss.basePath {
			// Try to remove directory (will only succeed if empty)
			os.Remove(path)
		}

		return nil
	})
}

// Health check
func (ss *StorageService) HealthCheck() error {
	// Test write access
	testFile := filepath.Join(ss.basePath, ".health_check")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		return fmt.Errorf("storage write test failed: %v", err)
	}

	// Test read access
	if _, err := os.ReadFile(testFile); err != nil {
		return fmt.Errorf("storage read test failed: %v", err)
	}

	// Cleanup test file
	os.Remove(testFile)

	return nil
}

// Stream file for download
func (ss *StorageService) StreamFile(filePath string, writer io.Writer) error {
	fullPath := filepath.Join(ss.basePath, filePath)

	if !strings.HasPrefix(fullPath, ss.basePath) {
		return fmt.Errorf("invalid file path")
	}

	file, err := os.Open(fullPath)
	if err != nil {
		return fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	_, err = io.Copy(writer, file)
	return err
}
