package com.eko.model;

import java.util.List;

public record PlaylistResult(List<VideoItem> videos, int hiddenCount) {}
