import { useEffect, useRef } from 'react';

/**
 * MatrixBackground — full-screen animated canvas background.
 * Ported from the standalone index.html into a React component.
 * Non-interactive (pointer-events: none), absolutely positioned behind all content.
 */
export default function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    const body = document.body;

    // ---- theme palettes ---------------------------------------------------
    const THEMES = {
      light: {
        bg:       '#f6f3ec',
        dimRGB:   [199, 192, 178],
        dimAlpha: 0.5,
        navyRGB:  [95, 113, 145],
        skyRGB:   [64, 98, 138],    // deeper dusty blue for contrast on cream
        strokeA:  0.2,
        linkA:    0.2,
        linkRGB:  [82, 112, 148],
      },
    };

    let theme = THEMES.light;

    // ---- grid config ------------------------------------------------------
    const FONT_SIZE = 13;
    const CELL_W    = 14;
    const CELL_H    = 16;
    const FONT      = FONT_SIZE + 'px monospace';

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let W, H, cols, rows;
    let bgCanvas, bgCtx;

    // ---- nodes ------------------------------------------------------------
    const NODE_COUNT      = 10;
    const ESCAPE_FRACTION = 0.15;
    let nodes = [];

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function makeNode(escaping) {
      const radius = rand(38, 85);
      const n = {
        x: rand(radius, (W || window.innerWidth) - radius),
        y: rand(radius, (H || window.innerHeight) - radius),
        vx: rand(0.08, 0.28) * (Math.random() < 0.5 ? -1 : 1),
        vy: rand(0.08, 0.28) * (Math.random() < 0.5 ? -1 : 1),
        r: radius,
        escaping: !!escaping,
      };
      if (n.escaping) respawnEscaping(n);
      return n;
    }

    function respawnEscaping(n) {
      n.r = rand(38, 85);
      const speed = rand(0.12, 0.32);
      const edge  = Math.floor(rand(0, 4));
      if (edge === 0)      { n.x = rand(0, W); n.y = -n.r;   n.vx = rand(-0.12, 0.12); n.vy = speed; }
      else if (edge === 1) { n.x = W + n.r;    n.y = rand(0, H); n.vx = -speed; n.vy = rand(-0.12, 0.12); }
      else if (edge === 2) { n.x = rand(0, W); n.y = H + n.r;   n.vx = rand(-0.12, 0.12); n.vy = -speed; }
      else                 { n.x = -n.r;       n.y = rand(0, H); n.vx = speed;  n.vy = rand(-0.12, 0.12); }
    }

    function initNodes() {
      nodes = [];
      const escapeCount = Math.max(1, Math.round(NODE_COUNT * ESCAPE_FRACTION));
      for (let i = 0; i < NODE_COUNT; i++) nodes.push(makeNode(i < escapeCount));
    }

    // ---- cursor glow ------------------------------------------------------
    const cursor = { x: 0, y: 0, r: 95, active: false };
    const onMouseMove  = (e) => { cursor.x = e.clientX; cursor.y = e.clientY; cursor.active = true; };
    const onMouseLeave = ()  => { cursor.active = false; };
    const onMouseEnter = ()  => { cursor.active = true; };
    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseenter', onMouseEnter);

    // ---- build static background -----------------------------------------
    function buildBackground() {
      bgCanvas = document.createElement('canvas');
      bgCanvas.width  = Math.floor(W * dpr);
      bgCanvas.height = Math.floor(H * dpr);
      bgCtx = bgCanvas.getContext('2d', { alpha: false });
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      bgCtx.fillStyle = theme.bg;
      bgCtx.fillRect(0, 0, W, H);
      body.style.background = theme.bg;

      bgCtx.font          = FONT;
      bgCtx.textBaseline  = 'middle';
      bgCtx.textAlign     = 'center';
      bgCtx.fillStyle     = `rgba(${theme.dimRGB[0]},${theme.dimRGB[1]},${theme.dimRGB[2]},${theme.dimAlpha})`;

      for (let r = 0; r < rows; r++) {
        const y = r * CELL_H + CELL_H / 2;
        for (let c = 0; c < cols; c++) {
          bgCtx.fillText('0', c * CELL_W + CELL_W / 2, y);
        }
      }
    }

    // ---- resize ----------------------------------------------------------
    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;

      canvas.width        = Math.floor(W * dpr);
      canvas.height       = Math.floor(H * dpr);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font          = FONT;
      ctx.textBaseline  = 'middle';
      ctx.textAlign     = 'center';

      cols = Math.ceil(W / CELL_W) + 1;
      rows = Math.ceil(H / CELL_H) + 1;

      buildBackground();

      if (nodes.length) {
        nodes.forEach((n) => {
          if (n.escaping) return;
          n.x = Math.min(Math.max(n.x, n.r), Math.max(n.r, W - n.r));
          n.y = Math.min(Math.max(n.y, n.r), Math.max(n.r, H - n.r));
        });
      } else {
        initNodes();
      }
    }

    // ---- color helpers ---------------------------------------------------
    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpRGB(c1, c2, t) {
      return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
    }
    function colorForT(t) {
      let rgb, alpha;
      if (t < 0.45) {
        const k = t / 0.45;
        rgb   = lerpRGB(theme.skyRGB, theme.navyRGB, k);
        alpha = lerp(0.92, 0.72, k);
      } else {
        const k = (t - 0.45) / 0.55;
        rgb   = lerpRGB(theme.navyRGB, theme.dimRGB, k);
        alpha = lerp(0.72, theme.dimAlpha, k);
      }
      return `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${alpha.toFixed(3)})`;
    }

    // ---- collision -------------------------------------------------------
    function resolveCollision(a, b) {
      const dx = b.x - a.x, dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) dist = 0.01;
      const nx = dx / dist, ny = dy / dist;
      const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
      const rel = dvx * nx + dvy * ny;
      if (rel > 0) {
        a.vx -= rel * nx; a.vy -= rel * ny;
        b.vx += rel * nx; b.vy += rel * ny;
      }
      const overlap = a.r + b.r - dist;
      if (overlap > 0) {
        const sx = nx * overlap / 2, sy = ny * overlap / 2;
        a.x -= sx; a.y -= sy;
        b.x += sx; b.y += sy;
      }
    }

    // ---- animation loop --------------------------------------------------
    const activeCells = new Map();
    const bonds       = new Map();
    let   rafId;

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.escaping) {
          const off = n.x + n.r < 0 || n.x - n.r > W || n.y + n.r < 0 || n.y - n.r > H;
          if (off) respawnEscaping(n);
          continue;
        }
        if (n.x - n.r <= 0)  { n.x = n.r;     n.vx =  Math.abs(n.vx); }
        else if (n.x + n.r >= W) { n.x = W - n.r; n.vx = -Math.abs(n.vx); }
        if (n.y - n.r <= 0)  { n.y = n.r;     n.vy =  Math.abs(n.vy); }
        else if (n.y + n.r >= H) { n.y = H - n.r; n.vy = -Math.abs(n.vy); }
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b    = nodes[j];
          const dx   = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < a.r + b.r) { resolveCollision(a, b); bonds.set(i + '_' + j, true); }
        }
      }
      for (const key of bonds.keys()) {
        const [i, j] = key.split('_').map(Number);
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) > a.r + b.r + 170) bonds.delete(key);
      }

      const effective = cursor.active ? nodes.concat([cursor]) : nodes;

      ctx.drawImage(bgCanvas, 0, 0, W, H);

      if (bonds.size) {
        ctx.lineWidth = 2.4;
        ctx.lineCap   = 'round';
        const RELEASE_DIST = 170;
        for (const key of bonds.keys()) {
          const [i, j] = key.split('_').map(Number);
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist  = Math.sqrt(dx * dx + dy * dy);
          const slack = dist - (a.r + b.r);
          const t  = Math.min(1, Math.max(0, slack / RELEASE_DIST));
          const op = (theme.linkA * (1 - t) + 0.15 * (1 - t)).toFixed(3);
          ctx.strokeStyle = `rgba(${theme.linkRGB[0]},${theme.linkRGB[1]},${theme.linkRGB[2]},${op})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.lineWidth   = 1;
      ctx.strokeStyle = `rgba(${theme.skyRGB[0]},${theme.skyRGB[1]},${theme.skyRGB[2]},${theme.strokeA})`;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      activeCells.clear();
      for (const n of effective) {
        const minC = Math.max(0, Math.floor((n.x - n.r) / CELL_W));
        const maxC = Math.min(cols - 1, Math.ceil((n.x + n.r) / CELL_W));
        const minR = Math.max(0, Math.floor((n.y - n.r) / CELL_H));
        const maxR = Math.min(rows - 1, Math.ceil((n.y + n.r) / CELL_H));

        for (let r = minR; r <= maxR; r++) {
          const cy = r * CELL_H + CELL_H / 2;
          const dy = cy - n.y;
          for (let c = minC; c <= maxC; c++) {
            const cx   = c * CELL_W + CELL_W / 2;
            const dx   = cx - n.x;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= n.r) {
              const t   = dist / n.r;
              const key = r * cols + c;
              const prev = activeCells.get(key);
              if (prev === undefined || t < prev) activeCells.set(key, t);
            }
          }
        }
      }

      let glowOn = false;
      ctx.shadowColor = `rgb(${theme.skyRGB[0]},${theme.skyRGB[1]},${theme.skyRGB[2]})`;

      for (const [key, t] of activeCells) {
        const r = (key / cols) | 0;
        const c = key % cols;
        const x = c * CELL_W + CELL_W / 2;
        const y = r * CELL_H + CELL_H / 2;

        const needsGlow = t < 0.4;
        if (needsGlow && !glowOn)       { ctx.shadowBlur = 5; glowOn = true; }
        else if (!needsGlow && glowOn)  { ctx.shadowBlur = 0; glowOn = false; }

        ctx.fillStyle = colorForT(t);
        ctx.fillText('1', x, y);
      }
      ctx.shadowBlur = 0;

      rafId = requestAnimationFrame(step);
    }

    // ---- vignette overlay drawn on canvas --------------------------------
    // (we handle this via CSS instead, in the parent)

    window.addEventListener('resize', resize);
    resize();
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  return (
    <>
      {/* Matrix canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'block',
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      {/* Radial vignette darkening edges */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          userSelect: 'none',
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0) 38%, rgba(0,0,0,0.15) 78%, rgba(0,0,0,0.3) 100%)',
          opacity: 0.35,
        }}
      />
    </>
  );
}
