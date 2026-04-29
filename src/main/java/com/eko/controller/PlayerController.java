package com.eko.controller;

import com.eko.service.HistoryService;
import com.eko.service.YouTubeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class PlayerController {

    private static final Logger log = LoggerFactory.getLogger(PlayerController.class);
    private final YouTubeService youTubeService;
    private final HistoryService historyService;

    public PlayerController(YouTubeService youTubeService, HistoryService historyService) {
        this.youTubeService = youTubeService;
        this.historyService = historyService;
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/watch")
    public String watch() {
        return "watch";
    }

    @PostMapping("/playlist")
    public String loadPlaylist(@RequestParam String url, Model model,
                               @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String playlistId = youTubeService.extractPlaylistId(url);
            var result = youTubeService.getPlaylistVideos(playlistId);
            model.addAttribute("videos", result.videos());
            model.addAttribute("hiddenCount", result.hiddenCount());
            model.addAttribute("playlistId", playlistId);

            if (!result.videos().isEmpty()) {
                historyService.savePlaylist(
                    userDetails.getUsername(),
                    playlistId,
                    result.videos().get(0).getThumbnailUrl(),
                    result.videos().size()
                );
            }
        } catch (Exception e) {
            log.error("Erro ao carregar playlist: {}", e.getMessage(), e);
            model.addAttribute("error", "Não foi possível carregar a playlist. Verifique o link e tente novamente.");
        }
        return "player";
    }

    @GetMapping("/playlist/{id}")
    public String loadPlaylistById(@PathVariable("id") String playlistId, Model model,
                                   @AuthenticationPrincipal UserDetails userDetails) {
        try {
            var result = youTubeService.getPlaylistVideos(playlistId);
            model.addAttribute("videos", result.videos());
            model.addAttribute("hiddenCount", result.hiddenCount());
            model.addAttribute("playlistId", playlistId);

            if (!result.videos().isEmpty()) {
                historyService.savePlaylist(
                    userDetails.getUsername(),
                    playlistId,
                    result.videos().get(0).getThumbnailUrl(),
                    result.videos().size()
                );
            }
        } catch (Exception e) {
            log.error("Erro ao carregar playlist: {}", e.getMessage(), e);
            model.addAttribute("error", "Não foi possível carregar a playlist. Verifique o link e tente novamente.");
        }
        return "player";
    }
}
