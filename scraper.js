const { chromium } = require('playwright');

// Helper function to add random delay
const randomDelay = async (min = 1000, max = 3000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
};

// Helper function to retry failed operations
async function retry(fn, retries = 3, delay = 5000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed: ${error.message}`);
      if (i < retries - 1) {
        console.log(`Waiting ${delay/1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function getArtistNames() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    geolocation: { longitude: -74.006, latitude: 40.7128 },
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    }
  });

  // Add stealth scripts
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    window.chrome = { runtime: {} };
  });

  const page = await context.newPage();
  const shows = [];

  try {
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
      const url = `https://www.ohmyrockness.com/shows/just-announced?page=${pageNum}`;
      console.log(`Scraping page ${pageNum}...`);
      
      // Random delay before navigation
      await randomDelay(2000, 5000);
      
      // Wrap page navigation in retry logic
      await retry(async () => {
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 60000 // Increased timeout to 60 seconds
        });

        // Simulate human-like scrolling
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
              
              if(totalHeight >= scrollHeight){
                clearInterval(timer);
                resolve();
              }
            }, 100);
          });
        });

        // Random delay after scrolling
        await randomDelay(1000, 2000);

        const pageShows = await page.$$eval('.row.vevent', rows =>
          rows.map(row => {
            const artistEl = Array.from(row.querySelectorAll('.bands.summary a')).filter(a =>
              a.classList.contains('non-profiled') || a.className.trim() === ''
            );
            const artistNames = artistEl.map(a => a.textContent.trim());

            const datetimeAttr = row.querySelector('.value-title')?.getAttribute('title') || '';

            let date = 'Unknown';
            let time = 'Unknown';
        
            if (datetimeAttr) {
              const dt = new Date(datetimeAttr);
              date = dt.toLocaleDateString();
              time = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            const venue = row.querySelector('.fn.org').textContent.trim();

            return { name: { artists: artistNames, date, time, venue } };
          })
        );

        if (pageShows.length === 0) {
          throw new Error('No shows found on page - possible detection or page load issue');
        }

        shows.push(...pageShows);
      }, 3, 10000); // 3 retries with 10 second delay between attempts
      
      // Random delay between pages
      await randomDelay(3000, 7000);
    }

    console.log('🎤 Total shows found:', shows.length);
  } catch (error) {
    console.error('❌ Error during scraping:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await context.close();
    await browser.close();
  }

  return shows;
}

// Run directly
if (require.main === module) {
  getArtistNames().catch(error => {
    console.error('❌ Error in Playwright scraper:', error.message);
    console.error('Stack trace:', error.stack);
  });
}

module.exports = getArtistNames;