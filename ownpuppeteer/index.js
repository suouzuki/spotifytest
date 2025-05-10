const puppeteerBase = require("rebrowser-puppeteer-core");
const { pageController } = require("./pageController.js");
const { launch, Launcher } = require("chrome-launcher");

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
      console.log("[1] Xvfb iniciado com sucesso");
    } catch (err) {
      console.warn("[1] Erro ao iniciar Xvfb:", err.message);
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

  console.log("[2] Flags do Chrome preparadas:", chromeFlags);

  const chrome = await launch({
    ignoreDefaultFlags: true,
    chromeFlags,
    ...customConfig,
  });

  console.log("[3] Chrome iniciado na porta:", chrome.port);

  if (plugins.length > 0) {
    try {
      const puppeteerExtra = require("puppeteer-extra");
      puppeteer = puppeteerExtra(puppeteer);
      for (const plugin of plugins) {
        puppeteer.use(plugin);
      }
      console.log("[4] Plugins puppeteer-extra carregados com sucesso");
    } catch (e) {
      console.warn("[4] Erro ao carregar plugins no puppeteer-extra:", e.message);
    }
  }

  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${chrome.port}`,
      ...connectOption,
    });
    console.log("[5] Conectado ao navegador via Puppeteer");
  } catch (err) {
    throw new Error("[5] Erro ao conectar ao navegador: " + err.message);
  }

  let pages;
  try {
    pages = await browser.pages();
    console.log("[6] Páginas abertas recuperadas com sucesso");
  } catch {
    pages = [];
    console.log("[6] Nenhuma página aberta recuperada");
  }

  let page = pages.length > 0 ? pages[0] : null;

  if (!page) {
    try {
      page = await browser.newPage();
      console.log("[7] Nova página criada com sucesso");
    } catch (err) {
      throw new Error("[7] Falha ao criar nova página: " + err.message);
    }
  } else {
    console.log("[7] Página existente reutilizada");
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

  console.log("[8] Configuração do pageController preparada");

  try {
    page = await pageController({
      ...pageControllerConfig,
      killProcess: true,
      chrome,
    });
    console.log("[9] pageController executado com sucesso");
  } catch (err) {
    console.warn("[9] Erro ao configurar pageController:", err.message);
  }

  browser.on("targetcreated", async (target) => {
    try {
      if (target.type() === "page") {
        const newPage = await target.page();
        if (newPage) {
          pageControllerConfig.page = newPage;
          await pageController(pageControllerConfig);
          console.log("[-] Novo target (página) detectado e configurado");
        }
      }
    } catch (err) {
      console.warn("[-] Erro em targetcreated:", err.message);
    }
  });

  console.log("[10] Navegador pronto para uso");

  return {
    browser,
    page,
  };
}

module.exports = { connect };
