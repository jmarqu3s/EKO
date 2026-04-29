package com.eko.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "watched_playlists")
public class WatchedPlaylist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String playlistId;

    private String thumbnailUrl;
    private int videoCount;

    @Column(nullable = false)
    private LocalDateTime accessedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getPlaylistId() { return playlistId; }
    public void setPlaylistId(String playlistId) { this.playlistId = playlistId; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public int getVideoCount() { return videoCount; }
    public void setVideoCount(int videoCount) { this.videoCount = videoCount; }

    public LocalDateTime getAccessedAt() { return accessedAt; }
    public void setAccessedAt(LocalDateTime accessedAt) { this.accessedAt = accessedAt; }
}
