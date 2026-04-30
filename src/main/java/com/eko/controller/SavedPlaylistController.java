package com.eko.controller;

import com.eko.model.SavedPlaylist;
import com.eko.model.User;
import com.eko.repository.SavedPlaylistRepository;
import com.eko.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
public class SavedPlaylistController {

    private final SavedPlaylistRepository savedPlaylistRepo;
    private final UserRepository userRepo;

    public SavedPlaylistController(SavedPlaylistRepository savedPlaylistRepo,
                                   UserRepository userRepo) {
        this.savedPlaylistRepo = savedPlaylistRepo;
        this.userRepo = userRepo;
    }

    @PostMapping("/playlist/save")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> savePlaylist(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {

        String username = userDetails.getUsername();
        Optional<User> userOpt = userRepo.findByName(username);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().build();

        String playlistId = (String) body.get("playlistId");
        String name = (String) body.get("name");
        if (playlistId == null || playlistId.isBlank() || name == null || name.isBlank())
            return ResponseEntity.badRequest().build();

        String thumbnailUrl = (String) body.getOrDefault("thumbnailUrl", "");
        int videoCount = body.get("videoCount") instanceof Number n ? n.intValue() : 0;

        User user = userOpt.get();
        SavedPlaylist sp = savedPlaylistRepo.findByUserAndPlaylistId(user, playlistId)
                .orElse(new SavedPlaylist());
        sp.setUser(user);
        sp.setPlaylistId(playlistId);
        sp.setName(name.trim());
        sp.setThumbnailUrl(thumbnailUrl);
        sp.setVideoCount(videoCount);
        sp.setSavedAt(LocalDateTime.now());
        savedPlaylistRepo.save(sp);

        return ResponseEntity.ok(Map.of("name", sp.getName()));
    }

    @DeleteMapping("/playlist/saved/{id}")
    @ResponseBody
    public ResponseEntity<Void> deleteSavedPlaylist(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        String username = userDetails.getUsername();
        Optional<User> userOpt = userRepo.findByName(username);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().build();

        Optional<SavedPlaylist> spOpt = savedPlaylistRepo.findById(id);
        if (spOpt.isEmpty()) return ResponseEntity.notFound().build();
        SavedPlaylist sp = spOpt.get();
        if (!sp.getUser().getName().equals(username)) return ResponseEntity.status(403).build();
        savedPlaylistRepo.delete(sp);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/saved-playlists")
    public String savedPlaylists(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        String username = userDetails.getUsername();
        List<SavedPlaylist> saved = userRepo.findByName(username)
                .map(savedPlaylistRepo::findByUserOrderBySavedAtDesc)
                .orElse(List.of());
        model.addAttribute("savedPlaylists", saved);
        return "saved-playlists";
    }
}
