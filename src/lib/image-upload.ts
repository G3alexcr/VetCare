// Helper to convert any image file from the computer to an optimized Base64 Data URL
// Resized via HTML5 Canvas to keep database payload lightweight (~100-250KB) while maintaining crisp HD quality.

export function fileToBase64DataUrl(file: File, maxDim = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("El archivo seleccionado no es una imagen válida"));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Error al leer el archivo desde el disco"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("No se pudo inicializar el procesador de imágenes"));
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG base64 (or PNG if original was transparent PNG/SVG/logo)
        const format = file.type === "image/png" && (img.width < 800 && img.height < 800) ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("No se pudo decodificar el formato de imagen"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// Format base64 size indicator for user feedback
export function getBase64SizeKb(dataUrl: string): number {
  if (!dataUrl || !dataUrl.startsWith("data:")) return 0;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return 0;
  const b64 = dataUrl.slice(comma + 1);
  const bytes = Math.floor((b64.length * 3) / 4);
  return Math.round(bytes / 1024);
}
