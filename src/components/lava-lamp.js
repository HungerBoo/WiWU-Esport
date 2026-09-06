// High-Performance Interactive Rising Lava Lamp Animation Canvas
// Features organic rising & sinking thermal blobs with soft gradients and fluid cursor displacement

export function initLavaLamp() {
  const canvas = document.querySelector('.ambient-lava-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // Scale down internal buffer resolution (0.5x) for 75% fill-rate savings
  // Soft ambient blobs retain smooth aesthetics with minimal CPU/GPU overhead
  const SCALE = 0.5;
  let width = 0;
  let height = 0;
  let animationFrameId = null;
  let isRunning = false;

  // Mouse / cursor tracking with velocity
  const mouse = {
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    vx: 0,
    vy: 0,
    active: false,
    radius: 120 * SCALE
  };

  const colors = [
    { r: 1, g: 59, b: 19, a: 0.35 },     // WiWU Deep Green
    { r: 212, g: 243, b: 74, a: 0.38 },  // Acid Neon
    { r: 120, g: 155, b: 35, a: 0.32 },  // Olive Glow
    { r: 35, g: 85, b: 40, a: 0.30 },   // Forest Accent
    { r: 185, g: 228, b: 65, a: 0.34 }   // Lime Flare
  ];

  class LavaBlob {
    constructor(index, startRandomY = true) {
      this.index = index;
      this.reset(startRandomY);
    }

    reset(startRandomY = false) {
      this.radius = (Math.random() * 90 + 80) * SCALE; // scaled radius
      this.baseRadius = this.radius;

      // Random horizontal spread
      this.x = Math.random() * (width || window.innerWidth * SCALE);
      
      // Rising upward motion (negative vy)
      this.y = startRandomY 
        ? Math.random() * (height || window.innerHeight * SCALE)
        : (height || window.innerHeight * SCALE) + this.radius + Math.random() * 50;

      // Vertical rising speed
      this.baseSpeed = (0.5 + Math.random() * 0.7) * SCALE;
      this.vy = -this.baseSpeed;

      // Horizontal sway (thermal draft)
      this.swayFreq = 0.008 + Math.random() * 0.012;
      this.swayAmp = (0.6 + Math.random() * 0.8) * SCALE;
      this.swayPhase = Math.random() * Math.PI * 2;

      // Shape deformation & pulsing
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.02 + Math.random() * 0.02;
      this.stretchY = 1.05 + Math.random() * 0.18;

      this.color = colors[this.index % colors.length];

      // Physics velocities from cursor push
      this.fx = 0;
      this.fy = 0;
    }

    update() {
      // 1. Natural rising motion
      this.swayPhase += this.swayFreq;
      this.pulsePhase += this.pulseSpeed;

      const horizontalSway = Math.sin(this.swayPhase) * this.swayAmp;
      this.x += horizontalSway;
      this.y += this.vy;

      // Dynamic radius breathing
      this.radius = this.baseRadius + Math.sin(this.pulsePhase) * (this.baseRadius * 0.12);

      // 2. Cursor repulsion & fluid push
      if (mouse.active) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const minDist = this.radius + mouse.radius;

        if (dist < minDist && dist > 0) {
          const overlap = 1 - (dist / minDist);
          const pushMagnitude = overlap * overlap * 8 * SCALE;
          const nx = dx / dist;
          const ny = dy / dist;

          this.fx += nx * pushMagnitude;
          this.fy += ny * pushMagnitude;
          this.fx += mouse.vx * 0.12 * overlap;
          this.fy += mouse.vy * 0.12 * overlap;
        }
      }

      // Apply and dampen physics force
      this.x += this.fx;
      this.y += this.fy;
      this.fx *= 0.90;
      this.fy *= 0.90;

      // 3. Screen bounds & loop
      const topLimit = -this.radius * 2;
      if (this.y < topLimit) {
        this.reset(false);
      }

      if (this.x < -this.radius) {
        this.x = width + this.radius * 0.5;
      } else if (this.x > width + this.radius) {
        this.x = -this.radius * 0.5;
      }
    }

    draw(context) {
      context.save();
      context.translate(this.x, this.y);
      context.scale(1, this.stretchY);

      const grad = context.createRadialGradient(0, 0, 0, 0, 0, this.radius);
      const { r, g, b, a } = this.color;

      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a * 1.6})`);
      grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${a * 1.1})`);
      grad.addColorStop(0.70, `rgba(${r}, ${g}, ${b}, ${a * 0.4})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      context.beginPath();
      context.arc(0, 0, this.radius, 0, Math.PI * 2);
      context.fillStyle = grad;
      context.fill();

      context.restore();
    }
  }

  let blobs = [];

  function resize() {
    const rawW = window.innerWidth;
    const rawH = window.innerHeight;
    width = Math.ceil(rawW * SCALE);
    height = Math.ceil(rawH * SCALE);
    canvas.width = width;
    canvas.height = height;

    const count = rawW < 768 ? 5 : 9;
    if (blobs.length === 0) {
      blobs = Array.from({ length: count }, (_, i) => new LavaBlob(i, true));
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Pointer listeners
  let lastMoveTime = performance.now();

  const onPointerMove = (e) => {
    const now = performance.now();
    const dt = Math.max(1, now - lastMoveTime);
    lastMoveTime = now;

    const scaledX = e.clientX * SCALE;
    const scaledY = e.clientY * SCALE;

    if (mouse.prevX !== -9999) {
      mouse.vx = ((scaledX - mouse.prevX) / dt) * 16;
      mouse.vy = ((scaledY - mouse.prevY) / dt) * 16;
      mouse.vx = Math.max(-20, Math.min(20, mouse.vx));
      mouse.vy = Math.max(-20, Math.min(20, mouse.vy));
    }

    mouse.prevX = scaledX;
    mouse.prevY = scaledY;
    mouse.x = scaledX;
    mouse.y = scaledY;
    mouse.active = true;
  };

  const onPointerLeave = () => {
    mouse.active = false;
    mouse.prevX = -9999;
    mouse.prevY = -9999;
    mouse.vx = 0;
    mouse.vy = 0;
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('blur', onPointerLeave, { passive: true });

  // Pause rendering when tab is hidden to save battery and CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  }, { passive: true });

  function render() {
    ctx.clearRect(0, 0, width, height);

    mouse.vx *= 0.88;
    mouse.vy *= 0.88;

    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < blobs.length; i++) {
      blobs[i].update();
      blobs[i].draw(ctx);
    }

    ctx.globalCompositeOperation = 'source-over';
    if (isRunning) {
      animationFrameId = requestAnimationFrame(render);
    }
  }

  function startLoop() {
    if (!isRunning) {
      isRunning = true;
      animationFrameId = requestAnimationFrame(render);
    }
  }

  function stopLoop() {
    isRunning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  startLoop();
}
