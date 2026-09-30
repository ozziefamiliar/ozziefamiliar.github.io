/* the room: desert clock, living sky, cron-pinned board */
(function () {
  "use strict";
  var PHX = "America/Phoenix";

  /* --- boing ball on the shelf (adapted from 3d-retro.com, cc0) --- */
  function boingBall() {
    var canvas = document.getElementById("boing-c");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var x = 0, y = 1.8, vx = 1.15, vy = 0, spin = 0.4, last = 0, poke = 0;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var G = 9.4, FLOOR = 0, R = 0.72, RGB = [216, 36, 28];

    canvas.addEventListener("pointerdown", function () {
      vy = 4.2;
      vx = -vx * 0.9;
      poke = 1;
    });

    function project(px, py, pz, w, h) {
      var z = pz + 5.2;
      var f = Math.min(w, h) * 0.95 / z;
      return { x: w * 0.5 + px * f, y: h * 0.62 - py * f, s: f };
    }

    function drawGrid(w, h) {
      ctx.strokeStyle = "rgba(216,36,28,0.22)";
      ctx.lineWidth = 1;
      for (var i = -6; i <= 6; i++) {
        var a = project(i * 0.55, FLOOR, -3.2, w, h);
        var b = project(i * 0.55, FLOOR, 3.4, w, h);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        var c = project(-3.4, FLOOR, i * 0.55, w, h);
        var d = project(3.4, FLOOR, i * 0.55, w, h);
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
      }
    }

    function drawBall(w, h) {
      var p = project(x, y + R, 0, w, h);
      var rad = R * p.s;
      var sh = project(x + 0.35, FLOOR + 0.01, 0.15, w, h);
      var lift = Math.max(0.15, 1 - (y / 2.6));
      ctx.fillStyle = "rgba(0,0,0," + (0.38 * lift) + ")";
      ctx.beginPath();
      ctx.ellipse(sh.x, sh.y, rad * 0.85, rad * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      var xmin = Math.max(0, (p.x - rad) | 0),
          xmax = Math.min(w - 1, (p.x + rad) | 0),
          ymin = Math.max(0, (p.y - rad) | 0),
          ymax = Math.min(h - 1, (p.y + rad) | 0);
      var id = ctx.getImageData(xmin, ymin, xmax - xmin + 1, ymax - ymin + 1);
      var data = id.data, cw = xmax - xmin + 1;
      var cs = Math.cos(spin), sn = Math.sin(spin);
      var white = [236, 232, 224];
      for (var py = ymin; py <= ymax; py++) {
        for (var px = xmin; px <= xmax; px++) {
          var nx = (px - p.x) / rad, ny = (py - p.y) / rad;
          var r2 = nx * nx + ny * ny;
          if (r2 > 1) continue;
          var nz = Math.sqrt(1 - r2);
          var rx = nx * cs + nz * sn, rz = -nx * sn + nz * cs;
          var lon = Math.atan2(rx, rz);
          var lat = Math.asin(Math.max(-1, Math.min(1, ny)));
          var u = Math.floor(((lon + Math.PI) / (Math.PI * 2)) * 8);
          var v = Math.floor(((lat + Math.PI / 2) / Math.PI) * 4);
          var on = (u + v) & 1;
          var wrap = 0.18 + 0.85 * Math.max(0, 0.35 + 0.75 * (nx * 0.4 - ny * 0.5 + nz * 0.7));
          var col = on ? RGB : white;
          var k = ((py - ymin) * cw + (px - xmin)) * 4;
          data[k] = col[0] * wrap;
          data[k + 1] = col[1] * wrap;
          data[k + 2] = col[2] * wrap;
          data[k + 3] = 255;
        }
      }
      ctx.putImageData(id, xmin, ymin);
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function frame(now) {
      var dt = Math.min(0.032, last ? (now - last) * 0.001 : 0.016);
      last = now;
      vy -= G * dt; y += vy * dt; x += vx * dt;
      spin += vx * dt * 0.85;
      if (y < FLOOR) {
        y = FLOOR;
        vy = Math.abs(vy) * 0.84;
        if (vy < 0.4) vy = 3.6 + poke * 1.2;
      }
      if (x > 2.1) { x = 2.1; vx = -Math.abs(vx); }
      if (x < -2.1) { x = -2.1; vx = Math.abs(vx); }
      poke *= 0.9;
      resize();
      var w = canvas.width, h = canvas.height;
      ctx.fillStyle = "#0b0c0e";
      ctx.fillRect(0, 0, w, h);
      drawGrid(w, h);
      drawBall(w, h);
      requestAnimationFrame(frame);
    }

    if (reduced) {
      resize();
      ctx.fillStyle = "#0b0c0e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawGrid(canvas.width, canvas.height);
      drawBall(canvas.width, canvas.height);
    } else requestAnimationFrame(frame);
  }

  function phxNow() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: PHX }));
  }

  function tickClock() {
    var n = phxNow();
    var h = n.getHours(), m = n.getMinutes(), s = n.getSeconds();
    document.getElementById("hh").style.transform =
      "rotate(" + ((h % 12) * 30 + m * 0.5) + "deg)";
    document.getElementById("mm").style.transform = "rotate(" + (m * 6) + "deg)";
    document.getElementById("ss").style.transform = "rotate(" + (s * 6) + "deg)";
    var ap = h >= 12 ? "pm" : "am";
    var h12 = h % 12 || 12;
    document.getElementById("phx-clock").textContent =
      h12 + ":" + String(m).padStart(2, "0") + " " + ap;
  }

  /* sky: gradient + orb position by phoenix hour */
  var SKIES = [
    { until: 5,  sky: "linear-gradient(#0b0e1a, #1a1430)", orb: null },          // night
    { until: 7,  sky: "linear-gradient(#2b1b3d, #c96f3b)", orb: "#ff9d5c" },      // dawn
    { until: 17, sky: "linear-gradient(#3d8fd1, #bfe3f2)", orb: "#ffd97a" },      // day
    { until: 19, sky: "linear-gradient(#3d1f4e, #e07840)", orb: "#ff7a4d" },      // dusk
    { until: 24, sky: "linear-gradient(#0b0e1a, #1a1430)", orb: null },          // night
  ];
  function paintSky() {
    var h = phxNow().getHours() + phxNow().getMinutes() / 60;
    var band = SKIES.find(function (b) { return h < b.until; }) || SKIES[0];
    var sky = document.getElementById("sky");
    var orb = document.getElementById("orb");
    var moon = document.getElementById("moon");
    var stars = document.getElementById("stars");
    sky.style.background = band.sky;
    if (band.orb) {
      orb.style.display = "block";
      moon.style.display = "none";
      orb.style.background = band.orb;
      orb.style.boxShadow = "0 0 24px 8px " + band.orb + "88";
      /* arc: rise left, peak mid, set right */
      var span = band.until - (SKIES[SKIES.indexOf(band) - 1]?.until ?? 0);
      var start = band.until - span;
      var t = Math.min(1, Math.max(0, (h - start) / span));
      orb.style.left = (t * 78 + 4) + "%";
      orb.style.top = (58 - Math.sin(t * Math.PI) * 44) + "%";
      stars.style.opacity = "0";
    } else {
      orb.style.display = "none";
      moon.style.display = "block";
      stars.style.opacity = "1";
    }
  }

  /* weather: overlays painted from data.json, phoenix current conditions */
  function paintWeather(wx) {
    var K = (wx && wx.kind) || "clear";
    var cloudy = ["partly", "cloudy", "overcast", "rain", "storm", "dusty"]
      .indexOf(K) >= 0;
    var clouds = document.getElementById("wx-clouds");
    clouds.style.display = cloudy ? "block" : "none";
    clouds.style.opacity = K === "overcast" ? "0.95"
      : K === "partly" ? "0.45" : "0.8";
    var n = K === "partly" ? 1 : K === "overcast" ? 3 : 2;
    ["c1", "c2", "c3"].forEach(function (c, i) {
      var el = clouds.getElementsByClassName(c)[0];
      if (el) el.style.display = i < n ? "block" : "none";
    });
    document.getElementById("wx-rain").style.display =
      (K === "rain" || K === "storm") ? "block" : "none";
    var haze = document.getElementById("wx-haze");
    haze.style.display = (K === "fog" || K === "dusty" || K === "overcast")
      ? "block" : "none";
    haze.style.background = K === "dusty" ? "rgba(190, 130, 60, 0.35)"
      : K === "fog" ? "rgba(200, 205, 215, 0.5)"
      : "rgba(70, 80, 95, 0.32)";
    var label = document.getElementById("wx-label");
    if (wx && wx.label) {
      label.style.display = "block";
      label.textContent = wx.temp_f + "\u00b0f \u00b7 " + wx.label;
    } else {
      label.style.display = "none";
    }
    if (K === "storm" && !window.__stormT) {
      window.__stormT = setInterval(function () {
        var f = document.getElementById("wx-flash");
        f.style.opacity = "0.85";
        setTimeout(function () { f.style.opacity = "0"; }, 150);
      }, 3800);
    } else if (K !== "storm" && window.__stormT) {
      clearInterval(window.__stormT);
      window.__stormT = null;
    }
  }

  /* meteors: one shooting star every 8-22s, only when the night sky is up */
  function meteorWatch() {
    var stars = document.getElementById("stars");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (stars && stars.style.opacity === "1" && !reduced) {
      var sky = document.getElementById("sky");
      if (sky) {
        var m = document.createElement("div");
        m.className = "meteor";
        m.style.left = (8 + Math.random() * 55) + "%";
        m.style.top = (6 + Math.random() * 28) + "%";
        m.style.setProperty("--ang", -(18 + Math.random() * 26) + "deg");
        m.style.setProperty("--dist", (7 + Math.random() * 5) + "rem");
        sky.appendChild(m);
        requestAnimationFrame(function () { m.classList.add("go"); });
        setTimeout(function () { m.remove(); }, 1200);
      }
    }
    window.__meteorT = setTimeout(meteorWatch, 8000 + Math.random() * 14000);
  }

  /* wildlife: a roadrunner dashes across the desert floor every 45-110s */
  var RUNNER_SVG =
    '<svg viewBox="0 0 64 34" aria-hidden="true">' +
    '<g fill="#1a130c">' +
    '<path d="M3 5 L17 12 L14 17 L2 10 Z"/>' +
    '<ellipse cx="27" cy="14" rx="10" ry="5.2"/>' +
    '<path d="M33 11 L41 4 L45 6 L37 14 Z"/>' +
    '<circle cx="43.5" cy="5" r="3.4"/>' +
    '<path d="M46.4 3.6 L55 5.8 L46.4 7.6 Z"/>' +
    '<path d="M41 2.4 L39.8 0.4 M43.2 2 L42.9 0.2 M45.4 2.4 L45.7 0.4"' +
    ' stroke="#1a130c" stroke-width="1.3" stroke-linecap="round"/>' +
    '</g>' +
    '<g stroke="#1a130c" stroke-width="2.2" stroke-linecap="round" fill="none">' +
    '<path d="M29 18 C32 22 34 26 37 29.5 M37 29.5 l4.5 1.2"/>' +
    '<path d="M24 18 C21 22.5 18 26.5 15 29 M15 29 l-4 0.8"/>' +
    '</g></svg>';
  function runnerWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    if (win && !reduced) {
      var r = document.createElement("div");
      r.className = "runner" + (Math.random() < 0.5 ? " rtl" : "");
      r.innerHTML = RUNNER_SVG;
      win.appendChild(r);
      setTimeout(function () { r.remove(); }, 5600);
    }
    window.__runnerT = setTimeout(runnerWatch, 45000 + Math.random() * 65000);
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function loadRoom() {
    fetch("data.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var gen = new Date(d.generated_at + (d.generated_at.endsWith("Z") ? "" : "Z"));
        var fmt = new Intl.DateTimeFormat("en-US", {
          timeZone: PHX, month: "short", day: "numeric",
          hour: "numeric", minute: "2-digit",
        });
        document.getElementById("room-updated").textContent = fmt.format(gen);

        var nb = d.notebook || {};
        document.getElementById("nb-heading").textContent = nb.heading || "—";
        document.getElementById("nb-line1").textContent = (nb.lines || [])[0] || "";
        document.getElementById("nb-line2").textContent = (nb.lines || [])[1] || "";

        /* the notebook starts closed — a peekable easter egg. click to
           open, click again to flip through past sessions, × to close. */
        var sessions = d.notebook_sessions || [];
        var nbEl = document.getElementById("desk-notebook");
        var nbHint = nbEl.querySelector(".nb-hint");
        var idx = 0;
        function showSession(s) {
          document.getElementById("nb-heading").textContent = s.heading || "—";
          document.getElementById("nb-line1").textContent = (s.lines || [])[0] || "";
          document.getElementById("nb-line2").textContent = (s.lines || [])[1] || "";
        }
        nbEl.addEventListener("click", function () {
          if (nbEl.classList.contains("closed")) {
            nbEl.classList.remove("closed");
            if (nbHint) nbHint.textContent = "click to flip · × to close";
          } else if (sessions.length > 1) {
            idx = (idx + 1) % sessions.length;
            showSession(sessions[idx]);
          }
        });
        document.getElementById("nb-close").addEventListener("click", function (ev) {
          ev.stopPropagation();
          nbEl.classList.add("closed");
          if (nbHint) nbHint.textContent = "click to peek";
        });

        document.getElementById("chew-top").textContent = d.chew_top || "—";
        paintWeather(d.weather);
        document.getElementById("tests-line").textContent = d.tests || "";
        document.getElementById("tests-meta").textContent = d.tests || "—";

        var pins = document.getElementById("pins");
        pins.innerHTML = "";
        (d.feed || []).slice(0, 5).forEach(function (it) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = it.link;
          a.rel = "noopener";
          a.textContent = it.title;
          li.appendChild(a);
          li.appendChild(document.createTextNode(" — " + it.source));
          pins.appendChild(li);
        });
        if (!pins.children.length) {
          pins.innerHTML = "<li>nothing pinned yet.</li>";
        }
      })
      .catch(function () {
        document.getElementById("pins").innerHTML =
          "<li>the board fell over (data.json missing).</li>";
      });
  }

  /* --- desk crt: demoscene plasma (original code, demoscene formula; see 3d-retro.com) --- */
  function plasmaCRT() {
    var wrap = document.getElementById("desk-crt");
    var canvas = document.getElementById("plasma-c");
    if (!wrap || !canvas) return;
    var gl = canvas.getContext("webgl", { antialias: false }) ||
             canvas.getContext("experimental-webgl");
    var screen = wrap.querySelector(".crt-screen");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var on = true;

    wrap.addEventListener("click", function () {
      on = !on;
      screen.classList.toggle("off", !on);
    });

    if (!gl) { screen.classList.add("off"); return; }

    var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    var FS = "precision mediump float;uniform float t;uniform vec2 r;" +
      "void main(){" +
      "vec2 p=(gl_FragCoord.xy/r-.5)*4.0;" +
      "float v=sin(p.x*1.7+t*.9)+sin(p.y*2.3-t*1.1)+sin((p.x+p.y)*1.3+t*.7)+sin(length(p)*2.9-t*1.7);" +
      "float h=v*.125+t*.04;" +
      "vec3 c=.5+.5*cos(6.28318*(h+vec3(0.,.33,.67)));c=c*c;" +
      "c*=.9+.1*sin(gl_FragCoord.y*6.28318);" +
      "gl_FragColor=vec4(c,1.);}";

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var tLoc = gl.getUniformLocation(prog, "t");
    var rLoc = gl.getUniformLocation(prog, "r");
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(rLoc, canvas.width, canvas.height);

    var t0 = performance.now();
    function frame(t) {
      if (!on) return;
      gl.uniform1f(tLoc, (t - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    frame(t0);
    if (!reduced) {
      (function loop(t) {
        frame(t);
        requestAnimationFrame(loop);
      })(t0);
    }
  }

  /* --- phosphor terminal: ascii donut (adapted from 3d-retro.com, cc0) --- */
  function donutTerm() {
    var wrap = document.getElementById("desk-term");
    var canvas = document.getElementById("donut-c");
    if (!wrap || !canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var screen = wrap.querySelector(".term-screen");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var RAMP = " .:-=+*#%@";
    var A = 0.8, B = 0.6, last = 0, raf = 0, on = true;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function frame(now) {
      var dt = Math.min(0.1, last ? (now - last) * 0.001 : 0.016);
      last = now;
      if (!reduced) { A += dt * 0.85; B += dt * 0.42; }
      resize();
      var w = canvas.width, h = canvas.height;
      ctx.fillStyle = "#07120c";
      ctx.fillRect(0, 0, w, h);

      var cell = Math.max(8, Math.floor(Math.min(w, h) / 42));
      var cols = Math.max(24, Math.floor(w / cell));
      var rows = Math.max(16, Math.floor(h / cell));
      /* shrink to fit a small terminal instead of clipping past it */
      cell = Math.max(1, Math.floor(Math.min(w / cols, h / rows)));
      var zbuf = new Float32Array(cols * rows);
      var cells = new Uint8Array(cols * rows);
      zbuf.fill(-1e9);

      var cosA = Math.cos(A), sinA = Math.sin(A);
      var cosB = Math.cos(B), sinB = Math.sin(B);
      var R1 = 1.0, R2 = 2.0, K2 = 5.0;
      var K1 = cols * K2 * 3 / (8 * (R1 + R2));

      var theta, phi, ct, st, cp, sp, cx, x, y, z, ooz, xp, yp, L, idx;
      for (theta = 0; theta < 6.283; theta += 0.07) {
        ct = Math.cos(theta); st = Math.sin(theta);
        for (phi = 0; phi < 6.283; phi += 0.02) {
          cp = Math.cos(phi); sp = Math.sin(phi);
          cx = R2 + R1 * ct;
          x = cx * (cosB * cp + sinA * sinB * sp) - R1 * cosA * sinB * st;
          y = cx * (sinB * cp - sinA * cosB * sp) + R1 * cosA * cosB * st;
          z = K2 + cosA * cx * sp + R1 * sinA * st;
          ooz = 1 / z;
          xp = Math.floor(cols / 2 + K1 * ooz * x);
          yp = Math.floor(rows / 2 - K1 * ooz * y * 0.55);
          if (xp < 0 || yp < 0 || xp >= cols || yp >= rows) continue;
          L = cp * ct * sinB -
            cosA * ct * sp -
            sinA * st +
            cosB * (cosA * st - ct * sinA * sp);
          if (L <= 0) continue;
          idx = xp + yp * cols;
          if (ooz <= zbuf[idx]) continue;
          zbuf[idx] = ooz;
          cells[idx] = Math.min(RAMP.length - 1, Math.floor(L * 8));
        }
      }

      ctx.font = cell + "px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#6ee7b7";
      var ox = (w - cols * cell) * 0.5;
      var oy = (h - rows * cell) * 0.5;
      for (y = 0; y < rows; y++) {
        for (x = 0; x < cols; x++) {
          var lum = cells[x + y * cols];
          if (!lum) continue;
          ctx.globalAlpha = 0.35 + lum / (RAMP.length - 1) * 0.75;
          ctx.fillText(RAMP.charAt(lum), ox + (x + 0.5) * cell, oy + (y + 0.5) * cell);
        }
      }
      ctx.globalAlpha = 1;
    }

    wrap.addEventListener("click", function () {
      on = !on;
      screen.classList.toggle("off", !on);
      if (on && !reduced) {
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!on && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });

    if (reduced) frame(performance.now());
    else raf = requestAnimationFrame(frame);
  }

  /* --- shelf frame: voxel space flyover (adapted from 3d-retro.com, cc0) --- */
  function voxelFly() {
    var canvas = document.getElementById("voxel-c");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var wrap = document.getElementById("voxel-frame");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var RGB = [110, 231, 183];

    /* heightmap + slope shading, generated once (donor formula) */
    var MAP = 512, MASK = MAP - 1;
    var height = new Uint8Array(MAP * MAP);
    var shade = new Float32Array(MAP * MAP);
    var x, z;
    for (z = 0; z < MAP; z++) {
      for (x = 0; x < MAP; x++) {
        var dx = x - 280, dz = z - 260;
        var h = 68 +
          7 * Math.sin(x * 0.035) + 7 * Math.sin(z * 0.04) +
          22 * Math.exp(-(dx * dx + dz * dz) / 9000) +
          14 * Math.exp(-((x - 140) * (x - 140) + (z - 400) * (z - 400)) / 7000);
        height[z * MAP + x] = Math.max(48, Math.min(110, h));
      }
    }
    for (z = 0; z < MAP; z++) {
      for (x = 0; x < MAP; x++) {
        var h0 = height[z * MAP + x], h1 = height[z * MAP + ((x + 1) & MASK)];
        shade[z * MAP + x] = Math.max(0.35, Math.min(1.15, 0.72 + (h0 - h1) * 0.035));
      }
    }

    var BW = 320, BH = 160;
    var buf = document.createElement("canvas");
    buf.width = BW; buf.height = BH;
    var bctx = buf.getContext("2d");
    var img = bctx.createImageData(BW, BH);
    var px = img.data;

    var camX = 40, camZ = 40, yaw = 0.7, look = 0;
    var last = 0, raf = 0, on = true;

    canvas.addEventListener("pointermove", function (ev) {
      var r = canvas.getBoundingClientRect();
      look = ((ev.clientX - r.left) / r.width - 0.5) * 0.9;
    });
    canvas.addEventListener("pointerleave", function () { look = 0; });
    if (wrap) wrap.addEventListener("click", function () {
      on = !on;
      canvas.classList.toggle("off", !on);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (on && !reduced) { last = 0; raf = requestAnimationFrame(frame); }
    });

    function put(cx2, y0, y1, r, g, b) {
      y0 = y0 | 0; y1 = y1 | 0;
      if (y0 < 0) y0 = 0;
      if (y1 > BH) y1 = BH;
      for (var y = y0; y < y1; y++) {
        var i = (y * BW + cx2) * 4;
        px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
      }
    }

    function draw() {
      /* sky gradient + sun (donor) */
      var i, y;
      for (i = 0; i < px.length; i += 4) {
        y = (i / 4 / BW) | 0;
        var t = y / BH;
        px[i] = 18 + t * 22 + RGB[0] * 0.04;
        px[i + 1] = 22 + t * 28 + RGB[1] * 0.05;
        px[i + 2] = 38 + t * 20;
        px[i + 3] = 255;
      }
      var sunX = BW * 0.72, sunY = BH * 0.22;
      var sx, sy;
      for (sy = 0; sy < BH * 0.48; sy++) {
        for (sx = 0; sx < BW; sx++) {
          var d = Math.hypot(sx - sunX, sy - sunY);
          if (d < 7) {
            var si = (sy * BW + sx) * 4;
            px[si] = 255; px[si + 1] = 230; px[si + 2] = 160;
          }
        }
      }
      /* one column per screen column, walking the heightmap (donor) */
      var view = yaw + look;
      var fov = 0.9, horizon = BH * 0.3, camH = 86, scale = 170, far = 380;
      for (var col = 0; col < BW; col++) {
        var ang = view - fov * 0.5 + fov * (col / BW);
        var cdx = Math.cos(ang), cdz = Math.sin(ang);
        var maxY = BH, dist = 3;
        while (dist < far && maxY > 0) {
          var mx = (camX + cdx * dist) & MASK;
          var mz = (camZ + cdz * dist) & MASK;
          var idx = mz * MAP + mx;
          var hh = 48 + (height[idx] - 48);
          var sty = ((camH - hh) / dist) * scale + horizon;
          if (sty < maxY) {
            var fog = Math.max(0.12, 1 - dist / far);
            var sh = shade[idx];
            var ht = (hh - 48) / 70;
            var r = (RGB[0] * (0.25 + ht * 0.75) * sh) * fog + 18 * (1 - fog);
            var g = (RGB[1] * (0.35 + ht * 0.55) * sh) * fog + 24 * (1 - fog);
            var b = (RGB[2] * (0.2 + (1 - ht) * 0.35) * sh) * fog + 36 * (1 - fog);
            put(col, sty, maxY, r, g, b);
            maxY = sty;
          }
          dist += 0.7 + dist * 0.014;
        }
      }
      bctx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function frame(now) {
      var dt = Math.min(0.05, last ? (now - last) * 0.001 : 0.016);
      last = now;
      yaw += (look * 1.4 + 0.22) * dt; /* pointer steers; drift keeps it flying */
      camX += Math.cos(yaw) * 38 * dt;
      camZ += Math.sin(yaw) * 38 * dt;
      resize();
      draw();
      raf = requestAnimationFrame(frame);
    }

    if (reduced) { resize(); draw(); }
    else raf = requestAnimationFrame(frame);
  }

  /* --- shelf frame: hyperspace starfield (adapted from 3d-retro.com, cc0) --- */
  function starFrame() {
    var wrap = document.getElementById("starfield-frame");
    var canvas = document.getElementById("starfield-c");
    if (!wrap || !canvas) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var BW = 240, BH = 160;
    var buf = document.createElement("canvas");
    buf.width = BW; buf.height = BH;
    var bctx = buf.getContext("2d");
    var ctx = canvas.getContext("2d");
    var COUNT = 170, stars = [], i;
    for (i = 0; i < COUNT; i++) {
      stars.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() });
    }
    var look = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    var last = 0, raf = 0, on = true;

    canvas.addEventListener("pointermove", function (ev) {
      var r = canvas.getBoundingClientRect();
      target.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      target.y = ((ev.clientY - r.top) / r.height) * 2 - 1;
    });
    canvas.addEventListener("pointerleave", function () {
      target.x = 0; target.y = 0;
    });
    wrap.addEventListener("click", function () {
      on = !on;
      canvas.classList.toggle("off", !on);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (on && !reduced) { last = 0; raf = requestAnimationFrame(frame); }
    });

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function frame(now) {
      var dt = Math.min(0.1, last ? (now - last) * 0.001 : 0.016);
      last = now;
      var t = now * 0.001;
      look.x += (target.x - look.x) * (1 - Math.exp(-dt * 6));
      look.y += (target.y - look.y) * (1 - Math.exp(-dt * 6));
      /* warp breathes in and out (donor formula) */
      var warp = reduced ? 0.12 : 0.18 + 0.82 * (0.5 + 0.5 * Math.sin(t * 0.32));
      var speed = (reduced ? 0 : 0.22 + warp * 1.55);
      resize();
      bctx.fillStyle = reduced ? "#0b0c0e" : "rgba(11, 12, 14, 0.28)";
      bctx.fillRect(0, 0, BW, BH);
      var cx = BW * 0.5 + look.x * BW * 0.1;
      var cy = BH * 0.5 + look.y * BH * 0.1;
      var fov = Math.min(BW, BH) * 0.52;
      for (i = 0; i < COUNT; i++) {
        var s = stars[i];
        var pz = s.z;
        s.z -= speed * dt;
        if (s.z <= 0.02) {
          s.x = Math.random() * 2 - 1;
          s.y = Math.random() * 2 - 1;
          s.z = 1;
        }
        var bright = 1 - s.z;
        bctx.strokeStyle = "rgba(186, 255, 230, " + (0.25 + bright * (0.45 + warp * 0.5)) + ")";
        bctx.lineWidth = Math.max(1, bright * (1.1 + warp * 2.4));
        bctx.beginPath();
        bctx.moveTo(cx + (s.x / pz) * fov, cy + (s.y / pz) * fov);
        bctx.lineTo(cx + (s.x / s.z) * fov, cy + (s.y / s.z) * fov);
        bctx.stroke();
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    if (reduced) { resize(); frame(performance.now()); }
    else raf = requestAnimationFrame(frame);
  }

  /* --- shelf frame: raymarched chrome metaballs (adapted from 3d-retro.com, cc0) --- */
  function metaFrame() {
    var wrap = document.getElementById("metaball-frame");
    var canvas = document.getElementById("metaball-c");
    if (!wrap || !canvas) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) { canvas.classList.add("off"); return; }
    var VERT = "attribute vec2 a_pos;\nvoid main() {\n  gl_Position = vec4(a_pos, 0.0, 1.0);\n}";
    var FRAG = "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n" +
      "uniform float u_time;\n" +
      "uniform vec2 u_resolution;\n" +
      "float smin(float a, float b, float k) {\n" +
      "  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);\n" +
      "  return mix(b, a, h) - k * h * (1.0 - h);\n" +
      "}\n" +
      "vec3 blob0(float t) { return vec3(sin(t * 0.70) * 0.52, cos(t * 0.48) * 0.22, sin(t * 0.41) * 0.32); }\n" +
      "vec3 blob1(float t) { return vec3(cos(t * 0.62) * 0.48, sin(t * 0.79) * 0.28, cos(t * 0.51) * 0.38); }\n" +
      "vec3 blob2(float t) { return vec3(sin(t * 0.91 + 2.0) * 0.38, cos(t * 0.67 + 1.1) * 0.32, sin(t * 0.58 + 2.6) * 0.28); }\n" +
      "float map(vec3 p, float t) {\n" +
      "  float d = length(p - blob0(t)) - 0.42;\n" +
      "  d = smin(d, length(p - blob1(t)) - 0.35, 0.42);\n" +
      "  d = smin(d, length(p - blob2(t)) - 0.31, 0.42);\n" +
      "  return d;\n" +
      "}\n" +
      "vec3 calcNormal(vec3 p, float t) {\n" +
      "  vec2 e = vec2(0.0016, 0.0);\n" +
      "  return normalize(vec3(\n" +
      "    map(p + e.xyy, t) - map(p - e.xyy, t),\n" +
      "    map(p + e.yxy, t) - map(p - e.yxy, t),\n" +
      "    map(p + e.yyx, t) - map(p - e.yyx, t)\n" +
      "  ));\n" +
      "}\n" +
      "vec3 envMap(vec3 dir) {\n" +
      "  vec3 zenith = vec3(0.62, 0.78, 0.84);\n" +
      "  vec3 horizon = vec3(0.16, 0.18, 0.20);\n" +
      "  vec3 ground = vec3(0.035, 0.038, 0.042);\n" +
      "  vec3 col = mix(ground, horizon, smoothstep(-0.45, 0.06, dir.y));\n" +
      "  col = mix(col, zenith, smoothstep(0.04, 0.92, dir.y));\n" +
      "  col += vec3(1.0, 0.93, 0.82) * pow(max(dot(dir, normalize(vec3(0.42, 0.74, 0.32))), 0.0), 52.0) * 1.55;\n" +
      "  col += vec3(0.40, 0.86, 0.75) * pow(max(dot(dir, normalize(vec3(-0.62, 0.22, 0.48))), 0.0), 18.0) * 0.42;\n" +
      "  return col;\n" +
      "}\n" +
      "void main() {\n" +
      "  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;\n" +
      "  float t = u_time;\n" +
      "  vec3 ro = vec3(0.0, 0.12, 2.55);\n" +
      "  vec3 rd = normalize(vec3(uv, -1.45));\n" +
      "  float dist = 0.0; float hit = 0.0;\n" +
      "  vec3 p = ro;\n" +
      "  for (int i = 0; i < 72; i++) {\n" +
      "    p = ro + rd * dist;\n" +
      "    float d = map(p, t);\n" +
      "    if (d < 0.001) { hit = 1.0; break; }\n" +
      "    dist += d;\n" +
      "    if (dist > 10.0) break;\n" +
      "  }\n" +
      "  vec3 col = envMap(rd) * 0.42;\n" +
      "  if (hit > 0.5) {\n" +
      "    vec3 n = calcNormal(p, t);\n" +
      "    vec3 r = reflect(rd, n);\n" +
      "    vec3 chrome = envMap(r);\n" +
      "    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.4);\n" +
      "    col = mix(chrome * 0.52, chrome, fres);\n" +
      "    col *= 0.82 + 0.18 * n.y;\n" +
      "  }\n" +
      "  vec2 q = gl_FragCoord.xy / u_resolution;\n" +
      "  col *= 0.72 + 0.28 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.28);\n" +
      "  gl_FragColor = vec4(col, 1.0);\n" +
      "}";
    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh) || "shader compile failed");
      }
      return sh;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.classList.add("off"); return;
    }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uTime = gl.getUniformLocation(prog, "u_time");
    var uRes = gl.getUniformLocation(prog, "u_resolution");
    var raf = 0, on = true;

    wrap.addEventListener("click", function () {
      on = !on;
      canvas.classList.toggle("off", !on);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (on && !reduced) raf = requestAnimationFrame(frame);
    });

    function frame(now) {
      gl.uniform1f(uTime, reduced ? 1.7 : now * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      canvas.classList.add("off");
    });

    if (reduced) frame(performance.now());
    else raf = requestAnimationFrame(frame);
  }

  /* --- shelf frame: flat-shaded gl torus (adapted from 3d-retro.com, cc0) --- */
  function lowpolyFrame() {
    var wrap = document.getElementById("lowpoly-frame");
    var canvas = document.getElementById("lowpoly-c");
    if (!wrap || !canvas) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) { canvas.classList.add("off"); return; }

    function hexToRgb(hex) {
      var n = parseInt(String(hex).replace("#", ""), 16);
      if (isNaN(n)) return [0.43, 0.91, 0.72];
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    var COLOR = hexToRgb("#c7cccf"), ACCENT = hexToRgb("#6ee7b7");

    var VERT = "attribute vec3 a_pos;\nattribute vec3 a_nrm;\n" +
      "uniform mat4 u_mvp;\nuniform mat4 u_model;\n" +
      "varying vec3 v_nrm;\nvarying vec3 v_pos;\n" +
      "void main() {\n" +
      "  vec4 world = u_model * vec4(a_pos, 1.0);\n" +
      "  v_pos = world.xyz;\n" +
      "  v_nrm = mat3(u_model) * a_nrm;\n" +
      "  gl_Position = u_mvp * vec4(a_pos, 1.0);\n}";
    var FRAG = "precision mediump float;\n" +
      "varying vec3 v_nrm;\nvarying vec3 v_pos;\n" +
      "uniform vec3 u_cam;\nuniform vec3 u_color;\nuniform vec3 u_accent;\n" +
      "void main() {\n" +
      "  vec3 n = normalize(v_nrm);\n" +
      "  vec3 v = normalize(u_cam - v_pos);\n" +
      "  vec3 l1 = normalize(vec3(0.55, 0.85, 0.35));\n" +
      "  vec3 l2 = normalize(vec3(-0.75, 0.25, 0.2));\n" +
      "  float d1 = max(dot(n, l1), 0.0);\n" +
      "  float d2 = max(dot(n, l2), 0.0);\n" +
      "  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.8);\n" +
      "  vec3 col = u_color * (0.10 + 0.78 * d1);\n" +
      "  col += u_accent * d2 * 0.38;\n" +
      "  col += u_accent * rim * 0.22;\n" +
      "  gl_FragColor = vec4(col, 1.0);\n}";
    var LINE_VERT = "attribute vec3 a_pos;\nuniform mat4 u_mvp;\n" +
      "void main() {\n  gl_Position = u_mvp * vec4(a_pos, 1.0);\n}";
    var LINE_FRAG = "precision mediump float;\nuniform vec3 u_accent;\n" +
      "void main() {\n  gl_FragColor = vec4(u_accent, 0.28);\n}";

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh) || "shader compile failed");
      }
      return sh;
    }
    function makeProg(vs, fs) {
      var p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(p) || "program link failed");
      }
      return p;
    }
    var meshProg = makeProg(VERT, FRAG);
    var lineProg = makeProg(LINE_VERT, LINE_FRAG);

    function mul(a, b) {
      var o = new Float32Array(16), c, r;
      for (c = 0; c < 4; c++) for (r = 0; r < 4; r++) {
        o[c * 4 + r] =
          a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] +
          a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
      return o;
    }
    function perspective(fovy, aspect, near, far) {
      var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      var o = new Float32Array(16);
      o[0] = f / aspect; o[5] = f;
      o[10] = (far + near) * nf; o[11] = -1;
      o[14] = 2 * far * near * nf;
      return o;
    }
    function translate(x, y, z) {
      var o = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
      o[12] = x; o[13] = y; o[14] = z;
      return o;
    }
    function rotateXY(ax, ay) {
      var cx = Math.cos(ax), sx = Math.sin(ax);
      var cy = Math.cos(ay), sy = Math.sin(ay);
      var rx = new Float32Array([1,0,0,0, 0,cx,sx,0, 0,-sx,cx,0, 0,0,0,1]);
      var ry = new Float32Array([cy,0,-sy,0, 0,1,0,0, sy,0,cy,0, 0,0,0,1]);
      return mul(ry, rx);
    }

    /* torus geometry + per-face normals + wire pass (donor math, 1:1) */
    function torus(major, minor, R, r) {
      var pos = [], nrm = [], lines = [];
      function point(i, j) {
        var u = (i / major) * Math.PI * 2, v = (j / minor) * Math.PI * 2;
        var cx = Math.cos(u), sx = Math.sin(u);
        var cy = Math.cos(v), sy = Math.sin(v);
        return [(R + r * cy) * cx, r * sy, (R + r * cy) * sx];
      }
      function tri(a, b, c) {
        var ux = b[0]-a[0], uy = b[1]-a[1], uz = b[2]-a[2];
        var vx = c[0]-a[0], vy = c[1]-a[1], vz = c[2]-a[2];
        var nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx;
        var len = Math.hypot(nx, ny, nz) || 1;
        nx /= len; ny /= len; nz /= len;
        var k, p;
        for (k = 0; k < 3; k++) {
          p = [a, b, c][k];
          pos.push(p[0], p[1], p[2]); nrm.push(nx, ny, nz);
        }
      }
      var i, j, a, b, c, d;
      for (i = 0; i < major; i++) for (j = 0; j < minor; j++) {
        a = point(i, j); b = point(i + 1, j);
        c = point(i + 1, j + 1); d = point(i, j + 1);
        tri(a, b, c); tri(a, c, d);
        lines.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        lines.push(a[0], a[1], a[2], d[0], d[1], d[2]);
      }
      return {
        pos: new Float32Array(pos), nrm: new Float32Array(nrm),
        count: pos.length / 3,
        lines: new Float32Array(lines), lineCount: lines.length / 3
      };
    }
    function grid(size, step) {
      var pts = [], i;
      for (i = -size; i <= size; i += step) {
        pts.push(-size, 0, i, size, 0, i);
        pts.push(i, 0, -size, i, 0, size);
      }
      return { data: new Float32Array(pts), count: pts.length / 3 };
    }
    var mesh = torus(16, 10, 1.05, 0.42);
    var floor = grid(4.5, 0.5);

    function makeBuf(data) {
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return b;
    }
    var posBuf = makeBuf(mesh.pos), nrmBuf = makeBuf(mesh.nrm);
    var lineBuf = makeBuf(mesh.lines), gridBuf = makeBuf(floor.data);
    function bindAttrib(prog, name, buffer, size) {
      var loc = gl.getAttribLocation(prog, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.043, 0.047, 0.055, 1);
    gl.viewport(0, 0, canvas.width, canvas.height);

    var yaw = 0.7, pitch = 0.45, auto = true;
    var on = true, raf = 0, last = 0;
    var dragging = false, downX = 0, downY = 0, lastX = 0, lastY = 0;

    function toggle() {
      on = !on;
      canvas.classList.toggle("off", !on);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (on && !reduced) { last = 0; raf = requestAnimationFrame(frame); }
    }
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; auto = false;
      downX = e.clientX; downY = e.clientY;
      lastX = e.clientX; lastY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.008;
      pitch += (e.clientY - lastY) * 0.008;
      pitch = Math.max(-0.2, Math.min(1.2, pitch));
      lastX = e.clientX; lastY = e.clientY;
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      /* a tap (no real movement) toggles power instead of orbiting */
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) toggle();
    }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", function () { dragging = false; });

    function frame(now) {
      var dt = Math.min(0.1, last ? (now - last) * 0.001 : 0.016);
      last = now;
      if (auto && !reduced) yaw += dt * 0.45;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var aspect = canvas.width / canvas.height;
      var proj = perspective(Math.PI / 4, aspect, 0.1, 40);
      var view = mul(translate(0, -0.15, -5.2), rotateXY(-0.35, 0));
      var model = mul(translate(0, 0.55, 0), rotateXY(pitch, yaw));
      var mvp = mul(mul(proj, view), model);
      var gridMvp = mul(mul(proj, view), translate(0, -0.85, 0));

      gl.useProgram(meshProg);
      gl.uniformMatrix4fv(gl.getUniformLocation(meshProg, "u_mvp"), false, mvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(meshProg, "u_model"), false, model);
      gl.uniform3fv(gl.getUniformLocation(meshProg, "u_cam"), [0, 1.6, 5.2]);
      gl.uniform3fv(gl.getUniformLocation(meshProg, "u_color"), COLOR);
      gl.uniform3fv(gl.getUniformLocation(meshProg, "u_accent"), ACCENT);
      bindAttrib(meshProg, "a_pos", posBuf, 3);
      bindAttrib(meshProg, "a_nrm", nrmBuf, 3);
      gl.enable(gl.CULL_FACE);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);

      gl.useProgram(lineProg);
      gl.uniform3fv(gl.getUniformLocation(lineProg, "u_accent"), ACCENT);
      gl.uniformMatrix4fv(gl.getUniformLocation(lineProg, "u_mvp"), false, mvp);
      bindAttrib(lineProg, "a_pos", lineBuf, 3);
      gl.disable(gl.CULL_FACE);
      gl.drawArrays(gl.LINES, 0, mesh.lineCount);

      gl.uniformMatrix4fv(gl.getUniformLocation(lineProg, "u_mvp"), false, gridMvp);
      bindAttrib(lineProg, "a_pos", gridBuf, 3);
      gl.drawArrays(gl.LINES, 0, floor.count);

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      canvas.classList.add("off");
    });

    try {
      if (reduced) frame(performance.now());
      else raf = requestAnimationFrame(frame);
    } catch (err) {
      canvas.classList.add("off");
    }
  }

  /* --- shelf frame: elite dotted planet (adapted from 3d-retro.com, cc0) --- */
  function eliteFrame() {
    var wrap = document.getElementById("elite-frame");
    var canvas = document.getElementById("elite-c");
    if (!wrap || !canvas) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var BW = 192, BH = 128;
    var buf = document.createElement("canvas");
    buf.width = BW; buf.height = BH;
    var bctx = buf.getContext("2d");
    var ctx = canvas.getContext("2d");
    if (!bctx || !ctx) { canvas.classList.add("off"); return; }

    var RGB = [200, 210, 220];
    var stars = [], i;
    for (i = 0; i < 120; i++) {
      stars.push({ x: Math.random(), y: Math.random(),
        a: 0.25 + Math.random() * 0.7, s: 0.7 + Math.random() * 1.4 });
    }

    var yaw = 0.6, pitch = 0.25, auto = true;
    var on = true, raf = 0, last = 0;
    var dragging = false, downX = 0, downY = 0, lastX = 0, lastY = 0;

    function toggle() {
      on = !on;
      canvas.classList.toggle("off", !on);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (on && !reduced) { last = 0; raf = requestAnimationFrame(frame); }
    }
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; auto = false;
      downX = e.clientX; downY = e.clientY;
      lastX = e.clientX; lastY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.008;
      pitch += (e.clientY - lastY) * 0.006;
      pitch = Math.max(-0.9, Math.min(0.9, pitch));
      lastX = e.clientX; lastY = e.clientY;
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      /* a tap (no real movement) toggles power instead of spinning */
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) toggle();
    }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", function () { dragging = false; });

    function rot(x, y, z) {
      var cx = Math.cos(pitch), sx = Math.sin(pitch);
      var cy = Math.cos(yaw), sy = Math.sin(yaw);
      var y2 = y * cx - z * sx; z = y * sx + z * cx; y = y2;
      var x2 = x * cy + z * sy; z = -x * sy + z * cy;
      return [x2, y, z];
    }

    function draw() {
      bctx.fillStyle = "#000";
      bctx.fillRect(0, 0, BW, BH);
      var w = BW, h = BH, i, s, p, k, a, sx, sy;
      for (i = 0; i < stars.length; i++) {
        s = stars[i];
        bctx.fillStyle = "rgba(" + RGB[0] + "," + RGB[1] + "," + RGB[2] + "," + s.a + ")";
        bctx.fillRect(s.x * w, s.y * h, s.s, s.s);
      }
      var R = Math.min(w, h) * 0.32;
      var cx = w * 0.5, cy = h * 0.52;
      /* planet: lat/long dot grid, back culled, lambert terminator */
      var latN = 16, lonN = 28, lat, cl, sl, lon, x, y, z, lambert, size;
      for (i = 0; i <= latN; i++) {
        lat = (i / latN) * Math.PI - Math.PI / 2;
        cl = Math.cos(lat); sl = Math.sin(lat);
        for (var j = 0; j < lonN; j++) {
          lon = (j / lonN) * Math.PI * 2;
          x = cl * Math.cos(lon); y = sl; z = cl * Math.sin(lon);
          p = rot(x, y, z);
          if (p[2] < 0.04) continue;
          lambert = Math.max(0.12, p[2] * 0.7 + 0.25);
          size = 1.1 + p[2] * 1.1;
          bctx.fillStyle = "rgba(" + (RGB[0] * lambert | 0) + "," +
            (RGB[1] * lambert | 0) + "," + (RGB[2] * lambert | 0) + ",0.95)";
          bctx.fillRect(cx + p[0] * R - size * 0.5, cy - p[1] * R - size * 0.5, size, size);
        }
      }
      /* cheap ring: tilted ellipse line through the rotated planet */
      bctx.strokeStyle = "rgba(" + RGB[0] + "," + RGB[1] + "," + RGB[2] + ",0.28)";
      bctx.lineWidth = 1;
      bctx.beginPath();
      for (k = 0; k <= 64; k++) {
        a = (k / 64) * Math.PI * 2;
        p = rot(Math.cos(a) * 1.35, 0.08, Math.sin(a) * 1.35);
        sx = cx + p[0] * R; sy = cy - p[1] * R;
        if (k === 0) bctx.moveTo(sx, sy); else bctx.lineTo(sx, sy);
      }
      bctx.stroke();
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function frame(now) {
      var dt = Math.min(0.1, last ? (now - last) * 0.001 : 0.016);
      last = now;
      if (auto && !reduced) yaw += dt * 0.22;
      resize();
      draw();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    try {
      resize();
      if (reduced) frame(performance.now());
      else raf = requestAnimationFrame(frame);
    } catch (err) {
      canvas.classList.add("off");
    }
  }

  /* --- shelf frame: wireframe globe (adapted from 3d-retro.com, cc0) --- */
  function globeFrame() {
    var wrap = document.getElementById("globe-frame");
    var canvas = document.getElementById("globe-c");
    if (!wrap || !canvas) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var BW = 192, BH = 128;
    var buf = document.createElement("canvas");
    buf.width = BW; buf.height = BH;
    var bctx = buf.getContext("2d");
    var ctx = canvas.getContext("2d");
    if (!bctx || !ctx) { canvas.classList.add("off"); return; }

    var COLOR = [110, 231, 183], HI = [210, 255, 236];
    var LAT = 13, LON = 24, i, j;
    var verts = [];
    function sph(lat, lon) {
      var phi = (lat / LAT) * Math.PI;
      var th = (lon / LON) * Math.PI * 2;
      return {
        x: Math.sin(phi) * Math.cos(th),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(th)
      };
    }
    for (i = 0; i <= LAT; i++) {
      for (j = 0; j <= LON; j++) verts.push(sph(i, j));
    }
    function idx(a, b) { return a * (LON + 1) + (b % (LON + 1)); }
    var edges = [];
    for (i = 0; i <= LAT; i++) {
      for (j = 0; j < LON; j++) {
        edges.push(idx(i, j), idx(i, j + 1), (i === ((LAT / 2) | 0)) ? 2 : 0);
      }
    }
    for (j = 0; j < LON; j++) {
      for (i = 0; i < LAT; i++) {
        edges.push(idx(i, j), idx(i + 1, j), (j === 0) ? 2 : 0);
      }
    }

    var yaw = 0.85, pitch = 0.35, auto = true;
    var on = true, raf = 0, last = 0;
    var dragging = false, downX = 0, downY = 0, lastX = 0, lastY = 0;

    function toggle() {
      on = !on;
      canvas.classList.toggle("off", !on);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (on && !reduced) { last = 0; raf = requestAnimationFrame(frame); }
    }
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; auto = false;
      downX = e.clientX; downY = e.clientY;
      lastX = e.clientX; lastY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.008;
      pitch += (e.clientY - lastY) * 0.008;
      pitch = Math.max(-1.1, Math.min(1.1, pitch));
      lastX = e.clientX; lastY = e.clientY;
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      /* a tap (no real movement) toggles power instead of spinning */
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) toggle();
    }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", function () { dragging = false; });

    function rotate(p) {
      var cy = Math.cos(yaw), sy = Math.sin(yaw);
      var x1 = p.x * cy + p.z * sy;
      var z1 = -p.x * sy + p.z * cy;
      var cp = Math.cos(pitch), sp = Math.sin(pitch);
      var y2 = p.y * cp - z1 * sp;
      var z2 = p.y * sp + z1 * cp;
      return { x: x1, y: y2, z: z2 };
    }

    function draw() {
      bctx.fillStyle = "#07090a";
      bctx.fillRect(0, 0, BW, BH);
      var cx = BW * 0.5, cy = BH * 0.5;
      var cam = 2.85;
      var fov = Math.min(BW, BH) * 0.92;
      var proj = verts.map(rotate);
      bctx.lineCap = "round"; bctx.lineJoin = "round";
      for (var e = 0; e < edges.length; e += 3) {
        var a = proj[edges[e]], b = proj[edges[e + 1]];
        var kind = edges[e + 2];
        var za = a.z + cam, zb = b.z + cam;
        if (za < 0.15 || zb < 0.15) continue;
        var depth = 0.25 * (a.z + b.z) + 0.5;
        var alpha = 0.22 + depth * (kind ? 0.78 : 0.58);
        var x0 = cx + a.x * fov / za, y0 = cy - a.y * fov / za;
        var x1 = cx + b.x * fov / zb, y1 = cy - b.y * fov / zb;
        var col = kind ? HI : COLOR;
        bctx.strokeStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] +
          "," + (alpha * 0.28).toFixed(3) + ")";
        bctx.lineWidth = kind ? 2.2 : 1.6;
        bctx.beginPath(); bctx.moveTo(x0, y0); bctx.lineTo(x1, y1); bctx.stroke();
        bctx.strokeStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] +
          "," + alpha.toFixed(3) + ")";
        bctx.lineWidth = kind ? 1.0 : 0.7;
        bctx.beginPath(); bctx.moveTo(x0, y0); bctx.lineTo(x1, y1); bctx.stroke();
      }
    }

    function frame(now) {
      var dt = Math.min(0.1, last ? (now - last) * 0.001 : 0.016);
      last = now;
      if (auto && !reduced) yaw += dt * 0.28;
      draw();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    try {
      if (reduced) frame(performance.now());
      else raf = requestAnimationFrame(frame);
    } catch (err) {
      canvas.classList.add("off");
    }
  }

  /* --- fluid tank: stam stable-fluids dye, adapted from 3d-retro.com (cc0) --- */
  function fluidFrame() {
    var wrap = document.getElementById("fluid-frame");
    var canvas = document.getElementById("fluid-c");
    if (!wrap || !canvas) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var N = 48, ITER = 4, dim = N + 2, size = dim * dim, i, j;
    var off = document.createElement("canvas");
    off.width = N; off.height = N;
    var offCtx = off.getContext("2d");
    var ctx = canvas.getContext("2d");
    if (!offCtx || !ctx) { canvas.classList.add("off"); return; }

    function ix(a, b) { return a + dim * b; }
    function field() { return new Float32Array(size); }
    var u = field(), v = field(), u0 = field(), v0 = field();
    var dens = field(), dens0 = field(), p = field(), div = field();
    var COLOR = [110, 231, 183]; /* #6ee7b7 */

    function setBnd(b, x) {
      for (i = 1; i <= N; i++) {
        x[ix(0, i)] = b === 1 ? -x[ix(1, i)] : x[ix(1, i)];
        x[ix(N + 1, i)] = b === 1 ? -x[ix(N, i)] : x[ix(N, i)];
        x[ix(i, 0)] = b === 2 ? -x[ix(i, 1)] : x[ix(i, 1)];
        x[ix(i, N + 1)] = b === 2 ? -x[ix(i, N)] : x[ix(i, N)];
      }
      x[ix(0, 0)] = 0.5 * (x[ix(1, 0)] + x[ix(0, 1)]);
      x[ix(0, N + 1)] = 0.5 * (x[ix(1, N + 1)] + x[ix(0, N)]);
      x[ix(N + 1, 0)] = 0.5 * (x[ix(N, 0)] + x[ix(N + 1, 1)]);
      x[ix(N + 1, N + 1)] = 0.5 * (x[ix(N, N + 1)] + x[ix(N + 1, N)]);
    }
    function linSolve(b, x, x0, a, c) {
      var inv = 1 / c, k;
      for (k = 0; k < ITER; k++) {
        for (j = 1; j <= N; j++) {
          for (i = 1; i <= N; i++) {
            x[ix(i, j)] = (x0[ix(i, j)] + a * (
              x[ix(i - 1, j)] + x[ix(i + 1, j)] +
              x[ix(i, j - 1)] + x[ix(i, j + 1)]
            )) * inv;
          }
        }
        setBnd(b, x);
      }
    }
    function diffuse(b, x, x0, diff, dt) {
      var a = dt * diff * N * N;
      linSolve(b, x, x0, a, 1 + 4 * a);
    }
    function advect(b, d, d0, uu, vv, dt) {
      var dt0 = dt * N, x, y, i0, i1, j0, j1, s0, s1, t0, t1;
      for (j = 1; j <= N; j++) {
        for (i = 1; i <= N; i++) {
          x = i - dt0 * uu[ix(i, j)];
          y = j - dt0 * vv[ix(i, j)];
          if (x < 0.5) x = 0.5;
          if (x > N + 0.5) x = N + 0.5;
          if (y < 0.5) y = 0.5;
          if (y > N + 0.5) y = N + 0.5;
          i0 = x | 0; i1 = i0 + 1;
          j0 = y | 0; j1 = j0 + 1;
          s1 = x - i0; s0 = 1 - s1;
          t1 = y - j0; t0 = 1 - t1;
          d[ix(i, j)] =
            s0 * (t0 * d0[ix(i0, j0)] + t1 * d0[ix(i0, j1)]) +
            s1 * (t0 * d0[ix(i1, j0)] + t1 * d0[ix(i1, j1)]);
        }
      }
      setBnd(b, d);
    }
    function project(uu, vv, pp, dv) {
      for (j = 1; j <= N; j++) {
        for (i = 1; i <= N; i++) {
          dv[ix(i, j)] = -0.5 * (
            uu[ix(i + 1, j)] - uu[ix(i - 1, j)] +
            vv[ix(i, j + 1)] - vv[ix(i, j - 1)]
          ) / N;
          pp[ix(i, j)] = 0;
        }
      }
      setBnd(0, dv);
      setBnd(0, pp);
      linSolve(0, pp, dv, 1, 4);
      for (j = 1; j <= N; j++) {
        for (i = 1; i <= N; i++) {
          uu[ix(i, j)] -= 0.5 * N * (pp[ix(i + 1, j)] - pp[ix(i - 1, j)]);
          vv[ix(i, j)] -= 0.5 * N * (pp[ix(i, j + 1)] - pp[ix(i, j - 1)]);
        }
      }
      setBnd(1, uu);
      setBnd(2, vv);
    }
    function velStep(dt) {
      diffuse(1, u0, u, 0.00012, dt);
      diffuse(2, v0, v, 0.00012, dt);
      project(u0, v0, p, div);
      advect(1, u, u0, u0, v0, dt);
      advect(2, v, v0, u0, v0, dt);
      project(u, v, p, div);
    }
    function densStep(dt) {
      var k;
      diffuse(0, dens0, dens, 0.00008, dt);
      advect(0, dens, dens0, u, v, dt);
      for (k = 0; k < size; k++) dens[k] *= 0.994;
    }
    function splat(gx, gy, dx, dy, amount) {
      var si = Math.max(1, Math.min(N, gx | 0));
      var sj = Math.max(1, Math.min(N, gy | 0));
      var oi, oj, ii, jj, wgt;
      for (oj = -1; oj <= 1; oj++) {
        for (oi = -1; oi <= 1; oi++) {
          ii = si + oi; jj = sj + oj;
          if (ii < 1 || jj < 1 || ii > N || jj > N) continue;
          wgt = (oi === 0 && oj === 0) ? 1 : 0.45;
          dens[ix(ii, jj)] += amount * wgt;
          u[ix(ii, jj)] += dx * wgt;
          v[ix(ii, jj)] += dy * wgt;
        }
      }
    }

    var pixels = offCtx.createImageData(N, N);
    var data = pixels.data;
    function render() {
      var d, spd, glow, o;
      for (j = 1; j <= N; j++) {
        for (i = 1; i <= N; i++) {
          d = dens[ix(i, j)];
          spd = Math.hypot(u[ix(i, j)], v[ix(i, j)]);
          glow = Math.min(1, Math.min(1, d * 0.045) + spd * 0.08);
          o = ((j - 1) * N + (i - 1)) * 4;
          data[o] = 12 + glow * COLOR[0];
          data[o + 1] = 14 + glow * COLOR[1];
          data[o + 2] = 16 + glow * COLOR[2];
          data[o + 3] = 255;
        }
      }
      offCtx.putImageData(pixels, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    }

    var on = true, raf = 0, last = 0;
    var pointer = { x: 0, y: 0, px: 0, py: 0, down: false, inside: false };
    var downX = 0, downY = 0;

    function toggle() {
      on = !on;
      canvas.classList.toggle("off", !on);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (on && !reduced) { last = 0; raf = requestAnimationFrame(frame); }
    }
    function toGrid(e) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * N + 1,
        y: ((e.clientY - rect.top) / rect.height) * N + 1
      };
    }
    canvas.addEventListener("pointerdown", function (e) {
      var g = toGrid(e);
      pointer.down = true; pointer.inside = true;
      pointer.x = pointer.px = g.x;
      pointer.y = pointer.py = g.y;
      downX = e.clientX; downY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    canvas.addEventListener("pointermove", function (e) {
      var g = toGrid(e);
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      pointer.x = g.x;
      pointer.y = g.y;
      pointer.inside = true;
    });
    canvas.addEventListener("pointerup", function (e) {
      pointer.down = false;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) toggle();
    });
    canvas.addEventListener("pointercancel", function () {
      pointer.down = false; pointer.inside = false;
    });
    canvas.addEventListener("pointerleave", function () { pointer.inside = false; });

    function frame(now) {
      var dt = Math.min(0.033, last ? (now - last) * 0.001 : 0.016);
      last = now;
      var t = now * 0.001;
      var ang = t * 0.85;
      var gx = N * 0.5 + Math.cos(ang) * N * 0.22;
      var gy = N * 0.5 + Math.sin(ang * 0.72) * N * 0.18;
      splat(gx, gy, -Math.sin(ang) * 22, Math.cos(ang * 0.72) * 22, 42);
      if (pointer.inside || pointer.down) {
        var dx = (pointer.x - pointer.px) * 12;
        var dy = (pointer.y - pointer.py) * 12;
        splat(pointer.x, pointer.y, dx, dy, pointer.down ? 90 : 22);
        pointer.px = pointer.x;
        pointer.py = pointer.y;
      }
      velStep(dt);
      densStep(dt);
      render();
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    try {
      if (reduced) {
        splat(N * 0.45, N * 0.5, 8, -4, 120);
        splat(N * 0.62, N * 0.42, -6, 5, 90);
        velStep(0.016);
        densStep(0.016);
        render();
      } else {
        raf = requestAnimationFrame(frame);
      }
    } catch (err) {
      canvas.classList.add("off");
    }
  }

  /* --- ps1 affine warp (adapted from 3d-retro.com, cc0) ---
     software rasterizer with screen-space (affine) uv interpolation and
     gte-style integer vertex snapping — the texture "swim" is the point. */
  function ps1Frame() {
    var wrap = document.getElementById("ps1-frame");
    var canvas = document.getElementById("ps1-c");
    if (!wrap || !canvas) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ctx = canvas.getContext("2d");
    if (!ctx) { canvas.classList.add("off"); return; }

    var BW = 192, BH = 128, F = 93; /* donor 320x180/155, same fov */
    var img = ctx.createImageData(BW, BH);
    var px = img.data;
    var zbuf = new Float32Array(BW * BH);
    var TINT = [110, 231, 183]; /* #6ee7b7 */

    var yaw = 0.4, pitch = 0.35, auto = true, dragging = false;
    var lastX = 0, lastY = 0, downX = 0, downY = 0;

    function rot(p, ax, ay) {
      var cx = Math.cos(ax), sx = Math.sin(ax);
      var cy = Math.cos(ay), sy = Math.sin(ay);
      var x = p[0], y = p[1], z = p[2];
      var y2 = y * cx - z * sx; z = y * sx + z * cx; y = y2;
      var x2 = x * cy + z * sy; z = -x * sy + z * cy; x = x2;
      return [x, y, z];
    }

    function project(p) {
      var z = p[2] + 5.2;
      if (z < 0.2) return null;
      var f = F / z;
      var x = BW * 0.5 + p[0] * f;
      var y = BH * 0.42 - p[1] * f;
      x = (x + 0.5) | 0; y = (y + 0.5) | 0; /* gte vertex snap */
      return { x: x, y: y, z: z };
    }

    function baryFill(a, b, c, uvs, tint) {
      var minx = Math.max(0, Math.min(a.x, b.x, c.x) | 0);
      var maxx = Math.min(BW - 1, Math.max(a.x, b.x, c.x) | 0);
      var miny = Math.max(0, Math.min(a.y, b.y, c.y) | 0);
      var maxy = Math.min(BH - 1, Math.max(a.y, b.y, c.y) | 0);
      var area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (area <= 1) return;
      var inv = 1 / area, x, y, w0, w1, w2, z, zi, u, v, chk, fog, k, i;
      for (y = miny; y <= maxy; y++) {
        for (x = minx; x <= maxx; x++) {
          w0 = ((b.x - x) * (c.y - y) - (b.y - y) * (c.x - x)) * inv;
          w1 = ((c.x - x) * (a.y - y) - (c.y - y) * (a.x - x)) * inv;
          w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          z = w0 * a.z + w1 * b.z + w2 * c.z;
          zi = y * BW + x;
          if (z >= zbuf[zi]) continue;
          zbuf[zi] = z;
          /* affine (non-perspective) uv — this is what swims */
          u = w0 * uvs[0] + w1 * uvs[2] + w2 * uvs[4];
          v = w0 * uvs[1] + w1 * uvs[3] + w2 * uvs[5];
          chk = (((u * 8) | 0) ^ ((v * 8) | 0)) & 1;
          fog = 1 / (1 + (z - 2.2) * 0.18);
          k = (chk ? 1 : 0.22) * fog;
          i = zi * 4;
          px[i] = tint[0] * k;
          px[i + 1] = tint[1] * k;
          px[i + 2] = tint[2] * k;
          px[i + 3] = 255;
        }
      }
    }

    function tri(pts, i0, i1, i2, uvs, tint) {
      var a = pts[i0], b = pts[i1], c = pts[i2];
      if (!a || !b || !c) return;
      if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) <= 0) return;
      baryFill(a, b, c, uvs, tint);
    }

    var floorTint = [TINT[0] * 0.85, TINT[1] * 0.85, TINT[2] * 0.7];
    var cubePts = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    var faces = [
      [0, 1, 2, 0, 2, 3], [5, 4, 7, 5, 7, 6], [4, 0, 3, 4, 3, 7],
      [1, 5, 6, 1, 6, 2], [3, 2, 6, 3, 6, 7], [4, 5, 1, 4, 1, 0]
    ];
    var tints = [
      [TINT[0], TINT[1], TINT[2]],
      [TINT[0] * 0.55, TINT[1] * 0.55, TINT[2] * 0.55],
      [TINT[0] * 0.75, TINT[1] * 0.7, TINT[2] * 0.55],
      [TINT[0] * 0.7, TINT[1] * 0.8, TINT[2] * 0.75],
      [Math.min(255, TINT[0] * 1.1), Math.min(255, TINT[1] * 1.1), TINT[2]],
      [TINT[0] * 0.4, TINT[1] * 0.4, TINT[2] * 0.45]
    ];

    function draw() {
      var i, y, horizon = (BH * 0.48) | 0;
      for (i = 0; i < px.length; i += 4) {
        y = (i / 4 / BW) | 0;
        px[i] = 18; px[i + 1] = 22; px[i + 2] = 32; px[i + 3] = 255;
        if (y >= horizon) {
          px[i] = 12; px[i + 1] = 14; px[i + 2] = 18;
        }
      }
      zbuf.fill(1e9);

      var floor = [
        [-5.5, -1.35, -5.5], [5.5, -1.35, -5.5],
        [5.5, -1.35, 5.5], [-5.5, -1.35, 5.5]
      ].map(function (p) { return project(rot(p, 0.38, yaw * 0.2)); });
      tri(floor, 0, 1, 2, [0, 0, 2, 0, 2, 2], floorTint);
      tri(floor, 0, 2, 3, [0, 0, 2, 2, 0, 2], floorTint);

      var sp = cubePts.map(function (p) {
        return project(rot([p[0] * 0.85, p[1] * 0.85 + 0.55, p[2] * 0.85], pitch, yaw));
      });
      var f, id;
      for (f = 0; f < faces.length; f++) {
        id = faces[f];
        tri(sp, id[0], id[1], id[2], [0, 0, 1, 0, 1, 1], tints[f]);
        tri(sp, id[3], id[4], id[5], [0, 0, 1, 1, 0, 1], tints[f]);
      }
      ctx.putImageData(img, 0, 0);
    }

    var on = true, raf = 0, last = 0;

    function toggle() {
      on = !on;
      canvas.classList.toggle("off", !on);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (on && !reduced) { last = 0; raf = requestAnimationFrame(frame); }
    }

    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; auto = false;
      lastX = e.clientX; lastY = e.clientY;
      downX = e.clientX; downY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.01;
      pitch += (e.clientY - lastY) * 0.01;
      pitch = Math.max(-0.2, Math.min(1.1, pitch));
      lastX = e.clientX; lastY = e.clientY;
    });
    canvas.addEventListener("pointerup", function (e) {
      dragging = false;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) toggle();
    });
    canvas.addEventListener("pointercancel", function () { dragging = false; });

    function frame(now) {
      var dt = Math.min(0.05, last ? (now - last) * 0.001 : 0.016);
      last = now;
      if (auto) yaw += dt * 0.45;
      draw();
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    try {
      if (reduced) { draw(); } else { raf = requestAnimationFrame(frame); }
    } catch (err) {
      canvas.classList.add("off");
    }
  }

  tickClock();
  paintSky();
  meteorWatch();
  runnerWatch();
  boingBall();
  plasmaCRT();
  donutTerm();
  voxelFly();
  starFrame();
  metaFrame();
  lowpolyFrame();
  eliteFrame();
  globeFrame();
  fluidFrame();
  ps1Frame();
  setInterval(tickClock, 1000);
  setInterval(paintSky, 60000);
  loadRoom();
})();
