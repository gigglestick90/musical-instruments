# Technical Design Document: Webcam Instrument & Composer App

**Version:** 1.0
**Date:** 2023-10-27

**1. Project Goal**

To create a web application that uses a user's webcam to detect finger movements in real-time. These movements will trigger corresponding musical instrument sounds. The application will feature instrument selection, a "Composer Mode" to control song playback speed via conducting gestures, and the ability to upload custom songs.

**2. Core Technologies**

*   **Backend Framework:** Python (Flask) - For serving the web application and handling file uploads.
*   **Frontend:** HTML, CSS, JavaScript - For the user interface, webcam access, and interaction logic.
*   **Computer Vision:** MediaPipe Hands (JavaScript library) - For robust, real-time hand and finger tracking directly in the browser. [4, 5]
*   **Audio Handling:** Web Audio API (JavaScript) - For low-latency sound playback, scheduling, and modifying playback speed. [1]
*   **UI Styling (Optional):** CSS Framework like Bootstrap or Tailwind CSS for quicker styling, or custom CSS.

**3. High-Level Architecture**

1.  **Client-Side (Browser):**
    *   Handles webcam access (`getUserMedia`).
    *   Runs the MediaPipe Hands model to detect hand/finger landmarks on the video stream.
    *   Interprets finger positions/gestures to determine user intent (playing notes, conducting).
    *   Uses the Web Audio API to load and play instrument sounds or control song playback.
    *   Renders the UI (video feed, instrument selector, buttons, visual feedback).
    *   Handles file selection for custom songs.
2.  **Server-Side (Python/Flask):**
    *   Serves the main HTML, CSS, and JavaScript files.
    *   Serves static assets (instrument audio files, default songs).
    *   Provides an endpoint to handle uploads of custom songs.

**4. Detailed Task Breakdown**

**Phase 1: Basic Setup & Webcam Integration**

*   `[x]` **Task 1: Project Setup**
    *   `[x]` Subtask 1.1: Set up Python virtual environment.
    *   `[x]` Subtask 1.2: Install Flask (`pip install Flask`).
    *   `[x]` Subtask 1.3: Create basic Flask application structure (app.py, static/, templates/).
    *   `[x]` Subtask 1.4: Create main HTML file (e.g., `templates/index.html`).
    *   `[x]` Subtask 1.5: Create basic JavaScript file (e.g., `static/js/main.js`) and CSS file (e.g., `static/css/style.css`).
    *   `[x]` Subtask 1.6: Set up Flask route in `app.py` to serve `index.html`.
*   `[x]` **Task 2: Webcam Access & Display**
    *   `[x]` Subtask 2.1: (JS) Use `navigator.mediaDevices.getUserMedia` to request webcam access. [3]
    *   `[x]` Subtask 2.2: (HTML) Add `<video>` element to display the webcam feed.
    *   `[x]` Subtask 2.3: (JS) Stream the webcam feed to the `<video>` element.
    *   `[x]` Subtask 2.4: Handle permissions errors (user denies access).

**Phase 2: Finger Detection & Basic Interaction**

*   `[x]` **Task 3: Integrate Finger Detection**
    *   `[x]` Subtask 3.1: (JS) Include or import the MediaPipe Hands JavaScript library/solution. [4, 5]
    *   `[x]` Subtask 3.2: (JS) Configure MediaPipe Hands (e.g., number of hands, confidence thresholds).
    *   `[x]` Subtask 3.3: (JS) Create a loop (e.g., using `requestAnimationFrame`) to continuously send video frames to MediaPipe for processing.
    *   `[x]` Subtask 3.4: (JS) Process the landmark results returned by MediaPipe.
*   `[x]` **Task 4: Visualize Detection**
    *   `[x]` Subtask 4.1: (HTML) Add a `<canvas>` element, overlayed on the `<video>` element.
    *   `[x]` Subtask 4.2: (JS) Get the canvas 2D drawing context.
    *   `[x]` Subtask 4.3: (JS) In the processing loop, draw the detected hand landmarks and connections onto the canvas based on the coordinates from MediaPipe. [5]
