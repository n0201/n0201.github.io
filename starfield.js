/* Shared canvas starfield background.
   Exposes window.initStarfield(canvasId) -> { triggerWarp() }
   Used by both index.html and 404.html so the two pages share one
   background engine instead of duplicating it. */
(function () {
  'use strict';

  function initStarfield(canvasId) {
    var canvas = document.getElementById(canvasId || 'bg-canvas');
    if (!canvas || !canvas.getContext) {
      return { triggerWarp: function () {} };
    }

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    var ctx = canvas.getContext('2d');
    var width = 0;
    var height = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var layers = [];
    var shootingStar = null;
    var nextShootAt = 0;
    var pointerX = 0.5;
    var pointerY = 0.5;
    var rafId = null;
    var running = false;
    var warpUntil = 0;

    var LAYER_CONFIG = [
      { count: 60, speed: 0.010, radius: [0.4, 1.0], parallax: 6, colors: ['255,255,255', '29,237,162'] },
      { count: 40, speed: 0.022, radius: [0.7, 1.5], parallax: 14, colors: ['0,212,255', '255,255,255'] },
      { count: 22, speed: 0.038, radius: [1.0, 2.0], parallax: 26, colors: ['255,61,135', '29,237,162'] }
    ];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildLayers();
    }

    function buildLayers() {
      layers = LAYER_CONFIG.map(function (cfg) {
        var stars = [];
        for (var i = 0; i < cfg.count; i++) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: cfg.radius[0] + Math.random() * (cfg.radius[1] - cfg.radius[0]),
            color: cfg.colors[Math.random() < 0.7 ? 0 : 1],
            phase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.5 + Math.random() * 1.2
          });
        }
        return { stars: stars, speed: cfg.speed, parallax: cfg.parallax };
      });
    }

    function maybeSpawnShootingStar(time) {
      if (shootingStar || time < nextShootAt) return;
      shootingStar = {
        x: Math.random() * width * 0.6,
        y: Math.random() * height * 0.3,
        vx: 6 + Math.random() * 4,
        vy: 3 + Math.random() * 2,
        life: 0,
        maxLife: 40
      };
    }

    function drawShootingStar() {
      if (!shootingStar) return;
      shootingStar.x += shootingStar.vx;
      shootingStar.y += shootingStar.vy;
      shootingStar.life++;

      var alpha = 1 - shootingStar.life / shootingStar.maxLife;
      if (alpha <= 0) {
        shootingStar = null;
        nextShootAt = performance.now() + 4000 + Math.random() * 6000;
        return;
      }

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(29,237,162,0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(shootingStar.x - shootingStar.vx * 4, shootingStar.y - shootingStar.vy * 4);
      ctx.stroke();
      ctx.restore();
    }

    function drawFrame(time) {
      ctx.clearRect(0, 0, width, height);

      var warping = !prefersReducedMotion && time < warpUntil;
      var offsetX = (pointerX - 0.5) * 2;
      var offsetY = (pointerY - 0.5) * 2;

      layers.forEach(function (layer) {
        var speed = warping ? layer.speed * 45 : layer.speed;

        layer.stars.forEach(function (star) {
          star.y += speed;
          if (star.y > height + 4) {
            star.y = -4;
            star.x = Math.random() * width;
          }

          var px = star.x + offsetX * layer.parallax;
          var py = star.y + offsetY * layer.parallax;

          if (warping) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(' + star.color + ',0.85)';
            ctx.lineWidth = star.r;
            ctx.moveTo(px, py);
            ctx.lineTo(px, py - speed * 3);
            ctx.stroke();
            return;
          }

          var twinkle = prefersReducedMotion
            ? 0.7
            : 0.55 + 0.45 * Math.sin(star.phase + time * 0.0015 * star.twinkleSpeed);

          ctx.beginPath();
          ctx.fillStyle = 'rgba(' + star.color + ',' + twinkle.toFixed(3) + ')';
          ctx.arc(px, py, star.r, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      if (!prefersReducedMotion && !warping) {
        maybeSpawnShootingStar(time);
        drawShootingStar();
      }
    }

    function loop(time) {
      if (!running) return;
      drawFrame(time);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    function triggerWarp() {
      if (prefersReducedMotion) return;
      warpUntil = performance.now() + 2200;
      if (!running) start();
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    if (isFinePointer && !prefersReducedMotion) {
      window.addEventListener('pointermove', function (e) {
        pointerX = e.clientX / width;
        pointerY = e.clientY / height;
      });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stop();
      } else if (!prefersReducedMotion) {
        start();
      }
    });

    resize();
    nextShootAt = performance.now() + 3000;

    if (prefersReducedMotion) {
      drawFrame(0); // single static frame, no animation loop
    } else {
      start();
    }

    return { triggerWarp: triggerWarp };
  }

  window.initStarfield = initStarfield;
})();
