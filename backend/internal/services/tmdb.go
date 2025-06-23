// backend/internal/services/tmdb.go
package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"onflix/internal/config"
	"onflix/internal/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TMDBService struct {
	config     *config.Config
	httpClient *http.Client
	baseURL    string
	apiKey     string
}

// TMDB API Response Structures
type TMDBMovie struct {
	ID                  int             `json:"id"`
	Title               string          `json:"title"`
	OriginalTitle       string          `json:"original_title"`
	Overview            string          `json:"overview"`
	ReleaseDate         string          `json:"release_date"`
	Runtime             int             `json:"runtime"`
	Genres              []TMDBGenre     `json:"genres"`
	PosterPath          string          `json:"poster_path"`
	BackdropPath        string          `json:"backdrop_path"`
	VoteAverage         float64         `json:"vote_average"`
	VoteCount           int             `json:"vote_count"`
	OriginalLanguage    string          `json:"original_language"`
	ProductionCountries []TMDBCountry   `json:"production_countries"`
	SpokenLanguages     []TMDBLanguage  `json:"spoken_languages"`
	Status              string          `json:"status"`
	Tagline             string          `json:"tagline"`
	Video               bool            `json:"video"`
	Adult               bool            `json:"adult"`
	Popularity          float64         `json:"popularity"`
	BelongsToCollection *TMDBCollection `json:"belongs_to_collection"`
	Budget              int64           `json:"budget"`
	Revenue             int64           `json:"revenue"`
	IMDBID              string          `json:"imdb_id"`
}

type TMDBTVShow struct {
	ID                  int            `json:"id"`
	Name                string         `json:"name"`
	OriginalName        string         `json:"original_name"`
	Overview            string         `json:"overview"`
	FirstAirDate        string         `json:"first_air_date"`
	LastAirDate         string         `json:"last_air_date"`
	Genres              []TMDBGenre    `json:"genres"`
	PosterPath          string         `json:"poster_path"`
	BackdropPath        string         `json:"backdrop_path"`
	VoteAverage         float64        `json:"vote_average"`
	VoteCount           int            `json:"vote_count"`
	OriginalLanguage    string         `json:"original_language"`
	OriginCountry       []string       `json:"origin_country"`
	SpokenLanguages     []TMDBLanguage `json:"spoken_languages"`
	Status              string         `json:"status"`
	Type                string         `json:"type"`
	InProduction        bool           `json:"in_production"`
	NumberOfEpisodes    int            `json:"number_of_episodes"`
	NumberOfSeasons     int            `json:"number_of_seasons"`
	Seasons             []TMDBSeason   `json:"seasons"`
	Networks            []TMDBNetwork  `json:"networks"`
	CreatedBy           []TMDBCreator  `json:"created_by"`
	LastEpisodeToAir    *TMDBEpisode   `json:"last_episode_to_air"`
	NextEpisodeToAir    *TMDBEpisode   `json:"next_episode_to_air"`
	ProductionCompanies []TMDBCompany  `json:"production_companies"`
	Languages           []string       `json:"languages"`
	Homepage            string         `json:"homepage"`
	Popularity          float64        `json:"popularity"`
	Adult               bool           `json:"adult"`
}

type TMDBGenre struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type TMDBCountry struct {
	ISO31661 string `json:"iso_3166_1"`
	Name     string `json:"name"`
}

type TMDBLanguage struct {
	ISO6391 string `json:"iso_639_1"`
	Name    string `json:"name"`
}

type TMDBCollection struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	PosterPath   string `json:"poster_path"`
	BackdropPath string `json:"backdrop_path"`
}

type TMDBSeason struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Overview     string `json:"overview"`
	PosterPath   string `json:"poster_path"`
	SeasonNumber int    `json:"season_number"`
	AirDate      string `json:"air_date"`
	EpisodeCount int    `json:"episode_count"`
}

type TMDBEpisode struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	Overview      string  `json:"overview"`
	StillPath     string  `json:"still_path"`
	AirDate       string  `json:"air_date"`
	EpisodeNumber int     `json:"episode_number"`
	SeasonNumber  int     `json:"season_number"`
	Runtime       int     `json:"runtime"`
	VoteAverage   float64 `json:"vote_average"`
	VoteCount     int     `json:"vote_count"`
}

