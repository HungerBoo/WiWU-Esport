// Interactive Rising Lava Lamp Animation Canvas
// Features organic rising & sinking thermal blobs with fluid cursor displacement

export function initLavaLamp() {
  const canvas = document.querySelector('.ambient-lava-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let animationFrameId = null;

  // Mouse / cursor tracking with velocity
  const mouse = {
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    vx: 0,
    vy: 0,
    active: false,
    radius: 140
  };

  const colors = [
    { r: 1, g: 59, b: 19, a: 0.28 },     // WiWU Deep Green
    { r: 212, g: 243, b: 74, a: 0.32 },  // Acid Neon
    { r: 120, g: 155, b: 35, a: 0.25 },  // Olive Glow
    { r: 35, g: 85, b: 40, a: 0.22 },   // Forest Accent
    { r: 185, g: 228, b: 65, a: 0.26 }   // Lime Flare
  ];

  class LavaBlob {
    constructor(index, startRandomY = true) {
      this.index = index;
      this.reset(startRandomY);
    }

    reset(startRandomY = false) {
      this.radius = Math.random() * 80 + 70; // 70px - 150px
      this.baseRadius = this.radius;

      // Random horizontal spread
      this.x = Math.random() * (width || window.innerWidth);
      
      // Rising upward motion (negative vy)
      // If startRandomY, scatter across full screen height, otherwise start below bottom
      this.y = startRandomY 
        ? Math.random() * (height || window.innerHeight)
        : (height || window.innerHeight) + this.radius + Math.random() * 80;

      // Vertical rising speed (lava lamp buoyancy)
      this.baseSpeed = 0.55 + Math.random() * 0.75;
      this.vy = -this.baseSpeed;

      // Horizontal sway (thermal draft)
      this.swayFreq = 0.008 + Math.random() * 0.012;
      this.swayAmp = 0.6 + Math.random() * 0.8;
      this.swayPhase = Math.random() * Math.PI * 2;

      // Shape deformation & pulsing
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.02 + Math.random() * 0.02;
      this.stretchY = 1.05 + Math.random() * 0.18; // slightly elongated vertically while rising

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
          const pushMagnitude = overlap * overlap * 12; // Quadratic force for tactile feel
          const nx = dx / dist;
          const ny = dy / dist;

          // Push blob away from cursor
          this.fx += nx * pushMagnitude;
          this.fy += ny * pushMagnitude;

          // Also transfer a portion of cursor movement velocity (stirring the fluid)
          this.fx += mouse.vx * 0.12 * overlap;
          this.fy += mouse.vy * 0.12 * overlap;
        }
      }

      // Apply and dampen physics force
      this.x += this.fx;
      this.y += this.fy;
      this.fx *= 0.90;
      this.fy *= 0.90;

      // 3. Screen bounds & loop (when blob rises above the top, respawn at the bottom)
      const topLimit = -this.radius * 2;
      if (this.y < topLimit) {
        this.reset(false);
      }

      // Soft side boundary handling
      if (this.x < -this.radius) {
        this.x = width + this.radius * 0.5;
      } else if (this.x > width + this.radius) {
        this.x = -this.radius * 0.5;
      }
    }

    draw(context) {
      context.save();
      context.translate(this.x, this.y);

      // Vertical teardrop/oval stretch for authentic rising lava effect
      context.scale(1, this.stretchY);

      const grad = context.createRadialGradient(0, 0, this.radius * 0.1, 0, 0, this.radius);
      const { r, g, b, a } = this.color;

      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a * 1.5})`);
      grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${a * 0.85})`);
      grad.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${a * 0.2})`);
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
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const count = width < 768 ? 6 : 11;
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

    if (mouse.prevX !== -9999) {
      mouse.vx = ((e.clientX - mouse.prevX) / dt) * 16;
      mouse.vy = ((e.clientY - mouse.prevY) / dt) * 16;
      // Cap extreme velocities
      mouse.vx = Math.max(-25, Math.min(25, mouse.vx));
      mouse.vy = Math.max(-25, Math.min(25, mouse.vy));
    }

    mouse.prevX = e.clientX;
    mouse.prevY = e.clientY;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
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

  // Animation Loop
  function render() {
    ctx.clearRect(0, 0, width, height);

    // Natural decay of cursor velocity if motionless
    mouse.vx *= 0.88;
    mouse.vy *= 0.88;

    // Glowing liquid blending
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < blobs.length; i++) {
      blobs[i].update();
      blobs[i].draw(ctx);
    }

    ctx.globalCompositeOperation = 'source-over';
    animationFrameId = requestAnimationFrame(render);
  }

  render();
}
