interface Position {
  x: number;
  y: number;
}

export function moveWithCollisions(
  position: Position,
  movementX: number,
  movementY: number,
  isBlocked: (x: number, y: number) => boolean,
): void {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
  const stepX = movementX / steps;
  const stepY = movementY / steps;
  for (let step = 0; step < steps; step += 1) {
    const nextX = position.x + stepX;
    if (!isBlocked(nextX, position.y)) position.x = nextX;
    const nextY = position.y + stepY;
    if (!isBlocked(position.x, nextY)) position.y = nextY;
  }
}
