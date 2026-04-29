package com.eko.repository;

import com.eko.model.User;
import com.eko.model.WatchedVideo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WatchedVideoRepository extends JpaRepository<WatchedVideo, Long> {
    List<WatchedVideo> findByUserOrderByWatchedAtDesc(User user);
    Optional<WatchedVideo> findByUserAndVideoId(User user, String videoId);
}
