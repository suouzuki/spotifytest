const { createCursor } = require('ghost-cursor');
const { checkTurnstile } = require('./turnstile.js');
const kill = require('tree-kill');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
}

async function pageController({ browser, page, proxy, turnstile, xvfbsession, pid, plugins, killProcess = false, chrome }) {
    let solveStatus = turnstile;

    page.on('close', () => {
        solveStatus = false;
    });

    browser.on('disconnected', async () => {
        solveStatus = false;
        if (killProcess === true) {
            try { xvfbsession?.stopSync?.() } catch {}
            try { chrome?.kill?.() } catch {}
            try { pid && kill(pid, 'SIGKILL', () => {}) } catch {}
        }
    });

    if (proxy.username && proxy.password) {
        try {
            await page.authenticate({ username: proxy.username, password: proxy.password });
        } catch {}
    }

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://google.com',
    });

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
        window.chrome = { runtime: {} };
        console.debug = () => {};

        Object.defineProperty(MouseEvent.prototype, 'screenX', {
            get() {
                return this.clientX + window.screenX;
            }
        });
        Object.defineProperty(MouseEvent.prototype, 'screenY', {
            get() {
                return this.clientY + window.screenY;
            }
        });
    });

    const cursor = createCursor(page);
    try {
        await cursor.move(getRandomInt(100, 500), getRandomInt(100, 500));
    } catch {}

    page.realCursor = cursor;
    page.realClick = cursor.click;

    for (const plugin of plugins || []) {
        try {
            if (plugin.onPageCreated) plugin.onPageCreated(page);
        } catch {}
    }

    async function turnstileSolver() {
        while (solveStatus) {
            try {
                await checkTurnstile({ page });
            } catch {}
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    turnstileSolver();

    return page;
}

module.exports = { pageController };
