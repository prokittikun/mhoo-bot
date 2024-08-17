import { s3 } from '../src/utils/S3-Client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const data = async ()  => {
    //load image from public asset to buffer
    const image = fs.readFileSync(path.join(__dirname, "./public/assets/background/frame.png"));
    //image to buffer
    const buffer = Buffer.from(image);
    return await s3.send(
        new PutObjectCommand({
          Bucket: "banner-mhoo-bot",
          Key: "test.png",
          Body: image,
        }),
      );
}

data().then((res) => {
    console.log(res);
}).catch((err) => {
    console.log(err);
})