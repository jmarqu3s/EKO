package com.eko.controller;

import com.eko.service.YouTubeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class PlayerController {

    private static final Logger log = LoggerFactory.getLogger(PlayerController.class);
    private final YouTubeService youTubeService;

    public PlayerController(YouTubeService youTubeService) {
        this.youTubeService = youTubeService;
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
    public String loadPlaylist(@RequestParam("url") String url, Model model) {
        try {
            String playlistId = youTubeService.extractPlaylistId(url);
            var result = youTubeService.getPlaylistVideos(playlistId);
            model.addAttribute("videos", result.videos());
            model.addAttribute("hiddenCount", result.hiddenCount());
            model.addAttribute("playlistId", playlistId);
        } catch (Exception e) {
            log.error("Erro ao carregar playlist: {}", e.getMessage(), e);
            model.addAttribute("error", "Não foi possível carregar a playlist. Verifique o link e tente novamente.");
        }
        return "player";
    }
}
