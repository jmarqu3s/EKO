var player;
var queue = [];
var currentIndex = 0;

function extractVideoId(url) {
    url = url.trim();
    var patterns = [
        /[?&]v=([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /shorts\/([a-zA-Z0-9_-]{11})/
    ];
    for (var i = 0; i < patterns.length; i++) {
        var m = url.match(patterns[i]);
        if (m) return m[1];
    }
    return null;
}

function getInitialVideoId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('v');
}

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
    var id = getInitialVideoId();
    if (id) {
        addToQueue(id);
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        var next = currentIndex + 1;
        if (next < queue.length) {
            loadVideo(next);
        }
    }
}

function addToQueue(videoId) {
    var index = queue.length;
    queue.push(videoId);
    renderItem(videoId, index);
    updateCount();

    if (queue.length === 1) {
        loadVideo(0);
    }
}

function loadVideo(index) {
    currentIndex = index;

    document.querySelectorAll('.watch-item').forEach(function(el) {
        el.classList.remove('active');
    });
    var el = document.querySelector('[data-watch-index="' + index + '"]');
    if (el) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    player.cueVideoById(queue[index]);
}

function renderItem(videoId, index) {
    var li = document.createElement('li');
    li.className = 'track-item watch-item';
    li.dataset.watchIndex = index;
    li.onclick = function() { loadVideo(index); };

    var thumb = document.createElement('img');
    thumb.src = 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg';
    thumb.className = 'track-thumb';
    thumb.alt = '';

    var info = document.createElement('div');
    info.className = 'track-info';

    var title = document.createElement('p');
    title.className = 'track-title';
    title.textContent = 'Vídeo ' + (index + 1);

    var channel = document.createElement('p');
    channel.className = 'track-channel';
    channel.textContent = videoId;

    info.appendChild(title);
    info.appendChild(channel);
    li.appendChild(thumb);
    li.appendChild(info);

    document.getElementById('video-list').appendChild(li);
}

function updateCount() {
    var n = queue.length;
    document.getElementById('video-count').textContent = n + (n === 1 ? ' vídeo' : ' vídeos');
}

function addVideo() {
    var input = document.getElementById('add-url-input');
    var id = extractVideoId(input.value);
    if (!id) {
        alert('Link inválido. Cole um link de vídeo do YouTube.');
        return;
    }
    addToQueue(id);
    input.value = '';
}
