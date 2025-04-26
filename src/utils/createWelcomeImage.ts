import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import Jimp from "jimp";
import axios from "axios";
import { PNG } from "pngjs";
import sharp from "sharp";
import { s3 } from "./S3-Client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { readFileSync } from "fs";

async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary");
}

async function convertWebpToBuffer(inputImagePath: string): Promise<Buffer> {
  try {
    const imageBuffer = await downloadImage(inputImagePath);

    // Convert WebP to PNG using sharp
    const pngBuffer = await sharp(imageBuffer).toFormat("png").toBuffer();

    return pngBuffer;
  } catch (error) {
    console.error("Error downloading or converting image:", error);
    throw error;
  }
}

async function createCircularImageWithFrame(
  inputImagePath: string
): Promise<Buffer> {
  try {
    const pngBuffer = await convertWebpToBuffer(inputImagePath);
    const image = await Jimp.read(pngBuffer);
    const frame = await Jimp.read(
      path.join(__dirname, "../../public/assets/background/frame.png")
    );
    const width = frame.getWidth();
    const height = frame.getHeight();
    image.resize(width, height);
    // frame.resize(width, height);

    const radius = Math.min(width, height) / 2;
    console.log("radius: ", radius);

    image.circle({
      radius: radius,
      x: width / 2,
      y: height / 2,
    });

    image.blit(frame, 0, 0);

    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

    return buffer;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function createWelcomeImage(
  memberProfile: string,
  displayName: string,
  joinImageName: string,
  outputPath?: string
): Promise<Buffer> {
  // const image1 = loadImage(memberProfile);
  return await new Promise(async (resolve, reject) => {
    try {
      const canvasWidth = 1024;
      const canvasHeight = 500;

      const canvas = createCanvas(canvasWidth, canvasHeight);
      registerFont(
        path.join(__dirname, "../../public/fonts/Kanit/Kanit-Bold.ttf"),
        {
          family: "Kanit Bold",
        }
      );
      registerFont(
        path.join(__dirname, "../../public/fonts/Kanit/Kanit-ExtraBold.ttf"),
        {
          family: "Kanit ExtraBold",
        }
      );

      const context = canvas.getContext("2d");
      const backgroundS3 = await s3.send(
        new GetObjectCommand({
          Bucket: "banner-mhoo-bot",
          Key: joinImageName,
        })
      );
      const stream = backgroundS3.Body as Readable;
      const background = await loadImage(Buffer.concat(await stream.toArray()));
      context.drawImage(background, 0, 0, canvas.width, canvas.height);
      var canvasCenterX = canvasWidth / 2;
      var canvasCenterY = canvasHeight / 2;
      const circularImageBuffer = await createCircularImageWithFrame(
        memberProfile
      );
      const circularImage = await loadImage(circularImageBuffer);
      const circularImageWidth = circularImage.width;
      const circularImageHeight = circularImage.height;
      context.drawImage(
        circularImage,
        canvasCenterX - circularImageWidth / 2,
        canvasCenterY - 70 - circularImageHeight / 2,
        circularImage.width,
        circularImage.height
      );
      // draw text
      context.font = "80px Kanit ExtraBold";
      context.fillStyle = "white";
      context.textAlign = "center";
      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 5;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.fillText("WELCOME!", canvasCenterX, canvasCenterY + 110);

      context.font = "45px Kanit ExtraBold";
      context.fillStyle = "white";
      context.textAlign = "center";
      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 5;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.fillText(displayName, canvasCenterX, canvasCenterY + 150);

      const fileContent = readFileSync("verbs.txt", "utf-8");
      const words = fileContent
        .split("\n")
        .map((word) => word.trim())
        .filter((word) => word.length > 0);

      const randomWord = words[Math.floor(Math.random() * words.length)];
      context.font = "45px Kanit ExtraBold";
      context.fillStyle = "white";
      context.textAlign = "center";
      context.shadowColor = "rgba(0, 0, 0, 0.5)";
      context.shadowBlur = 5;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;
      context.fillText(
        `พี่ดอมต้องการ "${randomWord}" คุณ`,
        canvasCenterX,
        canvasCenterY + 190
      );

      const buffer = canvas.toBuffer("image/png");
      resolve(buffer);
    } catch (error) {
      console.error("Error in mergeImages:", error);
      reject(error);
    }
    // const fs = require("fs");
    // const out = fs.createWriteStream(outputPath);
    // const stream = canvas.createPNGStream();
    // stream.pipe(out);
    // out.on("finish", () => {
    //   console.log("The image was created successfully.");
    //   resolve(true);
    // });
    // out.on("error", (err: any) => {
    //   console.error("Error creating image:", err);
    //   reject(false);
    // });
  });
}

// mergeImages(
//   "https://cdn.discordapp.com/avatars/1074351181842894889/2f8a376ebccf8aae8012d185cb1c67e2.webp",
//   "1708053988391.png",
//   path.join(__dirname, "../../public/assets/background/erase.png")
// );
