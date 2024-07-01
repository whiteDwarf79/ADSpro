document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audioPlayer');

    document.addEventListener('keydown', function(event) {
        if (event.code === 'Tab') {
            if (audioPlayer.paused) {
                audioPlayer.play(); 
            } else {
                audioPlayer.pause(); 
            }
            event.preventDefault(); 
        }
    });
    
});
