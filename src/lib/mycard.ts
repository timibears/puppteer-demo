import puppeteer, { Browser, Page } from 'puppeteer';
import { IOcr } from './tesseract';
import { IUser } from '../entity/user';
import { IImageProcess } from './jimp';
import delay from './delay';
import { IWebController } from './puppeteer';

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

    browserWSEndpoint?: string ;

    page?: Page ;

    webController: IWebController

    constructor(
      webController: IWebController,
      ocrService: IOcr,
      imageProcessService: IImageProcess,
      user: IUser,
    ) {
      this.ocrService = ocrService;
      this.imageProcessService = imageProcessService;
      this.webController = webController;
      this.user = user;
    }

    async login(): Promise<void> {
      const browser = await this.webController.launchBroswer();

      this.browserWSEndpoint = await browser.wsEndpoint();

      console.log(this.browserWSEndpoint);

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(30000);

      this.page = page;

      // set cookies
      if (this.user.cookie?.length) {
        await page.setCookie(...this.user.cookie);
      }

      await page.goto(this.loginUrl);

      // delay(1000000);

      // return;

      await page.type('#Account', this.user.username);

      await Promise.all([
        page.click('#btnLogin'),
        page.waitForNavigation(),
      ]);

      await delay(1000);
      await page.type('#Password', this.user.password);

      const captcha = await this.captchaRecognize();

      await page.type('#VerifyCode', captcha);

      const [_, navigation] = await Promise.allSettled([
        page.click('#btnPassword'),
        page.waitForNavigation({ timeout: 5000 }),
      ]);

      if (navigation.status === 'fulfilled') {
        await page.goto(this.loginUrl);
        await page.screenshot({ path: `${this.screenshotPath}/sucessLoginPage.png` });

        return;
      }

      await page.waitForFunction(
        `document.querySelector('div#browser_popup') 
        && document.querySelector('div#browser_popup').style.visibility == 'visible'
        && document.querySelector('div#browser_popup').style.opacity == 1`,
      );

      /*
       * 未驗證 form
       * const phoneVerifyEl = await page.$('div#browser_popup');
       * await phoneVerifyEl?.screenshot({ path: `${this.screenshotPath}/notPhoneVerifyForm.png` });
       * #btnBrowser => 好
       * #btnLater => 下次再說
       */

      await Promise.all([
        page.click('#btnBrowser'),
        page.waitForNavigation(),
      ]);
    }

    private async captchaRecognize() : Promise<string> {
      const captchaEl = await this.page?.waitForSelector('img#captcha');
      const buffer = await captchaEl?.screenshot();

      const processImageBuffer = await this.imageProcessService.imageProcessing(buffer);

      const recognizeResult = await this.ocrService.recognize(processImageBuffer);

      return recognizeResult.data.text;
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

    async storeCookie(): Promise<void> {
      if (!this.page) {
        throw new Error('page not found');
      }

      const { page } = this;

      const cookies = await page.cookies();

      const globalSaveCookie = cookies.filter((cookie) => cookie.name === 'GlobalMyCard'
      || cookie.name === '.MyCardMemberLogin' || cookie.name === 'ASP.NET_SessionId');

      this.user.cookie = globalSaveCookie ? [...globalSaveCookie] : [];
    }
}

export default MyCard;
