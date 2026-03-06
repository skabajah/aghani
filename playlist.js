
/**
 * 8 playlist only 
 */

document.querySelectorAll('.card').forEach(card => {
    const video = card.getAttribute('data-video');
    const playlist = card.getAttribute('data-playlist');

    if (playlist && playlist !== '#') {
        const img = card.querySelector('img');
        if (!img) return;

        if (card.classList.contains('shorts')) {
            // Shorts: just open the playlist URL
            img.addEventListener('click', () => {
                window.open(playlist, '_blank');
            });
        } else {
            // Other cards: open first video in playlist
            let videoId = '';
            if (video.includes('youtu.be/')) {
                videoId = video.split('youtu.be/')[1];
            } else if (video.includes('watch?v=')) {
                videoId = video.split('watch?v=')[1];
            }

            let playlistId = '';
            const match = playlist.match(/list=([a-zA-Z0-9_-]+)/);
            if (match) playlistId = match[1];

            if (videoId && playlistId) {
                const link = `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&index=1`;
                img.addEventListener('click', () => {
                    window.open(link, '_blank');
                });
            }
        }
    }
});