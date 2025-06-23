package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Content struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	TMDBID         int                `json:"tmdb_id" bson:"tmdb_id"`
	Title          string             `json:"title" bson:"title" validate:"required"`
	OriginalTitle  string             `json:"original_title" bson:"original_title"`
	Description    string             `json:"description" bson:"description"`
	Type           ContentType        `json:"type" bson:"type" validate:"required"`
	Genres         []string           `json:"genres" bson:"genres"`
	ReleaseDate    time.Time          `json:"release_date" bson:"release_date"`
	Runtime        int                `json:"runtime" bson:"runtime"` // In minutes
	Rating         float64            `json:"rating" bson:"rating"`
	MaturityRating string             `json:"maturity_rating" bson:"maturity_rating"`
	Country        string             `json:"country" bson:"country"`
	Language       string             `json:"language" bson:"language"`
	Cast           []CastMember       `json:"cast" bson:"cast"`
	Director       []string           `json:"director" bson:"director"`
	Producer       []string           `json:"producer" bson:"producer"`
	Writer         []string           `json:"writer" bson:"writer"`
	Images         ContentImages      `json:"images" bson:"images"`
	Videos         []ContentVideo     `json:"videos" bson:"videos"`
	Seasons        []Season           `json:"seasons,omitempty" bson:"seasons,omitempty"` // For TV shows
	Status         ContentStatus      `json:"status" bson:"status"`
	IsFeatured     bool               `json:"is_featured" bson:"is_featured"`
	IsOriginal     bool               `json:"is_original" bson:"is_original"`
	ViewCount      int64              `json:"view_count" bson:"view_count"`
	LikeCount      int64              `json:"like_count" bson:"like_count"`
	Tags           []string           `json:"tags" bson:"tags"`
	Keywords       []string           `json:"keywords" bson:"keywords"`
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}

type ContentType string

const (
	ContentTypeMovie  ContentType = "movie"
	ContentTypeTVShow ContentType = "tv_show"
)

type ContentStatus string

const (
	ContentStatusDraft     ContentStatus = "draft"
	ContentStatusPublished ContentStatus = "published"
	ContentStatusArchived  ContentStatus = "archived"
)

type CastMember struct {
	Name        string `json:"name" bson:"name"`
	Character   string `json:"character" bson:"character"`
	ProfilePath string `json:"profile_path" bson:"profile_path"`
	Order       int    `json:"order" bson:"order"`
}

type ContentImages struct {
	PosterPath   string   `json:"poster_path" bson:"poster_path"`
	BackdropPath string   `json:"backdrop_path" bson:"backdrop_path"`
	LogoPath     string   `json:"logo_path" bson:"logo_path"`
	Screenshots  []string `json:"screenshots" bson:"screenshots"`
}

type ContentVideo struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Title     string             `json:"title" bson:"title"`
	Type      VideoType          `json:"type" bson:"type"`
	Quality   VideoQuality       `json:"quality" bson:"quality"`
	Duration  int                `json:"duration" bson:"duration"` // In seconds
	FileURL   string             `json:"file_url" bson:"file_url"`
	FileSize  int64              `json:"file_size" bson:"file_size"` // In bytes
	Subtitles []Subtitle         `json:"subtitles" bson:"subtitles"`
	IsDefault bool               `json:"is_default" bson:"is_default"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

type VideoType string

const (
	VideoTypeTrailer VideoType = "trailer"
	VideoTypeTeaser  VideoType = "teaser"
	VideoTypeFull    VideoType = "full"
	VideoTypeClip    VideoType = "clip"
)

type VideoQuality string

const (
	Quality480p  VideoQuality = "480p"
	Quality720p  VideoQuality = "720p"
	Quality1080p VideoQuality = "1080p"
	Quality4K    VideoQuality = "4k"
)

type Subtitle struct {
	Language string `json:"language" bson:"language"`
	Label    string `json:"label" bson:"label"`
	FileURL  string `json:"file_url" bson:"file_url"`
}

// For TV Shows
type Season struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	SeasonNumber int                `json:"season_number" bson:"season_number"`
	Name         string             `json:"name" bson:"name"`
	Overview     string             `json:"overview" bson:"overview"`
	PosterPath   string             `json:"poster_path" bson:"poster_path"`
	AirDate      time.Time          `json:"air_date" bson:"air_date"`
	Episodes     []Episode          `json:"episodes" bson:"episodes"`
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
}

type Episode struct {
	ID            primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	EpisodeNumber int                `json:"episode_number" bson:"episode_number"`
	Name          string             `json:"name" bson:"name"`
	Overview      string             `json:"overview" bson:"overview"`
	StillPath     string             `json:"still_path" bson:"still_path"`
	AirDate       time.Time          `json:"air_date" bson:"air_date"`
	Runtime       int                `json:"runtime" bson:"runtime"`
	Videos        []ContentVideo     `json:"videos" bson:"videos"`
	CreatedAt     time.Time          `json:"created_at" bson:"created_at"`
}
