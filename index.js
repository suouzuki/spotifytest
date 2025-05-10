const { connect } = require("puppeteer-real-browser");
const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const app = express();
console.log(process.env.CHROME_PATH)
app.get("/screenshot", (req, res) => {
  const imgPath = path.join(__dirname, "screenshot.png");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const stream = fs.createReadStream(imgPath);
  stream.pipe(res);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("API running on /screenshot");
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const stealthPlugin = require("puppeteer-extra-plugin-stealth");

async function test() {
  const { browser, page } = await connect({
    headless: "auto",
    args: [],
    customConfig: {},
    turnstile: true,
    connectOption: {},
    disableXvfb: false,
    ignoreAllFlags: false,
    plugins: [stealthPlugin()],
    executablePath: process.env.CHROME_PATH,
  });

  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
  );
  await page.emulateTimezone("America/Sao_Paulo");

  await page._client().send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: path.resolve(__dirname, "./downloads"),
  });

  await page.goto("https://spotdownloader.com/", {
    timeout: 1000 * 60 * 3,
    waitUntil: "domcontentloaded",
  });

  const screenshotPath = path.join(__dirname, "screenshot.png");
  const startScreenshotLoop = async () => {
    while (true) {
      await page.screenshot({ path: screenshotPath });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  startScreenshotLoop();

  await delay(10_000);
  try {
    await page.waitForSelector("#link");
    await page.click("#link");
  } catch (_) {
    await delay(5000);
    page.click("#link");
  }

  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  await page.type(
    "#link",
    "https://open.spotify.com/track/3dLSEH3LqTsCcBFMzsE0Er"
  );
  await page.click("#submit");
}

test();
