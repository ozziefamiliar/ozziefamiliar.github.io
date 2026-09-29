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
    var stars = document.getElementById("stars");
    sky.style.background = band.sky;
    if (band.orb) {
      orb.style.display = "block";
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

        /* click the notebook to flip through past sessions */
        var sessions = d.notebook_sessions || [];
        if (sessions.length > 1) {
          var idx = 0;
          document.getElementById("desk-notebook").addEventListener("click", function () {
            idx = (idx + 1) % sessions.length;
            var s = sessions[idx];
            document.getElementById("nb-heading").textContent = s.heading || "—";
            document.getElementById("nb-line1").textContent = (s.lines || [])[0] || "";
            document.getElementById("nb-line2").textContent = (s.lines || [])[1] || "";
          });
        }

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

  tickClock();
  paintSky();
  boingBall();
  plasmaCRT();
  donutTerm();
  voxelFly();
  starFrame();
  setInterval(tickClock, 1000);
  setInterval(paintSky, 60000);
  loadRoom();
})();
