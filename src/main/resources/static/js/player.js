let player;
let currentIndex = 0;
let shuffleOn = false;
let repeatMode = 0; // 0 = off, 1 = repeat-all, 2 = repeat-one
let originalData = [...videosData];

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

function progressKey() {
    return 'eko_progress_' + (document.getElementById('app')?.dataset.playlistId || '');
}

function saveProgress() {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    const state = player.getPlayerState();
    if (state === -1) return;
    localStorage.setItem(progressKey(), JSON.stringify({
        index: currentIndex,
        time: Math.floor(player.getCurrentTime())
    }));
}

function restoreProgress() {
    const raw = localStorage.getItem(progressKey());
    if (!raw) return false;
    try {
        const { index, time } = JSON.parse(raw);
        if (index < 0 || index >= videosData.length || time < 1) return false;
        const el = document.querySelector(`[data-index="${index}"]`);
        if (!el) return false;
        currentIndex = index;
        document.querySelectorAll('.track-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        updateBarInfo({ title: el.dataset.title, channel: el.dataset.channel, thumb: el.dataset.thumb });
        player.cueVideoById(el.dataset.videoId, time);
        showToast('Continuando de onde você parou · ' + el.dataset.title);
        return true;
    } catch(e) { return false; }
}

function onPlayerReady() {
    if (restoreProgress()) return;

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

setInterval(saveProgress, 5000);
window.addEventListener('beforeunload', saveProgress);

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
    saveVideoHistory(el.dataset.videoId, el.dataset.title, el.dataset.channel, el.dataset.thumb);
}

function saveVideoHistory(videoId, title, channelTitle, thumbnailUrl) {
    const csrfMeta = document.querySelector('meta[name="_csrf"]');
    const csrfHeaderMeta = document.querySelector('meta[name="_csrf_header"]');
    if (!csrfMeta || !csrfHeaderMeta) return;

    const headers = { 'Content-Type': 'application/json' };
    headers[csrfHeaderMeta.content] = csrfMeta.content;

    fetch('/history/video', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ videoId, title, channelTitle, thumbnailUrl })
    }).catch(() => {});
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
    if (repeatMode === 0 && currentIndex >= videosData.length - 1) return;
    const next = (currentIndex + 1) % videosData.length;
    const el = document.querySelector(`[data-index="${next}"]`);
    if (el) playTrack(el);
}

function cycleRepeat() {
    repeatMode = repeatMode === 0 ? 1 : 0;
    const btn = document.getElementById('btn-repeat');
    btn.classList.toggle('active', repeatMode === 1);
    btn.title = repeatMode === 1 ? 'Repetir playlist ativado' : 'Repetir playlist';
}

function removeTrack(e, btn) {
    e.stopPropagation();
    const li = btn.closest('.track-item');
    const idx = parseInt(li.dataset.index);

    videosData.splice(idx, 1);
    originalData = originalData.filter(v => v.videoId !== li.dataset.videoId);

    li.remove();

    // Reindexar itens restantes
    document.querySelectorAll('.track-item').forEach((item, i) => {
        item.dataset.index = i;
        const numEl = item.querySelector('.track-number');
        if (numEl) numEl.textContent = i + 1;
    });

    if (currentIndex > idx) currentIndex--;
    else if (currentIndex === idx && videosData.length > 0) {
        const next = Math.min(idx, videosData.length - 1);
        const el = document.querySelector(`[data-index="${next}"]`);
        if (el) playTrack(el);
    }
}

function prevTrack() {
    const prev = (currentIndex - 1 + videosData.length) % videosData.length;
    const el = document.querySelector(`[data-index="${prev}"]`);
    if (el) playTrack(el);
}

function fisherYatesShuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function renderTrackList(data) {
    const currentVideoId = videosData[currentIndex] ? videosData[currentIndex].videoId : null;
    const list = document.getElementById('track-list');
    list.innerHTML = '';
    let activeEl = null;

    data.forEach((video, i) => {
        const li = document.createElement('li');
        li.className = 'track-item';
        li.dataset.videoId = video.videoId;
        li.dataset.title = video.title;
        li.dataset.channel = video.channel;
        li.dataset.thumb = video.thumb;
        li.dataset.index = i;
        li.onclick = function() { playTrack(this); };

        const num = document.createElement('span');
        num.className = 'track-number';
        num.textContent = i + 1;

        const img = document.createElement('img');
        img.src = video.thumb;
        img.alt = video.title;
        img.className = 'track-thumb';

        const info = document.createElement('div');
        info.className = 'track-info';

        const title = document.createElement('p');
        title.className = 'track-title';
        title.textContent = video.title;

        const channel = document.createElement('p');
        channel.className = 'track-channel';
        channel.textContent = video.channel;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'track-remove-btn';
        removeBtn.title = 'Remover da fila';
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
        removeBtn.onclick = function(e) { removeTrack(e, this); };

        info.appendChild(title);
        info.appendChild(channel);
        li.appendChild(num);
        li.appendChild(img);
        li.appendChild(info);
        li.appendChild(removeBtn);

        if (video.videoId === currentVideoId) {
            li.classList.add('active');
            currentIndex = i;
            activeEl = li;
        }

        list.appendChild(li);
    });

    videosData = data;

    if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function toggleShuffle() {
    shuffleOn = !shuffleOn;
    document.getElementById('btn-shuffle').classList.toggle('active', shuffleOn);

    if (shuffleOn) {
        renderTrackList(fisherYatesShuffle(originalData));
    } else {
        renderTrackList([...originalData]);
    }
}

function toggleOptionsMenu() {
    document.getElementById('bar-options-menu').classList.toggle('open');
}

document.addEventListener('click', function(e) {
    var btn  = document.getElementById('btn-options');
    var menu = document.getElementById('bar-options-menu');
    if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
    }
});

function syncPlaylist() {
    document.getElementById('bar-options-menu').classList.remove('open');

    const playlistId = document.getElementById('app').dataset.playlistId;
    const currentIds = videosData.map(v => v.videoId);

    const csrfMeta = document.querySelector('meta[name="_csrf"]');
    const csrfHeaderMeta = document.querySelector('meta[name="_csrf_header"]');
    const headers = { 'Content-Type': 'application/json' };
    if (csrfMeta && csrfHeaderMeta) headers[csrfHeaderMeta.content] = csrfMeta.content;

    fetch('/playlist/' + playlistId + '/sync', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ currentIds: currentIds })
    })
    .then(r => r.json())
    .then(data => {
        const mapped = data.videos.map((v, i) => ({
            videoId: v.videoId,
            title: v.title,
            channel: v.channelTitle,
            thumb: v.thumbnailUrl,
            index: i
        }));
        renderTrackList(mapped);
        originalData = [...mapped];

        const added   = data.added   || 0;
        const removed = data.removed || 0;
        let msg;
        if (added > 0 && removed > 0) {
            msg = 'Playlist sincronizada · ' + added + ' adicionada(s), ' + removed + ' removida(s)';
        } else if (added > 0) {
            msg = 'Playlist sincronizada · ' + added + ' música(s) adicionada(s)';
        } else if (removed > 0) {
            msg = 'Playlist sincronizada · ' + removed + ' música(s) removida(s)';
        } else {
            msg = 'Playlist sincronizada · Nenhuma alteração encontrada';
        }
        showToast(msg);
    })
    .catch(() => showToast('Erro ao sincronizar a playlist'));
}

function openSaveModal() {
    document.getElementById('bar-options-menu').classList.remove('open');
    const input = document.getElementById('save-modal-input');
    input.value = '';
    document.getElementById('save-modal-overlay').classList.add('open');
    document.getElementById('save-modal').classList.add('open');
    setTimeout(() => input.focus(), 50);
}

function closeSaveModal() {
    document.getElementById('save-modal-overlay').classList.remove('open');
    document.getElementById('save-modal').classList.remove('open');
}