*   `[x]` **Task 5: Basic Sound Triggering**
*   `[x]` Subtask 5.1: (JS) Initialize the Web Audio API's `AudioContext`. [1]
*   `[x]` Subtask 5.2: (JS) Create a function to load an audio file (e.g., a single piano note) into an `AudioBuffer`. [1]
*   `[x]` Subtask 5.3: (JS) Define simple interaction logic: e.g., if a specific fingertip (e.g., index finger) crosses a virtual line or enters a specific region on the screen.
*   `[x]` Subtask 5.4: (JS) When the interaction logic is triggered, play the loaded `AudioBuffer` using an `AudioBufferSourceNode`. [1]
*   `[x]` Subtask 5.5: (Assets) Add placeholder sound file(s) to the `static/audio/` directory.

**Phase 3: Instrument Selection Feature**

*   `[x]` **Task 6: Implement Instrument Selection UI**
   *   `[x]` Subtask 6.1: (HTML) Add a `<select>` dropdown menu to `index.html` listing available instruments (e.g., Piano, Drums, Guitar).
   *   `[x]` Subtask 6.2: (Assets) Obtain or create sound samples for each instrument and place them in `static/audio/`. Organize them clearly (e.g., `static/audio/piano/`, `static/audio/drums/`).
*   `[x]` **Task 7: Implement Instrument Sound Loading Logic**
   *   `[x]` Subtask 7.1: (JS) Add event listener to the dropdown to detect changes.
   *   `[x]` Subtask 7.2: (JS) When the instrument changes, update the application state to know which instrument is selected.
   *   `[x]` Subtask 7.3: (JS) Modify the sound loading/playing logic (from Task 5) to use the audio files corresponding to the *currently selected* instrument. Potentially pre-load sounds for selected instrument for better responsiveness.
   *   `[x]` Subtask 7.4: Refine interaction logic: Map different fingers or screen regions to different notes/sounds within the selected instrument set (e.g., different drum sounds, different piano keys).

**Implementation Notes (Task 6 & 7):**
*   The instrument selection UI currently includes Piano and Synthesizer.
*   Piano sounds are loaded from `static/audio/piano/` and include `piano-a.wav`, `piano-b.wav`, `piano-c.wav`, `piano-d.wav`, and `piano-e.wav`.
*   The synthesizer sound is loaded from `static/audio/synthesizer/note.wav`.
*   The current interaction logic maps each individual finger curl (thumb to pinky) to play a different piano sound (`piano-a.wav` to `piano-e.wav` respectively) when the Piano instrument is selected. The index finger curl triggers the `note.wav` sound for the Synthesizer.

**Phase 4: Composer Mode Feature**

*   `[ ]` **Task 8: Basic Song Playback**

**Phase 4: Composer Mode Feature**

*   `[ ]` **Task 8: Basic Song Playback**
    *   `[ ]` Subtask 8.1: (HTML) Add a "Composer Mode" toggle button/checkbox and a "Play/Pause" button.
    *   `[ ]` Subtask 8.2: (Assets) Add a default song file (e.g., MP3, OGG, WAV) to `static/audio/songs/`.
    *   `[ ]` Subtask 8.3: (JS) Use the Web Audio API to load the default song into an `AudioBuffer`. [1]
    *   `[ ]` Subtask 8.4: (JS) Implement play/pause functionality for the loaded song using an `AudioBufferSourceNode` and `AudioContext.suspend()/resume()` or by tracking playback state and creating new source nodes.
*   `[ ]` **Task 9: Conducting Gesture Recognition**
    *   `[ ]` Subtask 9.1: (JS) Define a conducting gesture based on MediaPipe landmarks (e.g., vertical movement speed of one hand, distance between hands, hand orientation).
    *   `[ ]` Subtask 9.2: (JS) Calculate the chosen gesture metric in the MediaPipe processing loop when Composer Mode is active.
*   `[ ]` **Task 10: Control Playback Speed**
    *   `[ ]` Subtask 10.1: (JS) Map the calculated conducting gesture metric to a desired playback rate (e.g., faster movement = higher rate). Define sensible min/max rates.
    *   `[ ]` Subtask 10.2: (JS) Use the `playbackRate` property of the `AudioBufferSourceNode` playing the song to dynamically adjust the speed based on the mapped conducting gesture. [1]
    *   `[ ]` Subtask 10.3: Add smoothing to the playback rate changes to avoid jerky audio.