type TMDBNetwork struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	LogoPath      string `json:"logo_path"`
	OriginCountry string `json:"origin_country"`
}

type TMDBCreator struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	ProfilePath string `json:"profile_path"`
	CreditID    string `json:"credit_id"`
}

type TMDBCompany struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	LogoPath      string `json:"logo_path"`
	OriginCountry string `json:"origin_country"`
}

type TMDBCredits struct {
	Cast []TMDBCastMember `json:"cast"`
	Crew []TMDBCrewMember `json:"crew"`
}

type TMDBCastMember struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Character   string  `json:"character"`
	ProfilePath string  `json:"profile_path"`
	Order       int     `json:"order"`
	CastID      int     `json:"cast_id"`
	CreditID    string  `json:"credit_id"`
	Gender      int     `json:"gender"`
	Popularity  float64 `json:"popularity"`
	Adult       bool    `json:"adult"`
}

type TMDBCrewMember struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Job         string  `json:"job"`
	Department  string  `json:"department"`
	ProfilePath string  `json:"profile_path"`
	CreditID    string  `json:"credit_id"`
	Gender      int     `json:"gender"`
	Popularity  float64 `json:"popularity"`
	Adult       bool    `json:"adult"`
}

type TMDBImages struct {
	Backdrops []TMDBImage `json:"backdrops"`
	Posters   []TMDBImage `json:"posters"`
	Logos     []TMDBImage `json:"logos"`
}

type TMDBImage struct {
	AspectRatio float64 `json:"aspect_ratio"`
	FilePath    string  `json:"file_path"`
	Height      int     `json:"height"`
	Width       int     `json:"width"`
	ISO6391     string  `json:"iso_639_1"`
	VoteAverage float64 `json:"vote_average"`
	VoteCount   int     `json:"vote_count"`
}

type TMDBVideos struct {
	Results []TMDBVideo `json:"results"`
}

type TMDBVideo struct {
	ID          string `json:"id"`
	Key         string `json:"key"`
	Name        string `json:"name"`
	Site        string `json:"site"`
	Size        int    `json:"size"`
	Type        string `json:"type"`
	Official    bool   `json:"official"`
	PublishedAt string `json:"published_at"`
	ISO6391     string `json:"iso_639_1"`
	ISO31661    string `json:"iso_3166_1"`
}

type TMDBSearchResponse struct {
	Page         int                `json:"page"`
	Results      []TMDBSearchResult `json:"results"`
	TotalPages   int                `json:"total_pages"`
	TotalResults int                `json:"total_results"`
}

type TMDBSearchResult struct {
	ID               int     `json:"id"`
	MediaType        string  `json:"media_type"`
	Title            string  `json:"title,omitempty"`
	Name             string  `json:"name,omitempty"`
	OriginalTitle    string  `json:"original_title,omitempty"`
	OriginalName     string  `json:"original_name,omitempty"`
	Overview         string  `json:"overview"`
	ReleaseDate      string  `json:"release_date,omitempty"`
	FirstAirDate     string  `json:"first_air_date,omitempty"`
	PosterPath       string  `json:"poster_path"`
	BackdropPath     string  `json:"backdrop_path"`
	VoteAverage      float64 `json:"vote_average"`
	VoteCount        int     `json:"vote_count"`
	OriginalLanguage string  `json:"original_language"`
	Popularity       float64 `json:"popularity"`
	Adult            bool    `json:"adult"`
	GenreIDs         []int   `json:"genre_ids"`
}

func NewTMDBService(cfg *config.Config) *TMDBService {
	return &TMDBService{
		config: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		baseURL: cfg.TMDB.BaseURL,
		apiKey:  cfg.TMDB.APIKey,
	}
}

// Core HTTP request method
func (ts *TMDBService) makeRequest(endpoint string, params map[string]string) ([]byte, error) {
	reqURL := fmt.Sprintf("%s%s", ts.baseURL, endpoint)

	// Parse URL and add parameters
	u, err := url.Parse(reqURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %v", err)
	}

	q := u.Query()
	q.Set("api_key", ts.apiKey)

	for key, value := range params {
		q.Set(key, value)
	}

	u.RawQuery = q.Encode()

	// Make HTTP request
	resp, err := ts.httpClient.Get(u.String())
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("TMDB API error: %d %s", resp.StatusCode, resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	return body, nil
}

// Search content
func (ts *TMDBService) SearchContent(query string) ([]TMDBSearchResult, error) {
	if query == "" {
		return nil, fmt.Errorf("search query cannot be empty")
	}

	params := map[string]string{
		"query":         query,
		"include_adult": "false",
	}

	body, err := ts.makeRequest("/search/multi", params)
	if err != nil {
		return nil, err
	}

	var response TMDBSearchResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse search response: %v", err)
	}

	return response.Results, nil
}

