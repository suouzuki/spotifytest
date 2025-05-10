const puppeteerBase = require("rebrowser-puppeteer-core");
const { pageController } = require("./pageController.js");

let puppeteer = puppeteerBase;

async function connect({
  proxy = {},
  turnstile = false,
  connectOption = {},
  plugins = [],
} = {}) {
  const BROWSERLESS_ENDPOINT = "wss://chrome.browserless.io?token=2SHvm8ayx0iA26B5ff3d109a6df047b1e312fe6c3661eb670";

  if (plugins.length > 0) {
    try {
      const puppeteerExtra = require("puppeteer-extra");
      puppeteer = puppeteerExtra(puppeteer);
      for (const plugin of plugins) {
        puppeteer.use(plugin);
      }
      console.log("[1] Plugins puppeteer-extra carregados com sucesso");
    } catch (e) {
      console.warn("[1] Erro ao carregar plugins no puppeteer-extra:", e.message);
    }
  }

  let browser;
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: BROWSERLESS_ENDPOINT,
      ...connectOption,
    });
    console.log("[2] Conectado ao Browserless.io via Puppeteer");
  } catch (err) {
    throw new Error("[2] Erro ao conectar ao navegador remoto: " + err.message);
  }

  let pages;
  try {
    pages = await browser.pages();
    console.log("[3] Páginas abertas recuperadas com sucesso");
  } catch {
    pages = [];
    console.log("[3] Nenhuma página aberta recuperada");
  }

  let page = pages.length > 0 ? pages[0] : null;

  if (!page) {
    try {
      console.log('[4] tentando criar pagina');
      page = await browser.newPage();
      console.log("[4] Nova página criada com sucesso");
    } catch (err) {
      throw new Error("[4] Falha ao criar nova página: " + err.message);
    }
  } else {
    console.log("[4] Página existente reutilizada");
  }

  const pageControllerConfig = {
    browser,
    page,
    proxy,
    turnstile,
    xvfbsession: null,
    pid: null,
    plugins,
  };

  console.log("[5] Configuração do pageController preparada");

  try {
    page = await pageController({
      ...pageControllerConfig,
      killProcess: false,
    });
    console.log("[6] pageController executado com sucesso");
  } catch (err) {
    console.warn("[6] Erro ao configurar pageController:", err.message);
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

  console.log("[7] Navegador pronto para uso");

  return {
    browser,
    page,
  };
}

module.exports = { connect };
