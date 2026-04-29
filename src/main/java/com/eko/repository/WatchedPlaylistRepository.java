package com.eko.repository;

import com.eko.model.User;
import com.eko.model.WatchedPlaylist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchedPlaylistRepository extends JpaRepository<WatchedPlaylist, Long> {
    List<WatchedPlaylist> findByUserOrderByAccessedAtDesc(User user);
    Optional<WatchedPlaylist> findByUserAndPlaylistId(User user, String playlistId);
}
