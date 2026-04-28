let player;
let currentIndex = 0;
let shuffleOn = false;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

function onPlayerReady() {
    const first = document.querySelector('[data-index="0"]');
    if (!first) return;

    currentIndex = 0;
    first.classList.add('active');
    first.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    updateBarInfo({
        title: first.dataset.title,
        channel: first.dataset.channel,
        thumb: first.dataset.thumb
    });

    player.cueVideoById(first.dataset.videoId);
}

function playTrack(el) {
    currentIndex = parseInt(el.dataset.index);

    document.querySelectorAll('.track-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    updateBarInfo({
        title: el.dataset.title,
        channel: el.dataset.channel,
        thumb: el.dataset.thumb
    });

    player.loadVideoById(el.dataset.videoId);
    setPlayIcon(false);
}

function updateBarInfo(video) {
    document.getElementById('bar-title').textContent = video.title;
    document.getElementById('bar-channel').textContent = video.channel;
    document.getElementById('bar-thumb').src = video.thumb;
}

function setPlayIcon(isPlaying) {
    document.getElementById('icon-play').style.display = isPlaying ? 'none' : 'block';
    document.getElementById('icon-pause').style.display = isPlaying ? 'block' : 'none';
}

function togglePlay() {
    if (!player || typeof player.getPlayerState !== 'function') return;
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function nextTrack() {
    let next;
    if (shuffleOn) {
        next = Math.floor(Math.random() * videosData.length);
    } else {
        next = (currentIndex + 1) % videosData.length;
    }
    const el = document.querySelector(`[data-index="${next}"]`);
    if (el) playTrack(el);
}

function prevTrack() {
    const prev = (currentIndex - 1 + videosData.length) % videosData.length;
    const el = document.querySelector(`[data-index="${prev}"]`);
    if (el) playTrack(el);
}

function toggleShuffle() {
    shuffleOn = !shuffleOn;
    document.getElementById('btn-shuffle').classList.toggle('active', shuffleOn);
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        setPlayIcon(true);
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        setPlayIcon(false);
        if (event.data === YT.PlayerState.ENDED) {
            nextTrack();
        }
    }
}
