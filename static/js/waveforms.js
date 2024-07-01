document.addEventListener('DOMContentLoaded', function () {
    var wavesurfer = WaveSurfer.create({
        container: '#waveform'
    });

    wavesurfer.on('ready', function () {
        document.addEventListener('DOMContentLoaded', function() {
            console.log("DOM content loaded");     
        });
    });
    
    document.getElementById('audioFileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        wavesurfer.loadBlob(file);
        console.log('Audio file uploaded:', file.name);
    });
});
