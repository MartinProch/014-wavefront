// Generates icon-192.png and icon-512.png using SVG → PNG via Resvg or sharp.
// Falls back to writing an SVG that can be used directly.
import { createCanvas } from 'node:canvas';
import { writeFileSync } from 'node:fs';

function drawIcon(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  const s = size;

  // Background
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, s, s);

  // Rounded corners mask
  const r = s * 0.18;
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(s - r, 0);
  ctx.quadraticCurveTo(s, 0, s, r);
  ctx.lineTo(s, s - r);
  ctx.quadraticCurveTo(s, s, s - r, s);
  ctx.lineTo(r, s);
  ctx.quadraticCurveTo(0, s, 0, s - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = '#0a0e17';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Background again after mask
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, s, s);

  // Elliott wave zigzag (W shape for impulse)
  const pts = [
    [0.08, 0.72],  // start (0)
    [0.25, 0.32],  // Ⅰ peak
    [0.35, 0.52],  // Ⅱ low
    [0.55, 0.18],  // Ⅲ peak (tallest)
    [0.65, 0.40],  // Ⅳ low
    [0.82, 0.25],  // Ⅴ peak
    [0.92, 0.58],  // after Ⅴ
  ].map(([x, y]) => [x * s, y * s]);

  // Gradient stroke
  const grad = ctx.createLinearGradient(pts[0][0], 0, pts[pts.length - 1][0], 0);
  grad.addColorStop(0, '#448aff');
  grad.addColorStop(0.5, '#00e5ff');
  grad.addColorStop(1, '#00e676');

  ctx.strokeStyle = grad;
  ctx.lineWidth = s * 0.055;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  pts.slice(1).forEach(p => ctx.lineTo(...p));
  ctx.stroke();

  // Dots at peaks
  [[0.25, 0.32], [0.55, 0.18], [0.82, 0.25]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x * s, y * s, s * 0.035, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd740';
    ctx.fill();
  });

  // "WF" monogram (small, bottom-right)
  const fs = Math.round(s * 0.14);
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.fillStyle = 'rgba(68,138,255,0.6)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('WF', s * 0.94, s * 0.94);

  return c.toBuffer('image/png');
}

try {
  writeFileSync('icon-192.png', drawIcon(192));
  writeFileSync('icon-512.png', drawIcon(512));
  console.log('Icons generated: icon-192.png, icon-512.png');
} catch (e) {
  console.error('canvas module not available:', e.message);
  process.exit(1);
}
