/** 정답 축하 효과: 히어로 색 폭죽 + 짧은 팡파르 (브라우저 전용) */

export async function fireConfetti(themeColor: string) {
  const { default: confetti } = await import("canvas-confetti");
  const colors = [themeColor, "#facc15", "#ffffff", "#1c1917"];
  const base = { colors, disableForReducedMotion: true, zIndex: 60 };
  confetti({ ...base, particleCount: 120, spread: 80, origin: { y: 0.7 } });
  setTimeout(() => {
    confetti({ ...base, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.8 } });
    confetti({ ...base, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.8 } });
  }, 250);
}

let audioCtx: AudioContext | null = null;

/** 도-미-솔-도 짧은 팡파르. 오디오 파일 없이 Web Audio로 합성한다. */
export function playFanfare() {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.11;
      const duration = i === notes.length - 1 ? 0.45 : 0.13;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    });
  } catch {
    // 오디오를 못 쓰는 환경이면 조용히 넘어간다
  }
}