func (ts *TMDBService) SearchMovies(query string, page int) ([]TMDBSearchResult, error) {
	params := map[string]string{
		"query":         query,
		"include_adult": "false",
		"page":          strconv.Itoa(page),
	}

	body, err := ts.makeRequest("/search/movie", params)
	if err != nil {
		return nil, err
	}

	var response TMDBSearchResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse movie search response: %v", err)
	}

	return response.Results, nil
}

func (ts *TMDBService) SearchTVShows(query string, page int) ([]TMDBSearchResult, error) {
	params := map[string]string{
		"query":         query,
		"include_adult": "false",
		"page":          strconv.Itoa(page),
	}

	body, err := ts.makeRequest("/search/tv", params)
	if err != nil {
		return nil, err
	}

	var response TMDBSearchResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse TV search response: %v", err)
	}

	return response.Results, nil
}

// Get detailed content information
func (ts *TMDBService) GetMovie(tmdbID string) (*TMDBMovie, error) {
	params := map[string]string{
		"append_to_response": "credits,images,videos,similar,recommendations",
	}

	endpoint := fmt.Sprintf("/movie/%s", tmdbID)
	body, err := ts.makeRequest(endpoint, params)
	if err != nil {
		return nil, err
	}

	var movie TMDBMovie
	if err := json.Unmarshal(body, &movie); err != nil {
		return nil, fmt.Errorf("failed to parse movie response: %v", err)
	}

	return &movie, nil
}

func (ts *TMDBService) GetTVShow(tmdbID string) (*TMDBTVShow, error) {
	params := map[string]string{
		"append_to_response": "credits,images,videos,similar,recommendations",
	}

	endpoint := fmt.Sprintf("/tv/%s", tmdbID)
	body, err := ts.makeRequest(endpoint, params)
	if err != nil {
		return nil, err
	}

	var tvShow TMDBTVShow
	if err := json.Unmarshal(body, &tvShow); err != nil {
		return nil, fmt.Errorf("failed to parse TV show response: %v", err)
	}

	return &tvShow, nil
}

// Get season details
func (ts *TMDBService) GetSeason(tmdbID string, seasonNumber int) (*TMDBSeason, error) {
	endpoint := fmt.Sprintf("/tv/%s/season/%d", tmdbID, seasonNumber)
	body, err := ts.makeRequest(endpoint, nil)
	if err != nil {
		return nil, err
	}

	var season TMDBSeason
	if err := json.Unmarshal(body, &season); err != nil {
		return nil, fmt.Errorf("failed to parse season response: %v", err)
	}

	return &season, nil
}

// Get episode details
func (ts *TMDBService) GetEpisode(tmdbID string, seasonNumber, episodeNumber int) (*TMDBEpisode, error) {
	endpoint := fmt.Sprintf("/tv/%s/season/%d/episode/%d", tmdbID, seasonNumber, episodeNumber)
	body, err := ts.makeRequest(endpoint, nil)
	if err != nil {
		return nil, err
	}

	var episode TMDBEpisode
	if err := json.Unmarshal(body, &episode); err != nil {
		return nil, fmt.Errorf("failed to parse episode response: %v", err)
	}

	return &episode, nil
}

// Get credits
func (ts *TMDBService) GetMovieCredits(tmdbID string) (*TMDBCredits, error) {
	endpoint := fmt.Sprintf("/movie/%s/credits", tmdbID)
	body, err := ts.makeRequest(endpoint, nil)
	if err != nil {
		return nil, err
	}

	var credits TMDBCredits
	if err := json.Unmarshal(body, &credits); err != nil {
		return nil, fmt.Errorf("failed to parse movie credits: %v", err)
	}

	return &credits, nil
}

