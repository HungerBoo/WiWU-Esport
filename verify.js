import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const main = async () => {
  console.log('Starting Vite dev server...');
  const devServer = spawn('npx', ['vite', '--port', '4173', '--strictPort'], {
    shell: true,
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  let serverStarted = false;
  let serverPromise = new Promise((resolve, reject) => {
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Vite Server LOG]: ${output.trim()}`);
      if (output.includes('localhost:4173') || output.includes('127.0.0.1:4173')) {
        serverStarted = true;
        resolve();
      }
    });

    devServer.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error('Server start timeout'));
      }
    }, 15000);
  });

  try {
    await serverPromise;
    console.log('Vite dev server started completely.');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    console.log('Navigating to http://localhost:4173/...');
    const response = await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
    const status = response.status();
    console.log(`HTTP Status Code: ${status}`);
    if (status !== 200) {
      throw new Error(`Expected HTTP 200, got ${status}`);
    }

    // Check stats container initially contains "Matches" and "44"
    console.log('Checking initial stats container...');
    const statsContainerSelector = '[data-stats-container]';
    await page.waitForSelector(statsContainerSelector);
    let initialStatsText = await page.evaluate((sel) => document.querySelector(sel).innerText, statsContainerSelector);
    console.log('Initial stats content:', initialStatsText);
    if (!initialStatsText.includes('Matches') || !initialStatsText.includes('44')) {
      throw new Error(`Initial stats do not contain "Matches" and "44". Got: ${initialStatsText}`);
    }

    // Find and click the "Most recent season" toggle
    console.log('Clicking the "Most recent season" toggle...');
    const toggleButtonSelector = '[data-stats-view="recentSeason"]';
    await page.waitForSelector(toggleButtonSelector);
    await page.click(toggleButtonSelector);

    // Wait a brief moment or check the values directly
    await new Promise((resolve) => setTimeout(resolve, 500));

    let updatedStatsText = await page.evaluate((sel) => document.querySelector(sel).innerText, statsContainerSelector);
    console.log('Updated stats content:', updatedStatsText);
    if (!updatedStatsText.includes('Gruppe') || !updatedStatsText.includes('Gruppe 7.5')) {
      throw new Error(`Updated stats do not contain "Gruppe" and "Gruppe 7.5". Got: ${updatedStatsText}`);
    }

    // Check Instagram blockquote and its permalink
    console.log('Checking Instagram blockquote...');
    const igBlockquoteSelector = 'blockquote.instagram-media';
    await page.waitForSelector(igBlockquoteSelector);
    const permalink = await page.evaluate((sel) => document.querySelector(sel).getAttribute('data-instgrm-permalink'), igBlockquoteSelector);
    console.log('Instagram permalink:', permalink);
    if (!permalink || !permalink.includes('wiwu.esport')) {
      throw new Error(`Instagram blockquote does not have the expected permalink. Got: ${permalink}`);
    }

    console.log('All assertions passed successfully!');
    await browser.close();
  } catch (error) {
    console.error('Test failed:', error);
    process.exitCode = 1;
  } finally {
    console.log('Stopping Vite dev server...');
    devServer.kill();
  }
};

main();
