const { createCursor } = require('ghost-cursor');

const checkTurnstile = ({ page }) => {
    return new Promise(async (resolve) => {
        const cursor = createCursor(page);

        const delay = (ms) => new Promise(r => setTimeout(r, ms));
        const randomDelay = async (min = 100, max = 250) => {
            await delay(Math.floor(Math.random() * (max - min)) + min);
        };

        const waitTimeout = setTimeout(() => {
            clearTimeout(waitTimeout);
            resolve(false);
        }, 5000);

        try {
            const elements = await page.$$('[name="cf-turnstile-response"]');

            if (elements.length <= 0) {
                const coordinates = await page.evaluate(() => {
                    let result = [];

                    document.querySelectorAll('div').forEach(div => {
                        try {
                            const rect = div.getBoundingClientRect();
                            const style = window.getComputedStyle(div);
                            const basicMatch = rect.width > 290 && rect.width <= 310 && !div.querySelector('*');

                            if (style.margin === "0px" && style.padding === "0px" && basicMatch) {
                                result.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
                            }
                        } catch {}
                    });

                    if (result.length <= 0) {
                        document.querySelectorAll('div').forEach(div => {
                            try {
                                const rect = div.getBoundingClientRect();
                                const basicMatch = rect.width > 290 && rect.width <= 310 && !div.querySelector('*');

                                if (basicMatch) {
                                    result.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
                                }
                            } catch {}
                        });
                    }

                    return result;
                });

                for (const box of coordinates) {
                    try {
                        const x = box.x + 30;
                        const y = box.y + box.h / 2;
                        await cursor.move(x, y);
                        await randomDelay();
                        await cursor.click();
                        await randomDelay();
                    } catch {}
                }

                clearTimeout(waitTimeout);
                return resolve(true);
            }

            for (const element of elements) {
                try {
                    const parent = await element.evaluateHandle(el => el.parentElement);
                    const box = await parent.boundingBox();
                    const x = box.x + 30;
                    const y = box.y + box.height / 2;
                    await cursor.move(x, y);
                    await randomDelay();
                    await cursor.click();
                    await randomDelay();
                } catch {}
            }

            clearTimeout(waitTimeout);
            resolve(true);
        } catch {
            clearTimeout(waitTimeout);
            resolve(false);
        }
    });
};

module.exports = { checkTurnstile };
