import os, sys
import pytest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    return app.test_client()

def test_index_loads(client):
    rv = client.get('/')
    assert rv.status_code == 200
    html = rv.data.decode('utf-8')
    assert 'cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js' in html
    assert 'cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js' in html
    assert 'cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js' in html

def test_main_js_functionality():
    """Checks for key functions and calls in main.js"""
    with open('static/js/main.js', 'r', encoding='utf-8') as f:
        content = f.read()
    # Check for core MediaPipe setup
    assert 'function onResults' in content, "onResults function missing"
    assert 'hands.send' in content, "hands.send call missing"
    # Check for audio loading and playing logic (Task 5)
    assert 'async function loadNoteSound' in content, "loadNoteSound function missing"
    # Ensure the specific file name used in loadNoteSound is checked
    assert 'loadNoteSound(\'/static/audio/note.wav\')' in content, "Call to loadNoteSound missing or using incorrect file path/name"
    assert 'function playNote' in content, "playNote function missing"
    assert 'audioContext.decodeAudioData' in content, "decodeAudioData call missing"
    assert 'source.start(0)' in content, "source.start call missing or incorrect"