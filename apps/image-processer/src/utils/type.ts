export type ImageOptmizeType = {
  width: number;
  quality: number;
};

export type WithSrc<T> = T & { src: string };

export type MiniifyOptmizeType = {
  q: number;
  w: number;
};
