import { Command } from 'commander';
import MyCard from './lib/mycard';

const program = new Command();

program
  .name('puppteer-demo')
  .usage('');

program
  .command('s')
  .description('start puppteer');

program.parse(process.argv);

async function start() {
  const mycard = new MyCard();

  await mycard.login();
}

async function execute() {
  const { args } = program;
  const options = program.opts();

  if (args[0] === 's') {
    return start();
  }

  return program.help();
}

execute()
  .then(() => process.exit(0))
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