function confirmSavePlaylist() {
    const name = document.getElementById('save-modal-input').value.trim();
    if (!name) return;

    const playlistId = document.getElementById('app').dataset.playlistId;
    const thumb = videosData.length > 0 ? videosData[0].thumb : '';

    const csrfMeta = document.querySelector('meta[name="_csrf"]');
    const csrfHeaderMeta = document.querySelector('meta[name="_csrf_header"]');
    const headers = { 'Content-Type': 'application/json' };
    if (csrfMeta && csrfHeaderMeta) headers[csrfHeaderMeta.content] = csrfMeta.content;

    fetch('/playlist/save', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ playlistId, name, thumbnailUrl: thumb, videoCount: videosData.length })
    })
    .then(r => r.json())
    .then(data => {
        closeSaveModal();
        showToast('Playlist salva como "' + data.name + '"');
    })
    .catch(() => showToast('Erro ao salvar a playlist'));
}

let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('sync-toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

document.addEventListener('keydown', function(e) {
    if (!player || typeof player.getPlayerState !== 'function') return;
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
    } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        player.seekTo(player.getCurrentTime() + 10, true);
    } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        player.seekTo(Math.max(0, player.getCurrentTime() - 10), true);
    }
});

/* ── PROGRESSO ── */
let progressInterval = null;

function startProgress() {
    stopProgress();
    progressInterval = setInterval(updateProgress, 200);
}

function stopProgress() {
    if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
}

function updateProgress() {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    const current = player.getCurrentTime() || 0;
    const duration = player.getDuration() || 0;
    const pct = duration > 0 ? (current / duration) * 100 : 0;
    document.getElementById('progress-bar-fill').style.width = pct + '%';
    document.getElementById('time-current').textContent = formatTime(current);
    document.getElementById('time-total').textContent = formatTime(duration);
}

function formatTime(sec) {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
}

const progressWrap = document.getElementById('progress-bar-wrap');
const progressFill = document.getElementById('progress-bar-fill');
let isDragging = false;

function seekToPct(clientX) {
    if (!player || typeof player.getDuration !== 'function') return;
    const rect = progressWrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    progressFill.style.width = (pct * 100) + '%';
    player.seekTo(pct * player.getDuration(), true);
    document.getElementById('time-current').textContent = formatTime(pct * (player.getDuration() || 0));
}

progressWrap.addEventListener('mousedown', function(e) {
    isDragging = true;
    stopProgress();
    progressFill.style.transition = 'none';
    document.body.style.userSelect = 'none';
    seekToPct(e.clientX);
});

document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    seekToPct(e.clientX);
});

document.addEventListener('mouseup', function(e) {
    if (!isDragging) return;
    isDragging = false;
    progressFill.style.transition = '';
    document.body.style.userSelect = '';
    if (player && player.getPlayerState() === YT.PlayerState.PLAYING) startProgress();
});

/* ── SCROLL DE TÍTULO LONGO ── */
document.getElementById('track-list').addEventListener('mouseover', function(e) {
    const item = e.target.closest('.track-item');
    if (!item || item.classList.contains('title-scrolling')) return;
    const title = item.querySelector('.track-title');
    if (!title) return;
    const overflow = title.scrollWidth - title.clientWidth;
    if (overflow <= 0) return;
    const duration = Math.max(3, overflow / 40);
    title.style.setProperty('--title-scroll-dist', `-${overflow}px`);
    title.style.setProperty('--title-scroll-dur', `${duration}s`);
    item.classList.add('title-scrolling');
});

document.getElementById('track-list').addEventListener('mouseout', function(e) {
    const item = e.target.closest('.track-item');
    if (!item) return;
    if (e.relatedTarget && item.contains(e.relatedTarget)) return;
    item.classList.remove('title-scrolling');
});

/* ── PESQUISA NA FILA ── */
function filterQueue(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.track-item').forEach(item => {
        const match = item.dataset.title.toLowerCase().includes(q);
        item.style.display = match ? '' : 'none';
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        setPlayIcon(true);
        startProgress();
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        setPlayIcon(false);
        stopProgress();
        updateProgress();
        if (event.data === YT.PlayerState.ENDED) {
            nextTrack();
        }
    }
}
