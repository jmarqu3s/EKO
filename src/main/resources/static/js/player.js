let player;
let currentIndex = 0;
let shuffleOn = false;
let shuffledQueue = [];

function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1
        },
        events: {
            onStateChange: onPlayerStateChange
        }
    });

    buildQueue();
    if (videosData.length > 0) {
        updateNowPlaying(videosData[0]);
    }
}

function buildQueue() {
    shuffledQueue = [...videosData];
    if (shuffleOn) {
        for (let i = shuffledQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
        }
    }
}

function playTrack(el) {
    const videoId = el.dataset.videoId;
    currentIndex = parseInt(el.dataset.index);

    document.querySelectorAll('.track-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    updateNowPlaying({
        videoId,
        title: el.dataset.title,
        channel: el.dataset.channel,
        thumb: el.dataset.thumb
    });

    player.loadVideoById(videoId);
    document.getElementById('btn-play').innerHTML = '&#9646;&#9646;';
}

function updateNowPlaying(video) {
    document.getElementById('current-title').textContent = video.title;
    document.getElementById('current-channel').textContent = video.channel;
    document.getElementById('current-thumb').src = video.thumb;
}

function togglePlay() {
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
        document.getElementById('btn-play').innerHTML = '&#9654;';
    } else {
        player.playVideo();
        document.getElementById('btn-play').innerHTML = '&#9646;&#9646;';
    }
}

function nextTrack() {
    currentIndex = (currentIndex + 1) % videosData.length;
    const track = videosData[currentIndex];
    const el = document.querySelector(`[data-index="${currentIndex}"]`);
    if (el) playTrack(el);
}

function prevTrack() {
    currentIndex = (currentIndex - 1 + videosData.length) % videosData.length;
    const el = document.querySelector(`[data-index="${currentIndex}"]`);
    if (el) playTrack(el);
}

function toggleShuffle() {
    shuffleOn = !shuffleOn;
    const btn = document.getElementById('btn-shuffle');
    btn.classList.toggle('active', shuffleOn);
    buildQueue();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        nextTrack();
    }
}
