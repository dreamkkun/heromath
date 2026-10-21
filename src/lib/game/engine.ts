/**
 * 갤러그풍 슈팅 게임 엔진. 화면 그리기(draw)와 상태 갱신(update)만 맡고,
 * 시작·관문·게임오버 같은 화면 전환은 React 쪽이 status를 보고 처리한다.
 * 좌표는 360×540 논리 크기 기준이고, 실제 캔버스 크기에 맞춰 확대해서 그린다.
 */

export const WIDTH = 360;
export const HEIGHT = 540;

export type Status = "ready" | "playing" | "gate" | "over";

interface Bullet {
  x: number;
  y: number;
  vy: number;
}

interface Enemy {
  col: number;
  row: number;
  x: number;
  y: number;
  hp: number;
  emoji: string;
  state: "formation" | "diving" | "returning";
  /** 급강하를 시작한 뒤 흐른 시간 (좌우로 흔들리는 궤적 계산용) */
  diveTime: number;
  diveFromX: number;
  diveDir: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface Input {
  left: boolean;
  right: boolean;
  /** 화면을 누르고 끄는 중이면 그 x 위치 (논리 좌표) */
  targetX: number | null;
}

export interface GameColors {
  hero: string;
  ink: string;
  grid: string;
  marker: string;
}

const ROW_EMOJI = ["🛸", "👽", "👾", "🐙", "👻"];
const PLAYER_Y = HEIGHT - 56;
const PLAYER_SPEED = 230;
const FIRE_COOLDOWN = 0.32;
const HIT_RADIUS = 16;

export class Game {
  status: Status = "ready";
  stage = 1;
  score = 0;
  lives = 3;

  private playerX = WIDTH / 2;
  private invulnerable = 0;
  private fireTimer = 0;
  private bullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private particles: Particle[] = [];
  private time = 0;
  /** 대열이 위에서 내려오는 등장 연출 진행도 (0 → 1) */
  private entry = 0;
  private diveTimer = 0;
  private stars = Array.from({ length: 40 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    speed: 15 + Math.random() * 35,
  }));

  constructor(
    private heroEmblem: string,
    private onChange: () => void,
  ) {}

  setHeroEmblem(emblem: string) {
    this.heroEmblem = emblem;
  }

  start() {
    this.stage = 1;
    this.score = 0;
    this.lives = 3;
    this.beginStage();
  }

  /** 관문을 통과하면 다음 단계로 */
  nextStage() {
    this.stage += 1;
    this.beginStage();
  }

