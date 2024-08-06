import puppeteer, { Browser, Page } from 'puppeteer';

export interface IWebController {
    launchBroswer: () => Promise<Browser>,
    connectBroswer: (endpoint: string) => Promise<Browser>,
}

class PuppeteerService implements IWebController {
  launchBroswer(): Promise<Browser> {
    return puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
      ],
    });
  }

  connectBroswer(browserWSEndpoint: string): Promise<Browser> {
    return puppeteer.connect({
      browserWSEndpoint,
    });
  }
}

export default PuppeteerService;
