import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Upload,
  Star,
  Calendar,
  Clock,
  Users,
  Play,
  Download,
  Settings,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  FileText,
} from "lucide-react";
import { apiService } from "../../services/api";
import { ContentItem } from "../../services/content";
import { formatDate, formatDuration, cn } from "../../utils/helpers";
import { GENRES, CONTENT_TYPES } from "../../utils/constants";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import Modal, { ConfirmModal, FormModal } from "../common/Modal";
import Loading, { MovieCardSkeleton } from "../common/Loading";

interface ContentFilters {
  type: string;
  status: string;
  genre: string;
  featured: string;
  trending: string;
  sortBy: string;
  sortOrder: string;
}

interface NewContent {
  title: string;
  description: string;
  type: string;
  genre: string[];
  releaseDate: string;
  duration: number;
  director: string[];
  cast: string[];
  language: string;
  country: string;
  featured: boolean;
  trending: boolean;
  status: string;
}

const ContentManager: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ContentFilters>({
    type: "",
    status: "",
    genre: "",
    featured: "",
    trending: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const [newContent, setNewContent] = useState<NewContent>({
    title: "",
    description: "",
    type: "movie",
    genre: [],
    releaseDate: "",
    duration: 0,
    director: [],
    cast: [],
    language: "en",
    country: "US",
    featured: false,
    trending: false,
    status: "draft",
  });

  const [uploadData, setUploadData] = useState({
    videoFile: null as File | null,
    posterFile: null as File | null,
    backdropFile: null as File | null,
    trailerFile: null as File | null,
    subtitleFiles: [] as File[],
    uploadProgress: 0,
    uploading: false,
  });

  useEffect(() => {
    fetchContent();
  }, [pagination.page, searchQuery, filters]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (searchQuery) params.append("search", searchQuery);
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      if (filters.genre) params.append("genre", filters.genre);
      if (filters.featured) params.append("featured", filters.featured);
      if (filters.trending) params.append("trending", filters.trending);

      const response = await apiService.get<ContentItem[]>(
        `/admin/content?${params.toString()}`
      );

      setContent(response.data);
      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: response.pagination!.total,
          totalPages: response.pagination!.totalPages,
        }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch content");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContent = async () => {
    try {
      const contentData = {
        ...newContent,
        director: newContent.director.filter((d) => d.trim()),
        cast: newContent.cast.filter((c) => c.trim()),
        genre: newContent.genre.filter((g) => g.trim()),
      };

      await apiService.post("/admin/content", contentData);
      setShowCreateModal(false);
      resetNewContent();
      await fetchContent();
    } catch (err: any) {
      setError(err.message || "Failed to create content");
    }
  };

  const handleEditContent = async () => {
    if (!selectedItem) return;

    try {
      await apiService.patch(`/admin/content/${selectedItem.id}`, newContent);
      setShowEditModal(false);
      setSelectedItem(null);
      resetNewContent();
      await fetchContent();
    } catch (err: any) {
      setError(err.message || "Failed to update content");
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedItem) return;

    try {
      await apiService.delete(`/admin/content/${selectedItem.id}`);
      setShowDeleteModal(false);
      setSelectedItem(null);
      await fetchContent();
    } catch (err: any) {
      setError(err.message || "Failed to delete content");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedContent.length === 0) return;

    try {
      await apiService.post("/admin/content/bulk", {
        contentIds: selectedContent,
        action,
      });
      setSelectedContent([]);
      await fetchContent();
    } catch (err: any) {
      setError(err.message || "Failed to perform bulk action");
    }
  };

  const handleFileUpload = async () => {
    if (!uploadData.videoFile || !selectedItem) return;

    try {
      setUploadData((prev) => ({
        ...prev,
        uploading: true,
        uploadProgress: 0,
      }));

      const formData = new FormData();
      formData.append("video", uploadData.videoFile);
      if (uploadData.posterFile)
        formData.append("poster", uploadData.posterFile);
      if (uploadData.backdropFile)
        formData.append("backdrop", uploadData.backdropFile);
      if (uploadData.trailerFile)
        formData.append("trailer", uploadData.trailerFile);

      uploadData.subtitleFiles.forEach((file, index) => {
      formData.append(`subtitle_${index}`, file);
      });

      await apiService.post(
        `/admin/content/${selectedItem.id}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadData((prev) => ({ ...prev, uploadProgress: progress }));
            }
          },
        }
      );

      setShowUploadModal(false);
      setSelectedItem(null);
      resetUploadData();
      await fetchContent();
    } catch (err: any) {
      setError(err.message || "Failed to upload files");
    } finally {
      setUploadData((prev) => ({
        ...prev,
        uploading: false,
        uploadProgress: 0,
      }));
    }
  };

  const resetNewContent = () => {
    setNewContent({
      title: "",
      description: "",
      type: "movie",
      genre: [],
      releaseDate: "",
      duration: 0,
      director: [],
      cast: [],
      language: "en",
      country: "US",
      featured: false,
      trending: false,
      status: "draft",
    });
  };

  const resetUploadData = () => {
    setUploadData({
      videoFile: null,
      posterFile: null,
      backdropFile: null,
      trailerFile: null,
      subtitleFiles: [],
      uploadProgress: 0,
      uploading: false,
    });
  };

  const openEditModal = (item: ContentItem) => {
    setSelectedItem(item);
    setNewContent({
      title: item.title,
      description: item.description,
      type: item.type,
      genre: item.genre,
      releaseDate: item.releaseDate.split("T")[0],
      duration: item.duration,
      director: item.director,
      cast: item.cast.map((c) => c.name),
      language: item.language,
      country: item.country,
      featured: item.featured,
      trending: item.trending,
      status: item.status,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (item: ContentItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const openUploadModal = (item: ContentItem) => {
    setSelectedItem(item);
    setShowUploadModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleArrayInputChange = (
    value: string,
    field: "genre" | "director" | "cast"
  ) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setNewContent((prev) => ({ ...prev, [field]: array }));
  };

  if (loading && content.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Content Management</h1>
            <p className="text-muted-foreground">
              Manage movies, TV shows, and content
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">
            Manage movies, TV shows, and content
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Content
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Content</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">
                  {content.filter((c) => c.status === "published").length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Featured</p>
                <p className="text-2xl font-bold">
                  {content.filter((c) => c.featured).length}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">
                  {content.filter((c) => c.status === "published").length}
                </p>
              </div>
              <Upload className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search content by title, director, or cast..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4 pt-4 border-t">
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="tv_show">TV Shows</SelectItem>
                  <SelectItem value="documentary">Documentaries</SelectItem>
                  <SelectItem value="short_film">Short Films</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.genre}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, genre: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genres</SelectItem>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.featured}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, featured: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Featured</SelectItem>
                  <SelectItem value="false">Not Featured</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="releaseDate">Release Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="viewCount">Views</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortOrder}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sortOrder: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedContent.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedContent.length} item(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("publish")}
                >
                  Publish
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("archive")}
                >
                  Archive
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      {/* Content Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {content.map((item) => (
            <div key={item.id} className="group relative">
              <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3]">
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" onClick={() => openEditModal(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => openUploadModal(item)}>
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openDeleteModal(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>

                {/* Featured/Trending Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {item.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {item.trending && (
                    <Badge className="bg-red-100 text-red-800">Trending</Badge>
                  )}
                </div>

                {/* Selection Checkbox */}
                <div className="absolute bottom-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedContent.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContent((prev) => [...prev, item.id]);
                      } else {
                        setSelectedContent((prev) =>
                          prev.filter((id) => id !== item.id)
                        );
                      }
                    }}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              {/* Content Info */}
              <div className="mt-2 space-y-1">
                <h3 className="font-medium text-sm truncate">{item.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {item.type.replace("_", " ")}
                  </Badge>
                  <span>{formatDate(item.releaseDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{item.viewCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4">
                      <input
                        type="checkbox"
                        checked={selectedContent.length === content.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContent(content.map((c) => c.id));
                          } else {
                            setSelectedContent([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-4">Content</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Release Date</th>
                    <th className="text-left p-4">Rating</th>
                    <th className="text-left p-4">Views</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {content.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedContent.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContent((prev) => [...prev, item.id]);
                            } else {
                              setSelectedContent((prev) =>
                                prev.filter((id) => id !== item.id)
                              );
                            }
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {item.description}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {item.featured && (
                                <Badge variant="secondary" className="text-xs">
                                  Featured
                                </Badge>
                              )}
                              {item.trending && (
                                <Badge variant="secondary" className="text-xs">
                                  Trending
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {item.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {formatDate(item.releaseDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{item.viewCount.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUploadModal(item)}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} items
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Content Modal */}
      <FormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetNewContent();
        }}
        title="Add New Content"
        onSubmit={handleCreateContent}
        submitText="Create Content"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newContent.title}
                onChange={(e) =>
                  setNewContent((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Content title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select
                value={newContent.type}
                onValueChange={(value) =>
                  setNewContent((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="tv_show">TV Show</SelectItem>
                  <SelectItem value="documentary">Documentary</SelectItem>
                  <SelectItem value="short_film">Short Film</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={newContent.description}
              onChange={(e) =>
                setNewContent((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Content description"
              className="w-full p-2 border rounded-md resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Release Date</label>
              <Input
                type="date"
                value={newContent.releaseDate}
                onChange={(e) =>
                  setNewContent((prev) => ({
                    ...prev,
                    releaseDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={newContent.duration}
                onChange={(e) =>
                  setNewContent((prev) => ({
                    ...prev,
                    duration: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="120"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Genres</label>
            <Input
              value={newContent.genre.join(", ")}
              onChange={(e) => handleArrayInputChange(e.target.value, "genre")}
              placeholder="action, comedy, drama"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated list
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Director(s)</label>
            <Input
              value={newContent.director.join(", ")}
              onChange={(e) =>
                handleArrayInputChange(e.target.value, "director")
              }
              placeholder="Christopher Nolan, Steven Spielberg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated list
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Cast</label>
            <Input
              value={newContent.cast.join(", ")}
              onChange={(e) => handleArrayInputChange(e.target.value, "cast")}
              placeholder="Actor 1, Actor 2, Actor 3"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated list
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Language</label>
              <Input
                value={newContent.language}
                onChange={(e) =>
                  setNewContent((prev) => ({
                    ...prev,
                    language: e.target.value,
                  }))
                }
                placeholder="en"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Country</label>
              <Input
                value={newContent.country}
                onChange={(e) =>
                  setNewContent((prev) => ({
                    ...prev,
                    country: e.target.value,
                  }))
                }
                placeholder="US"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Featured</label>
              <Switch
                checked={newContent.featured}
                onCheckedChange={(checked) =>
                  setNewContent((prev) => ({ ...prev, featured: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Trending</label>
              <Switch
                checked={newContent.trending}
                onCheckedChange={(checked) =>
                  setNewContent((prev) => ({ ...prev, trending: checked }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={newContent.status}
                onValueChange={(value) =>
                  setNewContent((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </FormModal>

      {/* Edit Content Modal */}
      <FormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
          resetNewContent();
        }}
        title="Edit Content"
        onSubmit={handleEditContent}
        submitText="Update Content"
        size="lg"
      >
        {/* Same form fields as create modal */}
        <div className="space-y-4">
          {/* Content form fields here - same as create modal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newContent.title}
                onChange={(e) =>
                  setNewContent((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Content title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select
                value={newContent.type}
                onValueChange={(value) =>
                  setNewContent((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="tv_show">TV Show</SelectItem>
                  <SelectItem value="documentary">Documentary</SelectItem>
                  <SelectItem value="short_film">Short Film</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Add rest of the form fields similar to create modal */}
        </div>
      </FormModal>

      {/* Upload Files Modal */}
      <FormModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedItem(null);
          resetUploadData();
        }}
        title="Upload Files"
        onSubmit={handleFileUpload}
        submitText={uploadData.uploading ? "Uploading..." : "Upload Files"}
        submitDisabled={!uploadData.videoFile || uploadData.uploading}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Video File *</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  setUploadData((prev) => ({ ...prev, videoFile: file }));
              }}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Poster Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  setUploadData((prev) => ({ ...prev, posterFile: file }));
              }}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Backdrop Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  setUploadData((prev) => ({ ...prev, backdropFile: file }));
              }}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Trailer (Optional)</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  setUploadData((prev) => ({ ...prev, trailerFile: file }));
              }}
              className="w-full p-2 border rounded-md"
            />
          </div>

          {uploadData.uploading && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Upload Progress</span>
                <span>{uploadData.uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadData.uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        onConfirm={handleDeleteContent}
        title="Delete Content"
        message={`Are you sure you want to delete "${selectedItem?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default ContentManager;
