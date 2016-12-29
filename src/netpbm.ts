import { groupArray, sum } from './util';

class PbmImage {
  constructor(readonly header: Buffer, readonly pixelData: Buffer) {
  }

  get image(): Buffer {
    return Buffer.concat([this.header, this.pixelData]);
  }
}

export function bmpToPbm(bmpFile: Buffer): PbmImage {
  const bpp = bmpFile.readInt16LE(0x1c); // bits per pixel
  const imageWidth = bmpFile.readInt32LE(0x12);
  const imageHeight = bmpFile.readInt32LE(0x16);
  const pixelDataOffset = bmpFile.readInt32LE(0xa);

  const bmpPixels = bmpFile.slice(pixelDataOffset);

  return new PbmImage(Buffer.from(`P4\n${imageWidth} ${imageHeight}\n`), bmpPixelsToPbmBytes(bmpPixels, bpp, imageWidth));
}

function bmpPixelsToPbmBytes(bmpPixels: Buffer, bpp: number, imageWidth: number): Buffer {
  if (bmpPixels.length <= 0) return Buffer.from([]);

  // each pixel line in a BMP image is padded with useless bytes to have a length which is a multiple of the DWORD length (4 bytes)
  const paddedLineLength = Math.floor((bpp * imageWidth + 31) / 32) * 4;

  const currLineSourceBytes = Array.from(bmpPixels.slice(0, (bpp / 8) * imageWidth).values());
  // group the source bytes to arrays containing the bytes for one image pixel in the source and reduce them by converting the brightness of the source pixel to binary pixel value in the result
  const currLinePixelValues = groupArray(currLineSourceBytes, bpp / 8).map((pixelBytes: number[]) => {
    const brightness = sum(pixelBytes) / (3 * (bpp / 8));

    // in PBM 0 is white and 1 is black
    return <(0|1)>(brightness < (0.7 * (255 / 3)) ? 1 : 0);
  });

  // merge 8 pixel values into one byte of the result image
  const currLineBytes = Buffer.from(groupArray(currLinePixelValues, 8).map(eightBits => eightBits.reduce((acc, curr) => (acc << 1) + curr, 0)));

  const remainingImage = bmpPixelsToPbmBytes(bmpPixels.slice(paddedLineLength), bpp, imageWidth);

  // because the lines of the image are listed from bottom to top in BMP, the remaining image is prepended to the current line
  return Buffer.concat([remainingImage, currLineBytes]);
}