*   `[ ]` **Task 11: Custom Song Upload**
    *   `[ ]` Subtask 11.1: (HTML) Add an `<input type="file" accept="audio/*">` element for song uploads.
    *   `[ ]` Subtask 11.2: (JS) Add JavaScript to handle the file selection event.
    *   `[ ]` Subtask 11.3: (JS) Use the `fetch` API or `XMLHttpRequest` to send the selected audio file to the Flask backend.
    *   `[ ]` Subtask 11.4: (Python/Flask) Create a new Flask route (e.g., `/upload_song`) that accepts POST requests.
    *   `[ ]` Subtask 11.5: (Python/Flask) Implement logic to securely save the uploaded file to a designated server directory (e.g., `uploads/`). Ensure filename sanitization and potentially limit file size/types.
    *   `[ ]` Subtask 11.6: (JS) Update the UI to allow the user to select their uploaded song for Composer Mode (e.g., add it to a list or dropdown). This might involve fetching a list of available uploaded songs from the backend or loading the uploaded file directly into the Web Audio API using `FileReader` if server-side storage isn't strictly needed for immediate playback (though upload for persistence is good).
    *   `[ ]` Subtask 11.7: (JS) Update the song loading logic (Task 8.3) to handle loading user-uploaded songs.

**Phase 5: UI/UX Polish & Refinement ("Awesome" Look)**

*   `[ ]` **Task 12: Styling and Visual Feedback**
    *   `[ ]` Subtask 12.1: (CSS) Apply consistent and appealing styling to all UI elements (buttons, dropdown, video area, canvas). Consider using a CSS framework or designing custom styles.
    *   `[ ]` Subtask 12.2: (CSS/JS) Improve visual feedback:
        *   Clearly indicate active detection areas or trigger points.
        *   Animate or highlight elements when sounds are triggered.
        *   Provide visual feedback for conducting speed in Composer Mode.
        *   Style the landmark/connection drawing on the canvas (colors, line thickness).
    *   `[ ]` Subtask 12.3: Ensure responsive design (adapts reasonably to different screen sizes).
*   `[ ]` **Task 13: Improve User Experience**
    *   `[ ]` Subtask 13.1: Add clear instructions or tooltips for the user.
    *   `[ ]` Subtask 13.2: Provide loading indicators (e.g., while audio loads).
    *   `[ ]` Subtask 13.3: Ensure smooth transitions between modes/instruments.
    *   `[ ]` Subtask 13.4: Optimize performance (e.g., efficient drawing, debouncing events where necessary).
*   `[ ]` **Task 14: Testing and Debugging**
    *   `[ ]` Subtask 14.1: Test in different browsers (Chrome, Firefox recommended).
    *   `[ ]` Subtask 14.2: Test various webcam resolutions and lighting conditions.
    *   `[ ]` Subtask 14.3: Debug issues with detection accuracy, audio latency, and UI glitches.
    *   `[ ]` Subtask 14.4: Test file upload functionality thoroughly (different file types, sizes, error handling).

**5. Deployment Considerations (Future)**

*   Consider hosting platforms (e.g., Heroku, PythonAnywhere, AWS, Google Cloud).
*   Configure a production-ready web server (e.g., Gunicorn, Nginx).
*   Handle HTTPS for secure webcam access.
*   Manage user uploads securely and potentially implement storage limits.

**6. Potential Challenges & Risks**

*   **Performance:** Real-time video processing and audio playback can be CPU-intensive. Performance may vary significantly depending on the user's hardware. MediaPipe JS is generally efficient, but testing is crucial. [4]
*   **Detection Accuracy:** Lighting conditions, background clutter, webcam quality, and hand poses can affect detection accuracy.
*   **Audio Latency:** Web Audio API aims for low latency, but it can still be noticeable depending on the system. [1]
*   **Browser Compatibility:** While `getUserMedia` and Web Audio API are widely supported, minor inconsistencies might exist. [1, 3] MediaPipe JS primarily targets modern browsers. [4]
*   **Gesture Definition:** Defining intuitive and reliable gestures for triggering sounds and especially for conducting requires experimentation.
*   **Security:** File uploads need careful handling on the backend to prevent security vulnerabilities.
*   **Asset Loading:** Ensure CDN links remain valid or implement fallback to local assets if needed.

**7. Implementation Notes**

*   **MediaPipe Models:** The current implementation (`static/js/main.js`) uses CDN links to load MediaPipe assets. The local files in `static/models/` are therefore unused and could potentially be removed unless local hosting is desired later.

This document provides a structured plan. Remember that development is iterative; you may need to revisit earlier steps or adjust the plan as you encounter challenges or develop new ideas. Good luck!