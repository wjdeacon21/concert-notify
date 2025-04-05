// DOM Elements
const artistInput = document.getElementById('artistInput');
const resultContainer = document.getElementById('resultContainer');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');
const songCover = document.getElementById('songCover');

// Search function
async function searchArtist() {
    const artistNameValue = artistInput.value.trim();
    
    if (!artistNameValue) {
        showError('Please enter an artist name');
        return;
    }

    try {
        showLoading();
        hideResults();
        hideError();

        const response = await fetch(`/api/search?artist=${encodeURIComponent(artistNameValue)}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        updateResults(data);
    } catch (error) {
        showError(error.message || 'An error occurred while searching');
    } finally {
        hideLoading();
    }
}

// UI Helper Functions
function showLoading() {
    loading.classList.add('show');
}

function hideLoading() {
    loading.classList.remove('show');
}

function showResults() {
    resultContainer.classList.add('show');
}

function hideResults() {
    resultContainer.classList.remove('show');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

function updateResults(data) {
    songTitle.textContent = data.songName;
    artistName.textContent = data.artistName;
    songCover.src = data.albumCover;
    showResults();
}

// Event Listeners
artistInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchArtist();
    }
}); 