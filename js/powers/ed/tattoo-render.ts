import { TATTOO_HEIGHT, TATTOO_STENCIL, TATTOO_WIDTH, type TattooGame, type TattooPoint } from './tattoo-game.js';

export function drawTattooGame(context: CanvasRenderingContext2D, game: TattooGame, cursor: TattooPoint | null, needleDown: boolean, now: number): void {
  context.clearRect(0, 0, TATTOO_WIDTH, TATTOO_HEIGHT);
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#162e28'; context.fillRect(0, 0, 420, 320);
  context.fillStyle = '#203e34';
  for (let x = 0; x < 420; x += 24) for (let y = 0; y < 320; y += 24) context.fillRect(x, y, 22, 22);
  // A client reclining in the chair, with their forearm on the padded armrest.
  context.fillStyle = '#0b1515'; context.fillRect(18, 58, 96, 240);
  context.fillStyle = '#658876'; context.fillRect(20, 292, 96, 6);
  context.fillStyle = '#c58b63'; context.fillRect(42, 67, 47, 58);
  context.fillStyle = '#34251f'; context.fillRect(39, 59, 53, 23); context.fillRect(38, 77, 9, 20);
  context.fillStyle = '#efbf8b'; context.fillRect(51, 87, 37, 27);
  context.fillStyle = '#362a27'; context.fillRect(69, 91, 12, 4);
  context.fillStyle = '#e7bb85'; context.fillRect(51, 114, 25, 23);
  context.fillStyle = '#7e9ab0'; context.fillRect(28, 133, 73, 133);
  context.fillStyle = '#425b73'; context.fillRect(28, 255, 73, 43);
  context.fillStyle = '#101c20'; context.fillRect(102, 152, 290, 136);
  context.fillStyle = '#a26649'; context.fillRect(105, 139, 281, 131);
  context.fillStyle = '#e4ad7c'; context.fillRect(110, 145, 274, 116);
  context.fillStyle = '#f1c393'; context.fillRect(115, 149, 264, 23);
  context.fillStyle = '#c58b63'; context.fillRect(117, 252, 257, 10);
  context.fillStyle = '#f1c393'; context.fillRect(367, 171, 35, 64);
  context.fillStyle = '#b77c58';
  for (let y = 185; y < 230; y += 13) context.fillRect(385, y, 14, 3);
  context.font = '10px monospace'; context.fillStyle = '#c9f5a8';
  context.fillText('CLIENT: FIRST TATTOO', 18, 25);
  context.fillText('HALSTEAD / TRIBAL', 174, 123);
  context.save();
  context.strokeStyle = '#ae8599'; context.lineWidth = 4; context.lineJoin = 'miter';
  for (const path of TATTOO_STENCIL) {
    context.beginPath();
    path.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    context.stroke();
  }
  context.restore();
  context.strokeStyle = '#172632'; context.fillStyle = '#172632'; context.lineWidth = 5;
  context.lineCap = 'round'; context.lineJoin = 'round';
  for (const stroke of game.strokes) {
    context.beginPath();
    stroke.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
    context.stroke();
    if (stroke.length === 1) { const point = stroke[0]!; context.beginPath(); context.arc(point.x, point.y, 2.5, 0, Math.PI * 2); context.fill(); }
  }
  if (cursor && game.phase !== 'finished') {
    context.save(); context.translate(cursor.x, cursor.y);
    if (needleDown) context.translate(Math.sin(now / 13), Math.cos(now / 17));
    // Needle tip sits at the pointer; the machine and gloved hand sit above it.
    context.strokeStyle = '#7faca7'; context.lineWidth = 4;
    context.beginPath(); context.moveTo(24, -42); context.bezierCurveTo(65, -75, 67, -10, 105, -49); context.stroke();
    context.strokeStyle = '#e8f7ed'; context.lineWidth = 2;
    context.beginPath(); context.moveTo(0, 0); context.lineTo(14, -18); context.stroke();
    context.rotate(Math.PI / 4);
    context.fillStyle = '#91b9b3'; context.fillRect(-5, -34, 10, 25);
    context.fillStyle = '#192d31'; context.fillRect(-12, -57, 24, 30);
    context.fillStyle = '#e5ae5e'; context.fillRect(-9, -53, 7, 17); context.fillRect(2, -53, 7, 17);
    context.fillStyle = '#72a9b5'; context.fillRect(6, -35, 25, 18); context.fillRect(19, -52, 22, 29);
    context.restore();
  }
}