func (ts *TMDBService) GetTVCredits(tmdbID string) (*TMDBCredits, error) {
	endpoint := fmt.Sprintf("/tv/%s/credits", tmdbID)
	body, err := ts.makeRequest(endpoint, nil)
	if err != nil {
		return nil, err
	}

	var credits TMDBCredits
	if err := json.Unmarshal(body, &credits); err != nil {
		return nil, fmt.Errorf("failed to parse TV credits: %v", err)
	}

	return &credits, nil
}

// Convert TMDB data to our models
func (ts *TMDBService) ImportContent(tmdbID string) (*models.Content, error) {
	// First try to get as movie
	movie, err := ts.GetMovie(tmdbID)
	if err == nil {
		return ts.convertMovieToContent(movie)
	}

	// If movie fails, try TV show
	tvShow, err := ts.GetTVShow(tmdbID)
	if err != nil {
		return nil, fmt.Errorf("content not found with TMDB ID: %s", tmdbID)
	}

	return ts.convertTVShowToContent(tvShow)
}

func (ts *TMDBService) convertMovieToContent(movie *TMDBMovie) (*models.Content, error) {
	// Parse release date
	releaseDate, _ := time.Parse("2006-01-02", movie.ReleaseDate)

	// Convert genres
	var genres []string
	for _, genre := range movie.Genres {
		genres = append(genres, genre.Name)
	}

	// Get primary language
	language := movie.OriginalLanguage
	if len(language) == 0 {
		language = "en"
	}

	// Get primary country
	country := "US"
	if len(movie.ProductionCountries) > 0 {
		country = movie.ProductionCountries[0].ISO31661
	}

	// Get credits
	credits, _ := ts.GetMovieCredits(strconv.Itoa(movie.ID))

	// Convert cast
	var cast []models.CastMember
	if credits != nil {
		for i, member := range credits.Cast {
			if i >= 10 { // Limit to top 10 cast members
				break
			}
			cast = append(cast, models.CastMember{
				Name:        member.Name,
				Character:   member.Character,
				ProfilePath: ts.getImageURL(member.ProfilePath),
				Order:       member.Order,
			})
		}
	}

	// Get crew (directors, producers, writers)
	var directors, producers, writers []string
	if credits != nil {
		for _, member := range credits.Crew {
			switch member.Job {
			case "Director":
				directors = append(directors, member.Name)
			case "Producer", "Executive Producer":
				if len(producers) < 5 {
					producers = append(producers, member.Name)
				}
			case "Writer", "Screenplay", "Story":
				if len(writers) < 5 {
					writers = append(writers, member.Name)
				}
			}
		}
	}

	// Determine maturity rating (simplified mapping)
	maturityRating := "PG-13"
	if movie.Adult {
		maturityRating = "R"
	}

	content := &models.Content{
		TMDBID:         movie.ID,
		Title:          movie.Title,
		OriginalTitle:  movie.OriginalTitle,
		Description:    movie.Overview,
		Type:           models.ContentTypeMovie,
		Genres:         genres,
		ReleaseDate:    releaseDate,
		Runtime:        movie.Runtime,
		Rating:         movie.VoteAverage,
		MaturityRating: maturityRating,
		Country:        country,
		Language:       language,
		Cast:           cast,
		Director:       directors,
		Producer:       producers,
		Writer:         writers,
		Images: models.ContentImages{
			PosterPath:   ts.getImageURL(movie.PosterPath),
			BackdropPath: ts.getImageURL(movie.BackdropPath),
		},
		Status:    models.ContentStatusDraft,
		ViewCount: 0,
		LikeCount: 0,
		Tags:      []string{"imported", "tmdb"},
		Keywords:  ts.extractKeywords(movie.Overview),
	}

	return content, nil
}

