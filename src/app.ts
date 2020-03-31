import puppeteer from "puppeteer";
import { Selectors, PerfectMeal } from "./const";

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 300 });
  const page = (await browser.pages())[0];
  await page.goto("https://pauza.hr");
  await page.setViewport({
    height: 900,
    width: 1200
  });

  await page.type(Selectors.addressInput, "reljkoviceva 4");

  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  await page.waitFor(2000);

  await page.click(Selectors.addressConfirm);

  await page.waitForSelector(Selectors.searchInput);
  await page.type(Selectors.searchInput, PerfectMeal.keyWord);

  await page.keyboard.press("Enter");

  await page.waitFor(3000);

  const restaurants = await page.$$(Selectors.restaurant);

  for await (const restaurant of restaurants) {
    const text = await page.evaluate(e => e.textContent, restaurant);
    console.log(text);
  }

  // await browser.close();
})();
