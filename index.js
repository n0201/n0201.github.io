(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     Toast helper
     ============================================================ */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2600);
  }

  /* ============================================================
     Typewriter
     ============================================================ */
  var phrases = [
    'N0201',
    'All my links at one place',
    'sudo mka bacon',
    'nohello.com!',
    'When new bliss build?',
    'Welcome!',
    'Connect with me \u2192'
  ];

  function startTypewriter() {
    var el = document.getElementById('typewriter');
    if (!el) return;

    if (prefersReducedMotion) {
      el.textContent = phrases[0];
      return;
    }

    var phraseIndex = 0;
    var letterIndex = 0;
    var isDeleting = false;

    function tick() {
      var current = phrases[phraseIndex];
      el.textContent = current.substring(0, letterIndex);

      if (!isDeleting && letterIndex < current.length) {
        letterIndex++;
        setTimeout(tick, 70);
      } else if (isDeleting && letterIndex > 0) {
        letterIndex--;
        setTimeout(tick, 35);
      } else if (!isDeleting) {
        isDeleting = true;
        setTimeout(tick, 1800);
      } else {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(tick, 600);
      }
    }

    tick();
  }

  /* ============================================================
     Clipboard helper (shared by the profile-link button and the
     per-card copy chips), with an execCommand fallback for older
     browsers without the async Clipboard API
     ============================================================ */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text) ? Promise.resolve() : Promise.reject();
      });
    }
    return legacyCopy(text) ? Promise.resolve() : Promise.reject();
  }

  function legacyCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }

  function initCopyButton() {
    var btn = document.getElementById('copyLinkBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      copyText(window.location.href).then(function () {
        showToast('Link copied to clipboard');
      }).catch(function () {
        showToast('Copy failed — copy the URL manually');
      });
    });
  }

  function initCopyChips() {
    var chips = document.querySelectorAll('.copy-chip');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var url = chip.getAttribute('data-url');
        var label = chip.getAttribute('data-label') || 'Link';
        if (!url) return;
        copyText(url).then(function () {
          showToast(label + ' copied');
        }).catch(function () {
          showToast('Copy failed — copy the URL manually');
        });
      });
    });
  }

  /* ============================================================
     Session uptime (playful footer status)
     ============================================================ */
  function initUptime() {
    var el = document.getElementById('uptime');
    if (!el) return;
    var start = Date.now();

    function pad(n) {
      return n < 10 ? '0' + n : '' + n;
    }

    function tick() {
      var diff = Math.floor((Date.now() - start) / 1000);
      var h = pad(Math.floor(diff / 3600));
      var m = pad(Math.floor((diff % 3600) / 60));
      var s = pad(diff % 60);
      el.textContent = 'uptime ' + h + ':' + m + ':' + s;
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ============================================================
     Red dot easter egg
     ============================================================ */
  function initDotEasterEgg() {
    var dot = document.getElementById('dotRed');
    if (!dot) return;

    dot.addEventListener('click', function () {
      dot.classList.remove('shake');
      void dot.offsetWidth; // restart animation on repeated clicks
      dot.classList.add('shake');
      showToast("Nice try — this isn't a real terminal.");
    });
  }

  /* ============================================================
     Konami code -> hands off to the starfield's warp mode
     ============================================================ */
  function initKonamiCode(starfieldApi) {
    var sequence = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    var pos = 0;

    document.addEventListener('keydown', function (e) {
      var key = e.key ? e.key.toLowerCase() : '';
      if (key === sequence[pos]) {
        pos++;
        if (pos === sequence.length) {
          pos = 0;
          showToast('\uD83D\uDE80 Hyperspace engaged');
          if (starfieldApi) starfieldApi.triggerWarp();
        }
      } else {
        pos = key === sequence[0] ? 1 : 0;
      }
    });
  }

  /* ============================================================
     Magnetic card tilt (desktop / fine pointers only)
     ============================================================ */
  function initMagneticCards() {
    var isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer || prefersReducedMotion) return;

    var EASE_OUT = 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease';
    var EASE_BACK = 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease';

    document.querySelectorAll('.link-item').forEach(function (item) {
      var rect = null;
      var pending = null;
      var ticking = false;

      function apply() {
        ticking = false;
        if (!pending || !rect) return;
        var px = (pending.x - rect.left) / rect.width;
        var py = (pending.y - rect.top) / rect.height;
        var rotateY = (px - 0.5) * 16;
        var rotateX = (0.5 - py) * 16;
        item.style.transform =
          'perspective(600px) translateY(-8px) scale(1.06) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg)';
      }

      item.addEventListener('pointerenter', function () {
        rect = item.getBoundingClientRect();
        item.style.transition = EASE_OUT;
      });

      item.addEventListener('pointermove', function (e) {
        pending = { x: e.clientX, y: e.clientY };
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(apply);
        }
      });

      item.addEventListener('pointerleave', function () {
        item.style.transition = EASE_BACK;
        item.style.transform = '';
        rect = null;
        pending = null;
      });
    });
  }

  /* ============================================================
     Whole-profile QR toggle — generated entirely client-side, so
     the URL never leaves the browser via a third-party QR API
     ============================================================ */
  function initQrToggle() {
    var btn = document.getElementById('qrToggleBtn');
    var panel = document.getElementById('qrPanel');
    var holder = document.getElementById('qrCode');
    if (!btn || !panel || !holder) return;

    if (typeof qrcode !== 'function') {
      btn.style.display = 'none';
      return;
    }

    var generated = false;

    function generate() {
      if (generated) return;
      try {
        var qr = qrcode(0, 'M');
        qr.addData(window.location.href);
        qr.make();
        holder.innerHTML = qr.createSvgTag(4, 2);
        generated = true;
      } catch (err) {
        btn.style.display = 'none';
      }
    }

    btn.addEventListener('click', function () {
      var isOpen = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) generate();
    });
  }

  /* ============================================================
     Per-card QR popover — one shared popover element, repositioned
     and regenerated for whichever card's QR chip was clicked
     ============================================================ */
  function initQrChips() {
    var chips = document.querySelectorAll('.qr-chip');
    if (!chips.length) return;

    if (typeof qrcode !== 'function') {
      chips.forEach(function (chip) {
        chip.style.display = 'none';
      });
      return;
    }

    var popover = document.getElementById('qrPopover');
    var holder = document.getElementById('qrPopoverCode');
    var caption = document.getElementById('qrPopoverCaption');
    var closeBtn = document.getElementById('qrPopoverClose');
    if (!popover || !holder || !caption || !closeBtn) return;

    var activeChip = null;

    function positionPopover(chip) {
      var rect = chip.getBoundingClientRect();
      var popRect = popover.getBoundingClientRect();
      var popWidth = popRect.width || 220;
      var popHeight = popRect.height || 220;

      var left = rect.left + rect.width / 2 - popWidth / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - popWidth - 8));

      var top = rect.bottom + 10;
      if (top + popHeight > window.innerHeight - 8) {
        top = rect.top - popHeight - 10;
      }
      top = Math.max(8, top);

      popover.style.left = left + 'px';
      popover.style.top = top + 'px';
    }

    function closePopover(refocus) {
      if (activeChip) activeChip.setAttribute('aria-expanded', 'false');
      var chipToRefocus = activeChip;
      popover.classList.remove('open');
      popover.setAttribute('aria-hidden', 'true');
      activeChip = null;
      if (refocus && chipToRefocus) chipToRefocus.focus();
    }

    function openPopoverFor(chip) {
      if (activeChip) activeChip.setAttribute('aria-expanded', 'false');

      var url = chip.getAttribute('data-url');
      var label = chip.getAttribute('data-label') || 'Link';
      if (!url) return;

      try {
        var qr = qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        holder.innerHTML = qr.createSvgTag(3, 2);
      } catch (err) {
        return;
      }

      caption.textContent = label;
      activeChip = chip;
      positionPopover(chip);
      popover.classList.add('open');
      popover.setAttribute('aria-hidden', 'false');
      chip.setAttribute('aria-expanded', 'true');
      closeBtn.focus();
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (activeChip === chip) {
          closePopover(true);
        } else {
          openPopoverFor(chip);
        }
      });
    });

    closeBtn.addEventListener('click', function () {
      closePopover(true);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activeChip) closePopover(true);
    });

    document.addEventListener('click', function (e) {
      if (!activeChip) return;
      if (popover.contains(e.target) || e.target === activeChip || activeChip.contains(e.target)) return;
      closePopover(false);
    });

    window.addEventListener('resize', function () {
      if (activeChip) positionPopover(activeChip);
    });
  }

  /* ============================================================
     Cursor glow (desktop only)
     ============================================================ */
  function initCursorGlow() {
    var isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer || prefersReducedMotion) return;

    var glow = document.createElement('div');
    glow.id = 'cursorGlow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    var raf = null;
    var x = -100;
    var y = -100;
    var scale = 1;

    function render() {
      raf = null;
      glow.style.transform = 'translate3d(' + (x - 14) + 'px,' + (y - 14) + 'px,0) scale(' + scale + ')';
    }

    window.addEventListener('pointermove', function (e) {
      x = e.clientX;
      y = e.clientY;
      glow.classList.add('visible');
      if (!raf) raf = requestAnimationFrame(render);
    });

    document.addEventListener('pointerover', function (e) {
      if (e.target.closest && e.target.closest('a, button')) {
        glow.classList.add('hover');
        scale = 1.8;
      }
    });

    document.addEventListener('pointerout', function (e) {
      if (e.target.closest && e.target.closest('a, button')) {
        glow.classList.remove('hover');
        scale = 1;
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (!e.relatedTarget) glow.classList.remove('visible');
    });
  }

  /* ============================================================
     Keyboard shortcuts
     ============================================================ */
  function initKeyboardShortcuts() {
    var overlay = document.getElementById('shortcutsOverlay');
    var closeBtn = document.getElementById('shortcutsClose');
    var copyBtn = document.getElementById('copyLinkBtn');
    var qrToggleBtn = document.getElementById('qrToggleBtn');

    var linkMap = {
      g: 'https://github.com/n0201',
      t: 'https://t.me/max_n0201',
      b: 'https://t.me/BlissSupportCupid',
      x: 'https://x.com/n0201Git'
    };

    function isTypingContext(target) {
      var tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      return tag === 'input' || tag === 'textarea' || (target && target.isContentEditable);
    }

    function toggleOverlay(force) {
      if (!overlay) return;
      var show = typeof force === 'boolean' ? force : !overlay.classList.contains('open');
      overlay.classList.toggle('open', show);
      overlay.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingContext(e.target)) return;

      if (e.key === '?') {
        toggleOverlay();
        return;
      }
      if (e.key === 'Escape') {
        toggleOverlay(false);
        return;
      }

      var lower = e.key.toLowerCase();
      if (linkMap[lower]) {
        window.open(linkMap[lower], '_blank', 'noopener,noreferrer');
        return;
      }
      if (lower === 'c' && copyBtn) {
        copyBtn.click();
        return;
      }
      if (lower === 'q' && qrToggleBtn) {
        qrToggleBtn.click();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        toggleOverlay(false);
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) toggleOverlay(false);
      });
    }
  }

  /* ============================================================
     Init
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    var starfieldApi = window.initStarfield ? window.initStarfield('bg-canvas') : null;

    startTypewriter();
    initCopyButton();
    initCopyChips();
    initUptime();
    initDotEasterEgg();
    initKonamiCode(starfieldApi);
    initQrToggle();
    initQrChips();
    initMagneticCards();
    initCursorGlow();
    initKeyboardShortcuts();
  });

  console.log(
    '%c\uD83D\uDC4B hey — check out the code on GitHub: https://github.com/n0201',
    'color:#1DEDA2;font-weight:bold;font-family:monospace;font-size:13px;'
  );
})();