func (ts *TMDBService) convertTVShowToContent(tvShow *TMDBTVShow) (*models.Content, error) {
	// Parse first air date
	firstAirDate, _ := time.Parse("2006-01-02", tvShow.FirstAirDate)

	// Convert genres
	var genres []string
	for _, genre := range tvShow.Genres {
		genres = append(genres, genre.Name)
	}

	// Get primary language
	language := tvShow.OriginalLanguage
	if len(language) == 0 {
		language = "en"
	}

	// Get primary country
	country := "US"
	if len(tvShow.OriginCountry) > 0 {
		country = tvShow.OriginCountry[0]
	}

	// Get credits
	credits, _ := ts.GetTVCredits(strconv.Itoa(tvShow.ID))

	// Convert cast
	var cast []models.CastMember
	if credits != nil {
		for i, member := range credits.Cast {
			if i >= 10 { // Limit to top 10 cast members
				break
			}
			cast = append(cast, models.CastMember{
				Name:        member.Name,
				Character:   member.Character,
				ProfilePath: ts.getImageURL(member.ProfilePath),
				Order:       member.Order,
			})
		}
	}

	// Get creators and crew
	var directors, producers, writers []string
	for _, creator := range tvShow.CreatedBy {
		directors = append(directors, creator.Name)
	}

	if credits != nil {
		for _, member := range credits.Crew {
			switch member.Job {
			case "Producer", "Executive Producer":
				if len(producers) < 5 {
					producers = append(producers, member.Name)
				}
			case "Writer", "Screenplay", "Story":
				if len(writers) < 5 {
					writers = append(writers, member.Name)
				}
			}
		}
	}

	// Convert seasons
	var seasons []models.Season
	for _, tmdbSeason := range tvShow.Seasons {
		if tmdbSeason.SeasonNumber == 0 { // Skip specials
			continue
		}

		airDate, _ := time.Parse("2006-01-02", tmdbSeason.AirDate)

		season := models.Season{
			ID:           primitive.NewObjectID(),
			SeasonNumber: tmdbSeason.SeasonNumber,
			Name:         tmdbSeason.Name,
			Overview:     tmdbSeason.Overview,
			PosterPath:   ts.getImageURL(tmdbSeason.PosterPath),
			AirDate:      airDate,
			Episodes:     []models.Episode{}, // Episodes would be loaded separately
			CreatedAt:    time.Now(),
		}

		seasons = append(seasons, season)
	}

	// Determine maturity rating
	maturityRating := "PG-13"
	if tvShow.Adult {
		maturityRating = "TV-MA"
	}

	// Calculate average runtime (if available)
	runtime := 45 // Default TV show runtime

	content := &models.Content{
		TMDBID:         tvShow.ID,
		Title:          tvShow.Name,
		OriginalTitle:  tvShow.OriginalName,
		Description:    tvShow.Overview,
		Type:           models.ContentTypeTVShow,
		Genres:         genres,
		ReleaseDate:    firstAirDate,
		Runtime:        runtime,
		Rating:         tvShow.VoteAverage,
		MaturityRating: maturityRating,
		Country:        country,
		Language:       language,
		Cast:           cast,
		Director:       directors,
		Producer:       producers,
		Writer:         writers,
		Images: models.ContentImages{
			PosterPath:   ts.getImageURL(tvShow.PosterPath),
			BackdropPath: ts.getImageURL(tvShow.BackdropPath),
		},
		Seasons:   seasons,
		Status:    models.ContentStatusDraft,
		ViewCount: 0,
		LikeCount: 0,
		Tags:      []string{"imported", "tmdb"},
		Keywords:  ts.extractKeywords(tvShow.Overview),
	}

	return content, nil
}

// Utility methods
func (ts *TMDBService) getImageURL(path string) string {
	if path == "" {
		return ""
	}
	return fmt.Sprintf("https://image.tmdb.org/t/p/w500%s", path)
}

func (ts *TMDBService) getOriginalImageURL(path string) string {
	if path == "" {
		return ""
	}
	return fmt.Sprintf("https://image.tmdb.org/t/p/original%s", path)
}

func (ts *TMDBService) extractKeywords(overview string) []string {
	// Simple keyword extraction from overview
	words := strings.Fields(strings.ToLower(overview))
	var keywords []string

	for _, word := range words {
		// Remove punctuation and filter out common words
		word = strings.Trim(word, ".,!?\"'")
		if len(word) > 4 && !ts.isCommonWord(word) {
			keywords = append(keywords, word)
		}

		if len(keywords) >= 10 {
			break
		}
	}

	return keywords
}

func (ts *TMDBService) isCommonWord(word string) bool {
	commonWords := []string{
		"this", "that", "with", "have", "will", "from", "they", "know",
		"want", "been", "good", "much", "some", "time", "very", "when",
		"come", "here", "just", "like", "long", "make", "many", "over",
		"such", "take", "than", "them", "well", "were", "what", "year",
	}

	for _, common := range commonWords {
		if word == common {
			return true
		}
	}

	return false
}

