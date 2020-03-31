import puppeteer, { ElementHandle } from "puppeteer";
import dotenv from "dotenv";

dotenv.config();

import { Selectors, PerfectMeal } from "./const";

export const getElementText = async (
  element: ElementHandle
): Promise<string> => {
  const elementTextContent = await element.getProperty("textContent");
  const elementText = (await elementTextContent.jsonValue()) as string;
  return elementText;
};

const isRestaurantOk = async (element: ElementHandle) => {
  const ratingElement = await element.$(Selectors.restaurantRating);
  const ratingString = ratingElement && (await getElementText(ratingElement));
  console.log("Found restaurant with rating", ratingString);
  const rating = parseFloat(ratingString as string);
  return rating >= PerfectMeal.minRating;
};

const isMealOk = async (mealTitle: string) => {
  return mealTitle.toLowerCase().includes(PerfectMeal.keyWord);
};

(async () => {
  /**
   * Configure puppeteer
   */
  // const browser = await puppeteer.connect({
  //   slowMo: 300,
  //   browserURL: "http://localhost:9221"
  // });
  const browser = await puppeteer.launch({
    slowMo: 300,
    headless: false
  });
  const [page] = await browser.pages();
  await page.setViewport({
    width: 1200,
    height: 900
  });

  console.log("Visiting pauza.hr to order food for master");
  await page.goto("https://www.pauza.hr/");

  console.log("Entering location of my master");
  await page.type(Selectors.addressInput, "Reljkoviceva 4");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  console.log("Confirming location");
  await page.waitFor(3000);
  await page.click(Selectors.addressConfirm);

  console.log(`Searching for places with ${PerfectMeal.keyWord}`);
  await page.waitForSelector(Selectors.searchInput);
  await page.type(Selectors.searchInput, PerfectMeal.keyWord);
  await page.keyboard.press("Enter");

  await page.waitFor(3000);

  console.log("Selecting restaurant");
  const restaurantElements: ElementHandle[] = await page.$$(
    Selectors.restaurant
  );

  for await (const restaurant of restaurantElements) {
    if (await isRestaurantOk(restaurant)) {
      console.log(`Found a good restaurant for my master, selecting `);

      const buttonElement = await restaurant.$(
        Selectors.restaurantConfirmButton
      );

      buttonElement && (await buttonElement.click());

      break;
    }

    console.log("Master will not like this restaurant");
  }

  await page.waitFor(3000);

  /**
   * Select meal:
   */
  console.log("Selecting meal");

  const restaurantMealElements = await page.$$(
    Selectors.restaurantMealDescription
  );

  for await (const meal of restaurantMealElements) {
    const mealDescription = await getElementText(meal);
    if (await isMealOk(mealDescription)) {
      console.log(
        `Perfect meal for master found, selecting: ${mealDescription}`
      );
      await meal.click();
      break;
    }
    console.log(`Master doesn't like ${mealDescription}, searching further`);
  }

  await page.waitFor(3000);

  await page.click(Selectors.addMealToCartButton);

  await page.waitFor(3000);

  await page.click(Selectors.confirmMealButton);

  await page.waitFor(3000);

  console.log("Lets log in as my master");
  await page.type(Selectors.username, process.env.PAUZA_USER as string);
  await page.type(Selectors.password, process.env.PAUZA_PASS as string);
  await page.click(Selectors.loginButton);

  await page.waitFor(3000);

  console.log("Typing more details about my master");
  await page.type(Selectors.doorbellName, "Fule");
  await page.type(Selectors.floor, "1.");
  await page.type(Selectors.phone, "0959100987");

  // final purchase
  await page.click(Selectors.finalConfirmationButton);

  console.log("Waiting for confirmation");
  await page.waitFor(20000);

  console.log("Taking screenshot");
  await page.screenshot({ path: "pauza-confirmation.png" });

  browser.disconnect();
})();
