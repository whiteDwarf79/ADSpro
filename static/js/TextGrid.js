document.addEventListener('DOMContentLoaded', function() {
    var audioFile = null;
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var audioPlayer = document.getElementById('audioPlayer');
    var intervalDataContainer = document.getElementById('intervalDataContainer');
    var textData = [];
    var parsedIntervals = {};
    var selectedOverlay = null;
    var annotationBox = document.getElementById('annotation-box');
    const textSegments = getTextSegments(); 
if (textSegments.length > 0) {
    textSegments.forEach(function(segment) {
        saveAudioSegment(segment.startTime, segment.endTime, segment.text);
    });
}

    function getTextSegments() {
        const textSegments = [];
        if (parsedIntervals && parsedIntervals['default']) {
            const defaultIntervals = parsedIntervals['default'];
            defaultIntervals.forEach(interval => {
                const startTime = interval.xmin;
                const endTime = interval.xmax;
                const text = interval.text || '';
                textSegments.push({ startTime, endTime, text });
            });
        }
        return textSegments;
    }
    

    function updateAnnotationBoxWidth(totalDuration) {
        annotationBox.style.width = `${totalDuration * 100}px`;
    }

    function parseTextgrid(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const lines = event.target.result.split('\n');
            var parsedTextData = [];
            let xmin, xmax, text;
            parsedIntervals = {};

            for (let line of lines) {
                line = line.trim();
                if (line.startsWith("xmin")) {
                    xmin = parseFloat(line.split("=")[1].trim());
                } else if (line.startsWith("xmax")) {
                    xmax = parseFloat(line.split("=")[1].trim());
                } else if (line.startsWith("text")) {
                    text = line.split("=")[1].trim().replace(/"/g, '');
                    if (xmin !== undefined && xmax !== undefined) {
                        parsedTextData.push({ xmin, xmax, text });
                        if (!parsedIntervals['default']) parsedIntervals['default'] = [];
                        parsedIntervals['default'].push({ xmin, xmax, duration: xmax - xmin, text });
                    }
                    xmin = undefined;
                    xmax = undefined;
                }
            }

            if (parsedTextData.length > 0) {
                textData = parsedTextData;
                if (audioFile) {
                    visualizeIntervalData(parsedIntervals);
                }
            }
        };
        reader.readAsText(file);
    }


    function handleFileSelect(event) {
        const files = event.target.files;
        for (const file of files) {
            if (file.type.startsWith('audio')) {
                audioFile = file;
                const reader = new FileReader();
                reader.onload = function(e) {
                    const arrayBuffer = e.target.result;
                    audioContext.decodeAudioData(arrayBuffer, function(buffer) {
                        audioBuffer = buffer;
                        audioPlayer.src = URL.createObjectURL(file);
                        audioPlayer.play();
                        if (textData.length > 0) {
                            visualizeIntervalData(parsedIntervals);
                        }
                    });
                };
                reader.readAsArrayBuffer(file);
            } else if (file.name.endsWith('.TextGrid')) {
                parseTextgrid(file);
                if (textSegments.length > 0) {
                    textSegments.forEach(function(segment) {
                        saveAudioSegment(segment.startTime, segment.endTime, segment.text);
                    });
                }
            }
        }
    }

    function updatePlayheadPosition(timeInSeconds) {
        if (annotationBox && intervalDataContainer) {
            var annotationBoxWidth = annotationBox.offsetWidth;
            var playheadPosition = (timeInSeconds / audioPlayer.duration) * annotationBoxWidth;
            intervalDataContainer.scrollLeft = playheadPosition - (intervalDataContainer.offsetWidth / 2);

            document.querySelectorAll('.textOverlay').forEach(textOverlay => {
                const startTime = parseFloat(textOverlay.dataset.startTime);
                const endTime = parseFloat(textOverlay.dataset.endTime);

                if (timeInSeconds >= startTime && timeInSeconds <= endTime) {
                    textOverlay.classList.add('active');
                } else {
                    textOverlay.classList.remove('active');
                }
            });
        }
        console.log("Playhead position updated");
    }

    audioPlayer.addEventListener('timeupdate', function () {
        var timeInSeconds = audioPlayer.currentTime;
        updatePlayheadPosition(timeInSeconds);
    });

    document.getElementById('audioFileInput').addEventListener('change', handleFileSelect);
    document.getElementById('textGridFileInput').addEventListener('change', handleFileSelect);
    console.log("Event listeners attached");

    function visualizeIntervalData(intervals) {
        console.log("Visualizing interval data...");
        console.log("Intervals:", intervals);

        let maxDuration = 0;
        Object.values(intervals).forEach(tierIntervals => {
            tierIntervals.forEach(interval => {
                const duration = interval.xmax - interval.xmin;
                if (duration > maxDuration) {
                    maxDuration = duration;
                }
            });
        });

        if (maxDuration === 0) {
            console.error("No valid intervals found.");
            return;
        }

        updateAnnotationBoxWidth(maxDuration);
        intervalDataContainer.innerHTML = ""; 
        const intervalContainer = document.createElement('div');
        intervalContainer.classList.add('intervalContainer');


        Object.entries(intervals).forEach(([tierName, tierIntervals]) => {
            tierIntervals.forEach((interval) => {
                const textOverlay = document.createElement('div');
                textOverlay.classList.add('textOverlay');
                textOverlay.innerText = interval.text || " ";
                textOverlay.dataset.startTime = interval.xmin;
                textOverlay.dataset.endTime = interval.xmax;
                const intervalWidth = ((interval.xmax - interval.xmin) / maxDuration) * 100;
                textOverlay.style.width = `${intervalWidth}%`;
                textOverlay.style.left = `${(interval.xmin / maxDuration) * 100}%`;
                textOverlay.style.cursor = 'pointer'; 
                intervalContainer.appendChild(textOverlay);
            });
        });
        

        intervalDataContainer.appendChild(intervalContainer);
        console.log("Interval data visualized");
    }

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('textOverlay')) {
            if (selectedOverlay) {
                selectedOverlay.classList.remove('selected');
            }
            selectedOverlay = event.target;
            selectedOverlay.classList.add('selected');
            selectedOverlay.style.backgroundColor = '#8697CA';

            console.log("Overlay selected:", selectedOverlay.innerText);
            console.log("Overlay start time:", selectedOverlay.dataset.startTime);
            console.log("Overlay end time:", selectedOverlay.dataset.endTime);
        }
    });

    function segmentAudio() {
        console.log("==== Check button clicked ====");
        if (selectedOverlay) {
            const segment = {
                startTime: parseFloat(selectedOverlay.dataset.startTime),
                endTime: parseFloat(selectedOverlay.dataset.endTime),
                text: selectedOverlay.innerText
            };

            console.log("Segment to process:", segment);
            fetch('/process_segment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(segment)
            })
            .then(response => response.json())
            .then(data => {
                console.log("Prediction result:", data);
                updateOverlayColor(segment, data);  
            })
            .catch(error => {
                console.error('Error:', error);
            });
        } else {
            console.error('No overlay selected');
        }
    }

    function updateOverlayColor(segment, result) {
        const startTime = segment.startTime;
        const endTime = segment.endTime;
        const overlays = document.querySelectorAll('.textOverlay');

        overlays.forEach(overlay => {
            const overlayStartTime = parseFloat(overlay.dataset.startTime);
            const overlayEndTime = parseFloat(overlay.dataset.endTime);

            if (Math.abs(overlayStartTime - startTime) < 0.001 && Math.abs(overlayEndTime - endTime) < 0.001) {
                const prominent = result.prominent;

                if (prominent === 0) {
                    overlay.style.backgroundColor = 'red';
                } else if (prominent === 1) {
                    overlay.style.backgroundColor = 'DodgerBlue';
                }
            }
        });
    }

    var checkButton = document.getElementById('checkButton');
    if (checkButton) {
        checkButton.addEventListener('click', segmentAudio);
        console.log("Event listener attached to Check button");
    } else {
        console.error("Check button not found");
    }

    console.log("Script loaded successfully");
});
