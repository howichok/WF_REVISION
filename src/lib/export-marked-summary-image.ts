import { toPng } from "html-to-image";

/** Convert a base64 data URL to a Blob without using fetch() (avoids browser security blocks on data: URLs). */
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(0, comma);
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/png";
  const b64 = dataUrl.slice(comma + 1);
  const bytes = atob(b64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    buf[i] = bytes.charCodeAt(i);
  }
  return new Blob([buf], { type: mime });
}

export async function captureElementToPngBlob(
  element: HTMLElement,
  options?: { backgroundColor?: string }
): Promise<Blob> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: options?.backgroundColor ?? "#fafaf9",
  });
  return dataUrlToBlob(dataUrl);
}

export async function downloadPng(
  element: HTMLElement,
  filename: string,
  options?: { backgroundColor?: string }
): Promise<void> {
  const blob = await captureElementToPngBlob(element, options);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function sharePngOrDownload(
  element: HTMLElement,
  filename: string,
  options?: { backgroundColor?: string }
): Promise<"shared" | "downloaded"> {
  const blob = await captureElementToPngBlob(element, options);
  const file = new File([blob], filename, { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Marked paper summary",
      text: "Exam marking summary",
    });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
