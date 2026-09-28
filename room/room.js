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

  tickClock();
  paintSky();
  boingBall();
  plasmaCRT();
  setInterval(tickClock, 1000);
  setInterval(paintSky, 60000);
  loadRoom();
})();
