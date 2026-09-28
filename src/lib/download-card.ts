/**
 * Renders a FlowLens SVG score card to a high-resolution PNG and downloads it.
 * Done in the browser so the card uses the viewer's fonts and emoji.
 */
export async function downloadCardPng(svgUrl: string, filename: string, scale = 3): Promise<void> {
  const res = await fetch(svgUrl);
  if (!res.ok) throw new Error("Couldn't load the card image");
  const svgBlob = new Blob([await res.text()], { type: "image/svg+xml" });
  const svgObjectUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Couldn't render the card image"));
      img.src = svgObjectUrl;
    });

    const width = img.naturalWidth || 480;
    const height = img.naturalHeight || 230;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);

    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png")
    );

    const pngUrl = URL.createObjectURL(png);
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  } finally {
    URL.revokeObjectURL(svgObjectUrl);
  }
}
