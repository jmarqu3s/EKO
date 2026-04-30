var carouselState = {};

function initCarousel(id, pageSize) {
    var track = document.getElementById('track-' + id);
    if (!track) return;

    var items = Array.from(track.children);
    if (items.length === 0) return;

    track.innerHTML = '';

    for (var i = 0; i < items.length; i += pageSize) {
        var page = document.createElement('div');
        page.className = 'carousel-page';
        items.slice(i, i + pageSize).forEach(function(item) {
            page.appendChild(item);
        });
        track.appendChild(page);
    }

    var totalPages = Math.ceil(items.length / pageSize);
    carouselState[id] = { current: 0, total: totalPages };
    updateArrows(id);
}

function carouselNext(id) {
    var state = carouselState[id];
    if (!state || state.current >= state.total - 1) return;
    state.current++;
    applySlide(id);
    updateArrows(id);
}

function carouselPrev(id) {
    var state = carouselState[id];
    if (!state || state.current <= 0) return;
    state.current--;
    applySlide(id);
    updateArrows(id);
}

function applySlide(id) {
    var track = document.getElementById('track-' + id);
    track.style.transform = 'translateX(-' + (carouselState[id].current * 100) + '%)';
}

function updateArrows(id) {
    var state = carouselState[id];
    var prevBtn = document.getElementById('arrow-' + id + '-prev');
    var nextBtn = document.getElementById('arrow-' + id + '-next');
    if (prevBtn) prevBtn.disabled = state.current <= 0;
    if (nextBtn) nextBtn.disabled = state.current >= state.total - 1;
}

document.addEventListener('DOMContentLoaded', function() {
    initCarousel('playlists', 4);
    initCarousel('videos', 8);
});
