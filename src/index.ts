import { Command } from 'commander';
import config from 'config';
import readline from 'readline/promises';
import MyCard from './lib/mycard';
import { IUser } from './entity/user';
import { LOG_IN_STATUS_ENUM } from './lib/enum';
import JimpService from './lib/jimp';
import TesseractService from './lib/tesseract';
import PuppeteerService from './lib/puppeteer';

const program = new Command();

program
  .name('puppteer-demo')
  .usage('');

program
  .command('s')
  .description('start puppteer');
program
  .command('c')
  .description('start cropper');
program
  .command('r')
  .description('start recognize');

program.parse(process.argv);

const read = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ocrService = new TesseractService();

async function start() {
  const me: IUser = {
    username: config.get('USER.USERNAME'),
    password: config.get('USER.PASSWORD'),
    logInStatus: LOG_IN_STATUS_ENUM.UNVERIFY,
    cookie: [],
  };

  const mycard = new MyCard(
    new PuppeteerService(),
    ocrService,
    new JimpService(),
    me,
  );

  try {
    await ocrService.initWorker();

    await mycard.login();

    const verifyCode = await read.question('phone verify code:');

    await mycard.storeCookie();

    await mycard.verifyPhoneCode(verifyCode);
  } catch (error) {
    console.log(error);
  }
}

async function crop() {
  const imageProcessService = new JimpService();

  await imageProcessService.readImageFromPath('./src/screenshot/captcha.png');
  await imageProcessService.fillImageGap();
}

async function recognize() {
  await ocrService.initWorker();
  const result = await ocrService.recognize('./src/screenshot/captcha-process.png');
  console.log(result);
}

async function execute() {
  const { args } = program;

  if (args[0] === 's') {
    return start();
  }

  if (args[0] === 'c') {
    return crop();
  }

  if (args[0] === 'r') {
    return recognize();
  }

  return program.help();
}

execute()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
