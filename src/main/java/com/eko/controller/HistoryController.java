package com.eko.controller;

import com.eko.model.SavedPlaylist;
import com.eko.model.VideoItem;
import com.eko.repository.SavedPlaylistRepository;
import com.eko.repository.UserRepository;
import com.eko.service.HistoryService;
import com.eko.service.YouTubeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class HistoryController {

    private final HistoryService historyService;
    private final YouTubeService youTubeService;
    private final SavedPlaylistRepository savedPlaylistRepo;
    private final UserRepository userRepo;

    public HistoryController(HistoryService historyService, YouTubeService youTubeService,
                             SavedPlaylistRepository savedPlaylistRepo, UserRepository userRepo) {
        this.historyService = historyService;
        this.youTubeService = youTubeService;
        this.savedPlaylistRepo = savedPlaylistRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/history")
    public String history(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        String username = userDetails.getUsername();
        model.addAttribute("videos", historyService.getVideos(username));
        model.addAttribute("playlists", historyService.getPlaylists(username));

        Map<String, String> savedNames = userRepo.findByName(username)
                .map(user -> savedPlaylistRepo.findByUserOrderBySavedAtDesc(user).stream()
                        .collect(Collectors.toMap(SavedPlaylist::getPlaylistId, SavedPlaylist::getName, (a, b) -> a)))
                .orElse(Map.of());
        model.addAttribute("savedPlaylistNames", savedNames);

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
