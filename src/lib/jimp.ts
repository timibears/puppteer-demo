import Jimp from 'jimp';

export interface IImageProcess {
  imageProcessing: (buffer?: Buffer) => Promise<Buffer>
  readImageFromBuffer: (buffer: Buffer) => Promise<void>
  readImageFromPath: (path: string) => Promise<void>
  fillImageGap: () => Promise<void>
}

class JimpService implements IImageProcess {
  readonly whiteDecimal = 0xffffffff;

  readonly blackDecimal = 0x000000ff;

  image: Jimp | undefined

  async imageProcessing(buffer?: Buffer): Promise<Buffer> {
    if (!buffer) {
      throw new Error('buffer not exist');
    }
    await this.readImageFromBuffer(buffer);

    if (!this.image) {
      throw new Error('image not exist');
    }

    await this.image.invert();
    await this.fillImageGap();
    await this.image.scale(3);

    // writ to png image
    await this.image.writeAsync('./src/screenshot/captchaProcess.png');

    return this.image.getBufferAsync(Jimp.MIME_PNG);
  }

  async readImageFromBuffer(image: Buffer): Promise<void> {
    this.image = await Jimp.read(image);
  }

  async readImageFromPath(path: string): Promise<void> {
    this.image = await Jimp.read(path);
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
