const puppeteer = require("puppeteer");
const lipsum = require("lorem-ipsum");

const classCode = "stress_test17";
const userCount = 15;

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  const test = async userDataName => {
    const page = await browser.newPage({ userDataDir: userDataName });
    await page.goto(
      `http://localhost:3000/?flowID=islam_spread&classCode=${classCode}&userID=${userDataName}`,
    );

    const emailSelector = "#__next>div>div>div>div>div>input";
    await page.waitForSelector(emailSelector);
    await page.click(emailSelector);
    await page.keyboard.type("andy@andymatuschak.org");
    await page.keyboard.press("Enter");

    const responseSelector = "*[contentEditable=true]";
    await page.waitForSelector(responseSelector);
    await page.click(responseSelector);
    await page.keyboard.type(lipsum({ count: 5, units: "sentences" }), {
      delay: Math.random() * 50 + 50,
    });

    await page.click("button");
  };

  Promise.all(
    Array(userCount)
      .fill(null)
      .map((unused, index) => test(`user_${index}`)),
  );
  console.log("done");
})();
