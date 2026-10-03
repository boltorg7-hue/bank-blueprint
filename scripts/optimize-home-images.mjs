import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "src/assets/home");
const outputDir = path.join(root, "public/images/home");

const images = [
  { name: "woodbrook", widths: [480, 768, 1024, 1280] },
  { name: "savannah", widths: [320, 480, 640, 960] },
  { name: "maracas", widths: [320, 480, 640, 960] },
];

const formats = [
  { extension: "avif", quality: 52 },
  { extension: "webp", quality: 78 },
  { extension: "jpg", quality: 82 },
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const image of images) {
  const input = path.join(sourceDir, `${image.name}.jpg`);

  await Promise.all(
    formats.flatMap(({ extension, quality }) =>
      image.widths.map(async (width) => {
        const output = path.join(outputDir, `${image.name}-${width}w.${extension}`);
        const pipeline = sharp(input)
          .rotate()
          .resize({ width, withoutEnlargement: true });

        if (extension === "avif") {
          await pipeline.avif({ quality, effort: 4 }).toFile(output);
        } else if (extension === "webp") {
          await pipeline.webp({ quality, effort: 5 }).toFile(output);
        } else {
          await pipeline.jpeg({ quality, progressive: true, mozjpeg: true }).toFile(output);
        }
      }),
    ),
  );
}

console.log(`Optimized ${images.length} homepage photos into AVIF/WebP/JPEG responsive variants.`);