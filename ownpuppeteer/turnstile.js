const { createCursor } = require('ghost-cursor');

const checkTurnstile = async ({ page }) => {
  return new Promise(async (resolve) => {
    const cursor = createCursor(page);

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const randomDelay = async (min = 100, max = 250) => {
      await delay(Math.floor(Math.random() * (max - min)) + min);
    };

    const timeout = setTimeout(() => resolve(false), 5000);

    try {
      const challengeInputs = await page.$$('[name="cf-turnstile-response"]');

      if (challengeInputs.length <= 0) {
        const possibleBoxes = await page.evaluate(() => {
          const matches = [];

          function check(strict = true) {
            for (const div of document.querySelectorAll('div')) {
              try {
                const rect = div.getBoundingClientRect();
                const style = getComputedStyle(div);

                const widthMatch = rect.width > 290 && rect.width <= 310;
                const styleMatch = strict ? style.margin === '0px' && style.padding === '0px' : true;
                const empty = div.children.length === 0;

                if (widthMatch && styleMatch && empty) {
                  matches.push({
                    x: rect.x,
                    y: rect.y,
                    w: rect.width,
                    h: rect.height,
                  });
                }
              } catch {}
            }
          }

          check(true);
          if (matches.length === 0) check(false);

          return matches;
        });

        for (const { x, y, h } of possibleBoxes) {
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

      for (const element of challengeInputs) {
        try {
          const parent = await element.evaluateHandle((el) => el.parentElement);
          const box = await parent.boundingBox();

          if (box?.x && box?.y) {
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
