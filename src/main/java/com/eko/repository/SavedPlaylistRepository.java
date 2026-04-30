package com.eko.repository;

import com.eko.model.SavedPlaylist;
import com.eko.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedPlaylistRepository extends JpaRepository<SavedPlaylist, Long> {
    List<SavedPlaylist> findByUserOrderBySavedAtDesc(User user);
    Optional<SavedPlaylist> findByUserAndPlaylistId(User user, String playlistId);
}
