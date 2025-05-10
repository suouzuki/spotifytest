const { createCursor } = require('ghost-cursor');

const checkTurnstile = async ({ page }) => {
  return new Promise(async (resolve) => {
    const cursor = createCursor(page);

    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    const randomDelay = async (min = 100, max = 250) => {
      await delay(Math.floor(Math.random() * (max - min)) + min);
    };

    const timeout = setTimeout(() => resolve(false), 5000);

    try {
      const elements = await page.$$('[name="cf-turnstile-response"]');

      if (elements.length <= 0) {
        const coordinates = await page.evaluate(() => {
          const boxes = [];

          function scan(strict = true) {
            document.querySelectorAll("div").forEach(div => {
              try {
                const rect = div.getBoundingClientRect();
                const style = window.getComputedStyle(div);

                const widthOk = rect.width > 290 && rect.width <= 310;
                const styleOk = strict ? style.margin === "0px" && style.padding === "0px" : true;
                const empty = !div.querySelector("*");

                if (widthOk && styleOk && empty) {
                  boxes.push({
                    x: rect.x,
                    y: rect.y,
                    w: rect.width,
                    h: rect.height
                  });
                }
              } catch {}
            });
          }

          scan(true);
          if (boxes.length === 0) scan(false);
          return boxes;
        });

        for (const { x, y, h } of coordinates) {
          try {
            await cursor.move(x + 30, y + h / 2);
            await randomDelay();
            await cursor.click();
            await randomDelay();
          } catch {}
        }

        clearTimeout(timeout);
        return resolve(true);
      }

      for (const element of elements) {
        try {
          const parent = await element.evaluateHandle(el => el.parentElement);
          const box = await parent.boundingBox();

          if (box && box.x && box.y) {
            await cursor.move(box.x + 30, box.y + box.height / 2);
            await randomDelay();
            await cursor.click();
            await randomDelay();
          }
        } catch {}
      }

      clearTimeout(timeout);
      return resolve(true);
    } catch {
      clearTimeout(timeout);
      return resolve(false);
    }
  });
};

module.exports = { checkTurnstile };
