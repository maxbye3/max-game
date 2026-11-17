const SWEEP_SPEED = .36;
const ALIGNMENT_TOLERANCE = .04;

export class EngagementGame {
  phase: 'moving' | 'connecting' | 'returning' | 'engaged' = 'moving';
  ringX = .2;
  fingerX = .8;
  missUntil = 0;
  withdrawal = 0;
  private elapsed = 0;
  private direction = 1;
  private connectionTime = 0;

  update(seconds: number): void {
    const dt = Math.max(0, Math.min(seconds, .05));
    this.elapsed += dt;
    if (this.phase === 'moving') {
      this.ringX += this.direction * SWEEP_SPEED * dt;
      if (this.ringX > .88) {
        this.ringX = 1.76 - this.ringX;
        this.direction = -1;
      } else if (this.ringX < .12) {
        this.ringX = .24 - this.ringX;
        this.direction = 1;
      }
      this.fingerX = 1 - this.ringX;
    } else if (this.phase === 'connecting') {
      this.connectionTime = Math.min(1, this.connectionTime + dt / .45);
      if (this.connectionTime === 1) {
        if (Math.abs(this.ringX - this.fingerX) <= ALIGNMENT_TOLERANCE) this.phase = 'engaged';
        else {
          this.phase = 'returning';
          this.missUntil = this.elapsed + .8;
        }
      }
    } else if (this.phase === 'returning') {
      this.connectionTime = Math.max(0, this.connectionTime - dt / .35);
      if (this.connectionTime === 0) this.phase = 'moving';
    } else this.withdrawal = Math.min(1, this.withdrawal + dt / .5);
  }

  get connection(): number { return this.connectionTime; }
  get missed(): boolean { return this.elapsed < this.missUntil; }

  tap(): boolean {
    if (this.phase !== 'moving') return false;
    this.phase = 'connecting';
    return true;
  }
}
