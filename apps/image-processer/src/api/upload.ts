import { file, randomUUIDv7 } from 'bun';
import { mkdir, rename } from 'node:fs/promises';
import sharp from 'sharp';
import unzipper from 'unzipper';
import db from '../utils/db';
import { ImageIdLink } from '../../db/schema';
import { UPLOADS_DIR } from '../utils/config';

function isValidImageType(type: string): boolean {
  const validImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/octet-stream',
  ];
  return validImageTypes.includes(type);
}

function validateFile(file: File): boolean {
  return file.size > 0 && isValidImageType(file.type);
}

export enum AcceptJsonRequestFormat {
  BASE64 = 'base64',
  BINARY = 'binary',
}

export async function POST(request: Request): Promise<Response> {
  const requestUUID = randomUUIDv7();
  let zippFileUUID: string | null = null;

  console.log(`Processing upload request: ${requestUUID}`);

  let contentType = request.headers.get('Content-Type');
  const contentEncoding = request.headers.get('Content-Encoding');
  const acceptEncoding = request.headers.get('Accept-Encoding');

  if (!contentType) {
    switch (true) {
      case ['zip', 'gzip'].some((ct) => contentEncoding?.includes(ct)):
        contentType = 'application/zip';
        break;
      case ['zip', 'gzip'].some((ct) => acceptEncoding?.includes(ct)):
        contentType = 'application/zip';
        break;
      case request.headers.get('Content-Length') !== null:
        contentType = 'application/octet-stream';
        break;
      default:
        return Response.json(
          { error: 'Content-Type header is missing', requestId: requestUUID },
          { status: 400 },
        );
    }
  }

  try {
    let files: File[] | null = null;
    switch (true) {
      case contentType.startsWith('multipart/form-data'): {
        const formData = await request.formData();
        files = formData.getAll('file') as File[];
        if (!files || files.length === 0) {
          return Response.json(
            { error: 'No files uploaded', requestId: requestUUID },
            { status: 400 },
          );
        }
        break;
      }

      case contentType === 'application/octet-stream': {
        const arrayBuffer = await request.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        files = [
          new File([uint8Array], 'upload', {
            type: 'application/octet-stream',
          }),
        ];
        break;
      }
      case contentType.startsWith('image/'): {
        const arrayBuffer = await request.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const extension = contentType.split('/')[1];
        files = [
          new File([uint8Array], `upload.${extension}`, {
            type: contentType,
          }),
        ];
        break;
      }

      case contentType === 'json': {
        const json = (await request.json()) as {
          fileData: string;
          fileName: string;
          fileType: string;
          format: AcceptJsonRequestFormat;
        };
        if (
          !json.fileData ||
          !json.fileName ||
          !json.fileType ||
          !json.format ||
          [
            AcceptJsonRequestFormat.BASE64,
            AcceptJsonRequestFormat.BINARY,
          ].indexOf(json.format) === -1
        ) {
          return Response.json(
            { error: 'Invalid JSON payload', requestId: requestUUID },
            { status: 400 },
          );
        }
        let fileDataBuffer: Uint8Array;
        if (json.format === AcceptJsonRequestFormat.BASE64) {
          const binaryString = atob(json.fileData);
          const len = binaryString.length;
          fileDataBuffer = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            fileDataBuffer[i] = binaryString.charCodeAt(i);
          }
        } else {
          fileDataBuffer = Uint8Array.from(
            JSON.parse(json.fileData) as number[],
          );
        }
        files = [
          new File([fileDataBuffer], json.fileName, { type: json.fileType }),
        ];
        break;
      }

      case [
        'application/x-zip-compressed',
        'application/zip',
        'application/gzip',
      ].includes(contentType): {
        console.log('Processing ZIP file upload');
        files = await Promise.all(
          (
            await unzipper.Open.buffer(Buffer.from(await request.arrayBuffer()))
          ).files.map(async (entry) => {
            return new File([await entry.buffer()], entry.path, {
              type: 'application/octet-stream',
            });
          }),
        );
        zippFileUUID = randomUUIDv7();
        break;
      }

      default:
        return Response.json(
          { error: 'Unsupported Content-Type', requestId: requestUUID },
          { status: 415 },
        );
    }

    if (
      !files ||
      files.length === 0 ||
      files.some((file) => !validateFile(file))
    ) {
      return Response.json(
        { error: 'Invalid file uploaded', requestId: requestUUID },
        { status: 400 },
      );
    }

    const fileData: [File, string][] = files.map((file) => [
      file,
      randomUUIDv7(),
    ]);

    db.transaction(async () => {
      const imagesFiles = await Promise.all(
        fileData.map(async ([fileItem, id]) => {
          const dirPath = `${UPLOADS_DIR}/${requestUUID}`;
          await mkdir(dirPath, { recursive: true });
          const filePath = `${dirPath}/${fileItem.name}`;
          const tempFilePath = `${filePath}.tmp`;

          await file(tempFilePath).write(
            await sharp(await fileItem.arrayBuffer())
              .webp()
              .toBuffer(),
          );

          // Atomic move
          await rename(tempFilePath, filePath);

          return [filePath, id];
        }),
      );
      await db.insert(ImageIdLink).values(
        imagesFiles.map(([filePath, id]) => ({
          id: id as string,
          filePath: filePath as string,
          ...(zippFileUUID ? { zipFileId: zippFileUUID } : {}),
        })),
      );
      console.log(
        `Successfully processed and stored ${imagesFiles.length} files for request ${requestUUID}`,
      );
    });
    return Response.json(
      {
        message: 'Files uploaded successfully',
        requestId: requestUUID,
        imageIds: fileData.map(([, id]) => id),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`Error processing upload request ${requestUUID}:`, error);
    return Response.json(
      {
        error: 'Error processing upload',
        requestId: requestUUID,
      },
      { status: 500 },
    );
  } finally {
    console.log(`Finished processing upload request: ${requestUUID}`);
  }
}

export default {
  POST,
};
