const puppeteerBase = require("rebrowser-puppeteer-core");
const { pageController } = require("./pageController.js");
const Launcher = require("chrome-launcher");

let puppeteer = puppeteerBase;
let Xvfb = null;

try {
  Xvfb = require("xvfb");
} catch {}

async function connect({
  args = [],
  headless = false,
  customConfig = {},
  proxy = {},
  turnstile = false,
  connectOption = {},
  disableXvfb = false,
  plugins = [],
  ignoreAllFlags = false,
} = {}) {
  let xvfbsession = null;

  if (headless === "auto") headless = false;

  if (process.platform === "linux" && !disableXvfb && Xvfb) {
    try {
      xvfbsession = new Xvfb({
        silent: true,
        xvfb_args: ["-screen", "0", "1920x1080x24", "-ac"],
      });
      xvfbsession.startSync();
    } catch (err) {
      console.warn("Erro ao iniciar Xvfb:", err.message);
    }
  }

  let chromeFlags;

  if (ignoreAllFlags === true) {
    chromeFlags = [
      ...args,
      ...(headless !== false ? [`--headless=${headless}`] : []),
      ...(proxy?.host && proxy?.port
        ? [`--proxy-server=${proxy.host}:${proxy.port}`]
        : []),
    ];
  } else {
    const flags = Launcher.defaultFlags();

    const indexDisableFeatures = flags.findIndex(f =>
      f.startsWith("--disable-features")
    );
    if (indexDisableFeatures >= 0) {
      flags[indexDisableFeatures] += ",AutomationControlled";
    }

    const indexComponentUpdate = flags.findIndex(f =>
      f.startsWith("--disable-component-update")
    );
    if (indexComponentUpdate >= 0) {
      flags.splice(indexComponentUpdate, 1);
    }

    chromeFlags = [
      ...flags,
      ...args,
      ...(headless !== false ? [`--headless=${headless}`] : []),
      ...(proxy?.host && proxy?.port
        ? [`--proxy-server=${proxy.host}:${proxy.port}`]
        : []),
      "--no-sandbox",
      "--disable-dev-shm-usage",
    ];
  }

  const chrome = await Launcher.launch({
    ignoreDefaultFlags: true,
    chromeFlags,
    ...customConfig,
  });

  if (plugins.length > 0) {
    try {
      const puppeteerExtra = require("puppeteer-extra");
      puppeteer = puppeteerExtra(puppeteer);
      for (const plugin of plugins) {
        puppeteer.use(plugin);
      }
    } catch (e) {
      console.warn("Erro ao carregar plugins no puppeteer-extra:", e.message);
    }
  }

  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${chrome.port}`,
      ...connectOption,
    });
  } catch (err) {
    throw new Error("Erro ao conectar ao navegador: " + err.message);
  }

  let pages;
  try {
    pages = await browser.pages();
  } catch {
    pages = [];
  }

  let page = pages.length > 0 ? pages[0] : null;

  if (!page) {
    try {
      page = await browser.newPage();
    } catch (err) {
      throw new Error("Falha ao criar nova página: " + err.message);
    }
  }

  const pageControllerConfig = {
    browser,
    page,
    proxy,
    turnstile,
    xvfbsession,
    pid: chrome.pid,
    plugins,
  };

  try {
    page = await pageController({
      ...pageControllerConfig,
      killProcess: true,
      chrome,
    });
  } catch (err) {
    console.warn("Erro ao configurar pageController:", err.message);
  }

  browser.on("targetcreated", async (target) => {
    try {
      if (target.type() === "page") {
        const newPage = await target.page();
        if (newPage) {
          pageControllerConfig.page = newPage;
          await pageController(pageControllerConfig);
        }
      }
    } catch (err) {
      console.warn("Erro em targetcreated:", err.message);
    }
  });

  return {
    browser,
    page,
  };
}

module.exports = { connect };
