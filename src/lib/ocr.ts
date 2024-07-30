import {
  createScheduler, createWorker, Worker,
  RecognizeResult,
} from 'tesseract.js';

const scheduler = createScheduler();
let worker: Worker;

async function recognize(image: string) :Promise<RecognizeResult> {
  if (!worker) {
    worker = await createWorker('eng', 1);
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789',
    });
    scheduler.addWorker(worker);
  }

  return worker.recognize(image);
}

export default recognize;
