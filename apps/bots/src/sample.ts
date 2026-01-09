import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { file } from 'bun';
import { createZip, pushIntoWebsite } from './utils';

const downloadsDir = 'downloads';

async function run() {
  const entries = await readdir(downloadsDir).catch(() => []);

  for (const entry of entries) {
    const fullPath = join(downloadsDir, entry);
    const s = await stat(fullPath).catch(() => null);

    if (s && s.isDirectory()) {
      const id = parseInt(entry);
      if (isNaN(id)) continue;

      console.log(`\n--- Processing ID ${id} ---`);
      const dataJsonPath = join(fullPath, 'data.json');
      const dataFile = file(dataJsonPath);

      if (!(await dataFile.exists())) {
        console.log(`Skipping ${id}: No data.json found.`);
        continue;
      }

      let data: any;
      try {
        data = await dataFile.json();
      } catch (e) {
        console.error(`Error reading data.json for ${id}:`, e);
        continue;
      }

      const zipPath = join(fullPath, 'images.zip');
      const zipFile = file(zipPath);

      if (!(await zipFile.exists())) {
        console.log(`Zip missing for ${id}, checking images folder...`);
        const imagesDirPath = join(fullPath, 'images');
        const imagesDirStat = await stat(imagesDirPath).catch(() => null);

        if (imagesDirStat && imagesDirStat.isDirectory()) {
          const imageEntries = await readdir(imagesDirPath);
          const imageFiles = imageEntries
            .filter((f) => !f.startsWith('.'))
            .map((f) => join(imagesDirPath, f))
            .sort((a, b) => {
              // sort numerically if files are like 1.webp, 2.webp
              const getNum = (s: string) =>
                parseInt(s.split(/[\\/]/).pop()?.split('.')[0] || '0');
              return getNum(a) - getNum(b);
            });

          if (imageFiles.length > 0) {
            console.log(
              `Creating zip for ${id} with ${imageFiles.length} images...`,
            );
            await createZip(imageFiles, zipPath);
          } else {
            console.log(`Skipping ${id}: No images found in images/ folder.`);
            continue;
          }
        } else {
          console.log(
            `Skipping ${id}: Neither images.zip nor images/ folder found.`,
          );
          continue;
        }
      }

      // Check for cover.webp
      const coverPath = join(fullPath, 'cover.webp');
      if (!(await file(coverPath).exists())) {
        console.log(`Cover missing for ${id}, searching in images folder...`);
        const imagesDirPath = join(fullPath, 'images');
        const firstImagePath = join(imagesDirPath, '1.webp');
        if (await file(firstImagePath).exists()) {
          console.log(`Using first image as cover for ${id}...`);
          const coverBuffer = Buffer.from(
            await file(firstImagePath).arrayBuffer(),
          );
          await file(coverPath).write(coverBuffer);
        } else {
          console.log(
            `Skipping ${id}: No cover.webp and couldn't find 1.webp.`,
          );
          continue;
        }
      }

      try {
        console.log(`Uploading ID ${id} to website...`);
        // Use forward slashes for the base path as nhentai crawler logic seems to prefer it
        await pushIntoWebsite(id, fullPath.replace(/\\/g, '/'), data);
        console.log(`[Success] ID ${id} uploaded successfully.`);
      } catch (error) {
        console.error(`[Error] Error uploading ID ${id}:`, error);
      }
    }
  }
}

console.log('Starting manual upload process...');
run()
  .then(() => console.log('\nFinished processing all downloads.'))
  .catch(console.error);
