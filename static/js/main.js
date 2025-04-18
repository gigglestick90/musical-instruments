// Basic JavaScript file
console.log("main.js loaded");
// Audio setup for basic note triggering
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Object to hold audio buffers for different instruments
const instrumentSounds = {
    piano: {},
    synthesizer: {}
    // Add other instruments as needed
};

let currentInstrument = 'piano'; // Default instrument

// Function to load a single sound file
async function loadSound(url) {
    console.log(`Loading sound from: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("Sound loaded successfully.");
        return audioBuffer;
    } catch (error) {
        console.error('Error loading or decoding audio file:', error);
        alert(`Failed to load sound file from ${url}. Please check the file path and ensure it's a valid audio format.`);
        return null; // Return null on failure
    }
}

// Function to load all sounds for a given instrument
async function loadInstrumentSounds(instrument) {
    console.log(`Loading sounds for instrument: ${instrument}`);
    // Clear existing sounds for this instrument
    instrumentSounds[instrument] = {};

    // Define sounds to load for each instrument
    const soundsToLoad = {
        piano: [
            { name: 'piano_a', url: '/static/audio/piano/piano-a.wav' },
            { name: 'piano_b', url: '/static/audio/piano/piano-b.wav' },
            { name: 'piano_c', url: '/static/audio/piano/piano-c.wav' },
            { name: 'piano_d', url: '/static/audio/piano/piano-d.wav' },
            { name: 'piano_e', url: '/static/audio/piano/piano-e.wav' },
            // Add other piano notes as needed
        ],
        synthesizer: [
            { name: 'note', url: '/static/audio/synthesizer/note.wav' },
            // Add other synthesizer sounds as needed
        ]
    };

    const instrumentSoundList = soundsToLoad[instrument];
    if (!instrumentSoundList) {
        console.warn(`No sounds defined for instrument: ${instrument}`);
        return;
    }

    for (const sound of instrumentSoundList) {
        const audioBuffer = await loadSound(sound.url);
        if (audioBuffer) {
            instrumentSounds[instrument][sound.name] = audioBuffer;
        }
    }
    console.log(`Finished loading sounds for ${instrument}.`);
}