  private beginStage() {
    this.status = "playing";
    this.playerX = WIDTH / 2;
    this.bullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.invulnerable = 1;
    this.entry = 0;
    this.diveTimer = this.diveInterval();
    const rows = Math.min(2 + Math.ceil(this.stage / 2), 5);
    const cols = 6;
    this.enemies = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.enemies.push({
          col,
          row,
          x: 0,
          y: 0,
          // 3단계부터 맨 윗줄은 두 번 맞혀야 한다
          hp: row === 0 && this.stage >= 3 ? 2 : 1,
          emoji: ROW_EMOJI[row % ROW_EMOJI.length],
          state: "formation",
          diveTime: 0,
          diveFromX: 0,
          diveDir: 1,
        });
      }
    }
    this.onChange();
  }

  private diveInterval() {
    return Math.max(0.7, 2.8 - this.stage * 0.3) * (0.6 + Math.random() * 0.8);
  }

  private slotPosition(e: Enemy) {
    const sway = Math.sin(this.time * 0.9) * 28;
    const enterOffset = (1 - this.entry) * -260;
    return { x: 50 + e.col * 52 + sway, y: 70 + e.row * 40 + enterOffset };
  }

  update(dt: number, input: Input) {
    this.time += dt;
    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > HEIGHT) s.y -= HEIGHT;
    }
    this.updateParticles(dt);
    if (this.status !== "playing") return;

    this.entry = Math.min(1, this.entry + dt / 1.4);
    this.invulnerable = Math.max(0, this.invulnerable - dt);

    // 플레이어 이동: 끌고 있으면 그 위치로, 아니면 방향키로
    if (input.targetX !== null) {
      const diff = input.targetX - this.playerX;
      this.playerX += Math.sign(diff) * Math.min(Math.abs(diff), PLAYER_SPEED * 1.6 * dt);
    } else {
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      this.playerX += dir * PLAYER_SPEED * dt;
    }
    this.playerX = Math.max(20, Math.min(WIDTH - 20, this.playerX));

    // 자동 발사
    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && this.entry >= 1) {
      this.bullets.push({ x: this.playerX, y: PLAYER_Y - 18, vy: -430 });
      this.fireTimer = FIRE_COOLDOWN;
    }
    for (const b of this.bullets) b.y += b.vy * dt;
    this.bullets = this.bullets.filter((b) => b.y > -10);

    this.updateEnemies(dt);
    for (const b of this.enemyBullets) b.y += b.vy * dt;
    this.enemyBullets = this.enemyBullets.filter((b) => b.y < HEIGHT + 10);

    this.handleHits();

    if (this.enemies.length === 0 && this.status === "playing") {
      this.status = "gate";
      this.enemyBullets = [];
      this.onChange();
    }
  }

  private updateEnemies(dt: number) {
    const bulletSpeed = 170 + this.stage * 15;

    // 가끔 한 마리씩 급강하
    this.diveTimer -= dt;
    if (this.diveTimer <= 0 && this.entry >= 1) {
      const candidates = this.enemies.filter((e) => e.state === "formation");
      if (candidates.length > 0) {
        const e = candidates[Math.floor(Math.random() * candidates.length)];
        e.state = "diving";
        e.diveTime = 0;
        e.diveFromX = e.x;
        e.diveDir = e.x < this.playerX ? 1 : -1;
      }
      this.diveTimer = this.diveInterval();
    }

    for (const e of this.enemies) {
      const slot = this.slotPosition(e);
      if (e.state === "formation") {
        e.x = slot.x;
        e.y = slot.y;
        // 대열에 있는 적도 아주 가끔 총을 쏜다
        if (this.entry >= 1 && Math.random() < dt * (0.03 + this.stage * 0.012)) {
          this.enemyBullets.push({ x: e.x, y: e.y + 12, vy: bulletSpeed });
        }
      } else if (e.state === "diving") {
        e.diveTime += dt;
        const speed = 150 + this.stage * 14;
        e.y += speed * dt;
        // 플레이어 쪽으로 휘어지며 내려온다
        e.x = e.diveFromX + e.diveDir * Math.sin(e.diveTime * 2.2) * 90;
        if (Math.random() < dt * 0.9) {
          this.enemyBullets.push({ x: e.x, y: e.y + 12, vy: bulletSpeed + 40 });
        }
        if (e.y > HEIGHT + 20) {
          // 화면 아래로 빠지면 위에서 다시 나타나 대열로 돌아간다
          e.y = -30;
          e.state = "returning";
        }
      } else {
        e.x += (slot.x - e.x) * Math.min(1, dt * 3);
        e.y += (slot.y - e.y) * Math.min(1, dt * 3);
        if (Math.hypot(slot.x - e.x, slot.y - e.y) < 2) e.state = "formation";
      }
    }
  }

  private handleHits() {
    // 내 총알 → 적
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (e.hp > 0 && Math.hypot(b.x - e.x, b.y - e.y) < HIT_RADIUS) {
          b.y = -100;
          e.hp -= 1;
          if (e.hp <= 0) {
            this.score += e.state === "formation" ? 100 : 150;
            this.burst(e.x, e.y, "#ffe45c");
          } else {
            this.burst(e.x, e.y, "#ffffff", 4);
          }
          break;
        }
      }
    }
    const before = this.enemies.length;
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    if (this.enemies.length !== before) this.onChange();

    if (this.invulnerable > 0) return;
    // 적 총알이나 급강하한 적 → 나
    const hitByBullet = this.enemyBullets.some((b) => Math.hypot(b.x - this.playerX, b.y - PLAYER_Y) < 14);
    const hitByEnemy = this.enemies.some((e) => Math.hypot(e.x - this.playerX, e.y - PLAYER_Y) < 22);
    if (hitByBullet || hitByEnemy) {
      this.lives -= 1;
      this.burst(this.playerX, PLAYER_Y, "#ff6b6b", 18);
      this.enemyBullets = [];
      this.invulnerable = 2;
      if (this.lives <= 0) this.status = "over";
      this.onChange();
    }
  }

  private burst(x: number, y: number, color: string, count = 10) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 120;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.3, color });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D, colors: GameColors) {
    // 남색 밤하늘 위의 공책 모눈
    ctx.fillStyle = colors.ink;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = "rgba(213, 227, 245, 0.07)";
    ctx.lineWidth = 1;
    const offset = (this.time * 12) % 24;
    ctx.beginPath();
    for (let x = 0; x <= WIDTH; x += 24) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, HEIGHT);
    }
    for (let y = -24 + offset; y <= HEIGHT; y += 24) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(WIDTH, y + 0.5);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (const s of this.stars) ctx.fillRect(s.x, s.y, 1.5, 1.5);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 적
    ctx.font = "26px sans-serif";
    for (const e of this.enemies) {
      ctx.globalAlpha = e.hp >= 2 ? 1 : 0.95;
      ctx.fillText(e.emoji, e.x, e.y);
      if (e.hp >= 2) {
        ctx.strokeStyle = colors.marker;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 17, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // 총알
    ctx.fillStyle = colors.marker;
    for (const b of this.bullets) {
      ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
    }
    ctx.fillStyle = "#ff8a8a";
    for (const b of this.enemyBullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 나: 히어로 엠블럼. 맞은 직후엔 깜빡인다
    if (this.status !== "over" && (this.invulnerable === 0 || Math.floor(this.time * 10) % 2 === 0)) {
      ctx.fillStyle = colors.hero;
      ctx.beginPath();
      ctx.arc(this.playerX, PLAYER_Y, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.playerX, PLAYER_Y, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "22px sans-serif";
      ctx.fillText(this.heroEmblem, this.playerX, PLAYER_Y + 1);
    }

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life * 1.8);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }
}
