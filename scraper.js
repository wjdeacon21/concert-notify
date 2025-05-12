const axios = require('axios');
const https = require('https');

async function getArtistNames() {
  try {
    // Fetch shows data from GitHub raw content
    const response = await axios.get('https://raw.githubusercontent.com/wjdeacon21/scrapedShows/refs/heads/main/data/shows_recent.json', {
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
    const shows = response.data;

    console.log('🎤 Total shows found:', shows.length);
    return shows;
  } catch (error) {
    console.error('❌ Error fetching shows data:', error.message);
    throw error;
  }
}

// Run directly
if (require.main === module) {
  getArtistNames().catch(error => {
    console.error('❌ Error fetching shows:', error.message);
  });
}

module.exports = getArtistNames;