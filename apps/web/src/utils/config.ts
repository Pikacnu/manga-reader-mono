export const imageServerURL = process.env.IMAGE_SERVER_URL || '';
export const isWarpedImageServer = imageServerURL.length > 0;
export const IMAGE_SERVER_API_KEY =
  process.env.IMAGE_SERVER_API_KEY || 'default_image_server_key';
