package com.eko.controller;

import com.eko.model.VideoItem;
import com.eko.service.HistoryService;
import com.eko.service.YouTubeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
public class HistoryController {

    private final HistoryService historyService;
    private final YouTubeService youTubeService;

    public HistoryController(HistoryService historyService, YouTubeService youTubeService) {
        this.historyService = historyService;
        this.youTubeService = youTubeService;
    }

    @GetMapping("/history")
    public String history(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        String username = userDetails.getUsername();
        model.addAttribute("videos", historyService.getVideos(username));
        model.addAttribute("playlists", historyService.getPlaylists(username));
        return "history";
    }

    @PostMapping("/history/video")
    @ResponseBody
    public ResponseEntity<Void> saveVideo(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {

        String username = userDetails.getUsername();
        String videoId = body.get("videoId");
        if (videoId == null || videoId.isBlank()) return ResponseEntity.badRequest().build();

        String title = body.getOrDefault("title", "");
        String channelTitle = body.getOrDefault("channelTitle", "");
        String thumbnailUrl = body.getOrDefault("thumbnailUrl", "");

        if (title.isBlank()) {
            try {
                VideoItem info = youTubeService.getVideoInfo(videoId);
                title = info.getTitle();
                channelTitle = info.getChannelTitle();
                thumbnailUrl = info.getThumbnailUrl();
            } catch (Exception ignored) {
                thumbnailUrl = "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg";
            }
        }

        historyService.saveVideo(username, videoId, title, channelTitle, thumbnailUrl);
        return ResponseEntity.ok().build();
    }
}
