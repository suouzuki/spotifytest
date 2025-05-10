const { connect } = require("./ownpuppeteer/index.js");
const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const app = express();

const { exec } = require('child_process');

function findChromePath() {
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/opt/google/chrome/google-chrome',
    '/opt/google/chrome/google-chrome-stable'
  ];

  for (let path of possiblePaths) {
    try {
      // Verifica se o caminho existe
      if (fs.existsSync(path)) {
        console.log(`Google Chrome encontrado em: ${path}`);
        return path;
      }
    } catch (err) {
      console.error(`Erro ao verificar o caminho ${path}:`, err);
    }
  }

  console.log('Google Chrome não encontrado.');
  return null;
}

exec('which Xvfb', (error, stdout, stderr) => {
  if (error || !stdout.trim()) {
    console.error('Xvfb NÃO está instalado ou não está no PATH');
    process.exit(1);
  } else {
    console.log('Xvfb encontrado em:', stdout.trim());
  }
});
console.log(process.env.CHROME_PATH)
process.env.CHROME_PATH = process.env.CHROME_PATH || findChromePath()
console.log("[1] CHROME_PATH:", process.env.CHROME_PATH);

app.get("/screenshot", (req, res) => {
  console.log("[-] GET /screenshot chamado");
  const imgPath = path.join(__dirname, "screenshot.png");
  console.log("[-] Caminho da imagem:", imgPath);
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const stream = fs.createReadStream(imgPath);
  stream.pipe(res);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("[2] Servidor Express rodando na porta", process.env.PORT || 3000);
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const stealthPlugin = require("puppeteer-extra-plugin-stealth");

async function test() {
  console.log("[3] Iniciando conexão com o navegador...");
  const { browser, page } = await connect({
    headless: "auto",
    args: [],
    customConfig: {},
    turnstile: true,
    connectOption: {},
    disableXvfb: false,
    ignoreAllFlags: false,
    //plugins: [stealthPlugin()],
    executablePath: process.env.CHROME_PATH,
  });

if (!page) {
      throw new Error('A página não foi inicializada corretamente.');
    }

  console.log("[4] Navegador conectado");
  console.log("[5] Configurando userAgent e timezone...");
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
  );
  await page.emulateTimezone("America/Sao_Paulo");

  console.log("[6] Configurando diretório de download...");
  await page._client().send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: path.resolve(__dirname, "./downloads"),
  });

  console.log("[7] Acessando página...");
  await page.goto("https://spotdownloader.com/", {
    timeout: 1000 * 60 * 3,
    waitUntil: "domcontentloaded",
  });
  console.log("[8] Página carregada");

  const screenshotPath = path.join(__dirname, "screenshot.png");
  console.log("[9] Caminho para salvar screenshot:", screenshotPath);

  const startScreenshotLoop = async () => {
    console.log("[-] Iniciando loop de screenshots...");
    while (true) {
      try {
        await page.screenshot({ path: screenshotPath });
      } catch (err) {
        console.log("[-] Erro ao tirar screenshot:", err.message);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  startScreenshotLoop();

  console.log("[10] Aguardando 10 segundos antes de interagir com o site...");
  await delay(10_000);

  try {
    console.log("[11] Esperando pelo seletor #link...");
    await page.waitForSelector("#link");
    console.log("[12] #link encontrado, clicando...");
    await page.click("#link");
  } catch (_) {
    console.log("[13] Erro ao encontrar/clicar em #link, tentando novamente após 5s...");
    await delay(5000);
    page.click("#link");
  }

  console.log("[14] Limpando campo e digitando o link...");
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");

  await page.type(
    "#link",
    "https://open.spotify.com/track/3dLSEH3LqTsCcBFMzsE0Er"
  );

  console.log("[15] Clicando no botão de submit...");
  await page.click("#submit");

  console.log("[16] Processo de teste iniciado com sucesso.");
}

test();
