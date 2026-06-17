// Web Audio and YouTube playback engine.
// Plays actual YouTube links and one-shot sound effects.

export interface TrackDef {
  name: string;
  emoji: string;
  ytId: string;
}

export const TRACKS: Record<string, TrackDef> = {
  track1: {
    name: "Песня 1",
    emoji: "🌙",
    ytId: "cryYrzg-hjg",
  },
  track2: {
    name: "Песня 2",
    emoji: "🎵",
    ytId: "cridXTGuDPg",
  },
  track3: {
    name: "Песня 3",
    emoji: "✨",
    ytId: "85ubAv-IxFs",
  },
};

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private ytIframe: HTMLIFrameElement | null = null;
  activeTrack: string | null = null;

  private ensureCtx() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  play(trackId: string) {
    this.stop();
    const def = TRACKS[trackId];
    if (!def) return;
    this.activeTrack = trackId;

    if (!this.ytIframe) {
      const ifr = document.createElement("iframe");
      ifr.style.position = "fixed";
      ifr.style.bottom = "0px";
      ifr.style.right = "0px";
      ifr.style.width = "2px";
      ifr.style.height = "2px";
      ifr.style.opacity = "0.01";
      ifr.style.pointerEvents = "none";
      ifr.style.zIndex = "-999";
      ifr.setAttribute("allow", "autoplay");
      document.body.appendChild(ifr);
      this.ytIframe = ifr;
    }

    this.ytIframe.src = `https://www.youtube.com/embed/${def.ytId}?enablejsapi=1&autoplay=1&loop=1&playlist=${def.ytId}`;
  }

  stop() {
    this.activeTrack = null;
    if (this.ytIframe) {
      this.ytIframe.src = "";
    }
  }

  // One-shot sound effects
  private blip(opts: { type: OscillatorType; f0: number; f1: number; dur: number; peak: number }) {
    this.ensureCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = opts.type;
    o.frequency.setValueAtTime(opts.f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.f1), t + opts.dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.peak, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + opts.dur + 0.02);
  }

  quack() {
    this.blip({ type: "sawtooth", f0: 720, f1: 180, dur: 0.18, peak: 0.28 });
    window.setTimeout(() => this.blip({ type: "square", f0: 520, f1: 150, dur: 0.14, peak: 0.18 }), 85);
  }

  pop() {
    this.blip({ type: "triangle", f0: 880, f1: 1500, dur: 0.12, peak: 0.13 });
    window.setTimeout(() => this.blip({ type: "sine", f0: 1200, f1: 1900, dur: 0.1, peak: 0.1 }), 60);
  }

  dispose() {
    this.stop();
    if (this.ytIframe && this.ytIframe.parentNode) {
      this.ytIframe.parentNode.removeChild(this.ytIframe);
      this.ytIframe = null;
    }
    if (this.ctx) void this.ctx.close();
  }
}
