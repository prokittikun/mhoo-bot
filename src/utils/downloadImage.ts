import axios from "axios";
import * as fs from "fs";
import path from "path";
import * as imageSize from "image-size";
import * as Jimp from "jimp";
import stream from "stream";

async function convertToPng(
  inputImagePath: string,
  outputImagePath: string
): Promise<void> {
  try {
    const image = await Jimp.read(inputImagePath);
    await image.writeAsync(outputImagePath);
    console.log(`Image converted to PNG: ${outputImagePath}`);
  } catch (error) {
    console.error("Error converting image:", error);
  }
}

export async function downloadImage(
  url: string,
  destinationPath: string,
  imageName: string
): Promise<boolean> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const imageType = response.headers["content-type"].split("/")[1];
    if (!imageType) {
      throw new Error("Unable to determine image type.");
    }

    const destinationWithExtension = path.join(
      __dirname,
      `${destinationPath}${imageName}.png`
    );

    // Create a readable stream from the buffered data
    const imageBuffer = Buffer.from(response.data, "binary");
    const readableStream = new stream.PassThrough();
    readableStream.end(imageBuffer);

    // Create a temporary file
    const tempFilePath = `${destinationWithExtension}.temp`;

    // Pipe the readable stream to both sharp and the temporary file stream
    await new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(tempFilePath);
      readableStream.pipe(fileStream);
      fileStream.on("finish", async () => {
        try {
          // Use sharp on the temporary file
          await convertToPng(tempFilePath, destinationWithExtension);
          // Delete the temporary file
          fs.unlinkSync(tempFilePath);
          resolve(true);
        } catch (sharpError) {
          reject(sharpError);
        }
      });
      fileStream.on("error", reject);
    });

    return true;
  } catch (error: any) {
    throw new Error(
      `Failed to download image from URL: ${url}. Error: ${error.message}`
    );
  }
}
