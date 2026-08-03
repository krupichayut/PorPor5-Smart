import { useEffect, useRef } from 'react';

const HeroWave = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Accessibility & Performance check: respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height, imageData, data;
    const SCALE = 2;
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      width = Math.floor(canvas.width / SCALE);
      height = Math.floor(canvas.height / SCALE);
      imageData = ctx.createImageData(width, height);
      data = imageData.data;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const startTime = performance.now(); // High resolution time

    const SIN_TABLE = new Float32Array(1024);
    const COS_TABLE = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const angle = (i / 1024) * Math.PI * 2;
      SIN_TABLE[i] = Math.sin(angle);
      COS_TABLE[i] = Math.cos(angle);
    }

    const TWO_PI = Math.PI * 2;
    const fastSin = (x) => {
      let modX = x % TWO_PI;
      if (modX < 0) modX += TWO_PI;
      const index = Math.floor((modX / TWO_PI) * 1024) & 1023;
      return SIN_TABLE[index];
    };

    const fastCos = (x) => {
      let modX = x % TWO_PI;
      if (modX < 0) modX += TWO_PI;
      const index = Math.floor((modX / TWO_PI) * 1024) & 1023;
      return COS_TABLE[index];
    };

    const render = () => {
      const time = (performance.now() - startTime) * 0.001;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const u_x = (2 * x - width) / height;
          const u_y = (2 * y - height) / height;

          let a = 0;
          let d = 0;

          for (let i = 0; i < 4; i++) {
            a += fastCos(i - d + time * 0.5 - a * u_x);
            d += fastSin(i * u_y + a);
          }

          const wave = (fastSin(a) + fastCos(d)) * 0.5;
          const intensity = 0.3 + 0.4 * wave;
          // Subtler, more elegant base colors for Boutique Studio theme
          const baseVal = 0.05 + 0.1 * fastCos(u_x + u_y + time * 0.3);
          const blueAccent = 0.15 * fastSin(a * 1.5 + time * 0.2);
          const purpleAccent = 0.1 * fastCos(d * 2 + time * 0.1);

          const r = Math.max(0, Math.min(1, baseVal + purpleAccent * 0.8)) * intensity;
          const g = Math.max(0, Math.min(1, baseVal + blueAccent * 0.6)) * intensity;
          const b = Math.max(0, Math.min(1, baseVal + blueAccent * 1.2 + purpleAccent * 0.4)) * intensity;

          const index = (y * width + x) * 4;
          data[index] = r * 255;
          data[index + 1] = g * 255;
          data[index + 2] = b * 255;
          data[index + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      if (SCALE > 1) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(canvas, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId); // Fix memory leak
    };
  }, []);

  return <canvas 
    ref={canvasRef} 
    aria-hidden="true"
    role="presentation"
    style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: -10 }} 
  />;
};

export default HeroWave;
