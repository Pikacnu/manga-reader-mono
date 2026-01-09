import { file } from 'bun';
import JSZip from 'jszip';
import { TagType } from '../functions/type';
import { ServerURL } from './config';
import { fetchWithSignature } from './fetch';

export async function createZip(files: string[], outputPath: string) {
  const zip = new JSZip();
  for (const filePath of files) {
    const imageData = await file(filePath).arrayBuffer();
    zip.file(filePath.split('/').pop() || 'image.webp', imageData);
  }
  const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
  await file(outputPath).write(zipContent);
}

export async function pushIntoWebsite(
  bookId: number,
  basePath: string,
  bookInfo: {
    tag: Record<TagType, { name: string }[]>;
    title: string;
  },
) {
  const { tag, title } = bookInfo;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
    throw new Error('Request timed out');
  }, 5 * 60 * 1000);
  const createBookRes = await fetchWithSignature(
    `${ServerURL}/api/ingest/create_book`,
    {
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({
        title,
        author: tag[TagType.Artists].map((t) => t.name).join(', ') || 'Unknown',
        description: 'Uploaded by crawler bot',
        tags: tag[TagType.Tags].map((t) => t.name),
      }),
    },
  );
  clearTimeout(timeout);
  if (!createBookRes.ok) {
    const errorText = await createBookRes.text();
    console.error(
      `Failed to push book ${bookId}: ${createBookRes.statusText} - ${errorText}`,
    );

    throw new Error(`Failed to push book ${bookId}`);
  }
  const { bookId: newBookId } = (await createBookRes.json()) as {
    bookId: number;
  };
  console.log(
    `Successfully pushed book ${bookId} metadata to website. New ID: ${newBookId}`,
  );

  const coverFilePath = `${basePath}/cover.webp`;

  const coverBuffer = Buffer.from(await file(coverFilePath).arrayBuffer());

  const coverTimeout = setTimeout(() => {
    controller.abort();
  }, 5 * 60 * 1000);
  const uploadCoverRes = await fetchWithSignature(
    `${ServerURL}/api/ingest/upload_book_cover?bookId=${newBookId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'image/webp',
      },
      signal: controller.signal,
      body: coverBuffer,
    },
  );
  if (!uploadCoverRes.ok) {
    console.error(
      `Failed to upload cover for book ${bookId} (New ID: ${newBookId}): ${uploadCoverRes.statusText}`,
    );
    throw new Error(`Failed to upload cover for book ${bookId}`);
  }
  //console.log(`Successfully uploaded cover for book ${bookId}.`);
  clearTimeout(coverTimeout);

  // Upload chapter (zip)

  const zipFilePath = `${basePath}/images.zip`;
  const zipBuffer = Buffer.from(await file(zipFilePath).arrayBuffer());

  const zipTimeout = setTimeout(() => {
    controller.abort();
  }, 5 * 60 * 1000);

  const uploadRes = await fetchWithSignature(
    `${ServerURL}/api/ingest/upload_chapter_image?bookId=${newBookId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/zip',
      },
      signal: controller.signal,
      body: zipBuffer,
    },
  );
  if (!uploadRes.ok) {
    console.error(
      `Failed to upload chapter for book ${bookId}: ${uploadRes.statusText}`,
    );
    throw new Error(`Failed to upload chapter for book ${bookId}`);
  }
  clearTimeout(zipTimeout);

  //console.log(`Successfully uploaded chapter for book ${bookId}.`);
}