// Function to play a sound
function playSound(instrument, soundName) {
    const audioBuffer = instrumentSounds[instrument] ? instrumentSounds[instrument][soundName] : null;
    if (!audioBuffer) {
        console.warn(`Sound '${soundName}' not found for instrument '${instrument}'.`);
        return;
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}


// Get the instrument select dropdown element
const instrumentSelect = document.getElementById('instrument-select');

// Add an event listener to the dropdown
instrumentSelect.addEventListener('change', async (event) => {
    currentInstrument = event.target.value; // Update application state (Subtask 7.2)
    console.log('Selected instrument:', currentInstrument);
    await loadInstrumentSounds(currentInstrument); // Load sounds for the selected instrument (Subtask 7.3)
});

// Initial load of sounds for the default instrument
loadInstrumentSounds(currentInstrument);


const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// Revert to using locateFile in the constructor
const hands = new Hands({locateFile: (file) => {
  console.log(`Locating file: ${file}`); // Log requested files
  // Point to the specific version on the CDN for all assets
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
}});

hands.setOptions({
  modelComplexity: 1, // Use 1 for the full model, 0 for lite
  maxNumHands: 2,     // Optional: Set max hands
  minDetectionConfidence: 0.5, // Optional: Set confidence
  minTrackingConfidence: 0.5  // Optional: Set confidence
  // solutionPath removed, locateFile should handle asset paths now
});
hands.onResults(onResults);

function onResults(results) { // Make sure this function definition exists
    // console.log('MediaPipe hands results:', results); // Keep this commented out for now to reduce console noise
    // Add drawing logic here later (Task 4)
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // Ensure results.image is valid before drawing
    if (results.image) {
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }
    if (results.multiHandLandmarks && window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) { // Check if drawing utils are loaded
      for (const landmarks of results.multiHandLandmarks) {
        // Example using drawing_utils (ensure it's loaded in HTML)
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
        // Basic sound trigger: play note when index finger crosses lower region
       // Implement gesture-to-sound mapping based on the current instrument (Subtask 7.4)
       // Implement gesture-to-sound mapping based on the current instrument (Subtask 7.4)
       if (currentInstrument === 'piano') {
         // Piano: Map each finger tip crossing a horizontal threshold to a different note
         const fingerTips = [
           landmarks[4], // Thumb tip
           landmarks[8], // Index fingertip
           landmarks[12], // Middle fingertip
           landmarks[16], // Ring fingertip
           landmarks[20]  // Pinky fingertip
         ];
         const pianoNotes = ['piano_a', 'piano_b', 'piano_c', 'piano_d', 'piano_e']; // Corresponds to fingerTips index

         // Define horizontal thresholds for each finger (relative to video height, 0 to 1)
         // These values may need tuning
         // Define thresholds for each finger (relative to video dimensions, 0 to 1)
         // These values may need tuning
         const thresholds = [
           { y: 0.5, xMin: 0.0, xMax: 0.4 }, // Thumb: vertical threshold and horizontal range
           { y: 0.6 }, // Index: vertical threshold
           { y: 0.6 }, // Middle: vertical threshold
           { y: 0.6 }, // Ring: vertical threshold
           { y: 0.55 }  // Pinky: slightly lower vertical threshold
         ];

         // State to track if a note has been played for each finger
         if (!this.pianoNotePlayed) {
           this.pianoNotePlayed = [false, false, false, false, false];
         }

         for (let i = 0; i < fingerTips.length; i++) {
           let isPressing = false;
           if (i === 0) { // Thumb
             // Check for inward thumb curl: thumb tip x < thumb base x (plus tolerance)
             // Assuming right hand and standard orientation
             const thumbTip = landmarks[4];
             const thumbBase = landmarks[2];
             const curlThresholdX = 0.02; // Adjust tolerance as needed
             isPressing = thumbTip.x < thumbBase.x - curlThresholdX;
           } else { // Other fingers (Index, Middle, Ring, Pinky)
             // Check only vertical threshold for other fingers
             isPressing = fingerTips[i].y > thresholds[i].y;
           }

           if (isPressing && !this.pianoNotePlayed[i]) {
             playSound('piano', pianoNotes[i]);
             this.pianoNotePlayed[i] = true;
           } else if (!isPressing) {
             this.pianoNotePlayed[i] = false; // Reset when finger is not pressing
           }
         }
       } else if (currentInstrument === 'synthesizer') {
         // Synthesizer: Keep existing index finger curl logic
         const indexTip = landmarks[8];    // Index fingertip
         const indexPip = landmarks[6];    // Index PIP joint
         const isCurled = indexTip.y < indexPip.y - 0.05; // Adjust threshold as needed

         if (isCurled && !this.synthNotePlayed) {
           playSound('synthesizer', 'note');
           this.synthNotePlayed = true;
         } else if (!isCurled) {
           this.synthNotePlayed = false; // Reset when finger is not curled
         }
       }
     }
   } else if (results.multiHandLandmarks) {
        // Fallback or warning if drawing utils not ready
        console.warn("Drawing utilities (drawConnectors, drawLandmarks, HAND_CONNECTIONS) not found. Cannot draw landmarks.");
    }
    canvasCtx.restore();
}


async function enableCam() {
    console.log('enableCam() called');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('getUserMedia() is not supported by your browser');
        console.error('getUserMedia not supported');
        return;
    }

    const constraints = {
        video: true
    };

    try {
        console.log('Requesting webcam access with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('getUserMedia successful, stream obtained:', stream);
        videoElement.srcObject = stream;
        console.log('videoElement.srcObject set');
        console.log('Attempting to play video element');
        videoElement.play().then(() => {
            console.log('videoElement.play() success');
        }).catch(err => {
            console.error('Error playing video element:', err);
        });
        videoElement.addEventListener('loadedmetadata', async function() {
            console.log('videoElement loadedmetadata event fired');
            // Set canvas dimensions to match video
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            videoElement.style.display = 'block'; // Show the video element

            console.log('Setting up MediaPipe and Camera...');
            // Configuration is now done via hands.setOptions above

            const camera = new Camera(videoElement, {
                onFrame: async () => {
                    // Ensure video is ready before sending
                    if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
                        try {
                            await hands.send({ image: videoElement });
                        } catch (err) {
                            console.error('hands.send error:', err);
                        }
                    }
                 },
                width: videoElement.videoWidth,
                height: videoElement.videoHeight
            });
            camera.start();
            console.log('Camera started');
            console.log('videoElement display set to block');
        }, { once: true });
        console.log('loadedmetadata event listener added');
    } catch (e) {
        console.error('Error accessing webcam:', e);
        alert('Could not access the webcam. Please ensure you have a webcam connected and have granted permissions.');
    }
    console.log('enableCam() finished');
}

// Call the function to enable the webcam when the page loads
enableCam();