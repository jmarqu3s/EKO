package com.eko.service;

import com.eko.model.PlaylistResult;
import com.eko.model.VideoItem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Service
public class YouTubeService {

    private static final Logger log = LoggerFactory.getLogger(YouTubeService.class);

    @Value("${youtube.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String PLAYLIST_ITEMS_URL =
        "https://www.googleapis.com/youtube/v3/playlistItems";

    private static final String VIDEOS_URL =
        "https://www.googleapis.com/youtube/v3/videos";

    public PlaylistResult getPlaylistVideos(String playlistId) throws Exception {
        List<VideoItem> videos = new ArrayList<>();
        int hiddenCount = 0;
        String pageToken = null;

        do {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(PLAYLIST_ITEMS_URL)
                .queryParam("part", "snippet")
                .queryParam("playlistId", playlistId)
                .queryParam("maxResults", 50)
                .queryParam("key", apiKey);

            if (pageToken != null) {
                builder.queryParam("pageToken", pageToken);
            }

            String response = restTemplate.getForObject(builder.toUriString(), String.class);
            JsonNode root = mapper.readTree(response);

            List<VideoItem> pageCandidates = new ArrayList<>();
            List<String> pageVideoIds = new ArrayList<>();

            for (JsonNode item : root.path("items")) {
                JsonNode snippet = item.path("snippet");
                JsonNode resourceId = snippet.path("resourceId");

                String videoId = resourceId.path("videoId").asText();
                if (videoId.isBlank()) continue;

                String title = snippet.path("title").asText();
                String channel = snippet.path("videoOwnerChannelTitle").asText();
                String thumbnail = snippet.path("thumbnails").path("medium").path("url").asText();

                pageCandidates.add(new VideoItem(videoId, title, channel, thumbnail));
                pageVideoIds.add(videoId);
            }

            if (!pageVideoIds.isEmpty()) {
                java.util.Set<String> playable = getPlayableVideoIds(pageVideoIds);
                for (VideoItem v : pageCandidates) {
                    if (playable.contains(v.getVideoId())) {
                        videos.add(v);
                    } else {
                        hiddenCount++;
                    }
                }
            }

            JsonNode nextPage = root.path("nextPageToken");
            pageToken = nextPage.isMissingNode() ? null : nextPage.asText();

        } while (pageToken != null);

        return new PlaylistResult(videos, hiddenCount);
    }

    private java.util.Set<String> getPlayableVideoIds(List<String> videoIds) {
        java.util.Set<String> playable = new java.util.HashSet<>();
        try {
            String ids = String.join(",", videoIds);
            String url = UriComponentsBuilder.fromHttpUrl(VIDEOS_URL)
                .queryParam("part", "status,contentDetails")
                .queryParam("id", ids)
                .queryParam("key", apiKey)
                .toUriString();

            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = mapper.readTree(response);

            for (JsonNode item : root.path("items")) {
                JsonNode status = item.path("status");
                boolean isPublic     = "public".equals(status.path("privacyStatus").asText());
                boolean isEmbeddable = status.path("embeddable").asBoolean(false);

                if (!isPublic || !isEmbeddable) continue;

                if (isRegionBlocked(item.path("contentDetails"), "BR")) continue;

                playable.add(item.path("id").asText());
            }
        } catch (Exception e) {
            log.warn("Erro ao verificar status dos vídeos: {}", e.getMessage());
        }
        return playable;
    }

    private boolean isRegionBlocked(JsonNode contentDetails, String regionCode) {
        JsonNode restriction = contentDetails.path("regionRestriction");
        if (restriction.isMissingNode()) return false;

        JsonNode blocked = restriction.path("blocked");
        if (!blocked.isMissingNode()) {
            for (JsonNode r : blocked) {
                if (regionCode.equalsIgnoreCase(r.asText())) return true;
            }
        }

        JsonNode allowed = restriction.path("allowed");
        if (!allowed.isMissingNode()) {
            for (JsonNode r : allowed) {
                if (regionCode.equalsIgnoreCase(r.asText())) return false;
            }
            return true;
        }

        return false;
    }

    public VideoItem getVideoInfo(String videoId) throws Exception {
        String url = UriComponentsBuilder.fromHttpUrl(VIDEOS_URL)
            .queryParam("part", "snippet")
            .queryParam("id", videoId)
            .queryParam("key", apiKey)
            .toUriString();

        String response = restTemplate.getForObject(url, String.class);
        JsonNode root = mapper.readTree(response);
        JsonNode items = root.path("items");

        if (!items.isArray() || !items.elements().hasNext()) {
            return new VideoItem(videoId, "", "", "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg");
        }

        JsonNode snippet = items.get(0).path("snippet");
        String title = snippet.path("title").asText();
        String channel = snippet.path("channelTitle").asText();
        String thumbnail = snippet.path("thumbnails").path("medium").path("url").asText();

        return new VideoItem(videoId, title, channel, thumbnail);
    }

    public String extractPlaylistId(String url) {
        String id;
        if (url.contains("list=")) {
            String[] parts = url.split("list=");
            id = parts[1];
            if (id.contains("&")) {
                id = id.substring(0, id.indexOf("&"));
            }
        } else {
            id = url;
        }
        log.info("Playlist ID extraído: '{}'", id);
        return id;
    }
}
