import { bmpToPbm } from './netpbm';
const jimp = require("jimp");
import { createSocket } from 'dgram';
import { isIPv4 } from 'net';
import { promisify } from './util';

export type Display = { leftIP: string, middleIP: string, rightIP: string, port: number };
export type Image = string | Buffer;

export function display(d: Display, i: Image): Promise<any> {
  return promisify(jimp.read.bind(jimp), i)
    .then((image: any) => {
      return image.resize(144, 120).rotate(90).background(0x00000000).greyscale().invert().contrast(0.1);
    }).then((image: any) => promisify(image.getBuffer.bind(image), jimp.MIME_BMP))
    .then((bmpBuffer: Buffer) => {
      const pbmImage = bmpToPbm(bmpBuffer);
      const pbmBuffer = pbmImage.pixelData;

      const socket = createSocket(isIPv4(d.leftIP) ? 'udp4' : 'udp6');

      return Promise.all([
        new Promise((res, rej) => socket.send(pbmBuffer.slice(0, 720), d.port, d.leftIP, (err) => err ? rej(err) : res('Left Send'))),
        new Promise((res, rej) => socket.send(pbmBuffer.slice(720, 2 * 720), d.port, d.middleIP, (err) => err ? rej(err) : res('Middle Send'))),
        new Promise((res, rej) => socket.send(pbmBuffer.slice(2 * 720, 3 * 720), d.port, d.rightIP, (err) => err ? rej(err) : res('Right Send')))
      ]);
    });
}


