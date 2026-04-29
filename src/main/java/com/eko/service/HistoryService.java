package com.eko.service;

import com.eko.model.WatchedPlaylist;
import com.eko.model.WatchedVideo;
import com.eko.repository.UserRepository;
import com.eko.repository.WatchedPlaylistRepository;
import com.eko.repository.WatchedVideoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class HistoryService {

    private final WatchedVideoRepository videoRepo;
    private final WatchedPlaylistRepository playlistRepo;
    private final UserRepository userRepo;

    public HistoryService(WatchedVideoRepository videoRepo,
                          WatchedPlaylistRepository playlistRepo,
                          UserRepository userRepo) {
        this.videoRepo = videoRepo;
        this.playlistRepo = playlistRepo;
        this.userRepo = userRepo;
    }

    public void saveVideo(String username, String videoId, String title,
                          String channelTitle, String thumbnailUrl) {
        userRepo.findByName(username).ifPresent(user -> {
            WatchedVideo wv = videoRepo.findByUserAndVideoId(user, videoId)
                    .orElse(new WatchedVideo());
            wv.setUser(user);
            wv.setVideoId(videoId);
            wv.setTitle(title);
            wv.setChannelTitle(channelTitle);
            wv.setThumbnailUrl(thumbnailUrl);
            wv.setWatchedAt(LocalDateTime.now());
            videoRepo.save(wv);
        });
    }

    public void savePlaylist(String username, String playlistId,
                             String thumbnailUrl, int videoCount) {
        userRepo.findByName(username).ifPresent(user -> {
            WatchedPlaylist wp = playlistRepo.findByUserAndPlaylistId(user, playlistId)
                    .orElse(new WatchedPlaylist());
            wp.setUser(user);
            wp.setPlaylistId(playlistId);
            wp.setThumbnailUrl(thumbnailUrl);
            wp.setVideoCount(videoCount);
            wp.setAccessedAt(LocalDateTime.now());
            playlistRepo.save(wp);
        });
    }

    public List<WatchedVideo> getVideos(String username) {
        return userRepo.findByName(username)
                .map(videoRepo::findByUserOrderByWatchedAtDesc)
                .orElse(List.of());
    }

    public List<WatchedPlaylist> getPlaylists(String username) {
        return userRepo.findByName(username)
                .map(playlistRepo::findByUserOrderByAccessedAtDesc)
                .orElse(List.of());
    }
}
