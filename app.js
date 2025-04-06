//adding a comment so i can see the changes

// DOM Elements
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const artistInput = document.getElementById('artistInput');
const resultContainer = document.getElementById('resultContainer');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');
const songCover = document.getElementById('songCover');

// User state
let userId = null;
let accessToken = null;
let refreshToken = null;

// Check for tokens in URL hash
function checkForTokens() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    if (params.has('access_token')) {
        accessToken = params.get('access_token');
        refreshToken = params.get('refresh_token');
        userId = params.get('userId');
        
        // Clear URL hash
        window.location.hash = '';
        
        // Show app interface
        showAppInterface();
    }
}

// Login function
function login() {
    window.location.href = '/login';
}

// Logout function
function logout() {
    // Clear tokens
    accessToken = null;
    refreshToken = null;
    userId = null;
    
    // Show auth interface
    showAuthInterface();
}

// Show auth interface
function showAuthInterface() {
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
}

// Show app interface
function showAppInterface() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
}

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

        const response = await fetch(`/api/search?artist=${encodeURIComponent(artistNameValue)}&userId=${userId}`);
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

// Initialize
checkForTokens(); 