// Trending and popular content
func (ts *TMDBService) GetTrendingMovies(timeWindow string) ([]TMDBSearchResult, error) {
	if timeWindow != "day" && timeWindow != "week" {
		timeWindow = "week"
	}

	endpoint := fmt.Sprintf("/trending/movie/%s", timeWindow)
	body, err := ts.makeRequest(endpoint, nil)
	if err != nil {
		return nil, err
	}

	var response TMDBSearchResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse trending movies: %v", err)
	}

	return response.Results, nil
}

func (ts *TMDBService) GetTrendingTVShows(timeWindow string) ([]TMDBSearchResult, error) {
	if timeWindow != "day" && timeWindow != "week" {
		timeWindow = "week"
	}

	endpoint := fmt.Sprintf("/trending/tv/%s", timeWindow)
	body, err := ts.makeRequest(endpoint, nil)
	if err != nil {
		return nil, err
	}

	var response TMDBSearchResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse trending TV shows: %v", err)
	}

	return response.Results, nil
}

func (ts *TMDBService) GetPopularMovies(page int) ([]TMDBSearchResult, error) {
	params := map[string]string{
		"page": strconv.Itoa(page),
	}

	body, err := ts.makeRequest("/movie/popular", params)
	if err != nil {
		return nil, err
	}

	var response TMDBSearchResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse popular movies: %v", err)
	}

	return response.Results, nil
}

func (ts *TMDBService) GetPopularTVShows(page int) ([]TMDBSearchResult, error) {
	params := map[string]string{
		"page": strconv.Itoa(page),
	}

	body, err := ts.makeRequest("/tv/popular", params)
	if err != nil {
		return nil, err
	}

	var response TMDBSearchResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse popular TV shows: %v", err)
	}

	return response.Results, nil
}

// Configuration and genres
func (ts *TMDBService) GetConfiguration() (map[string]interface{}, error) {
	body, err := ts.makeRequest("/configuration", nil)
	if err != nil {
		return nil, err
	}

	var config map[string]interface{}
	if err := json.Unmarshal(body, &config); err != nil {
		return nil, fmt.Errorf("failed to parse configuration: %v", err)
	}

	return config, nil
}

func (ts *TMDBService) GetGenres() ([]TMDBGenre, error) {
	// Get movie genres
	movieBody, err := ts.makeRequest("/genre/movie/list", nil)
	if err != nil {
		return nil, err
	}

	var movieGenres struct {
		Genres []TMDBGenre `json:"genres"`
	}
	json.Unmarshal(movieBody, &movieGenres)

	// Get TV genres
	tvBody, err := ts.makeRequest("/genre/tv/list", nil)
	if err != nil {
		return nil, err
	}

	var tvGenres struct {
		Genres []TMDBGenre `json:"genres"`
	}
	json.Unmarshal(tvBody, &tvGenres)

	// Combine and deduplicate genres
	genreMap := make(map[int]TMDBGenre)
	for _, genre := range movieGenres.Genres {
		genreMap[genre.ID] = genre
	}
	for _, genre := range tvGenres.Genres {
		genreMap[genre.ID] = genre
	}

	var allGenres []TMDBGenre
	for _, genre := range genreMap {
		allGenres = append(allGenres, genre)
	}

	return allGenres, nil
}

// Health check
func (ts *TMDBService) HealthCheck() error {
	_, err := ts.makeRequest("/configuration", nil)
	return err
}

// Bulk import methods
func (ts *TMDBService) ImportTrendingContent() ([]*models.Content, error) {
	var allContent []*models.Content

	// Import trending movies
	trendingMovies, err := ts.GetTrendingMovies("week")
	if err == nil {
		for i, result := range trendingMovies {
			if i >= 20 { // Limit to 20 items
				break
			}

			content, err := ts.ImportContent(strconv.Itoa(result.ID))
			if err == nil {
				allContent = append(allContent, content)
			}
		}
	}

	// Import trending TV shows
	trendingTV, err := ts.GetTrendingTVShows("week")
	if err == nil {
		for i, result := range trendingTV {
			if i >= 20 { // Limit to 20 items
				break
			}

			content, err := ts.ImportContent(strconv.Itoa(result.ID))
			if err == nil {
				allContent = append(allContent, content)
			}
		}
	}

	return allContent, nil
}
