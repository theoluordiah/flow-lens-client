/**
 * Renders a FlowLens SVG score card to a high-resolution PNG and downloads it.
 * Done in the browser so the card uses the viewer's fonts and emoji.
 */
export async function downloadCardPng(svgUrl: string, filename: string, scale = 3): Promise<void> {
  // no-store: the <img> preview may have cached this response without CORS headers,
  // and reusing that cached copy would make the fetch fail.
  const res = await fetch(svgUrl, { cache: "no-store", mode: "cors" });
  if (!res.ok) throw new Error(`Couldn't load the card image (HTTP ${res.status})`);
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

    savePng(png, filename);
  } finally {
    URL.revokeObjectURL(svgObjectUrl);
  }
}

function savePng(png: Blob, filename: string): void {
  const pngUrl = URL.createObjectURL(png);
  const link = document.createElement("a");
  link.href = pngUrl;
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
}

export interface PlayerCardData {
  displayName: string;
  username: string;
  avatarUrl?: string;
  tierLabel: string;
  tierColor: string;
  overall: number;
  position: string;
  archetype: string;
  tagline: string;
  quote: string;
  attributes: { label: string; value: number }[];
  traits: { label: string; value: string }[];
  playstyles: string[];
}

const FONT = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

function loadAvatar(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    // GitHub avatars send CORS headers; without crossOrigin the canvas would be tainted.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

/** Draws the dashboard player card straight onto a canvas and downloads it as a PNG. */
export async function downloadPlayerCardPng(card: PlayerCardData, filename: string, scale = 3): Promise<void> {
  const W = 640;
  const H = 384;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");
  ctx.scale(scale, scale);

  const avatar = await loadAvatar(card.avatarUrl);
  const text = "#e6edf3";
  const soft = "#c9d1d9";
  const muted = "#8b949e";
  const track = "#21262d";

  // Frame with tier-colored top strip and border
  ctx.beginPath();
  ctx.roundRect(0.5, 0.5, W - 1, H - 1, 14);
  ctx.fillStyle = "#0d1117";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = card.tierColor;
  ctx.fillRect(0, 0, W, 4);
  ctx.restore();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = card.tierColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Header
  ctx.font = `700 12px ${FONT}`;
  ctx.fillStyle = card.tierColor;
  ctx.fillText(card.tierLabel, 28, 36);
  ctx.font = `500 12px ${FONT}`;
  ctx.fillStyle = muted;
  ctx.textAlign = "right";
  ctx.fillText(`${card.position} · ${card.archetype}`, W - 28, 36);
  ctx.textAlign = "left";

  // Avatar
  const ax = 28;
  const ay = 58;
  const as = 76;
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax + as / 2, ay + as / 2, as / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    ctx.drawImage(avatar, ax, ay, as, as);
  } else {
    ctx.fillStyle = track;
    ctx.fillRect(ax, ay, as, as);
    ctx.fillStyle = text;
    ctx.font = `700 30px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(card.username[0]?.toUpperCase() ?? "?", ax + as / 2, ay + as / 2 + 11);
    ctx.textAlign = "left";
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(ax + as / 2, ay + as / 2, as / 2 + 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = card.tierColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Identity
  const nameX = ax + as + 18;
  ctx.fillStyle = text;
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText(fitText(ctx, card.displayName, 330), nameX, 88);
  ctx.fillStyle = muted;
  ctx.font = `400 13px ${FONT}`;
  ctx.fillText(`@${card.username}`, nameX, 110);
  ctx.fillStyle = card.tierColor;
  ctx.font = `600 12px ${FONT}`;
  ctx.fillText(card.tagline, nameX, 130);

  // Overall rating ring
  const cx = W - 76;
  const cy = 96;
  const r = 44;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.strokeStyle = track;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = card.tierColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.min(card.overall, 99) / 99) * Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.textAlign = "center";
  ctx.fillStyle = text;
  ctx.font = `800 34px ${FONT}`;
  ctx.fillText(String(card.overall), cx, cy + 10);
  ctx.fillStyle = muted;
  ctx.font = `500 10px ${FONT}`;
  ctx.fillText("/99", cx, cy + 26);
  ctx.textAlign = "left";

  // Quote
  ctx.fillStyle = soft;
  ctx.font = `italic 400 13px ${FONT}`;
  ctx.fillText(fitText(ctx, `“${card.quote}”`, W - 56), 28, 170);

  const divider = (y: number) => {
    ctx.fillStyle = track;
    ctx.fillRect(28, y, W - 56, 1);
  };
  divider(188);

  // Attribute bars in two columns
  const colW = (W - 56 - 32) / 2;
  card.attributes.forEach((a, i) => {
    const x = 28 + (i % 2) * (colW + 32);
    const y = 216 + Math.floor(i / 2) * 28;
    ctx.fillStyle = soft;
    ctx.font = `700 11px ${FONT}`;
    ctx.fillText(a.label, x, y);
    const barX = x + 104;
    const barW = colW - 104 - 32;
    ctx.fillStyle = track;
    ctx.beginPath();
    ctx.roundRect(barX, y - 8, barW, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = card.tierColor;
    ctx.beginPath();
    ctx.roundRect(barX, y - 8, Math.max(7, (a.value / 99) * barW), 7, 3.5);
    ctx.fill();
    ctx.fillStyle = text;
    ctx.font = `700 12px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(String(a.value), x + colW, y);
    ctx.textAlign = "left";
  });

  divider(296);

  // Traits row
  let tx = 28;
  for (const t of card.traits) {
    const label = t.label.toUpperCase();
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = muted;
    ctx.fillText(label, tx, 320);
    tx += ctx.measureText(label).width + 6;
    ctx.font = `700 11px ${FONT}`;
    ctx.fillStyle = text;
    ctx.fillText(t.value, tx, 320);
    tx += ctx.measureText(t.value).width + 20;
  }

  // Playstyle pills + brand
  let px = 28;
  ctx.font = `700 10px ${FONT}`;
  for (const p of card.playstyles) {
    const label = p.toUpperCase();
    const w = ctx.measureText(label).width + 20;
    ctx.fillStyle = track;
    ctx.beginPath();
    ctx.roundRect(px, 336, w, 24, 12);
    ctx.fill();
    ctx.fillStyle = soft;
    ctx.fillText(label, px + 10, 352);
    px += w + 8;
  }
  ctx.textAlign = "right";
  ctx.fillStyle = text;
  ctx.font = `700 13px ${FONT}`;
  ctx.fillText("FlowLens", W - 28, 352);
  ctx.textAlign = "left";

  const png = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png")
  );
  savePng(png, filename);
}
