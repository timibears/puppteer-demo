import puppeteer from 'puppeteer';
import recognize from './ocr';

interface IBrowser {
  readonly loginUrl: string
  login : () => Promise<void>
}

class MyCard implements IBrowser {
    readonly loginUrl = 'https://member.mycard520.com/zh-tw/Login'

    instance = 0;

    async login(): Promise<void> {
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
        ],
      });
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(30000);

      await page.goto(this.loginUrl);

      await page.type('#Account', '0935666270');

      await Promise.all([
        page.click('#btnLogin'),
        page.waitForNavigation(),
      ]);

      await page.type('#Password', 'Aa27336622Aa');

      // const captcha = await page.$eval('img#captcha', (el) => el.src);
      const captchaEl = await page.waitForSelector('img#captcha');
      await captchaEl?.screenshot({ path: 'captcha.png' });

      const recognizeResult = await recognize('captcha.png');

      console.log(recognizeResult.data.text);
      console.log(recognizeResult);

      await page.screenshot({ path: './test.png' });

      await page.close();
    }
}

export default MyCard;
