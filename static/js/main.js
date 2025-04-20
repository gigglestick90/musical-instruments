import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0"; // Match example version

// Basic JavaScript file
console.log("main.js loaded");

// Audio setup for basic note triggering
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Object to hold audio buffers for different instruments
const instrumentSounds = {
    piano: {},
    synthesizer: {},
    drums: {}
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
        ],
        drums: [
            { name: 'drum_a', url: '/static/audio/drums/drum-a.mp3' },
            { name: 'drum_b', url: '/static/audio/drums/drum-b.mp3' },
            { name: 'drum_c', url: '/static/audio/drums/drum-c.mp3' },
            { name: 'drum_d', url: '/static/audio/drums/drum-d.mp3' },
            { name: 'drum_e', url: '/static/audio/drums/drum-e.mp3' },
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

// --- MediaPipe Hand Landmarker Setup ---
// HAND_CONNECTIONS is expected to be globally available from hands.js or drawing_utils.js
let handLandmarker = undefined;
let runningMode = "VIDEO"; // Set running mode to VIDEO for webcam processing
let lastVideoTime = -1;
let results = undefined;
let webcamRunning = false; // State to track if webcam is running
let pianoNotePlayed = [false, false, false, false, false]; // State for piano notes (global for now)
let synthNotePlayed = false; // State for synth note (global for now)

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {
    console.log("Creating Hand Landmarker...");
    const vision = await FilesetResolver.forVisionTasks(
        // path/to/wasm/root
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm" // Match example version
    );
    handLandmarker = await HandLandmarker.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath: "/static/models/hand_landmarker.task" // Path to the downloaded model
            },
            runningMode: runningMode, // Set running mode
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            // result_callback is not used in VIDEO mode
        }
    );
    console.log("Hand Landmarker created.");
    // Now that the landmarker is created, enable the webcam
    enableCam();
};

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// If webcam supported, create the hand landmarker
if (hasGetUserMedia()) {
    createHandLandmarker();
} else {
    console.warn("getUserMedia() is not supported by your browser");
    alert('getUserMedia() is not supported by your browser');
}


// Enable the live webcam view and start detection.
async function enableCam() {
    console.log('enableCam() called');
    if (!handLandmarker) {
        console.log("Wait! HandLandmarker not loaded yet.");
        return;
    }

    // set webcamRunning state
    webcamRunning = true;

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
            alert('Error playing video stream. Please check your webcam.');
        });

        // Add event listener to start prediction when the video metadata is loaded
        videoElement.addEventListener("loadeddata", predictWebcam);
        console.log('loadeddata event listener added');

    } catch (e) {
        console.error('Error accessing webcam:', e);
        alert('Could not access the webcam. Please ensure you have a webcam connected and have granted permissions.');
    }
    console.log('enableCam() finished');
}

