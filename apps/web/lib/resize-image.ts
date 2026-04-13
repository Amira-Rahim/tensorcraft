export async function resizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image (JPEG, PNG, WebP, etc.)");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File must be smaller than 5MB");
  }

  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const SIZE = 256;
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Center-crop: use the largest centered square from the source
  const srcSize = Math.min(img.width, img.height);
  const srcX = (img.width - srcSize) / 2;
  const srcY = (img.height - srcSize) / 2;

  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to create image blob"));
        resolve(blob);
      },
      "image/webp",
      0.8,
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
