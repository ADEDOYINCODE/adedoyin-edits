import { hsl } from "./color";
export async function mediaColor(
  blob: Blob,
): Promise<{ color: string; tag: string }> {
  if (!blob.type.startsWith("image/"))
    return { color: "#929C84", tag: "video" };
  let bitmap: ImageBitmap | undefined;
  let worker: Worker | undefined;
  try {
    bitmap = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = 80;
    c.height = Math.max(1, Math.round((bitmap.height / bitmap.width) * 80));
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    worker = new Worker(new URL("./color.worker.ts", import.meta.url), {
      type: "module",
    });
    const colors = await new Promise<string[]>((resolve, reject) => {
      worker!.onmessage = (e) => resolve(e.data);
      worker!.onerror = reject;
      worker!.postMessage(
        c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data,
      );
    });
    const color =
      colors.find((c) => {
        const [, s, l] = hsl(c);
        return s > 0.25 && l > 0.15 && l < 0.9;
      }) ||
      colors[0] ||
      "#929C84";
    const [h, s, l] = hsl(color);
    const tag =
      l < 0.12
        ? "black"
        : l > 0.9
          ? "white"
          : s < 0.15
            ? "neutral"
            : h < 20 || h >= 345
              ? "red"
              : h < 45
                ? "orange"
                : h < 75
                  ? "yellow"
                  : h < 165
                    ? "green"
                    : h < 195
                      ? "cyan"
                      : h < 265
                        ? "blue"
                        : h < 300
                          ? "purple"
                          : "pink";
    return { color, tag };
  } catch {
    return { color: "#929C84", tag: "neutral" };
  } finally {
    bitmap?.close();
    worker?.terminate();
  }
}
