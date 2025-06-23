import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  Download,
  Share2,
  Plus,
  Heart,
} from "lucide-react";
import { contentService, ContentItem } from "../services/content";
import { useWatchlist } from "../hooks/useContent";
import VideoPlayer from "../components/content/VideoPlayer";
import MovieRow from "../components/content/MovieRow";
import Loading from "../components/common/Loading";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { formatDuration, formatDate } from "../utils/helpers";

const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const [contentData, recommendationsData] = await Promise.all([
          contentService.getContentById(id),
          contentService.getRecommendations(id),
        ]);

        setContent(contentData);
        setRecommendations(recommendationsData);

        // Record view
        await contentService.recordView(id, 0);
      } catch (err: any) {
        setError(err.message || "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  const handleWatchlistToggle = async () => {
    if (!content) return;

    try {
      setWatchlistLoading(true);
      if (isInWatchlist(content.id)) {
        await removeFromWatchlist(content.id);
      } else {
        await addToWatchlist(content.id);
      }
    } catch (error) {
      console.error("Failed to toggle watchlist:", error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleProgressUpdate = async (progress: number) => {
    if (!content) return;

    try {
      const episodeId =
        content.type === "tv_show" && content.episodes
          ? content.episodes.find(
              (ep) =>
                ep.seasonNumber === selectedSeason &&
                ep.episodeNumber === selectedEpisode
            )?.id
          : undefined;

      await contentService.updateWatchProgress(content.id, progress, episodeId);
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Loading content..." />;
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            {error || "Content not found"}
          </h2>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentEpisode =
    content.type === "tv_show" && content.episodes
      ? content.episodes.find(
          (ep) =>
            ep.seasonNumber === selectedSeason &&
            ep.episodeNumber === selectedEpisode
        )
      : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Video Player */}
      <div className="relative">
        <VideoPlayer
          contentId={content.id}
          episodeId={currentEpisode?.id}
          title={currentEpisode ? currentEpisode.title : content.title}
          onProgressUpdate={handleProgressUpdate}
        />

        {/* Back Button Overlay */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
            className="bg-black/50 hover:bg-black/70"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Content Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>{formatDate(content.releaseDate)}</span>
                <span>•</span>
                <span>{formatDuration(content.duration)}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span>{content.rating.toFixed(1)}</span>
                </div>
                <Badge variant="secondary">
                  {content.type.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {content.genre.map((genre) => (
                  <Badge key={genre} variant="outline">
                    {genre}
                  </Badge>
                ))}
              </div>

              <p className="text-lg mb-6">{content.description}</p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleWatchlistToggle}
                  disabled={watchlistLoading}
                  variant={isInWatchlist(content.id) ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  {isInWatchlist(content.id) ? (
                    <Heart className="h-4 w-4 fill-current" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isInWatchlist(content.id)
                    ? "In Watchlist"
                    : "Add to Watchlist"}
                </Button>

                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>

                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Tabs for additional info */}
            <Tabs defaultValue="episodes" className="w-full">
              <TabsList>
                {content.type === "tv_show" && (
                  <TabsTrigger value="episodes">Episodes</TabsTrigger>
                )}
                <TabsTrigger value="cast">Cast & Crew</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              {/* Episodes Tab */}
              {content.type === "tv_show" && (
                <TabsContent value="episodes" className="space-y-4">
                  {content.seasons && content.seasons.length > 1 && (
                    <div className="flex gap-2">
                      {content.seasons.map((season) => (
                        <Button
                          key={season.seasonNumber}
                          variant={
                            selectedSeason === season.seasonNumber
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedSeason(season.seasonNumber)}
                        >
                          Season {season.seasonNumber}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-4">
                    {content.episodes
                      ?.filter((ep) => ep.seasonNumber === selectedSeason)
                      .map((episode) => (
                        <div
                          key={episode.id}
                          className={`flex gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedEpisode === episode.episodeNumber
                              ? "bg-primary/10 border-primary"
                              : "bg-card hover:bg-accent"
                          }`}
                          onClick={() =>
                            setSelectedEpisode(episode.episodeNumber)
                          }
                        >
                          <img
                            src={episode.thumbnail}
                            alt={episode.title}
                            className="w-24 h-14 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {episode.episodeNumber}. {episode.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {formatDuration(episode.duration)}
                            </p>
                            <p className="text-sm line-clamp-2">
                              {episode.description}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              )}

              {/* Cast & Crew Tab */}
              <TabsContent value="cast" className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Cast</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {content.cast.map((actor) => (
                      <div key={actor.id} className="text-center">
                        {actor.avatar && (
                          <img
                            src={actor.avatar}
                            alt={actor.name}
                            className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                          />
                        )}
                        <p className="font-medium text-sm">{actor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {actor.character}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Crew</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Director: </span>
                      <span className="text-muted-foreground">
                        {content.director.join(", ")}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Producer: </span>
                      <span className="text-muted-foreground">
                        {content.producer.join(", ")}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Writer: </span>
                      <span className="text-muted-foreground">
                        {content.writer.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Language: </span>
                      <span className="text-muted-foreground">
                        {content.language}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Country: </span>
                      <span className="text-muted-foreground">
                        {content.country}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Duration: </span>
                      <span className="text-muted-foreground">
                        {formatDuration(content.duration)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Release Date: </span>
                      <span className="text-muted-foreground">
                        {formatDate(content.releaseDate)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Rating: </span>
                      <span className="text-muted-foreground">
                        {content.rating.toFixed(1)}/10
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Views: </span>
                      <span className="text-muted-foreground">
                        {content.viewCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Status: </span>
                      <Badge variant="outline">{content.status}</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <MovieRow
                title="More Like This"
                content={recommendations}
                layout="vertical"
                showTitle={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
