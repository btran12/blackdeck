import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { Widget } from '../Widget';

const ANIMATION_TYPES = ['matrix', 'starfield', 'bubbles', 'fireworks', 'rain', 'snow', 'fish', 'birds', 'fireflies', 'cats', 'dna', 'sleepycat'];
const DEFAULT_ANIMATION = 'starfield';
const DEFAULT_ROTATION_MINUTES = 0; // 0 = no rotation

export const Animations = ({
  animationType = DEFAULT_ANIMATION,
  rotationIntervalMinutes = DEFAULT_ROTATION_MINUTES,
  showFade = false,
}) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [activeAnimation, setActiveAnimation] = useState(animationType);

  // Rotation between animation types
  useEffect(() => {
    if (rotationIntervalMinutes <= 0) {
      setActiveAnimation(animationType);
      return;
    }

    const intervalMs = Math.max(1, rotationIntervalMinutes) * 60 * 1000;
    let index = ANIMATION_TYPES.indexOf(animationType);
    if (index === -1) index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % ANIMATION_TYPES.length;
      setActiveAnimation(ANIMATION_TYPES[index]);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [animationType, rotationIntervalMinutes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let running = true;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement);

    let cleanup;

    switch (activeAnimation) {
      case 'matrix':
        cleanup = runMatrix(ctx, canvas, () => running);
        break;
      case 'starfield':
        cleanup = runStarfield(ctx, canvas, () => running);
        break;
      case 'bubbles':
        cleanup = runBubbles(ctx, canvas, () => running);
        break;
      case 'fireworks':
        cleanup = runFireworks(ctx, canvas, () => running);
        break;
      case 'rain':
        cleanup = runRain(ctx, canvas, () => running);
        break;
      case 'snow':
        cleanup = runSnow(ctx, canvas, () => running);
        break;
      case 'fish':
        cleanup = runFish(ctx, canvas, () => running);
        break;
      case 'birds':
        cleanup = runBirds(ctx, canvas, () => running);
        break;
      case 'fireflies':
        cleanup = runFireflies(ctx, canvas, () => running);
        break;
      case 'cats':
        cleanup = runCats(ctx, canvas, () => running);
        break;
      case 'dna':
        cleanup = runDNA(ctx, canvas, () => running);
        break;
      case 'sleepycat':
        cleanup = runSleepyCat(ctx, canvas, () => running);
        break;
      default:
        cleanup = runStarfield(ctx, canvas, () => running);
    }

    return () => {
      running = false;
      resizeObserver.disconnect();
      if (cleanup) cleanup();
    };
  }, [activeAnimation]);

  return (
    <Widget widgetType="animations" showFade={showFade}>
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <Typography
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            fontSize: '0.65rem',
            opacity: 0.3,
            color: '#fff',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          {activeAnimation}
        </Typography>
      </Box>
    </Widget>
  );
};

