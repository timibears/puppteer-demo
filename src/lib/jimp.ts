import Jimp from 'jimp';

export interface IImageProcess {
  imageProcessing: (path: string) => Promise<void>
  readImage: (path: string) => Promise<void>
  invertImage: () => Promise<void>
  fillImageGap: () => Promise<void>
}

class JimpService implements IImageProcess {
  readonly whiteDecimal = 0xffffffff;

  readonly blackDecimal = 0x000000ff;

  image: Jimp | undefined

  async imageProcessing(path: string): Promise<void> {
    await this.readImage(path);

    if (!this.image) {
      throw new Error('image not exist');
    }

    await this.invertImage();
    await this.fillImageGap();
    await this.image.scale(3);
    await this.image.writeAsync('./src/screenshot/captcha-process.png');
  }

  async readImage(path: string): Promise<void> {
    this.image = await Jimp.read(path);
  }

  async invertImage(): Promise<void> {
    if (!this.image) {
      throw new Error('image not exist');
    }

    await this.image.invert();
  }

  async fillImageGap(): Promise<void> {
    if (!this.image) {
      throw new Error('image not exist');
    }

    const { width, height } = this.image.bitmap;

    await this.image.scan(0, 0, width, height, (x, y) => {
      const color = this.image?.getPixelColor(x, y);
      if (color !== this.blackDecimal) {
        this.image?.setPixelColor(this.whiteDecimal, x, y);
      }
    });
  }
}

export default JimpService;
