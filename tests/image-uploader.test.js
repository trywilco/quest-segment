/* eslint-disable */
const puppeteer = require("puppeteer");

function isElementVisible(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return !!(
      element &&
      (element.offsetWidth ||
        element.offsetHeight ||
        element.getClientRects().length)
    );
  }, selector);
}

describe("Check that the Cloduinary image uploader shown when adding an item", () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  it("Open the image uploader in the editor page", async () => {
    await page.goto(
      "http://localhost:3001/editor",
      {
        waitUntil: "load",
        timeout: 60000,
      }
    );

    try {
      const button = await page.waitForSelector(`#uploader`, {
        timeout: 1000,
      });
      button.click();
    } catch (e) {
      throw Error("can't find a button with 'uploader' id in the /editor page");
    }

    const elementHandle = await page.$('iframe[src*="cloudinary.com"]');
    const frame = await elementHandle.contentFrame();

    await page.waitForTimeout(1000);
    if (!(await isElementVisible(frame, ".upload-popup-active"))) {
      throw Error(
        "Clicked on the upload button but couldn't find the upload popup"
      );
    }

    await frame.click('button[data-test="url-btn"]');

    await page.waitForTimeout(1000);
    try {
      await frame.waitForSelector('input[data-test="search-input-box"]', {
        timeout: 1000,
      });
    } catch (e) {
      throw Error("can't find input box to upload image from url");
    }

    await frame.focus('input[data-test="search-input-box"]');
    await frame.type(
      'input[data-test="search-input-box"]',
      "https://picsum.photos/100/100",
      { delay: 10 }
    );
    await page.keyboard.press("Enter");

    try {
      const upload = await frame.waitForSelector(
        'button[data-test="queue-done"]:not([disabled])',
        {
          timeout: 5000,
        }
      );
      await upload.click();
    } catch (e) {
      throw Error("can't find the upload button in the cloudinary widget");
    }

    try {
      await page.waitForSelector('img[src^="https://res.cloudinary.com/"]', {
        timeout: 5000,
      });
    } catch (e) {
      throw Error("can't find a preview for the uploaded image");
    }
  }, 60000);
});
