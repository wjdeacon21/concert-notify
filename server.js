const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Store access token
let accessToken = null;
let tokenExpiration = 0;

// Function to get Spotify access token
async function getAccessToken() {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', 
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
                }
            }
        );
        
        accessToken = response.data.access_token;
        tokenExpiration = Date.now() + (response.data.expires_in * 1000);
        return accessToken;
    } catch (error) {
        console.error('Error getting access token:', error.message);
        throw new Error('Failed to authenticate with Spotify');
    }
}

// Middleware to ensure valid access token
async function ensureAccessToken(req, res, next) {
    if (!accessToken || Date.now() >= tokenExpiration) {
        try {
            await getAccessToken();
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    next();
}

// Search endpoint
app.get('/api/search', ensureAccessToken, async (req, res) => {
    try {
        const { artist } = req.query;
        
        if (!artist) {
            return res.status(400).json({ error: 'Artist name is required' });
        }

        // Search for the artist
        const searchResponse = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const artistId = searchResponse.data.artists.items[0]?.id;
        
        if (!artistId) {
            return res.status(404).json({ error: 'Artist not found' });
        }

        // Get artist's top tracks
        const topTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const topTrack = topTracksResponse.data.tracks[0];
        
        if (!topTrack) {
            return res.status(404).json({ error: 'No tracks found for this artist' });
        }

        // Return the top track information
        res.json({
            songName: topTrack.name,
            artistName: topTrack.artists[0].name,
            albumCover: topTrack.album.images[0].url
        });

    } catch (error) {
        console.error('Error in search endpoint:', error.message);
        res.status(500).json({ error: 'Failed to fetch artist information' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
