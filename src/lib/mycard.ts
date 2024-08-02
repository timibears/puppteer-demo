import puppeteer, { Browser, Page } from 'puppeteer';
import { IOcr } from './ocr';
import { IUser } from '../entity/user';
import { IImageProcess } from './jimp';

export interface IBrowser {
  readonly loginUrl: string
  login : () => Promise<void>
  verifyPhoneCode: (code: string) => Promise<void>
}

class MyCard implements IBrowser {
    readonly loginUrl = 'https://member.mycard520.com/zh-tw/Login'

    readonly screenshotPath = './src/screenshot'

    ocrService: IOcr;

    imageProcessService: IImageProcess;

    user: IUser;

    browserWSEndpoint: string | undefined;

    page: Page | undefined;

    run = 0

    constructor(
      ocrService: IOcr,
      imageProcessService: IImageProcess,
      user: IUser,
    ) {
      this.ocrService = ocrService;
      this.imageProcessService = imageProcessService;
      this.user = user;
    }

    async login(): Promise<void> {
      let browser: Browser;

      if (!this.browserWSEndpoint) {
        browser = await puppeteer.launch({
          headless: false,
          args: [
            '--no-sandbox',
          ],
        });
        this.browserWSEndpoint = await browser.wsEndpoint();
      } else {
        browser = await puppeteer.connect({
          browserWSEndpoint: this.browserWSEndpoint,
        });
      }

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(30000);
      this.page = page;

      await page.goto(this.loginUrl);

      await page.type('#Account', this.user.username);

      await Promise.all([
        page.click('#btnLogin'),
        page.waitForNavigation(),
      ]);

      await page.type('#Password', this.user.password);

      const captchaEl = await page.waitForSelector('img#captcha');
      await captchaEl?.screenshot({ path: `${this.screenshotPath}/captcha.png` });

      await this.imageProcessService.imageProcessing(`${this.screenshotPath}/captcha.png`);

      const recognizeResult = await this.ocrService.recognize(`${this.screenshotPath}/captchaProcess.png`);

      console.log(recognizeResult.data.text);

      await page.type('#VerifyCode', recognizeResult.data.text);

      await page.screenshot({ path: `${this.screenshotPath}/loginPage.png` });

      await page.click('#btnPassword');

      await page.waitForFunction(
        `document.querySelector('div#browser_popup') 
        && document.querySelector('div#browser_popup').style.visibility == 'visible'
        && document.querySelector('div#browser_popup').style.opacity == 1`,
      );

      const phoneVerifyEl = await page.$('div#browser_popup');

      await phoneVerifyEl?.screenshot({ path: `${this.screenshotPath}/notPhoneVerifyForm.png` });

      await Promise.all([
        page?.click('#btnLater'),
        page.waitForNavigation(),
      ]);

      await page.screenshot({ path: `${this.screenshotPath}/phoneVerifyPage.png` });
    }

    async verifyPhoneCode(code: string): Promise<void> {
      if (!this.page) {
        throw new Error('page not found');
      }

      const { page } = this;

      await page.type('#VerifyCode', code);

      const loginLink = await page.waitForSelector('#step_btn');

      await Promise.all([
        loginLink?.click(),
        page.waitForNavigation(),
      ]);

      await page.screenshot({ path: `${this.screenshotPath}/sucessLoginPage.png` });
    }
}

export default MyCard;
