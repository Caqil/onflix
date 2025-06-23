package utils

import (
	"math"
	"net/http"

	"onflix/internal/models"

	"github.com/gin-gonic/gin"
)

func SuccessResponse(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, models.APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func ErrorResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, models.APIResponse{
		Success: false,
		Message: message,
		Error:   message,
	})
}

func ValidationErrorResponse(c *gin.Context, errors map[string]string) {
	c.JSON(http.StatusBadRequest, gin.H{
		"success": false,
		"message": "Validation failed",
		"errors":  errors,
	})
}

func PaginatedResponse(c *gin.Context, statusCode int, message string, data interface{}, currentPage, itemsPerPage int, totalItems int64) {
	totalPages := int(math.Ceil(float64(totalItems) / float64(itemsPerPage)))

	pagination := models.Pagination{
		CurrentPage:  currentPage,
		TotalPages:   totalPages,
		TotalItems:   totalItems,
		ItemsPerPage: itemsPerPage,
		HasNext:      currentPage < totalPages,
		HasPrevious:  currentPage > 1,
	}

	c.JSON(statusCode, models.PaginatedResponse{
		Success:    true,
		Message:    message,
		Data:       data,
		Pagination: pagination,
	})
}

func UnauthorizedResponse(c *gin.Context) {
	ErrorResponse(c, http.StatusUnauthorized, "Unauthorized access")
}

func ForbiddenResponse(c *gin.Context) {
	ErrorResponse(c, http.StatusForbidden, "Access forbidden")
}

func NotFoundResponse(c *gin.Context, resource string) {
	ErrorResponse(c, http.StatusNotFound, resource+" not found")
}

func InternalServerErrorResponse(c *gin.Context) {
	ErrorResponse(c, http.StatusInternalServerError, "Internal server error")
}

func BadRequestResponse(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusBadRequest, message)
}

func ConflictResponse(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusConflict, message)
}

func CreatedResponse(c *gin.Context, message string, data interface{}) {
	SuccessResponse(c, http.StatusCreated, message, data)
}

func NoContentResponse(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// Custom response for streaming
func StreamingResponse(c *gin.Context, contentType string, data []byte) {
	c.Header("Content-Type", contentType)
	c.Header("Accept-Ranges", "bytes")
	c.Header("Cache-Control", "no-cache")
	c.Data(http.StatusOK, contentType, data)
}

// Response for file downloads
func FileResponse(c *gin.Context, filename, contentType string, data []byte) {
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", contentType)
	c.Data(http.StatusOK, contentType, data)
}