// ─── Matrix Rain ────────────────────────────────────────────────────
function runMatrix(ctx, canvas, isRunning) {
  const fontSize = 14;
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
  let columns = Math.floor(canvas.width / fontSize);
  let drops = new Array(columns).fill(1);

  function draw() {
    if (!isRunning()) return;

    columns = Math.floor(canvas.width / fontSize);
    while (drops.length < columns) drops.push(0);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < columns; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Starfield ──────────────────────────────────────────────────────
function runStarfield(ctx, canvas, isRunning) {
  const NUM_STARS = 200;
  const stars = Array.from({ length: NUM_STARS }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Math.random(),
  }));

  function draw() {
    if (!isRunning()) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const star of stars) {
      star.z -= 0.005;
      if (star.z <= 0) {
        star.x = Math.random() * 2 - 1;
        star.y = Math.random() * 2 - 1;
        star.z = 1;
      }

      const sx = cx + (star.x / star.z) * cx;
      const sy = cy + (star.y / star.z) * cy;
      const size = (1 - star.z) * 3;
      const brightness = Math.floor((1 - star.z) * 255);

      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${1 - star.z})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Bubbles ────────────────────────────────────────────────────────
function runBubbles(ctx, canvas, isRunning) {
  const NUM_BUBBLES = 30;
  const colors = [
    'rgba(100, 200, 255, 0.3)',
    'rgba(150, 100, 255, 0.3)',
    'rgba(255, 100, 200, 0.3)',
    'rgba(100, 255, 150, 0.3)',
    'rgba(255, 200, 100, 0.3)',
  ];

  const bubbles = Array.from({ length: NUM_BUBBLES }, () => ({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 100,
    radius: 8 + Math.random() * 30,
    speed: 0.3 + Math.random() * 0.8,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.01 + Math.random() * 0.03,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  function draw() {
    if (!isRunning()) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const b of bubbles) {
      b.y -= b.speed;
      b.wobble += b.wobbleSpeed;
      const wx = b.x + Math.sin(b.wobble) * 20;

      if (b.y + b.radius < 0) {
        b.y = canvas.height + b.radius;
        b.x = Math.random() * canvas.width;
      }

      ctx.beginPath();
      ctx.arc(wx, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.arc(wx - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Fireworks ──────────────────────────────────────────────────────
function runFireworks(ctx, canvas, isRunning) {
  const particles = [];
  let frameCount = 0;

  function launch() {
    const x = Math.random() * canvas.width;
    const targetY = canvas.height * 0.1 + Math.random() * canvas.height * 0.4;
    const hue = Math.floor(Math.random() * 360);
    const count = 40 + Math.floor(Math.random() * 40);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 1 + Math.random() * 2.5;
      particles.push({
        x,
        y: targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 80 + Math.random() * 40,
        maxLife: 120,
        hue,
        size: 1.5 + Math.random(),
      });
    }
  }

  function draw() {
    if (!isRunning()) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    frameCount++;
    if (frameCount % 60 === 0 || particles.length === 0) {
      launch();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // gravity
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.life--;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Rain ───────────────────────────────────────────────────────────
function runRain(ctx, canvas, isRunning) {
  const NUM_DROPS = 150;
  const drops = Array.from({ length: NUM_DROPS }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    length: 10 + Math.random() * 20,
    speed: 4 + Math.random() * 6,
    opacity: 0.1 + Math.random() * 0.3,
  }));

  function draw() {
    if (!isRunning()) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
    ctx.lineWidth = 1;

    for (const d of drops) {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + 1, d.y + d.length);
      ctx.globalAlpha = d.opacity;
      ctx.stroke();

      d.y += d.speed;
      if (d.y > canvas.height) {
        d.y = -d.length;
        d.x = Math.random() * canvas.width;
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Snow ───────────────────────────────────────────────────────────
function runSnow(ctx, canvas, isRunning) {
  const NUM_FLAKES = 120;
  const flakes = Array.from({ length: NUM_FLAKES }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: 1 + Math.random() * 3,
    speed: 0.5 + Math.random() * 1.5,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.005 + Math.random() * 0.02,
    opacity: 0.3 + Math.random() * 0.7,
  }));

  function draw() {
    if (!isRunning()) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const f of flakes) {
      f.y += f.speed;
      f.wobble += f.wobbleSpeed;
      const wx = f.x + Math.sin(f.wobble) * 30;

      if (f.y > canvas.height + f.radius) {
        f.y = -f.radius;
        f.x = Math.random() * canvas.width;
      }

      ctx.beginPath();
      ctx.arc(wx, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Fish (aquarium) ────────────────────────────────────────────────
function runFish(ctx, canvas, isRunning) {
  const fishDefs = [
    { emoji: '🐟', sizeRange: [20, 30], speedRange: [0.3, 0.8] },
    { emoji: '🐠', sizeRange: [18, 28], speedRange: [0.4, 1.0] },
    { emoji: '🐡', sizeRange: [22, 32], speedRange: [0.2, 0.5] },
    { emoji: '🐙', sizeRange: [24, 36], speedRange: [0.15, 0.4] },
    { emoji: '🦐', sizeRange: [14, 20], speedRange: [0.5, 1.2] },
    { emoji: '🦈', sizeRange: [30, 42], speedRange: [0.6, 1.1] },
  ];

  const NUM_FISH = 14;

  const makeFish = () => {
    const def = fishDefs[Math.floor(Math.random() * fishDefs.length)];
    const goingRight = Math.random() > 0.5;
    const speed = def.speedRange[0] + Math.random() * (def.speedRange[1] - def.speedRange[0]);
    return {
      x: Math.random() * canvas.width,
      y: 40 + Math.random() * (canvas.height - 80),
      vx: speed * (goingRight ? 1 : -1),
      vy: 0,
      targetVx: speed * (goingRight ? 1 : -1),
      targetVy: 0,
      emoji: def.emoji,
      size: def.sizeRange[0] + Math.floor(Math.random() * (def.sizeRange[1] - def.sizeRange[0])),
      // Behavior state
      state: 'swim', // swim, dart, idle, turn
      stateTimer: 120 + Math.floor(Math.random() * 300),
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.08 + Math.random() * 0.06,
      baseSpeed: speed,
    };
  };

  const fish = Array.from({ length: NUM_FISH }, makeFish);

  // Ambient bubbles
  const bubbles = Array.from({ length: 25 }, () => ({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 50,
    radius: 1 + Math.random() * 3,
    speed: 0.2 + Math.random() * 0.5,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.04,
    opacity: 0.05 + Math.random() * 0.15,
  }));

  // Caustic light rays
  let causticPhase = 0;

  function draw() {
    if (!isRunning()) return;

    // Water background with subtle gradient
    ctx.fillStyle = 'rgba(0, 4, 12, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle caustic light ripples at top
    causticPhase += 0.008;
    for (let i = 0; i < 5; i++) {
      const x = canvas.width * 0.2 + Math.sin(causticPhase + i * 1.3) * canvas.width * 0.3;
      const gradient = ctx.createRadialGradient(x, 0, 0, x, 0, canvas.height * 0.4);
      gradient.addColorStop(0, `rgba(80, 160, 220, ${0.015 + Math.sin(causticPhase + i) * 0.008})`);
      gradient.addColorStop(1, 'rgba(80, 160, 220, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);
    }

    // Bubbles with wobble
    for (const b of bubbles) {
      b.y -= b.speed;
      b.wobble += b.wobbleSpeed;
      b.radius *= 1 + (Math.random() - 0.5) * 0.001; // Slight size variation
      const wx = b.x + Math.sin(b.wobble) * 8;
      if (b.y < -b.radius) {
        b.y = canvas.height + b.radius;
        b.x = Math.random() * canvas.width;
        b.radius = 1 + Math.random() * 3;
      }
      ctx.beginPath();
      ctx.arc(wx, b.y, b.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(150, 210, 255, ${b.opacity})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Highlight
      ctx.beginPath();
      ctx.arc(wx - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 230, 255, ${b.opacity * 0.8})`;
      ctx.fill();
    }

    // Update and draw fish
    for (const f of fish) {
      f.stateTimer--;

      // State machine for behavior
      if (f.stateTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.45) {
          // Gentle swim — pick a new gentle direction
          f.state = 'swim';
          f.stateTimer = 180 + Math.floor(Math.random() * 400);
          const angle = (Math.random() - 0.5) * 0.6;
          const spd = f.baseSpeed * (0.6 + Math.random() * 0.5);
          f.targetVx = Math.cos(angle) * spd * Math.sign(f.vx || 1);
          f.targetVy = Math.sin(angle) * spd;
          f.tailSpeed = 0.06 + Math.random() * 0.04;
        } else if (roll < 0.65) {
          // Dart — sudden burst of speed
          f.state = 'dart';
          f.stateTimer = 30 + Math.floor(Math.random() * 50);
          const spd = f.baseSpeed * (2.5 + Math.random() * 1.5);
          f.targetVx = spd * Math.sign(f.vx || 1);
          f.targetVy = (Math.random() - 0.5) * 1.5;
          f.tailSpeed = 0.15 + Math.random() * 0.1;
        } else if (roll < 0.85) {
          // Idle — nearly still, hovering
          f.state = 'idle';
          f.stateTimer = 100 + Math.floor(Math.random() * 200);
          f.targetVx = Math.sign(f.vx || 1) * f.baseSpeed * 0.05;
          f.targetVy = 0;
          f.tailSpeed = 0.02 + Math.random() * 0.02;
        } else {
          // Turn around
          f.state = 'swim';
          f.stateTimer = 120 + Math.floor(Math.random() * 200);
          f.targetVx = -f.vx;
          f.targetVy = (Math.random() - 0.5) * 0.5;
          f.tailSpeed = 0.07;
        }
      }

      // Smooth interpolation toward target velocity (momentum)
      f.vx += (f.targetVx - f.vx) * 0.02;
      f.vy += (f.targetVy - f.vy) * 0.02;
      // Slight vertical drift toward center
      f.vy += (canvas.height * 0.5 - f.y) * 0.00005;

      f.x += f.vx;
      f.y += f.vy;
      f.tailPhase += f.tailSpeed;

      // Soft boundary avoidance — steer away from edges
      const margin = 60;
      if (f.y < margin) f.targetVy += 0.05;
      if (f.y > canvas.height - margin) f.targetVy -= 0.05;
      if (f.x < margin && f.vx < 0) f.targetVx = Math.abs(f.targetVx);
      if (f.x > canvas.width - margin && f.vx > 0) f.targetVx = -Math.abs(f.targetVx);

      // Wrap if they somehow get far out
      if (f.x < -80) f.x = canvas.width + 40;
      if (f.x > canvas.width + 80) f.x = -40;

      // Draw fish with tail oscillation
      const tailWag = Math.sin(f.tailPhase) * 2;
      const direction = f.vx >= 0 ? 1 : -1;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(Math.atan2(f.vy, Math.abs(f.vx)) * direction * 0.3); // Subtle tilt toward movement
      if (direction < 0) ctx.scale(-1, 1);
      ctx.rotate(tailWag * 0.02); // Subtle body sway
      ctx.font = `${f.size}px serif`;
      ctx.fillText(f.emoji, 0, 0);
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Birds (flock with boid-like behavior) ─────────────────────────
function runBirds(ctx, canvas, isRunning) {
  const NUM_BIRDS = 20;
  const birdChars = ['🐦', '🦅', '🦆', '🦉', '🕊️'];

  const birds = Array.from({ length: NUM_BIRDS }, () => {
    const angle = (Math.random() - 0.5) * 0.4;
    const speed = 0.8 + Math.random() * 1.2;
    const goingRight = Math.random() > 0.3;
    const dir = goingRight ? 1 : -1;
    return {
      x: Math.random() * canvas.width,
      y: 30 + Math.random() * (canvas.height * 0.65),
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed,
      emoji: birdChars[Math.floor(Math.random() * birdChars.length)],
      size: 18 + Math.floor(Math.random() * 12),
      // Wing flap parameters
      flapPhase: Math.random() * Math.PI * 2,
      flapSpeed: 0.07 + Math.random() * 0.05,
      // Soaring state
      state: 'flap', // flap, glide, soar
      stateTimer: 60 + Math.floor(Math.random() * 200),
      glideCooldown: 0,
    };
  });

  // Boid parameters
  const SEPARATION_DIST = 40;
  const ALIGNMENT_DIST = 100;
  const COHESION_DIST = 120;
  const SEPARATION_FORCE = 0.03;
  const ALIGNMENT_FORCE = 0.01;
  const COHESION_FORCE = 0.005;
  const MAX_SPEED = 2.5;
  const MIN_SPEED = 0.4;

  function draw() {
    if (!isRunning()) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply boid rules
    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      let sepX = 0, sepY = 0;
      let alignVx = 0, alignVy = 0, alignCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      for (let j = 0; j < birds.length; j++) {
        if (i === j) continue;
        const other = birds[j];
        const dx = other.x - b.x;
        const dy = other.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Separation — steer away from close neighbors
        if (dist < SEPARATION_DIST && dist > 0) {
          sepX -= dx / dist;
          sepY -= dy / dist;
        }
        // Alignment — match heading of nearby birds
        if (dist < ALIGNMENT_DIST) {
          alignVx += other.vx;
          alignVy += other.vy;
          alignCount++;
        }
        // Cohesion — steer toward center of nearby flock
        if (dist < COHESION_DIST) {
          cohX += other.x;
          cohY += other.y;
          cohCount++;
        }
      }

      // Apply forces
      b.vx += sepX * SEPARATION_FORCE;
      b.vy += sepY * SEPARATION_FORCE;

      if (alignCount > 0) {
        b.vx += (alignVx / alignCount - b.vx) * ALIGNMENT_FORCE;
        b.vy += (alignVy / alignCount - b.vy) * ALIGNMENT_FORCE;
      }

      if (cohCount > 0) {
        const cx = cohX / cohCount;
        const cy = cohY / cohCount;
        b.vx += (cx - b.x) * COHESION_FORCE * 0.01;
        b.vy += (cy - b.y) * COHESION_FORCE * 0.01;
      }

      // Boundary avoidance — soft steering
      const margin = 50;
      if (b.y < margin) b.vy += 0.03;
      if (b.y > canvas.height * 0.75) b.vy -= 0.03;
      if (b.x < margin) b.vx += 0.02;
      if (b.x > canvas.width - margin) b.vx -= 0.02;

      // Behavior state machine
      b.stateTimer--;
      if (b.stateTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.5) {
          b.state = 'flap';
          b.stateTimer = 100 + Math.floor(Math.random() * 250);
          b.flapSpeed = 0.07 + Math.random() * 0.05;
        } else if (roll < 0.8) {
          b.state = 'glide';
          b.stateTimer = 40 + Math.floor(Math.random() * 100);
          b.flapSpeed = 0;
        } else {
          // Soar — rise gently with slow flaps
          b.state = 'soar';
          b.stateTimer = 60 + Math.floor(Math.random() * 120);
          b.vy -= 0.3;
          b.flapSpeed = 0.03;
        }
      }

      // Apply gravity during glide
      if (b.state === 'glide') {
        b.vy += 0.005;
      } else if (b.state === 'soar') {
        b.vy -= 0.008;
      }

      // Clamp speed
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed > MAX_SPEED) {
        b.vx = (b.vx / speed) * MAX_SPEED;
        b.vy = (b.vy / speed) * MAX_SPEED;
      } else if (speed < MIN_SPEED) {
        b.vx = (b.vx / (speed || 1)) * MIN_SPEED;
        b.vy = (b.vy / (speed || 1)) * MIN_SPEED;
      }

      b.x += b.vx;
      b.y += b.vy;
      b.flapPhase += b.flapSpeed;

      // Wrap
      if (b.x > canvas.width + 60) b.x = -50;
      if (b.x < -60) b.x = canvas.width + 50;
      if (b.y > canvas.height + 30) b.y = -20;
      if (b.y < -30) b.y = canvas.height * 0.5;

      // Draw
      const flapOffset = b.state === 'glide' ? 0 : Math.sin(b.flapPhase) * 4;
      const tiltAngle = Math.atan2(b.vy, Math.abs(b.vx)) * 0.3;
      const direction = b.vx >= 0 ? 1 : -1;

      // Subtle shadow
      ctx.globalAlpha = 0.15;
      ctx.font = `${b.size}px serif`;
      ctx.fillText(b.emoji, b.x + 3, b.y + b.size + 5);
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.translate(b.x, b.y + flapOffset);
      ctx.rotate(tiltAngle * direction);
      if (direction < 0) ctx.scale(-1, 1);
      // Slight scale pulsing during flap
      const scaleY = 1 + (b.state !== 'glide' ? Math.sin(b.flapPhase) * 0.05 : 0);
      ctx.scale(1, scaleY);
      ctx.font = `${b.size}px serif`;
      ctx.fillText(b.emoji, 0, 0);
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Fireflies ──────────────────────────────────────────────────────
function runFireflies(ctx, canvas, isRunning) {
  const NUM_FLIES = 40;
  const flies = Array.from({ length: NUM_FLIES }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    glowPhase: Math.random() * Math.PI * 2,
    glowSpeed: 0.02 + Math.random() * 0.04,
    radius: 2 + Math.random() * 2,
    hue: 50 + Math.random() * 30, // warm yellow-green
  }));

  function draw() {
    if (!isRunning()) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const f of flies) {
      // Wander
      f.vx += (Math.random() - 0.5) * 0.1;
      f.vy += (Math.random() - 0.5) * 0.1;
      f.vx = Math.max(-1, Math.min(1, f.vx));
      f.vy = Math.max(-1, Math.min(1, f.vy));
      f.x += f.vx;
      f.y += f.vy;
      f.glowPhase += f.glowSpeed;

      // Wrap
      if (f.x < -10) f.x = canvas.width + 10;
      if (f.x > canvas.width + 10) f.x = -10;
      if (f.y < -10) f.y = canvas.height + 10;
      if (f.y > canvas.height + 10) f.y = -10;

      const glow = 0.3 + Math.sin(f.glowPhase) * 0.5;
      const alpha = Math.max(0, glow);

      // Outer glow
      const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 6);
      gradient.addColorStop(0, `hsla(${f.hue}, 100%, 70%, ${alpha * 0.6})`);
      gradient.addColorStop(1, `hsla(${f.hue}, 100%, 70%, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(f.x - f.radius * 6, f.y - f.radius * 6, f.radius * 12, f.radius * 12);

      // Core
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${f.hue}, 100%, 85%, ${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Cats (lifelike behaviors) ───────────────────────────────────────
function runCats(ctx, canvas, isRunning) {
  const NUM_CATS = 5;
  const catEmojis = ['🐈', '🐱', '🐈‍⬛'];
  const idleEmojis = ['😺', '😸', '😻', '😹', '🙀', '😿', '😽'];
  const sleepEmoji = '😴';
  const groundY = canvas.height * 0.82;

  const cats = Array.from({ length: NUM_CATS }, () => {
    const goingRight = Math.random() > 0.5;
    const baseSpeed = 0.15 + Math.random() * 0.5;
    return {
      x: Math.random() * canvas.width,
      y: groundY,
      vx: 0,
      targetVx: baseSpeed * (goingRight ? 1 : -1),
      emoji: catEmojis[Math.floor(Math.random() * catEmojis.length)],
      size: 26 + Math.floor(Math.random() * 12),
      baseSpeed,
      // Animation phases
      walkPhase: Math.random() * Math.PI * 2,
      walkSpeed: 0.04 + Math.random() * 0.02,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 0.015 + Math.random() * 0.01,
      // Behavior state machine
      state: 'walk', // walk, pause, sit, groom, sleep, pounce, stretch
      stateTimer: 100 + Math.floor(Math.random() * 200),
      // Idle expression during sit/groom
      idleEmoji: null,
      // Stretch/pounce animation
      stretchProgress: 0,
      pounceVy: 0,
      onGround: true,
    };
  });

  const pawPrints = [];
  let frameCount = 0;

  function draw() {
    if (!isRunning()) return;
    frameCount++;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fading paw prints
    for (let i = pawPrints.length - 1; i >= 0; i--) {
      const p = pawPrints[i];
      p.life--;
      if (p.life <= 0) {
        pawPrints.splice(i, 1);
        continue;
      }
      const alpha = (p.life / p.maxLife) * 0.3;
      ctx.font = '8px serif';
      ctx.globalAlpha = alpha;
      ctx.fillText('🐾', p.x, p.y);
    }
    ctx.globalAlpha = 1;

    for (const c of cats) {
      c.stateTimer--;
      c.tailPhase += c.tailSpeed;

      // State machine transitions
      if (c.stateTimer <= 0) {
        const prevState = c.state;
        const roll = Math.random();

        if (prevState === 'sleep') {
          // After sleeping, always stretch first
          c.state = 'stretch';
          c.stateTimer = 60;
          c.stretchProgress = 0;
        } else if (roll < 0.35) {
          c.state = 'walk';
          c.stateTimer = 150 + Math.floor(Math.random() * 350);
          c.targetVx = c.baseSpeed * (Math.random() > 0.5 ? 1 : -1);
          c.walkSpeed = 0.04 + Math.random() * 0.02;
        } else if (roll < 0.5) {
          c.state = 'pause';
          c.stateTimer = 40 + Math.floor(Math.random() * 80);
          c.targetVx = 0;
        } else if (roll < 0.65) {
          c.state = 'sit';
          c.stateTimer = 120 + Math.floor(Math.random() * 250);
          c.targetVx = 0;
          c.idleEmoji = idleEmojis[Math.floor(Math.random() * idleEmojis.length)];
        } else if (roll < 0.78) {
          c.state = 'groom';
          c.stateTimer = 100 + Math.floor(Math.random() * 150);
          c.targetVx = 0;
        } else if (roll < 0.88) {
          c.state = 'sleep';
          c.stateTimer = 200 + Math.floor(Math.random() * 400);
          c.targetVx = 0;
        } else if (roll < 0.95) {
          c.state = 'pounce';
          c.stateTimer = 50;
          c.pounceVy = -3.5 - Math.random() * 1.5;
          c.targetVx = c.baseSpeed * 3 * (Math.sign(c.vx) || 1);
          c.onGround = false;
        } else {
          c.state = 'stretch';
          c.stateTimer = 50 + Math.floor(Math.random() * 30);
          c.stretchProgress = 0;
        }
      }

      // Physics per state
      switch (c.state) {
        case 'walk':
          c.vx += (c.targetVx - c.vx) * 0.03;
          c.walkPhase += c.walkSpeed;
          // Paw prints
          if (frameCount % 30 === 0) {
            pawPrints.push({ x: c.x, y: c.y + 18, life: 200, maxLife: 200 });
            if (pawPrints.length > 60) pawPrints.shift();
          }
          break;

        case 'pause':
          c.vx *= 0.9; // Decelerate
          break;

        case 'sit':
        case 'groom':
        case 'sleep':
          c.vx *= 0.95;
          break;

        case 'pounce':
          c.vx += (c.targetVx - c.vx) * 0.1;
          c.pounceVy += 0.15; // gravity
          c.y += c.pounceVy;
          if (c.y >= groundY) {
            c.y = groundY;
            c.onGround = true;
            c.pounceVy = 0;
            // Land and briefly pause
            c.state = 'pause';
            c.stateTimer = 20 + Math.floor(Math.random() * 40);
            c.targetVx = 0;
          }
          break;

        case 'stretch':
          c.vx *= 0.95;
          c.stretchProgress = Math.min(1, c.stretchProgress + 0.02);
          break;
      }

      c.x += c.vx;

      // Wrap
      if (c.x > canvas.width + 60) c.x = -50;
      if (c.x < -60) c.x = canvas.width + 50;

      // Drawing
      const direction = (c.vx >= 0 ? 1 : -1) || 1;
      let bounce = 0;
      let scaleX = 1;
      let scaleY = 1;

      if (c.state === 'walk') {
        bounce = Math.abs(Math.sin(c.walkPhase)) * 3;
      } else if (c.state === 'stretch') {
        // Elongate horizontally, compress vertically while stretching
        const t = c.stretchProgress;
        const stretchCurve = Math.sin(t * Math.PI); // 0→1→0
        scaleX = 1 + stretchCurve * 0.25;
        scaleY = 1 - stretchCurve * 0.15;
      } else if (c.state === 'pounce' && !c.onGround) {
        // Elongate in air
        scaleX = 1.15;
        scaleY = 0.9;
      }

      // Main body
      ctx.save();
      ctx.translate(c.x, c.y - bounce);
      if (direction < 0) ctx.scale(-1, 1);
      ctx.scale(scaleX, scaleY);
      ctx.font = `${c.size}px serif`;
      ctx.fillText(c.emoji, 0, 0);
      ctx.restore();

      // Tail sway (drawn as a small curve behind the cat)
      const tailSway = Math.sin(c.tailPhase) * 8;
      const tailX = c.x - direction * c.size * 0.5;
      ctx.save();
      ctx.strokeStyle = 'rgba(180, 160, 140, 0.25)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, c.y - bounce - 3);
      ctx.quadraticCurveTo(
        tailX - direction * 10,
        c.y - bounce - 15 + tailSway,
        tailX - direction * 5,
        c.y - bounce - 22 + tailSway * 0.5
      );
      ctx.stroke();
      ctx.restore();

      // State indicators
      if (c.state === 'sit' && c.idleEmoji) {
        // Show expression bubble above cat
        ctx.globalAlpha = 0.6;
        ctx.font = `${Math.floor(c.size * 0.45)}px serif`;
        ctx.fillText(c.idleEmoji, c.x + 5, c.y - c.size * 0.7 - bounce);
        ctx.globalAlpha = 1;
      } else if (c.state === 'groom') {
        // Tiny sparkles for grooming
        if (frameCount % 8 < 4) {
          ctx.font = `${Math.floor(c.size * 0.3)}px serif`;
          ctx.globalAlpha = 0.5;
          ctx.fillText('✨', c.x + (Math.random() - 0.5) * 10, c.y - c.size * 0.3 - bounce);
          ctx.globalAlpha = 1;
        }
      } else if (c.state === 'sleep') {
        // Zzz floating up
        const zzPhase = (frameCount % 120) / 120;
        ctx.globalAlpha = 0.4 * (1 - zzPhase);
        ctx.font = `${Math.floor(c.size * 0.35 + zzPhase * 4)}px serif`;
        ctx.fillText(sleepEmoji, c.x + 8, c.y - c.size * 0.5 - zzPhase * 25);
        ctx.globalAlpha = 1;
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ─── DNA Helix ──────────────────────────────────────────────────────
function runDNA(ctx, canvas, isRunning) {
  let offset = 0;

  const colors = [
    ['#ff6b6b', '#4ecdc4'],
    ['#a855f7', '#f59e0b'],
  ];

  function draw() {
    if (!isRunning()) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    offset += 0.02;
    const cx = canvas.width / 2;
    const amplitude = Math.min(canvas.width * 0.25, 80);
    const verticalSpacing = 20;
    const numNodes = Math.ceil(canvas.height / verticalSpacing) + 2;

    for (let i = 0; i < numNodes; i++) {
      const y = i * verticalSpacing;
      const phase = offset + i * 0.3;
      const x1 = cx + Math.sin(phase) * amplitude;
      const x2 = cx + Math.sin(phase + Math.PI) * amplitude;
      const depth1 = (Math.cos(phase) + 1) / 2;
      const depth2 = (Math.cos(phase + Math.PI) + 1) / 2;

      const pair = colors[i % 2];

      // Connecting bar
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Strand 1 node
      const size1 = 2 + depth1 * 4;
      ctx.beginPath();
      ctx.arc(x1, y, size1, 0, Math.PI * 2);
      ctx.fillStyle = pair[0];
      ctx.globalAlpha = 0.3 + depth1 * 0.7;
      ctx.fill();

      // Strand 2 node
      const size2 = 2 + depth2 * 4;
      ctx.beginPath();
      ctx.arc(x2, y, size2, 0, Math.PI * 2);
      ctx.fillStyle = pair[1];
      ctx.globalAlpha = 0.3 + depth2 * 0.7;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  draw();
}

// ─── Sleeping Cat (canvas-drawn chibi style) ────────────────────────
function runSleepyCat(ctx, canvas, isRunning) {
  let time = 0;

  // Eye state machine
  let eyeState = 'closed'; // closed, opening, open, closing
  let eyeOpenness = 0; // 0 = closed, 1 = fully open
  let eyeTimer = 300 + Math.floor(Math.random() * 500); // frames until next eye event
  let blinkTimer = 0;

  // Head movement
  let headTargetAngle = 0;
  let headAngle = 0;
  let headTargetY = 0;
  let headOffsetY = 0;
  let headMoveTimer = 200 + Math.floor(Math.random() * 300);

  // Tail state
  let tailCurl = 0;
  let tailTargetCurl = 0;
  let tailFlickTimer = 150 + Math.floor(Math.random() * 200);
  let tailFlicking = false;

  // Ear twitch
  let earTwitchL = 0;
  let earTwitchR = 0;
  let earTimer = 100 + Math.floor(Math.random() * 300);

  function draw() {
    if (!isRunning()) return;
    time += 0.016;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = Math.min(canvas.width / 400, canvas.height / 300) * 0.85;

    ctx.save();
    ctx.translate(cx, cy + 20 * scale);
    ctx.scale(scale, scale);

    // Breathing
    const breathe = Math.sin(time * 1.2) * 0.015;
    const breatheY = Math.sin(time * 1.2) * 2;

    // ── Update eye state machine ──
    eyeTimer--;
    if (eyeState === 'closed' && eyeTimer <= 0) {
      eyeState = 'opening';
      eyeTimer = 0;
    } else if (eyeState === 'opening') {
      eyeOpenness += 0.04;
      if (eyeOpenness >= 1) {
        eyeOpenness = 1;
        eyeState = 'open';
        eyeTimer = 60 + Math.floor(Math.random() * 120); // stay open a bit
      }
    } else if (eyeState === 'open') {
      eyeTimer--;
      // Blink while open
      blinkTimer--;
      if (blinkTimer <= 0) {
        blinkTimer = 25 + Math.floor(Math.random() * 40);
      }
      if (eyeTimer <= 0) {
        eyeState = 'closing';
      }
    } else if (eyeState === 'closing') {
      eyeOpenness -= 0.03;
      if (eyeOpenness <= 0) {
        eyeOpenness = 0;
        eyeState = 'closed';
        eyeTimer = 400 + Math.floor(Math.random() * 600);
      }
    }

    // Blink dip (quick close-open while eyes are open)
    let blinkDip = 0;
    if (eyeState === 'open' && blinkTimer > 15 && blinkTimer < 25) {
      blinkDip = 1 - Math.abs(blinkTimer - 20) / 5;
    }
    const effectiveOpenness = Math.max(0, eyeOpenness - blinkDip * 0.9);

    // ── Update head movement ──
    headMoveTimer--;
    if (headMoveTimer <= 0) {
      headTargetAngle = (Math.random() - 0.5) * 0.12;
      headTargetY = (Math.random() - 0.5) * 4;
      headMoveTimer = 150 + Math.floor(Math.random() * 400);
    }
    headAngle += (headTargetAngle - headAngle) * 0.01;
    headOffsetY += (headTargetY - headOffsetY) * 0.01;

    // ── Update tail ──
    tailFlickTimer--;
    if (tailFlickTimer <= 0) {
      if (!tailFlicking) {
        tailFlicking = true;
        tailTargetCurl = (Math.random() - 0.3) * 25;
        tailFlickTimer = 15 + Math.floor(Math.random() * 30);
      } else {
        tailFlicking = false;
        tailTargetCurl = Math.sin(time * 0.3) * 5;
        tailFlickTimer = 80 + Math.floor(Math.random() * 250);
      }
    }
    tailCurl += (tailTargetCurl - tailCurl) * (tailFlicking ? 0.15 : 0.02);
    const tailBase = Math.sin(time * 0.6) * 5;
    const tailWag = tailBase + tailCurl;

    // ── Update ear twitch ──
    earTimer--;
    if (earTimer <= 0) {
      const side = Math.random();
      if (side < 0.4) earTwitchL = 5 + Math.random() * 5;
      else if (side < 0.8) earTwitchR = 5 + Math.random() * 5;
      else { earTwitchL = 4; earTwitchR = 4; }
      earTimer = 80 + Math.floor(Math.random() * 350);
    }
    earTwitchL *= 0.9;
    earTwitchR *= 0.9;

    // ── Shadow ──
    ctx.beginPath();
    ctx.ellipse(0, 62, 120, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();

    // ── Tail ──
    ctx.save();
    ctx.translate(85, 30 + breatheY * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(30, -15 + tailWag, 55, -35 + tailWag, 50, -55 + tailWag * 0.5);
    ctx.bezierCurveTo(48, -65 + tailWag * 0.5, 35, -60 + tailWag * 0.3, 40, -50 + tailWag * 0.5);
    ctx.bezierCurveTo(45, -35 + tailWag, 25, -10 + tailWag, 5, 8);
    ctx.fillStyle = '#b0b0b0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(47, -57 + tailWag * 0.5, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#808080';
    ctx.fill();
    ctx.restore();

    // ── Back leg ──
    ctx.save();
    ctx.translate(0, breatheY * 0.5);
    ctx.beginPath();
    ctx.ellipse(55, 52, 20, 10, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#e8e8e8';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(72, 55, 10, 7, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f5c6cb';
    ctx.fill();
    ctx.restore();

    // ── Body ──
    ctx.save();
    ctx.scale(1 + breathe, 1 - breathe * 0.7);
    ctx.translate(0, breatheY);
    ctx.beginPath();
    ctx.ellipse(15, 20, 95, 50, -0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(40, 0, 45, 28, -0.1, -0.3, Math.PI * 0.8);
    ctx.fillStyle = '#b0b0b0';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(60, 15, 20, 18, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#a0a0a0';
    ctx.fill();
    ctx.restore();

    // ── Head (with rotation and vertical movement) ──
    ctx.save();
    ctx.translate(-60, -10 + breatheY * 0.8 + headOffsetY);
    ctx.rotate(headAngle);

    // Head shape
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#f5f5f5';
    ctx.fill();
    // Gray head patch
    ctx.beginPath();
    ctx.arc(5, -20, 30, Math.PI * 1.15, Math.PI * 1.95);
    ctx.bezierCurveTo(-25, -40, 15, -50, 30, -30);
    ctx.fillStyle = '#b0b0b0';
    ctx.fill();

    // ── Ears (with twitch) ──
    // Left ear
    ctx.beginPath();
    ctx.moveTo(-28, -35);
    ctx.lineTo(-40 - earTwitchL * 0.5, -68 - earTwitchL);
    ctx.lineTo(-12, -45);
    ctx.closePath();
    ctx.fillStyle = '#b0b0b0';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-27, -38);
    ctx.lineTo(-36 - earTwitchL * 0.3, -62 - earTwitchL * 0.8);
    ctx.lineTo(-16, -44);
    ctx.closePath();
    ctx.fillStyle = '#f5a0b0';
    ctx.fill();

    // Right ear
    ctx.beginPath();
    ctx.moveTo(28, -35);
    ctx.lineTo(42 + earTwitchR * 0.5, -68 - earTwitchR);
    ctx.lineTo(12, -45);
    ctx.closePath();
    ctx.fillStyle = '#909090';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(27, -38);
    ctx.lineTo(38 + earTwitchR * 0.3, -62 - earTwitchR * 0.8);
    ctx.lineTo(16, -44);
    ctx.closePath();
    ctx.fillStyle = '#f5a0b0';
    ctx.fill();

    // ── Eyes ──
    if (effectiveOpenness < 0.05) {
      // Fully closed — curved lines
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#555';
      ctx.beginPath();
      ctx.arc(-16, 2, 8, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(16, 2, 8, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else {
      // Open / partially open eyes
      const eyeH = effectiveOpenness * 10; // max height 10
      const pupilSize = 3 + effectiveOpenness * 2;

      // Left eye white
      ctx.beginPath();
      ctx.ellipse(-16, 2, 9, eyeH * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Left pupil
      ctx.beginPath();
      ctx.ellipse(-16, 2, pupilSize, pupilSize * 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#3a6';
      ctx.fill();
      // Inner pupil
      ctx.beginPath();
      ctx.ellipse(-16, 2, pupilSize * 0.45, pupilSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      // Eye shine
      ctx.beginPath();
      ctx.arc(-14, 0, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Right eye white
      ctx.beginPath();
      ctx.ellipse(16, 2, 9, eyeH * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Right pupil
      ctx.beginPath();
      ctx.ellipse(16, 2, pupilSize, pupilSize * 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#3a6';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(16, 2, pupilSize * 0.45, pupilSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(18, 0, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Sleepy eyelids (drooping from top)
      const lidDroop = (1 - effectiveOpenness) * 12;
      ctx.fillStyle = '#f5f5f5';
      ctx.beginPath();
      ctx.ellipse(-16, 2 - eyeH * 0.5 + lidDroop * 0.3, 10, lidDroop, 0, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(16, 2 - eyeH * 0.5 + lidDroop * 0.3, 10, lidDroop, 0, 0, Math.PI);
      ctx.fill();
    }

    // Blush
    ctx.beginPath();
    ctx.ellipse(-28, 12, 12, 8, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 150, 170, 0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(28, 12, 12, 8, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 150, 170, 0.35)';
    ctx.fill();

    // Nose
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(-4, 7);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fillStyle = '#f5a0b0';
    ctx.fill();

    // Mouth
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    ctx.quadraticCurveTo(-3, 18, 0, 14);
    ctx.quadraticCurveTo(3, 18, 6, 14);
    ctx.stroke();

    // Whiskers
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.beginPath(); ctx.moveTo(-25, 8); ctx.lineTo(-50, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-25, 12); ctx.lineTo(-52, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-25, 16); ctx.lineTo(-48, 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(25, 8); ctx.lineTo(50, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(25, 12); ctx.lineTo(52, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(25, 16); ctx.lineTo(48, 22); ctx.stroke();

    ctx.restore(); // head

    // ── Front paws ──
    ctx.save();
    ctx.translate(-60, breatheY * 0.8);
    ctx.beginPath();
    ctx.ellipse(-20, 40, 14, 9, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-22, 43, 5, 4, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#f5c0cc';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(22, 40, 14, 9, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(24, 43, 5, 4, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#f5c0cc';
    ctx.fill();
    ctx.restore();

    // ── Sleep bubble ──
    const droolSize = 3 + Math.sin(time * 0.8) * 2;
    const showBubble = eyeState === 'closed';
    if (showBubble) {
      ctx.beginPath();
      ctx.arc(-72, 16 + breatheY * 0.8 + headOffsetY, Math.max(1, droolSize), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 220, 250, 0.5)';
      ctx.fill();
    }

    // ── Zzz (positioned near head, only when eyes closed) ──
    if (eyeState === 'closed') {
      for (let i = 0; i < 3; i++) {
        const zPhase = (time * 0.5 + i * 1.2) % 3.5;
        if (zPhase > 3) continue;
        const t = zPhase / 3;
        const zx = -30 + i * 8 + Math.sin(time * 0.7 + i) * 6;
        const zy = -45 - t * 50 + breatheY + headOffsetY;
        const zAlpha = (1 - t) * 0.55;
        const zSize = 9 + t * 7 + i * 2;
        ctx.font = `bold ${zSize}px monospace`;
        ctx.fillStyle = `rgba(180, 200, 255, ${zAlpha})`;
        ctx.fillText('Z', zx, zy);
      }
    }

    ctx.restore();
    requestAnimationFrame(draw);
  }

  draw();
}
