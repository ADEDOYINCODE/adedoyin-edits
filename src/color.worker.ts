import { dominantColors } from "./color";
self.onmessage = (event: MessageEvent<Uint8ClampedArray>) => {
  self.postMessage(dominantColors(event.data));
};
