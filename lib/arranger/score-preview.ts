/** Rasteriza só a página 1 do PDF da grade para JPEG (até ~1,5 MB). */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const MAX_BYTES = 1_800_000;

export async function renderScorePreview(file: File): Promise<Blob> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data, useSystemFonts: true });

  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2.2, MAX_EDGE / Math.max(base.width, base.height));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível gerar a prévia da grade.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, canvasContext: context, viewport }).promise;

    let quality = JPEG_QUALITY;
    let blob = await canvasToJpeg(canvas, quality);
    while (blob.size > MAX_BYTES && quality > 0.45) {
      quality -= 0.1;
      blob = await canvasToJpeg(canvas, quality);
    }
    if (blob.size > MAX_BYTES) {
      throw new Error("A prévia da grade ficou grande demais. Tente um PDF com página menor.");
    }
    await pdf.cleanup();
    return blob;
  } catch (error) {
    if (error instanceof Error) {
      if (/password|encrypted/i.test(error.message)) {
        throw new Error("A grade está protegida por senha. Envie um PDF sem proteção.");
      }
      if (
        error.message.startsWith("Não foi possível") ||
        error.message.startsWith("A prévia")
      ) {
        throw error;
      }
    }
    throw new Error("Não foi possível abrir a grade. Envie um PDF válido da primeira página.");
  } finally {
    await loadingTask.destroy();
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível gerar a prévia da grade."));
      },
      "image/jpeg",
      quality,
    );
  });
}
