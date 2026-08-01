(function () {
  "use strict";

  // Navbar: add scrolled state
  var navbar = document.getElementById("navbar");
  var heroContent = document.querySelector(".hero-content");
  var heroScrollEl = document.querySelector(".hero-scroll");
  var backTop = document.getElementById("backTop");
  function onScroll() {
    var y = window.scrollY;
    if (navbar) {
      navbar.classList.toggle("scrolled", y > 24);
    }
    // Hero exit choreography: content drifts up and fades as you scroll away
    if (heroContent) {
      var vh = window.innerHeight;
      var p = Math.min(y / vh, 1);
      heroContent.style.opacity = String(Math.max(1 - p * 1.4, 0));
      heroContent.style.transform = "translateY(" + p * 90 + "px)";
      if (heroScrollEl) {
        heroScrollEl.style.opacity = String(Math.max(1 - p * 3, 0));
      }
    }
    if (backTop) {
      backTop.classList.toggle("show", y > 600);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  var toggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function closeNav() {
    if (navLinks) navLinks.classList.remove("open");
    if (toggle) toggle.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Close nav when a link is clicked
  if (navLinks) {
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeNav();
    });
  }

  // Scrollspy: highlight active section in nav
  var spySections = document.querySelectorAll("section[id]");
  var spyLinks = document.querySelectorAll(".nav-links a");
  function spy() {
    var pos = window.scrollY + 140;
    var current = "home";
    spySections.forEach(function (sec) {
      if (pos >= sec.offsetTop) current = sec.id;
    });
    spyLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + current);
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  // Scroll reveal
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  // Scroll progress bar
  var progress = document.getElementById("scrollProgress");
  function onProgress() {
    if (!progress) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onProgress, { passive: true });
  window.addEventListener("resize", onProgress);
  onProgress();

  // Feature detection for pointer type + motion prefs
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var canAnimate = finePointer.matches && !reduceMotion.matches;

  // Back to top rocket
  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  }

  // Mission-control preloader
  var preloader = document.getElementById("preloader");
  var preloaderFill = document.getElementById("preloaderFill");
  var preloaderPct = document.getElementById("preloaderPct");
  var preloaderStatus = document.getElementById("preloaderStatus");
  var statusSteps = [
    [8, "ESTABLISHING UPLINK"],
    [26, "CALIBRATING THRUSTERS"],
    [48, "SYNCING 600+ CADETS"],
    [70, "COMPILING PROJECTS"],
    [90, "ARMING IGNITION"],
    [100, "LIFTOFF — WELCOME ABOARD"]
  ];
  function finishPreload() {
    document.body.classList.remove("is-loading");
    document.body.classList.add("loaded");
    if (preloader) preloader.classList.add("done");
  }
  if (preloader && !reduceMotion.matches) {
    document.body.classList.add("is-loading");
    var preStart = null;
    var preDur = 1600;
    function pad3(n) {
      var s = String(n);
      while (s.length < 3) s = "0" + s;
      return s;
    }
    function preloaderStep(ts) {
      if (!preStart) preStart = ts;
      var p = Math.min((ts - preStart) / preDur, 1);
      var eased = 1 - Math.pow(1 - p, 2);
      var val = Math.round(eased * 100);
      if (preloaderFill) preloaderFill.style.width = val + "%";
      if (preloaderPct) preloaderPct.textContent = pad3(val) + "%";
      for (var i = 0; i < statusSteps.length; i++) {
        if (val >= statusSteps[i][0] && preloaderStatus) {
          preloaderStatus.textContent = statusSteps[i][1];
        }
      }
      if (p < 1) {
        requestAnimationFrame(preloaderStep);
      } else {
        finishPreload();
      }
    }
    requestAnimationFrame(preloaderStep);
    window.setTimeout(finishPreload, 5000);
  } else {
    finishPreload();
  }

  // Interactive depth starfield + shooting stars
  var spaceCanvas = document.getElementById("spaceCanvas");
  if (spaceCanvas && spaceCanvas.getContext) {
    var ctx = spaceCanvas.getContext("2d");
    var SW = 0, SH = 0;
    var SDPR = Math.min(window.devicePixelRatio || 1, 2);
    var stars = [];
    var shooting = [];
    var spaceMouseX = 0, spaceMouseY = 0;
    var nextShoot = 0;
    var spaceRunning = !reduceMotion.matches;

    function makeStar() {
      return {
        x: Math.random() * SW,
        y: Math.random() * SH,
        z: Math.random(),
        r: Math.random() * 1.1 + 0.25,
        tw: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06
      };
    }

    function resizeSpace() {
      SW = window.innerWidth;
      SH = window.innerHeight;
      spaceCanvas.width = SW * SDPR;
      spaceCanvas.height = SH * SDPR;
      spaceCanvas.style.width = SW + "px";
      spaceCanvas.style.height = SH + "px";
      ctx.setTransform(SDPR, 0, 0, SDPR, 0, 0);
      var count = Math.min(260, Math.round((SW * SH) / 6000));
      stars = [];
      for (var i = 0; i < count; i++) stars.push(makeStar());
    }

    function drawSpace() {
      ctx.clearRect(0, 0, SW, SH);
      var px = (spaceMouseX / SW - 0.5) * 2;
      var py = (spaceMouseY / SH - 0.5) * 2;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.tw += 0.02;
        var depth = s.z;
        s.x += s.vx + px * 0.06 * (1 - depth);
        s.y += s.vy + py * 0.06 * (1 - depth);
        if (s.x < -2) s.x = SW + 2;
        else if (s.x > SW + 2) s.x = -2;
        if (s.y < -2) s.y = SH + 2;
        else if (s.y > SH + 2) s.y = -2;
        var alpha = 0.3 + 0.7 * Math.abs(Math.sin(s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(214,228,255," + alpha.toFixed(2) + ")";
        ctx.fill();
      }
      nextShoot -= 1;
      if (nextShoot <= 0 && shooting.length < 3) {
        shooting.push({
          x: Math.random() * SW * 0.9 + SW * 0.05,
          y: Math.random() * SH * 0.5,
          vx: (Math.random() * 2.6 + 1.8) * (Math.random() < 0.5 ? 1 : -1),
          vy: Math.random() * 1.6 + 0.8,
          life: 1
        });
        nextShoot = Math.floor(Math.random() * 260 + 140);
      }
      for (i = shooting.length - 1; i >= 0; i--) {
        var m = shooting[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.014;
        if (m.life <= 0 || m.x < -60 || m.x > SW + 60 || m.y > SH + 60) {
          shooting.splice(i, 1);
          continue;
        }
        var head = Math.max(m.life, 0);
        var grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 7, m.y - m.vy * 7);
        grad.addColorStop(0, "rgba(255,255,255," + head.toFixed(2) + ")");
        grad.addColorStop(0.4, "rgba(96,165,250," + (head * 0.7).toFixed(2) + ")");
        grad.addColorStop(1, "rgba(96,165,250,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 7, m.y - m.vy * 7);
        ctx.stroke();
      }
      if (spaceRunning) requestAnimationFrame(drawSpace);
    }

    resizeSpace();
    window.addEventListener("resize", resizeSpace);
    document.addEventListener("mousemove", function (e) {
      spaceMouseX = e.clientX;
      spaceMouseY = e.clientY;
    });
    if (spaceRunning) {
      requestAnimationFrame(drawSpace);
    } else {
      drawSpace();
    }
  }

  // Custom cursor (reticle)
  var cursorDot = document.getElementById("cursorDot");
  var cursorRing = document.getElementById("cursorRing");
  if (cursorDot && cursorRing && canAnimate) {
    document.body.classList.add("has-custom-cursor");
    var cdx = 0, cdy = 0, crx = 0, cry = 0, cmx = 0, cmy = 0;
    var hotTargets =
      "a, button, input, textarea, .domain-card, .pillar-card, .lead-card, .stat, .gallery-item, .back-top";
    function cursorLoop() {
      cdx += (cmx - cdx) * 0.5;
      cdy += (cmy - cdy) * 0.5;
      crx += (cmx - crx) * 0.2;
      cry += (cmy - cry) * 0.2;
      cursorDot.style.transform =
        "translate3d(" + (cdx - 3.5) + "px," + (cdy - 3.5) + "px,0)";
      cursorRing.style.transform =
        "translate3d(" + (crx - 18) + "px," + (cry - 18) + "px,0)";
      requestAnimationFrame(cursorLoop);
    }
    document.addEventListener("mousemove", function (e) {
      cmx = e.clientX;
      cmy = e.clientY;
    });
    document.addEventListener("mouseover", function (e) {
      var on = e.target.closest ? !!e.target.closest(hotTargets) : false;
      cursorRing.classList.toggle("active", on);
    });
    requestAnimationFrame(cursorLoop);
  }

  // Cursor glow (desktop, mouse only)
  var glow = document.getElementById("cursorGlow");
  if (glow && canAnimate) {
    document.body.classList.add("has-glow");
    var gx = 0, gy = 0, tx = 0, ty = 0, glowRaf = null;
    function glowLoop() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
      glowRaf = requestAnimationFrame(glowLoop);
    }
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!glowRaf) glowRaf = requestAnimationFrame(glowLoop);
    });
  }

  // Hero parallax — orbs, starfield, orbit rings drift with the mouse
  var heroBg = document.querySelector(".hero-bg");
  var orbitGraphic = document.querySelector(".orbit-graphic");
  if (canAnimate && heroBg) {
    document.addEventListener("mousemove", function (e) {
      var nx = e.clientX / window.innerWidth - 0.5;
      var ny = e.clientY / window.innerHeight - 0.5;
      heroBg.style.transform =
        "translate3d(" + nx * 22 + "px," + ny * 14 + "px,0) scale(1.05)";
      if (orbitGraphic) {
        orbitGraphic.style.transform =
          "translate(calc(-50% + " + -nx * 44 + "px), calc(-50% + " + -ny * 28 + "px))";
      }
    });
  }

  // 3D tilt + cursor spotlight on cards
  var tiltEls = document.querySelectorAll(
    ".domain-card, .pillar-card, .lead-card, .stat"
  );
  if (canAnimate && tiltEls.length) {
    tiltEls.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        var rx = (0.5 - py) * 10;
        var ry = (px - 0.5) * 10;
        card.style.transform =
          "perspective(900px) rotateX(" +
          rx.toFixed(2) +
          "deg) rotateY(" +
          ry.toFixed(2) +
          "deg) translateY(-6px)";
      });
      card.addEventListener("mouseenter", function () {
        card.classList.add("tilt-active");
      });
      card.addEventListener("mouseleave", function () {
        card.classList.remove("tilt-active");
        card.style.transform = "";
      });
    });
  }

  // Animated stat counters
  function runCounter(el) {
    var targetStr = el.getAttribute("data-count") || "0";
    var suffix = el.getAttribute("data-suffix") || "";
    var target = parseInt(targetStr, 10) || 0;
    var pad = /^0/.test(targetStr) ? 2 : 0;
    var duration = 1400;
    var start = null;
    function padVal(n) {
      var s = String(n);
      while (s.length < pad) s = "0" + s;
      return s;
    }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = padVal(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll(".stat-num[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  // Scroll parallax for decorative graphics
  var parallaxEls = document.querySelectorAll(".parallax");
  var parallaxTicking = false;
  function parallaxUpdate() {
    parallaxTicking = false;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-speed") || "0.15");
      var r = el.getBoundingClientRect();
      var center = r.top + r.height / 2 - vh / 2;
      el.style.transform = "translate3d(0," + (-center * speed).toFixed(1) + "px,0)";
    });
  }
  function parallaxRaf() {
    if (!parallaxTicking) {
      parallaxTicking = true;
      requestAnimationFrame(parallaxUpdate);
    }
  }
  if (parallaxEls.length && !reduceMotion.matches) {
    window.addEventListener("scroll", parallaxRaf, { passive: true });
    window.addEventListener("resize", parallaxRaf);
    parallaxUpdate();
  }

  // Mission-control terminal typing
  var termCmd = document.getElementById("termCmd");
  var termOut = document.getElementById("termOut");
  if (termCmd && termOut) {
    var sessions = [
      { cmd: "wiztron --status", out: "600+ cadets online · 7 domains active · HQ Block 3, Set Ground Floor" },
      { cmd: "git init builder", out: "Identity initialised: curious student → engineer. Commit your ideas." },
      { cmd: "launch --vehicle=trainer-jet", out: "Payload: trainer jet prototype. Ignition… GO FOR LAUNCH ✓" },
      { cmd: "join --domain=software", out: "Request logged. Welcome aboard, builder." },
      { cmd: "deploy --event=workshop", out: "Next workshop: calibrating. Watch this space." }
    ];
    var termIdx = 0, charIdx = 0, termPause = 0;
    var termTyping = true;
    function termStep() {
      if (termTyping) {
        var s = sessions[termIdx];
        charIdx++;
        termCmd.textContent = s.cmd.slice(0, charIdx);
        if (charIdx >= s.cmd.length) {
          termTyping = false;
          termOut.textContent = "▸ " + s.out;
          termPause = 0;
        }
        setTimeout(termStep, 42);
      } else {
        termPause++;
        if (termPause > 150) {
          termIdx = (termIdx + 1) % sessions.length;
          charIdx = 0;
          termTyping = true;
          termCmd.textContent = "";
          termOut.textContent = "";
          setTimeout(termStep, 350);
        } else {
          setTimeout(termStep, 30);
        }
      }
    }
    if (!reduceMotion.matches) {
      setTimeout(termStep, 1000);
    } else {
      termCmd.textContent = sessions[0].cmd;
      termOut.textContent = "▸ " + sessions[0].out;
    }
  }

  // Register form (front-end only demo)
  var form = document.getElementById("registerForm");
  var success = document.getElementById("registerSuccess");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (success) {
        success.classList.add("show");
        form.reset();
        setTimeout(function () {
          success.classList.remove("show");
        }, 6000);
      }
    });
  }

  // Wordmark: size accent line, then auto-fit SVG to the content
  function layoutWordmarks() {
    var svgs = document.querySelectorAll(".wm-svg");
    svgs.forEach(function (svg) {
      var content = svg.querySelector(".wm-content");
      var letters = svg.querySelector(".wm-letters");
      var underline = svg.querySelector(".wm-underline");
      if (!content || !letters || typeof letters.getBBox !== "function") return;

      var lettersBox = letters.getBBox();
      if (!lettersBox.width) return;

      if (underline) {
        underline.setAttribute("x", lettersBox.x);
        underline.setAttribute("width", Math.round(lettersBox.width * 0.68));
        underline.setAttribute("y", lettersBox.y + lettersBox.height + 8);
        underline.setAttribute("height", 5);
        underline.setAttribute("rx", 2.5);
      }

      var box = content.getBBox();
      if (!box.width) return;

      var pad = 18;
      svg.setAttribute(
        "viewBox",
        (box.x - pad) +
          " " +
          (box.y - pad) +
          " " +
          (box.width + pad * 2) +
          " " +
          (box.height + pad * 2)
      );
    });
  }

  function readyWordmarks() {
    function run() {
      layoutWordmarks();
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    }
    window.addEventListener("load", run);
    window.addEventListener("resize", run);
    window.setTimeout(run, 300);
    window.setTimeout(run, 1200);
    if (document.readyState === "complete") {
      run();
    } else {
      document.addEventListener("DOMContentLoaded", run);
    }
  }

  readyWordmarks();
})();
