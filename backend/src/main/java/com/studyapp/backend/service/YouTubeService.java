package com.studyapp.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyapp.backend.dto.YouTubeDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class YouTubeService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${app.youtube.api-key:}")
    private String apiKey;

    @Value("${app.youtube.max-results:20}")
    private int defaultMaxResults;

    @Value("${app.youtube.timeout-seconds:15}")
    private int timeoutSeconds;

    private static final String YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
    private static final String YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

    private static final Set<String> HIGH_AUTHORITY_CHANNELS = Set.of(
            "mit opencourseware", "khan academy", "freecodecamp", "crashcourse",
            "stanford", "harvard", "3blue1brown", "nptel", "cs dojo",
            "statquest with josh starmer", "traversy media", "fireship",
            "geeksforgeeks", "gate smashers", "neso academy", "edureka", "simplilearn"
    );

    public YouTubeService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isConfigured() {
        return apiKey != null
                && !apiKey.isBlank()
                && !apiKey.equalsIgnoreCase("your-youtube-api-key-here")
                && !apiKey.startsWith("${");
    }

    public YouTubeDto.StatusResponse getStatus() {
        boolean configured = isConfigured();
        return YouTubeDto.StatusResponse.builder()
                .configured(configured)
                .message(configured
                        ? "YouTube Data API v3 key is active and ready."
                        : "YouTube Data API v3 key is not configured. Add YOUTUBE_API_KEY in environment or application.properties.")
                .build();
    }

    public YouTubeDto.SearchResponse searchVideos(YouTubeDto.SearchRequest request) {
        if (!isConfigured()) {
            log.warn("YouTube search requested but app.youtube.api-key is not configured.");
            return YouTubeDto.SearchResponse.builder()
                    .query(request != null ? request.getQuery() : "")
                    .totalResults(0)
                    .videos(Collections.emptyList())
                    .apiKeyConfigured(false)
                    .quotaExceeded(false)
                    .errorMessage("YouTube Data API v3 key is not configured on this server. Set YOUTUBE_API_KEY in your backend environment variables or application.properties.")
                    .build();
        }

        String rawQuery = request.getQuery() != null ? request.getQuery().trim() : "";
        if (rawQuery.isBlank()) {
            throw new IllegalArgumentException("Search query cannot be empty.");
        }

        try {
            // 1. Build optimized YouTube search query
            StringBuilder queryBuilder = new StringBuilder(rawQuery);
            if (request.getSubjectName() != null && !request.getSubjectName().isBlank()) {
                queryBuilder.append(" ").append(request.getSubjectName().trim());
            }

            // Append pedagogical intent keywords if difficulty requested
            if ("EXAM_CRASH_COURSE".equalsIgnoreCase(request.getDifficulty())) {
                queryBuilder.append(" crash course revision");
            } else if ("BEGINNER".equalsIgnoreCase(request.getDifficulty())) {
                queryBuilder.append(" tutorial for beginners");
            } else if ("ADVANCED".equalsIgnoreCase(request.getDifficulty())) {
                queryBuilder.append(" deep dive advanced lecture");
            }

            String searchQuery = queryBuilder.toString().trim();

            // 2. Build search endpoint URI
            StringBuilder searchUrl = new StringBuilder(YOUTUBE_SEARCH_URL);
            searchUrl.append("?part=snippet")
                    .append("&type=video")
                    .append("&videoEmbeddable=true")
                    .append("&maxResults=").append(Math.min(defaultMaxResults, 25))
                    .append("&q=").append(URLEncoder.encode(searchQuery, StandardCharsets.UTF_8))
                    .append("&key=").append(apiKey.trim());

            // Handle language filter
            if (request.getLanguage() != null && !request.getLanguage().equalsIgnoreCase("ALL")) {
                searchUrl.append("&relevanceLanguage=").append(URLEncoder.encode(request.getLanguage().toLowerCase(), StandardCharsets.UTF_8));
            }

            // Handle duration filter for search API
            if ("SHORT".equalsIgnoreCase(request.getDurationFilter())) {
                searchUrl.append("&videoDuration=short"); // < 4 min
            } else if ("MEDIUM".equalsIgnoreCase(request.getDurationFilter())) {
                searchUrl.append("&videoDuration=medium"); // 4-20 min
            } else if ("LONG".equalsIgnoreCase(request.getDurationFilter())) {
                searchUrl.append("&videoDuration=long"); // > 20 min
            }

            // Handle sorting for search API
            String sortBy = request.getSortBy() != null ? request.getSortBy().toUpperCase() : "BEST_MATCH";
            if ("MOST_VIEWED".equals(sortBy)) {
                searchUrl.append("&order=viewCount");
            } else if ("NEWEST".equals(sortBy)) {
                searchUrl.append("&order=date");
            } else {
                searchUrl.append("&order=relevance");
            }

            HttpRequest searchHttpReq = HttpRequest.newBuilder()
                    .uri(URI.create(searchUrl.toString()))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> searchHttpRes = httpClient.send(searchHttpReq, HttpResponse.BodyHandlers.ofString());

            if (searchHttpRes.statusCode() == 403) {
                log.error("YouTube Search API 403 Forbidden: {}", searchHttpRes.body());
                boolean isQuota = searchHttpRes.body().contains("quotaExceeded") || searchHttpRes.body().contains("quota");
                return YouTubeDto.SearchResponse.builder()
                        .query(rawQuery)
                        .totalResults(0)
                        .videos(Collections.emptyList())
                        .apiKeyConfigured(true)
                        .quotaExceeded(isQuota)
                        .errorMessage(isQuota
                                ? "YouTube Data API daily quota limit exceeded. You can retry tomorrow or configure a new API key."
                                : "YouTube Data API key is invalid or lacks YouTube Data API v3 permissions.")
                        .build();
            }

            if (searchHttpRes.statusCode() != 200) {
                log.error("YouTube Search API failed with code {}: {}", searchHttpRes.statusCode(), searchHttpRes.body());
                return YouTubeDto.SearchResponse.builder()
                        .query(rawQuery)
                        .totalResults(0)
                        .videos(Collections.emptyList())
                        .apiKeyConfigured(true)
                        .quotaExceeded(false)
                        .errorMessage("YouTube Search API returned status " + searchHttpRes.statusCode())
                        .build();
            }

            JsonNode searchJson = objectMapper.readTree(searchHttpRes.body());
            JsonNode items = searchJson.path("items");
            if (!items.isArray() || items.isEmpty()) {
                return YouTubeDto.SearchResponse.builder()
                        .query(rawQuery)
                        .totalResults(0)
                        .videos(Collections.emptyList())
                        .apiKeyConfigured(true)
                        .quotaExceeded(false)
                        .build();
            }

            List<String> videoIds = new ArrayList<>();
            for (JsonNode item : items) {
                String videoId = item.path("id").path("videoId").asText(null);
                if (videoId != null && !videoId.isBlank()) {
                    videoIds.add(videoId);
                }
            }

            if (videoIds.isEmpty()) {
                return YouTubeDto.SearchResponse.builder()
                        .query(rawQuery)
                        .totalResults(0)
                        .videos(Collections.emptyList())
                        .apiKeyConfigured(true)
                        .quotaExceeded(false)
                        .build();
            }

            // 3. Fetch detailed statistics and duration using videos.list
            String idsParam = String.join(",", videoIds);
            String videosUrl = YOUTUBE_VIDEOS_URL + "?part=snippet,contentDetails,statistics&id="
                    + URLEncoder.encode(idsParam, StandardCharsets.UTF_8)
                    + "&key=" + apiKey.trim();

            HttpRequest videosHttpReq = HttpRequest.newBuilder()
                    .uri(URI.create(videosUrl))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> videosHttpRes = httpClient.send(videosHttpReq, HttpResponse.BodyHandlers.ofString());

            if (videosHttpRes.statusCode() != 200) {
                log.error("YouTube Videos API failed with code {}: {}", videosHttpRes.statusCode(), videosHttpRes.body());
                return YouTubeDto.SearchResponse.builder()
                        .query(rawQuery)
                        .totalResults(0)
                        .videos(Collections.emptyList())
                        .apiKeyConfigured(true)
                        .quotaExceeded(false)
                        .errorMessage("Failed to retrieve video statistics from YouTube API.")
                        .build();
            }

            JsonNode videosJson = objectMapper.readTree(videosHttpRes.body());
            JsonNode videoItems = videosJson.path("items");

            List<YouTubeDto.VideoItemDto> videoList = new ArrayList<>();
            for (JsonNode vItem : videoItems) {
                YouTubeDto.VideoItemDto dto = parseVideoItem(vItem, rawQuery, request);
                if (dto != null) {
                    videoList.add(dto);
                }
            }

            // 4. Rank and sort videos according to requested strategy
            sortVideos(videoList, sortBy);

            return YouTubeDto.SearchResponse.builder()
                    .query(rawQuery)
                    .totalResults(videoList.size())
                    .videos(videoList)
                    .apiKeyConfigured(true)
                    .quotaExceeded(false)
                    .build();

        } catch (Exception e) {
            log.error("Error executing YouTube search for query '{}': {}", rawQuery, e.getMessage(), e);
            return YouTubeDto.SearchResponse.builder()
                    .query(rawQuery)
                    .totalResults(0)
                    .videos(Collections.emptyList())
                    .apiKeyConfigured(true)
                    .quotaExceeded(false)
                    .errorMessage("Error searching YouTube: " + e.getMessage())
                    .build();
        }
    }

    private YouTubeDto.VideoItemDto parseVideoItem(JsonNode vItem, String query, YouTubeDto.SearchRequest request) {
        String id = vItem.path("id").asText();
        JsonNode snippet = vItem.path("snippet");
        JsonNode statistics = vItem.path("statistics");
        JsonNode contentDetails = vItem.path("contentDetails");

        if (id == null || id.isBlank() || snippet.isMissingNode()) {
            return null;
        }

        String rawTitle = snippet.path("title").asText("");
        String title = unescapeHtml(rawTitle);
        String description = unescapeHtml(snippet.path("description").asText(""));
        String channelTitle = unescapeHtml(snippet.path("channelTitle").asText(""));
        String channelId = snippet.path("channelId").asText("");
        String publishedAt = snippet.path("publishedAt").asText("");

        // High resolution thumbnail fallback
        String thumbnailUrl = snippet.path("thumbnails").path("maxres").path("url").asText(null);
        if (thumbnailUrl == null) {
            thumbnailUrl = snippet.path("thumbnails").path("high").path("url").asText(null);
        }
        if (thumbnailUrl == null) {
            thumbnailUrl = snippet.path("thumbnails").path("medium").path("url").asText(null);
        }
        if (thumbnailUrl == null) {
            thumbnailUrl = "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
        }

        // Parse Duration (ISO 8601: PT#M#S)
        String isoDuration = contentDetails.path("duration").asText("");
        long durationSeconds = parseIsoDuration(isoDuration);
        String formattedDuration = formatDuration(durationSeconds);

        // Parse statistics with clean fallbacks
        Long views = statistics.has("viewCount") ? statistics.path("viewCount").asLong() : null;
        String formattedViews = views != null ? formatCount(views) + " views" : "Not available";

        Long likes = statistics.has("likeCount") ? statistics.path("likeCount").asLong() : null;
        String formattedLikes = likes != null ? formatCount(likes) : "Not available";

        String formattedPublishedDate = formatPublishedDate(publishedAt);

        // Tags
        List<String> tags = new ArrayList<>();
        JsonNode tagsNode = snippet.path("tags");
        if (tagsNode.isArray()) {
            for (int i = 0; i < Math.min(tagsNode.size(), 4); i++) {
                tags.add(tagsNode.get(i).asText());
            }
        }

        // Determine difficulty badge
        String difficultyBadge = determineDifficultyBadge(title, description, durationSeconds);

        // Calculate Multi-Factor Composite Score
        double compositeScore = computeCompositeScore(title, description, channelTitle, views, likes, durationSeconds, publishedAt, query);

        // Generate AI Recommendation Reason
        String recommendationReason = generateRecommendationReason(title, channelTitle, views, likes, durationSeconds, publishedAt);

        return YouTubeDto.VideoItemDto.builder()
                .id(id)
                .title(title)
                .description(description)
                .channelTitle(channelTitle)
                .channelId(channelId)
                .thumbnailUrl(thumbnailUrl)
                .publishedAt(publishedAt)
                .formattedPublishedDate(formattedPublishedDate)
                .duration(formattedDuration)
                .durationSeconds(durationSeconds)
                .views(views)
                .formattedViews(formattedViews)
                .likes(likes)
                .formattedLikes(formattedLikes)
                .videoUrl("https://www.youtube.com/watch?v=" + id)
                .recommendationReason(recommendationReason)
                .tags(tags)
                .difficultyBadge(difficultyBadge)
                .compositeScore(compositeScore)
                .build();
    }

    private double computeCompositeScore(String title, String description, String channelTitle,
                                         Long views, Long likes, long durationSeconds,
                                         String publishedAt, String query) {
        String lowerTitle = title.toLowerCase();
        String lowerDesc = description.toLowerCase();
        String lowerChannel = channelTitle.toLowerCase();
        String lowerQuery = query.toLowerCase();

        // 1. Relevance Score (0 - 40)
        double relevanceScore = 15.0;
        String[] queryWords = lowerQuery.split("\\s+");
        for (String word : queryWords) {
            if (word.length() > 2) {
                if (lowerTitle.contains(word)) relevanceScore += 8.0;
                if (lowerDesc.contains(word)) relevanceScore += 2.0;
            }
        }

        // Pedagogical keywords bonus
        if (lowerTitle.contains("tutorial") || lowerTitle.contains("course") || lowerTitle.contains("lecture")
                || lowerTitle.contains("explained") || lowerTitle.contains("derivation") || lowerTitle.contains("guide")) {
            relevanceScore += 8.0;
        }

        // High authority educator channel bonus
        if (HIGH_AUTHORITY_CHANNELS.stream().anyMatch(lowerChannel::contains)) {
            relevanceScore += 10.0;
        }

        // 2. Popularity Logarithmic Score (0 - 25)
        double popScore = 0.0;
        if (views != null && views > 0) {
            popScore = Math.min(25.0, Math.log10(views) * 3.5);
        }

        // 3. Engagement Score (0 - 20)
        double engScore = 5.0;
        if (views != null && views > 100 && likes != null && likes > 0) {
            double likeRatio = (double) likes / views;
            engScore = Math.min(20.0, likeRatio * 400.0);
        }

        // 4. Recency & Velocity Score (0 - 15)
        double recencyScore = 5.0;
        try {
            if (publishedAt != null && !publishedAt.isBlank()) {
                Instant pubInstant = Instant.parse(publishedAt);
                long daysOld = Math.max(1, ChronoUnit.DAYS.between(pubInstant, Instant.now()));
                if (daysOld < 180) recencyScore = 15.0;
                else if (daysOld < 365) recencyScore = 12.0;
                else if (daysOld < 730) recencyScore = 9.0;
                else recencyScore = 5.0;
            }
        } catch (Exception ignored) {}

        return relevanceScore + popScore + engScore + recencyScore;
    }

    private String generateRecommendationReason(String title, String channelTitle, Long views, Long likes,
                                                long durationSeconds, String publishedAt) {
        String lowerTitle = title.toLowerCase();
        String lowerChannel = channelTitle.toLowerCase();

        boolean isEducator = HIGH_AUTHORITY_CHANNELS.stream().anyMatch(lowerChannel::contains);

        if (isEducator) {
            return "Curated from top academic institution / recognized technical educator (" + channelTitle + ").";
        }

        if (durationSeconds > 0 && durationSeconds <= 600) {
            return "Concise high-yield concept review (< 10 mins) — ideal for fast exam revision.";
        }

        if (durationSeconds >= 2400) {
            return "Comprehensive deep-dive lecture with complete derivations and practical walk-throughs.";
        }

        if (views != null && views >= 500_000) {
            return "Widely trusted by over " + formatCount(views) + " learners with strong positive engagement.";
        }

        if (views != null && likes != null && views > 1000 && ((double) likes / views) > 0.04) {
            return "High community rating (top like-to-view ratio) for clarity and explanation depth.";
        }

        if (lowerTitle.contains("step by step") || lowerTitle.contains("visual") || lowerTitle.contains("animation")) {
            return "Features step-by-step visual intuitions to help master complex concepts quickly.";
        }

        return "Strong syllabus keyword alignment with clear teaching methodology and practical examples.";
    }

    private String determineDifficultyBadge(String title, String description, long durationSeconds) {
        String combined = (title + " " + description).toLowerCase();

        if (combined.contains("crash course") || combined.contains("revision in") || combined.contains("one shot")) {
            return "Exam Crash Course";
        }
        if (combined.contains("advanced") || combined.contains("deep dive") || combined.contains("internal") || durationSeconds > 3000) {
            return "Advanced / Deep Dive";
        }
        if (combined.contains("beginner") || combined.contains("basics") || combined.contains("introduction") || combined.contains("for dummies")) {
            return "Beginner Friendly";
        }
        return "Core Concept";
    }

    private void sortVideos(List<YouTubeDto.VideoItemDto> list, String sortBy) {
        switch (sortBy) {
            case "MOST_VIEWED":
                list.sort((a, b) -> Long.compare(b.getViews() != null ? b.getViews() : 0L, a.getViews() != null ? a.getViews() : 0L));
                break;
            case "NEWEST":
                list.sort((a, b) -> {
                    String d1 = a.getPublishedAt() != null ? a.getPublishedAt() : "";
                    String d2 = b.getPublishedAt() != null ? b.getPublishedAt() : "";
                    return d2.compareTo(d1);
                });
                break;
            case "TRENDING_ESTIMATE":
                list.sort((a, b) -> {
                    double v1 = computeVelocity(a.getViews(), a.getPublishedAt());
                    double v2 = computeVelocity(b.getViews(), b.getPublishedAt());
                    return Double.compare(v2, v1);
                });
                break;
            case "BEST_MATCH":
            default:
                list.sort((a, b) -> Double.compare(b.getCompositeScore() != null ? b.getCompositeScore() : 0.0,
                        a.getCompositeScore() != null ? a.getCompositeScore() : 0.0));
                break;
        }
    }

    private double computeVelocity(Long views, String publishedAt) {
        if (views == null || views <= 0 || publishedAt == null) return 0.0;
        try {
            Instant pub = Instant.parse(publishedAt);
            long days = Math.max(1, ChronoUnit.DAYS.between(pub, Instant.now()));
            return (double) views / days;
        } catch (Exception e) {
            return views.doubleValue();
        }
    }

    private long parseIsoDuration(String iso) {
        if (iso == null || iso.isBlank()) return 0;
        try {
            Duration d = Duration.parse(iso);
            return d.getSeconds();
        } catch (Exception e) {
            return 0;
        }
    }

    private String formatDuration(long seconds) {
        if (seconds <= 0) return "Not available";
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        long s = seconds % 60;
        if (h > 0) {
            return String.format("%d:%02d:%02d", h, m, s);
        }
        return String.format("%d:%02d", m, s);
    }

    private String formatCount(long count) {
        if (count >= 1_000_000) {
            return String.format("%.1fM", count / 1_000_000.0);
        } else if (count >= 1_000) {
            return String.format("%.1fK", count / 1_000.0);
        }
        return String.valueOf(count);
    }

    private String formatPublishedDate(String isoDate) {
        if (isoDate == null || isoDate.isBlank()) return "Not available";
        try {
            Instant published = Instant.parse(isoDate);
            Instant now = Instant.now();
            long days = ChronoUnit.DAYS.between(published, now);

            if (days <= 0) return "Today";
            if (days == 1) return "1 day ago";
            if (days < 30) return days + " days ago";
            long months = days / 30;
            if (months < 12) return months + (months == 1 ? " month ago" : " months ago");
            long years = months / 12;
            return years + (years == 1 ? " year ago" : " years ago");
        } catch (Exception e) {
            return isoDate.split("T")[0];
        }
    }

    private String unescapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&apos;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
    }
}
