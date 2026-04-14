import { toPng } from "html-to-image";

export async function captureElementToPngBlob(
  element: HTMLElement,
  options?: { backgroundColor?: string }
): Promise<Blob> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: options?.backgroundColor ?? "#fafaf9",
  });
  const response = await fetch(dataUrl);
  return response.blob();
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
