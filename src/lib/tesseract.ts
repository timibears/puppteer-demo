import {
  createScheduler, createWorker, Worker,
  RecognizeResult, Scheduler,
} from 'tesseract.js';

export interface IOcr {
  recognize: (image: Buffer | string) => Promise<RecognizeResult>
}

class TesseractService implements IOcr {
  private scheduler: Scheduler

  private worker: Worker|undefined

  constructor() {
    this.scheduler = createScheduler();
  }

  async initWorker(): Promise<void> {
    if (this.worker) {
      return;
    }

    this.worker = await createWorker('eng', 1, {
      langPath: './src/lib/data',
      cacheMethod: 'none',
      gzip: false,
    });

    await this.worker.setParameters({
      tessedit_char_whitelist: '0123456789',
    });

    this.scheduler.addWorker(this.worker);
  }

  async recognize(image: Buffer | string): Promise<RecognizeResult> {
    if (this.worker === undefined) {
      throw new Error('worker not init');
    }

    return this.worker.recognize(image);
  }
}

export default TesseractService;
