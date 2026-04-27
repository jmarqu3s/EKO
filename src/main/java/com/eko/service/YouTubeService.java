package com.eko.service;

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

    public List<VideoItem> getPlaylistVideos(String playlistId) throws Exception {
        List<VideoItem> videos = new ArrayList<>();
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

            for (JsonNode item : root.path("items")) {
                JsonNode snippet = item.path("snippet");
                JsonNode resourceId = snippet.path("resourceId");

                String videoId = resourceId.path("videoId").asText();
                if (videoId.isBlank()) continue;

                String title = snippet.path("title").asText();
                String channel = snippet.path("videoOwnerChannelTitle").asText();
                String thumbnail = snippet.path("thumbnails").path("medium").path("url").asText();

                videos.add(new VideoItem(videoId, title, channel, thumbnail));
            }

            JsonNode nextPage = root.path("nextPageToken");
            pageToken = nextPage.isMissingNode() ? null : nextPage.asText();

        } while (pageToken != null);

        return videos;
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
