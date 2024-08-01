import puppeteer from 'puppeteer';
import { IOcr } from './ocr';
import { IUser } from '../entity/user';
import { IImageProcess } from './jimp';

export interface IBrowser {
  readonly loginUrl: string
  login : () => Promise<void>
}

class MyCard implements IBrowser {
    readonly loginUrl = 'https://member.mycard520.com/zh-tw/Login'

    readonly screenshotPath = './src/screenshot'

    ocrService: IOcr;

    imageProcessService: IImageProcess;

    user: IUser;

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
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
        ],
      });
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(30000);

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

      const recognizeResult = await this.ocrService.recognize(`${this.screenshotPath}/captcha-process.png`);

      console.log(recognizeResult.data.text);

      await page.screenshot({ path: `${this.screenshotPath}/test.png` });

      await page.close();
    }
}

export default MyCard;