async function predictWebcam() {
    // Set canvas dimensions to match video
    canvasElement.style.width = videoElement.videoWidth + 'px';
    canvasElement.style.height = videoElement.videoHeight + 'px';
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Now let's start detecting the stream.
    // Set running mode to VIDEO if it's not already
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await handLandmarker.setOptions({ runningMode: "VIDEO" });
    }

    let startTimeMs = performance.now();

    // Only send frame to landmarker if the video time has advanced
    if (lastVideoTime !== videoElement.currentTime) {
        lastVideoTime = videoElement.currentTime;
        // Use detectForVideo for VIDEO mode
        results = handLandmarker.detectForVideo(videoElement, startTimeMs);
    }

    // Draw the hand annotations on the canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    // Draw the video frame onto the canvas
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Check if results and the necessary drawing utilities are available (assuming global from drawing_utils.js)
    if (results && results.landmarks && typeof drawConnectors === 'function' && typeof drawLandmarks === 'function' && typeof HAND_CONNECTIONS !== 'undefined') {
        for (const landmarks of results.landmarks) { // Iterate through detected hands
            // Use the drawing utilities directly (assuming global scope)
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });

            // Implement gesture-to-sound mapping based on the current instrument
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
                const thresholds = [
                    { y: 0.5, xMin: 0.0, xMax: 0.4 }, // Thumb: vertical threshold and horizontal range
                    { y: 0.6 }, // Index: vertical threshold
                    { y: 0.6 }, // Middle: vertical threshold
                    { y: 0.6 }, // Ring: vertical threshold
                    { y: 0.55 }  // Pinky: slightly lower vertical threshold
                ];

                // State to track if a note has been played for each finger per hand
                // Need to adapt this for multiple hands if necessary, for now assuming single hand logic
                // A more robust solution would track state per hand ID if available in results
                // if (!pianoNotePlayed) { // Initialize globally instead
                //     pianoNotePlayed = [false, false, false, false, false];
                // }

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

                    if (isPressing && !pianoNotePlayed[i]) {
                        playSound('piano', pianoNotes[i]);
                        pianoNotePlayed[i] = true;
                    } else if (!isPressing) {
                        pianoNotePlayed[i] = false; // Reset when finger is not pressing
                    }
                }
            } else if (currentInstrument === 'synthesizer') {
                // Synthesizer: Keep existing index finger curl logic
                const indexTip = landmarks[8];    // Index fingertip
                const indexPip = landmarks[6];    // Index PIP joint
                const isCurled = indexTip.y < indexPip.y - 0.05; // Adjust threshold as needed

                // State to track if note played for synth (assuming single hand for simplicity for now)
                // if (!synthNotePlayed) { // Initialize globally instead
                //     synthNotePlayed = false;
                // }

                if (isCurled && !synthNotePlayed) {
                    playSound('synthesizer', 'note');
                    synthNotePlayed = true;
                } else if (!isCurled) {
                    synthNotePlayed = false; // Reset when finger is not curled
                }
            } else if (currentInstrument === 'drums') {
                // Drums: Map each finger curl to a different drum sound
                const fingerTips = [
                    landmarks[4], // Thumb tip
                    landmarks[8], // Index fingertip
                    landmarks[12], // Middle fingertip
                    landmarks[16], // Ring fingertip
                    landmarks[20]  // Pinky fingertip
                ];
                const drumSounds = ['drum_a', 'drum_b', 'drum_c', 'drum_d', 'drum_e']; // Corresponds to fingerTips index

                // State to track if a drum sound has been played for each finger per hand
                // Need to adapt this for multiple hands if necessary, for now assuming single hand logic
                // if (!drumSoundPlayed) { // Initialize globally instead
                //     drumSoundPlayed = [false, false, false, false, false];
                // }
                // Initialize drumSoundPlayed if it doesn't exist
                if (typeof drumSoundPlayed === 'undefined') {
                    window.drumSoundPlayed = [false, false, false, false, false];
                }


                for (let i = 0; i < fingerTips.length; i++) {
                    let isCurled = false;
                    const fingerTipLandmark = fingerTips[i]; // Get the fingertip landmark object
                    let pipJointLandmark = null;

                    if (i === 0) { // Thumb
                        // Check for inward thumb curl: thumb tip x < thumb base x (plus tolerance)
                        // Assuming right hand and standard orientation
                        const thumbTip = landmarks[4];
                        const thumbBase = landmarks[2];
                        const curlThresholdX = 0.02; // Adjust tolerance as needed
                        isCurled = thumbTip.x < thumbBase.x - curlThresholdX;
                    } else { // Other fingers (Index, Middle, Ring, Pinky)
                        // Get the PIP joint landmark using the correct original index
                        const fingertipOriginalIndices = [4, 8, 12, 16, 20];
                        const pipJointOriginalIndex = fingertipOriginalIndices[i] - 2;
                        pipJointLandmark = landmarks[pipJointOriginalIndex];

                        // Check if fingertip is below the PIP joint (a simple curl detection)
                        if (fingerTipLandmark && pipJointLandmark) { // Add check for undefined landmarks
                             isCurled = fingerTipLandmark.y > pipJointLandmark.y + 0.05; // Adjust threshold as needed
                        }
                    }

                    if (isCurled && !drumSoundPlayed[i]) {
                        playSound('drums', drumSounds[i]);
                        drumSoundPlayed[i] = true;
                    } else if (!isCurled) {
                        drumSoundPlayed[i] = false; // Reset when finger is not curled
                    }
                }
            }
        }
    } else if (results && results.landmarks) {
        // Warning if drawing utils are not ready
        console.warn("Drawing utilities (drawConnectors, drawLandmarks, HAND_CONNECTIONS) not found globally. Cannot draw landmarks.");
    }

    canvasCtx.restore();

    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Initial call to create the hand landmarker when the script loads
// createHandLandmarker is now called after checking for getUserMedia support
// createHandLandmarker(); // This is now called inside the if(hasGetUserMedia()) block

// Dark mode toggle logic
const themeSwitchCheckbox = document.getElementById('theme-switch');
const bodyElement = document.body;

themeSwitchCheckbox.addEventListener('change', () => {
    if (themeSwitchCheckbox.checked) {
        bodyElement.classList.add('dark-mode');
    } else {
        bodyElement.classList.remove('dark-mode');
    }
});