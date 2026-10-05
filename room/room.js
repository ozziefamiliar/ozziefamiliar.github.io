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
  /* desk lamp: lights itself after dark. keyed to real phoenix night (the
     same stars-opacity gate as the meteors), not a schedule i picked.
     body.lamplit glows the bulb and fades the light cone + desk pool in
     over 3s (instant under prefers-reduced-motion). window.__forceLamp
     (true/false) is the console easter egg to peek anytime (and the
     headless hook). called from paintSky so the minute tick keeps it
     in sync with dusk and dawn. */
  function paintLamp() {
    var force = window.__forceLamp;
    var stars = document.getElementById("stars");
    var night = stars && stars.style.opacity === "1";
    var on = force === true ? true : force === false ? false : night;
    document.body.classList.toggle("lamplit", on);
  }
  window.__paintLamp = paintLamp; /* headless-test hook */

  /* morning coffee: the steam over the desk mug only rises on phoenix
     mornings (5:00–10:00 local), not a spawn timer. body.coffeemorning
     fades the wisps in over 4s (instant under prefers-reduced-motion,
     where the steam hides entirely and the mug stays as furniture).
     window.__forceMug (true/false) is the console easter egg to peek
     anytime (and the headless hook). called from paintSky so the minute
     tick carries it through dawn. */
  function paintMug() {
    var force = window.__forceMug;
    var h = phxNow().getHours() + phxNow().getMinutes() / 60;
    var on = force === true ? true : force === false ? false : (h >= 5 && h < 10);
    document.body.classList.toggle("coffeemorning", on);
    paintWindLean(); /* the steam leans with the real wind direction */
  }
  window.__paintMug = paintMug; /* headless-test hook */

  /* wind lean: the real phoenix wind has a direction now, not just a
     speed — meteorological degrees from open-meteo, stashed beside the
     wind in data.json. two things answer it, so the room agrees with
     itself: the outside rain streaks slant (the wx-rain gradient angle
     rides --rainang) and the morning coffee steam leans (the .steam
     container rides --steamlean). the east mesa stands on the left of the
     frame, so the window faces south — wind FROM direction d blows toward
     the view's left by sin(d) (d=270 from the west -> toward the east ->
     left). magnitude scales 0..1 by 40 km/h; calm air stays straight.
     static geometry, nothing to idle under prefers-reduced-motion.
     window.__forceWindDir (degrees) is the console easter egg — the peek
     also assumes 25 km/h so the lean reads. called from paintWeather and
     paintMug so the tick and the data refresh both carry it. */
  function paintWindLean() {
    var fdir = window.__forceWindDir;
    var wind = window.__wxWind || 0;
    var dir = (typeof fdir === "number") ? fdir : (window.__wxWindDir || 0);
    if (typeof fdir === "number") wind = Math.max(wind, 25);
    var lean = Math.sin(dir * Math.PI / 180); /* -1..1 lateral, view x */
    var amp = Math.min(1, Math.max(0, wind / 40));
    var rain = document.getElementById("wx-rain");
    if (rain) rain.style.setProperty("--rainang",
      (102 + lean * amp * 24).toFixed(1) + "deg");
    var steam = document.querySelectorAll(".steam, .tsteam");
    for (var si = 0; si < steam.length; si++) {
      steam[si].style.setProperty("--steamlean",
        (-lean * amp * 12).toFixed(1) + "deg");
    }
  }
  window.__paintWindLean = paintWindLean; /* headless-test hook */

  /* curtains: tied-back panels that answer the real desert wind. reads
     the same open-meteo wind stash the tumbleweed fires on (km/h) plus
     the weather kind — calm days hang near-still, breezes sway, storms
     billow. amplitude rides --curamp on #sky, period on --curdur; idle
     under prefers-reduced-motion via the css media query.
     window.__forceCurtain (true = storm peek, false = calm peek) is the
     console easter egg and the headless hook. called from paintSky so
     the minute tick keeps it in sync when data.json refreshes. */
  function paintCurtains() {
    var force = window.__forceCurtain;
    var wind = window.__wxWind || 0;
    var K = window.__wxKind || "clear";
    if (force === true) { wind = 30; K = "storm"; }
    else if (force === false) { wind = 0; K = "clear"; }
    var storm = K === "storm";
    var amp = storm ? 6.5 : Math.min(6, Math.max(0.35, (wind - 8) * 0.35));
    var dur = storm ? 2.2 : Math.min(8, Math.max(2.4, 8 - wind * 0.12));
    var sky = document.getElementById("sky");
    if (sky) {
      sky.style.setProperty("--curamp", amp.toFixed(2) + "deg");
      sky.style.setProperty("--curdur", dur.toFixed(2) + "s");
    }
  }
  window.__paintCurtains = paintCurtains; /* headless-test hook */

  /* windmill: an old farm windmill on the horizon turns on the real phoenix
     wind (the same open-meteo stash the tumbleweed fires on). calm days the
     wheel stands still; the spin period maps 1/wind, and races in storm or
     dusty weather. window.__forceWindSpin (a km/h number) is the console
     easter egg and the headless hook; idle under prefers-reduced-motion via
     the css media query. called from paintWeather, beside paintCurtains. */
  function paintWindmill() {
    var force = window.__forceWindSpin;
    var wind = (typeof force === "number") ? force : (window.__wxWind || 0);
    var K = window.__wxKind || "clear";
    var wheel = document.querySelector(".windmill .wheel");
    if (!wheel) return;
    if (wind < 4) {
      wheel.style.animation = "none"; /* calm days the mill stands still */
      window.__windDur = "still";
      return;
    }
    var dur = Math.max(2.2, Math.min(30, 120 / wind));
    if (K === "storm" || K === "dusty") dur *= 0.6; /* blades race in a storm */
    wheel.style.animation = "";
    wheel.style.animationDuration = dur.toFixed(2) + "s";
    window.__windDur = dur.toFixed(2) + "s"; /* headless peek */
  }
  window.__paintWindmill = paintWindmill; /* headless-test hook */

  /* city glow: after dark the horizon north of here carries phoenix's real
     light dome — a faint amber smudge rising behind the mesas. strength
     follows the same real open-meteo weather the window wears: full on
     clear/partly, slightly brighter under cloudy/overcast where the deck
     reflects the dome, faint under dust, off in storm/rain/fog.
     window.__forceCityGlow (true/false) is the console easter egg to peek
     anytime (and the headless hook). called from paintSky so the minute
     tick carries it through dusk and dawn. */
  function paintCityGlow() {
    var force = window.__forceCityGlow;
    var stars = document.getElementById("stars");
    var city = document.getElementById("cityglow");
    if (!city) return;
    var night = stars && stars.style.opacity === "1";
    var op = 0;
    if (force === true) { op = 1; }
    else if (force === false || !night) { op = 0; }
    else {
      var K = window.__wxKind || "clear";
      if (K === "clear" || K === "partly") op = 0.9;
      else if (K === "cloudy" || K === "overcast") op = 1;
      else if (K === "dusty") op = 0.35;
    }
    city.style.opacity = op.toFixed(2);
  }
  window.__paintCityGlow = paintCityGlow; /* headless-test hook */

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
    /* milky way: fades in with the night sky, behind the stars.
       window.__forceMilky is a console easter egg to peek at it anytime
       (and the headless hook) */
    var mw = document.getElementById("milkyway");
    if (mw) mw.classList.toggle("on",
      (!band.orb || window.__forceMilky === true));
    paintLamp(); /* the desk lamp follows nightfall, on the same tick */
    paintMug(); /* the coffee steams through the morning, on the same tick */
    paintCurtains(); /* the curtains answer the real wind, on the same tick */
    paintCityGlow(); /* the light dome glows on the night horizon, on the same tick */
    paintSundogs(); /* rainbow flecks flanking the low sun, on the same tick */
    paintScope(); /* the telescope slews to the radiant on shower nights, on the same tick */
  }

  /* sundogs (parhelia): faint rainbow flecks flanking the sun at ~22
     degrees — red on the inner edge, toward the sun. they need ice
     crystals in the air (crisp, clear cold) and a low sun (they fade as
     it climbs). gate: orb up + clear/partly + real temp <= 75f + orb in
     the lower sky (top >= 40% of its horizon-to-zenith arc). positioned
     ±13% from the orb's real position each minute tick so they track it.
     window.__forceSundog is a console easter egg to peek anytime (and
     the headless hook); static, so reduced-motion has nothing to idle. */
  function paintSundogs() {
    var orb = document.getElementById("orb");
    var orbUp = orb && orb.style.display === "block";
    var wxK = window.__wxKind || "clear";
    var temp = (typeof window.__wxTemp === "number") ? window.__wxTemp : 999;
    var low = orbUp && parseFloat(orb.style.top) >= 40;
    var on = (orbUp && low && temp <= 75 &&
        (wxK === "clear" || wxK === "partly")) ||
      window.__forceSundog === true;
    var dogs = [document.getElementById("sundogL"),
      document.getElementById("sundogR")];
    if (orbUp) {
      var cx = parseFloat(orb.style.left) || 50;
      var cy = parseFloat(orb.style.top) || 50;
      if (dogs[0]) {
        dogs[0].style.left = Math.max(0, cx - 13) + "%";
        dogs[0].style.top = "calc(" + cy + "% - 0.1rem)";
      }
      if (dogs[1]) {
        dogs[1].style.left = Math.min(94, cx + 13) + "%";
        dogs[1].style.top = "calc(" + cy + "% - 0.1rem)";
      }
    }
    dogs.forEach(function (d) { if (d) d.style.opacity = on ? "0.6" : "0"; });
  }
  window.__paintSundogs = paintSundogs;

  /* moon: true lunar phase from data.json. the inset box-shadow paints the
     box MINUS the box translated by (dx,0) — headless-verified: dx = 0
     paints nothing (new moon), |dx| >= the diameter paints the whole disc
     (full moon), and in between it carves the crescent. negative dx lights
     the right limb (waxing), positive the left (waning).
     window.__forceMoonPhase is a console easter egg to peek at any phase */
  var MOON_NAMES = ["new moon", "waxing crescent", "first quarter",
    "waxing gibbous", "full moon", "waning gibbous", "last quarter",
    "waning crescent"];
  function paintMoon(m) {
    var p = (m && typeof m.phase === "number")
      ? (((m.phase % 1) + 1) % 1) : 0.5;
    if (window.__forceMoonPhase != null) {
      p = (((window.__forceMoonPhase % 1) + 1) % 1);
    }
    var illum = (m && typeof m.illum === "number") ? m.illum
      : Math.round((1 - Math.cos(2 * Math.PI * p)) / 2 * 100);
    /* 0 at new moon, 1 at full; the sign picks the lit limb */
    var s = 1 - Math.abs(2 * p - 1);
    var dx = 1.5 * s * (p <= 0.5 ? -1 : 1); /* moon is 1.5rem across */
    var glow = 0.35 * illum / 100;
    var moon = document.getElementById("moon");
    moon.style.background = "transparent";
    moon.style.boxShadow = "0 0 18px 6px rgba(242,238,224," +
      glow.toFixed(3) + "), inset " + dx.toFixed(3) + "rem 0 0 0 #f2eee0";
    var name = (m && m.name) || MOON_NAMES[Math.floor((((p + 1 / 16) % 1) * 8)) % 8];
    moon.title = name + " · " + illum + "% lit";
    /* the moon's real arc: 0 at moonrise, 1 at moonset, from update.py's
       lunar ephemeris in data.json (rise_min/set_min). null when no data.
       hoisted here so the outside wash and the indoor pool ride the same
       arc — the wash now rises and sets with the real moon instead of
       sitting on all night. */
    var mpNow = phxNow();
    var mpT = mpNow.getHours() * 60 + mpNow.getMinutes();
    window.__moonRiseMin = (m && typeof m.rise_min === "number")
      ? m.rise_min : null;
    window.__moonSetMin = (m && typeof m.set_min === "number")
      ? m.set_min : null;
    window.__moonData = m; /* minute tick repaints the drift */
    var moonArc = null;
    if (typeof window.__moonRiseMin === "number" &&
        typeof window.__moonSetMin === "number") {
      var mra = window.__moonRiseMin, msa = window.__moonSetMin, mta = mpT;
      if (msa < mra) msa += 1440;
      if (mta < mra) mta += 1440;
      moonArc = (mta - mra) / (msa - mra);
    }
    var moonUp = moonArc !== null && moonArc >= 0 && moonArc <= 1;
    /* moonlight wash: on clear/partly bright-moon nights the ground strip
       gets a faint silver wash, opacity scaled by the real illumination —
       riding the moon's real arc now (see above): off before moonrise and
       after moonset, so it breathes in and out with the actual moon;
       null arc keeps the old static behavior. window.__forceMoonwash is
       a console easter egg to peek anytime (and the headless hook) */
    var washEl = document.getElementById("moonwash");
    if (washEl) {
      var nightNow = document.getElementById("stars").style.opacity === "1";
      var wxK = window.__wxKind || "clear";
      var washOn = (nightNow && (wxK === "clear" || wxK === "partly") &&
        illum >= 50 && (moonArc === null || moonUp)) ||
        window.__forceMoonwash === true;
      /* the force flag also lifts a dark moon so the peek reads */
      var effIllum = window.__forceMoonwash === true
        ? Math.max(illum, 75) : illum;
      washEl.style.opacity = washOn
        ? (0.12 + 0.20 * (effIllum - 50) / 50).toFixed(3) : "0";
    }
    /* moonlight pooling in the room: on the same bright-moon nights the
       moon comes through the window like the sun does — a cool wash on
       the wall under the sill and a silver patch pooling on the floor,
       mirroring the sun's daytime pieces (paintSun). update.py's real
       phoenix moonrise/moonset (data.json) drifts the patch left→right
       across the floor through the night — slow, like the moon — and the
       pool stays off when the moon is below the horizon; opacity keyed
       to the real illumination, 3s fade in css, z-index 1 under the
       furniture. window.__forceMoonpool easter egg + headless hook peeks
       at mid-arc (and lifts a dark moon so the peek reads, like
       __forceMoonwash) */
    var mp = document.getElementById("moonpool");
    var mw = document.getElementById("moonwall");
    if (mp && mw) {
      if (window.__forceMoonpool === true) moonArc = 0.5;
      moonUp = moonArc !== null && moonArc >= 0 && moonArc <= 1;
      var mpGate = nightNow && (wxK === "clear" || wxK === "partly") &&
        illum >= 50;
      var mpOn = (mpGate && (moonArc === null || moonUp)) ||
        window.__forceMoonpool === true;
      var mpIllum = window.__forceMoonpool === true
        ? Math.max(illum, 75) : illum;
      var mpo = mpOn
        ? Math.min(0.45, (0.12 + 0.20 * (mpIllum - 50) / 50) * 1.4) : 0;
      if (mpOn && moonArc !== null) {
        /* the silver patch rides the moon's real arc: left→right like
           the sun's, spreading wide when the moon hangs low; the wall
           wash leans away from it, evening-side at moonset */
        var mpw = 16 + (1 - Math.sin(moonArc * Math.PI)) * 10; /* rem */
        mp.style.left = (3 + moonArc * 11).toFixed(2) + "rem";
        mp.style.width = mpw.toFixed(2) + "rem";
        mw.style.setProperty("--sp-lean",
          ((0.5 - moonArc) * 46).toFixed(1) + "px");
      }
      mp.style.opacity = mpo.toFixed(3);
      mw.style.opacity = (mpo * 0.6).toFixed(3);
    }
  }
  window.__paintMoon = paintMoon; /* headless-test hook */

  /* alpenglow: twice a day the mesas catch the real sunrise/sunset light.
     update.py stashes the Phoenix-local times in data.json (minutes-of-day,
     refreshed with every data run so they track the seasons); the gate is
     ±25 minutes around each, so the glow lands inside the dawn/dusk sky
     bands and the mesa rims pick up the color. window.__forceGlow is "am"
     or "pm" to peek at either anytime (and the headless hook). */
  function paintGlow() {
    var now = phxNow();
    var t = now.getHours() * 60 + now.getMinutes();
    var cls = null;
    if (window.__forceGlow === "am") cls = "glow-am";
    else if (window.__forceGlow === "pm") cls = "glow-pm";
    else {
      var rise = window.__sunRiseMin, set = window.__sunSetMin;
      if (typeof rise === "number" && Math.abs(t - rise) <= 25) cls = "glow-am";
      else if (typeof set === "number" && Math.abs(t - set) <= 25) cls = "glow-pm";
    }
    document.body.classList.toggle("glow-am", cls === "glow-am");
    document.body.classList.toggle("glow-pm", cls === "glow-pm");
  }
  window.__paintGlow = paintGlow; /* headless-test hook */

  /* sunlight pooling: the real sun comes through the window and lands on
     the room — a warm wash on the wall below the sill (#sunwall) and a
     bright patch on the floor in front of the desk (#sunpool). both
     drift, lean, and warm with the sun's real arc: update.py stashes the
     phoenix-local sunrise/sunset minutes in data.json (window.__
     sunRiseMin/__sunSetMin), and the travel goes left→right mirroring the
     orb's arc across the window sky. morning sun leans the wall wash
     right and lands the floor patch near the window, deep gold; midday
     the wash is upright and the patch centered, pale; evening mirrors
     morning. gated on the open-meteo weather kind (storm/rain/dusty =
     off, overcast/fog = faint and diffuse), ramping up and down over the
     first and last eighth of the day. window.__forceSun ("am"/"noon"/
     "pm") peeks anytime and is the headless hook. repositioned on the
     minute tick alongside paintGlow — no animation loop, nothing to idle
     under prefers-reduced-motion. */
  function mixRGB(a, b, t) {
    return [0, 1, 2].map(function (i) {
      return Math.round(a[i] + (b[i] - a[i]) * t);
    }).join(",");
  }
  function paintSun() {
    var wall = document.getElementById("sunwall");
    var pool = document.getElementById("sunpool");
    var motes = document.getElementById("sunmotes");
    if (!wall || !pool) return;
    var now = phxNow();
    var t = now.getHours() * 60 + now.getMinutes();
    var rise = window.__sunRiseMin, set = window.__sunSetMin;
    var p = null; /* 0 at sunrise, 1 at sunset */
    var force = window.__forceSun;
    if (force === "am") p = 0.1;
    else if (force === "noon") p = 0.5;
    else if (force === "pm") p = 0.9;
    else if (typeof rise === "number" && typeof set === "number" && set > rise) {
      p = (t - rise) / (set - rise);
    }
    var on = p !== null && p >= 0 && p <= 1;
    var K = window.__wxKind || "clear";
    if (on && (K === "storm" || K === "rain" || K === "dusty")) on = false;
    if (!on) {
      wall.style.opacity = "0";
      pool.style.opacity = "0";
      if (motes) motes.style.opacity = "0";
      return;
    }
    /* ramp over the first/last eighth of the day (~1.5h of ~12h) */
    var ramp = Math.max(0, Math.min(1, Math.min(p, 1 - p) / 0.125));
    var maxO = K === "overcast" ? 0.15 : K === "fog" ? 0.10 : 0.42;
    var o = maxO * ramp;
    /* gold at the day's edges, pale at noon */
    var gold = Math.min(1, Math.abs(p - 0.5) * 2.6);
    var c = mixRGB([255, 188, 108], [255, 228, 196], 1 - gold);
    /* wall wash: top edge under the sill, leaning away from the sun —
       morning sun (left) leans it right, evening the mirror */
    var lean = (0.5 - p) * 46; /* px at the top edge */
    wall.style.setProperty("--sp-lean", lean.toFixed(1) + "px");
    wall.style.background = "linear-gradient(to bottom, rgba(" + c +
      ", 0.95), rgba(" + c + ", 0) 85%)";
    wall.style.opacity = o.toFixed(3);
    /* floor pool: drifts left→right through the day, spreading wide when
       the sun is low */
    var width = 16 + (1 - Math.sin(p * Math.PI)) * 10; /* rem */
    pool.style.left = (3 + p * 11).toFixed(2) + "rem";
    pool.style.width = width.toFixed(2) + "rem";
    pool.style.background = "radial-gradient(ellipse at center, rgba(" + c +
      ", 0.9), rgba(" + c + ", 0) 70%)";
    pool.style.opacity = Math.min(0.75, o * 1.15).toFixed(3);
    /* dust motes ride the pool: same geometry, slightly fainter, so the
       specks stay inside the patch as it drifts across the floor */
    if (motes) {
      motes.style.left = pool.style.left;
      motes.style.width = pool.style.width;
      motes.style.opacity = (Math.min(0.75, o * 1.15) * 0.85).toFixed(3);
    }
  }
  window.__paintSun = paintSun; /* headless-test hook */

  /* saguaro ground shadows: the same real phoenix sun that comes through
     the window also falls on the desert. long at dawn/dusk, short at
     noon, switching sides at midday — morning sun (east/left) throws
     each shadow right, afternoon throws it left. off at night and under
     storm/rain/dust, faint under overcast/fog. window.__forceSun
     ("am"/"noon"/"pm") doubles as the headless peek. minute tick keeps
     it in step with paintSun; nothing animates, so reduced-motion has
     nothing to idle. */
  function paintSagShadows() {
    var now = phxNow();
    var t = now.getHours() * 60 + now.getMinutes();
    var rise = window.__sunRiseMin, set = window.__sunSetMin;
    var p = null; /* 0 at sunrise, 1 at sunset */
    var force = window.__forceSun;
    if (force === "am") p = 0.1;
    else if (force === "noon") p = 0.5;
    else if (force === "pm") p = 0.9;
    else if (typeof rise === "number" && typeof set === "number" && set > rise) {
      p = (t - rise) / (set - rise);
    }
    var on = p !== null && p >= 0 && p <= 1;
    var K = window.__wxKind || "clear";
    if (on && (K === "storm" || K === "rain" || K === "dusty")) on = false;
    var shadows = document.querySelectorAll(".saguaro .sagshadow");
    if (!shadows.length) return;
    if (!on) {
      for (var i = 0; i < shadows.length; i++) shadows[i].style.opacity = "0";
      return;
    }
    var elev = Math.sin(p * Math.PI); /* 0 at horizon, 1 at noon */
    var len = Math.min(3.6, Math.max(0.7, 0.85 / Math.max(elev, 0.12)));
    var ramp = Math.max(0, Math.min(1, Math.min(p, 1 - p) / 0.125));
    var o = 0.9 * ramp * (K === "overcast" ? 0.45 : K === "fog" ? 0.35 : 1);
    var flip = p > 0.5;
    for (var j = 0; j < shadows.length; j++) {
      var s = shadows[j];
      s.classList.toggle("flip", flip);
      s.style.width = len.toFixed(2) + "rem";
      s.style.opacity = o.toFixed(3);
    }
  }
  window.__paintSagShadows = paintSagShadows; /* headless-test hook */

  /* dust motes in the sunbeam: a handful of specks seeded once, drifting
     slow rises on alternating loops, desynced by negative delays.
     paintSun positions the whole container with the pool — nothing here
     needs a timer. window.__forceSun rides along, so the noon peek shows
     them too. */
  function seedMotes() {
    var wrap = document.getElementById("sunmotes");
    if (!wrap || wrap.children.length) return;
    for (var i = 0; i < 9; i++) {
      var m = document.createElement("div");
      m.className = "mote";
      m.style.left = (12 + Math.random() * 76).toFixed(1) + "%";
      m.style.top = (18 + Math.random() * 64).toFixed(1) + "%";
      m.style.setProperty("--mx", (Math.random() * 2.6 - 1.3).toFixed(2) + "rem");
      m.style.setProperty("--my", (-(0.8 + Math.random() * 2.4)).toFixed(2) + "rem");
      m.style.setProperty("--md", (13 + Math.random() * 15).toFixed(1) + "s");
      m.style.setProperty("--mdel", (-(Math.random() * 24)).toFixed(1) + "s");
      m.style.setProperty("--mo", (0.30 + Math.random() * 0.35).toFixed(2));
      var s = (0.16 * (0.7 + Math.random() * 0.9)).toFixed(2);
      m.style.width = s + "rem";
      m.style.height = s + "rem";
      wrap.appendChild(m);
    }
  }

  /* saguaro bloom: the desert's own bloom season, not a schedule i picked.
     update.py stashes the Phoenix-local verdict in data.json (may-june =
     bloom); the flowers are pure css. window.__forceBloom is a console
     easter egg to peek anytime */
  function paintBloom(blooming) {
    var on = window.__forceBloom === true || blooming === true;
    document.body.classList.toggle("blooming", on);
  }
  window.__paintBloom = paintBloom; /* headless-test hook */

  /* prickly-pear bloom: the pad cluster is a permanent fixture; the magenta
     flowers open only when phoenix got a real spring rain. update.py stashes
     the verdict in data.json (april-may + 30-day precip); the petals are pure
     css. window.__forcePear is a console easter egg to peek anytime */
  function paintPear(pearing) {
    var on = window.__forcePear === true || pearing === true;
    document.body.classList.toggle("pearbloom", on);
  }
  window.__paintPear = paintPear; /* headless-test hook */

  /* woven rug: the flat gradient became a hand-loomed pattern. a seeded
     prng (mulberry32) draws navajo-style stepped diamonds and stripe bands
     in desert colors onto a small canvas, set as the .rug background so it
     survives the ellipse border-radius. fixed default seed = a stable rug;
     window.__rugSeed is a console easter egg to re-weave with another seed */
  function mulberry(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function weaveRug() {
    var rug = document.querySelector(".rug");
    if (!rug) return;
    var seed = (typeof window.__rugSeed === "number") ? window.__rugSeed : 20261001;
    var rnd = mulberry(seed);
    var W = 520, H = 180;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d");
    var cream = "#e8dcc3", sand = "#d9a05e", terra = "#b4562f",
        dark = "#5c3340", sage = "#7d8b5f";
    /* stepped diamond: stacked horizontal bars, woven read */
    function diamond(cx, cy, r, colA, colB) {
      var rows = Math.ceil(r);
      for (var i = 0; i < rows; i++) {
        var frac = 1 - Math.abs(i - (rows - 1) / 2) / ((rows + 1) / 2);
        var w = Math.max(2, Math.round(r * 2 * frac));
        x.fillStyle = (i % 2) ? colA : colB;
        x.fillRect(Math.round(cx - w / 2), Math.round(cy - rows + i * 2), w, 2);
      }
    }
    function motifRow(y0, h, gap, r, colA, colB) {
      var n = Math.floor(W / gap);
      for (var i = 0; i < n; i++) {
        var cx = (i + 0.5) * (W / n) + (rnd() - 0.5) * 6;
        diamond(cx, y0 + h / 2, r, colA, colB);
      }
    }
    x.fillStyle = dark; x.fillRect(0, 0, W, H);
    x.fillStyle = cream; x.fillRect(0, 10, W, 2); x.fillRect(0, H - 12, W, 2);
    var y = 14;
    function band(h, col, motif) {
      x.fillStyle = col; x.fillRect(0, y, W, h);
      if (motif) motif(y, h);
      y += h;
    }
    band(22, cream);
    band(4, sage);
    band(34, sand, function (yy, hh) {
      motifRow(yy, hh, 74, 11, cream, dark);
    });
    band(4, dark);
    band(30, terra, function (yy, hh) {
      motifRow(yy, hh, 56, 8, cream, dark);
    });
    band(4, sage);
    band(26, dark, function (yy, hh) {
      motifRow(yy, hh, 92, 8, sand, cream);
    });
    band(4, dark);
    band(22, cream);
    /* weave texture: thread lines + a few pale slubs, loomed unevenness */
    for (var ty = 0; ty < H; ty += 2) {
      x.fillStyle = "rgba(20,8,4,0.07)";
      x.fillRect(0, ty, W, 1);
      if (rnd() < 0.06) {
        x.fillStyle = "rgba(255,246,224,0.05)";
        x.fillRect(0, ty + 1, W, 1);
      }
    }
    rug.style.backgroundImage = "url(" + c.toDataURL() + ")";
  }
  window.__weaveRug = weaveRug; /* headless-test hook */

  /* weather: overlays painted from data.json, phoenix current conditions */
  function paintWeather(wx) {
    var K = (wx && wx.kind) || "clear";
    window.__wxKind = K; /* gates for the fair-weather balloon and friends */
    window.__wxWind = (wx && typeof wx.wind_kmh === "number") ? wx.wind_kmh : 0;
    window.__wxWindDir = (wx && typeof wx.wind_dir === "number") ? wx.wind_dir : 0;
    window.__wxTemp = (wx && typeof wx.temp_f === "number") ? wx.temp_f : 0;
    window.__wxHumidity = (wx && typeof wx.humidity === "number") ? wx.humidity : 0;
    /* the real sunrise/sunset in minutes-of-day — gates the alpenglow */
    window.__sunRiseMin = (wx && typeof wx.sun_rise_min === "number")
      ? wx.sun_rise_min : null;
    window.__sunSetMin = (wx && typeof wx.sun_set_min === "number")
      ? wx.sun_set_min : null;
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
    paintWindLean(); /* the rain slants with the real wind direction */
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
    /* heat shimmer: hot (90f+), clear-ish days only, sun up, motion allowed */
    var hotDay = (K === "clear" || K === "partly") &&
      wx && typeof wx.temp_f === "number" && wx.temp_f >= 90 &&
      document.getElementById("orb").style.display === "block";
    var reducedM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("wx-shimmer").style.display =
      (hotDay && !reducedM) ? "block" : "none";
    /* monsoon build-up: cumulonimbus over the horizon when storms brew.
       window.__forceMonsoon is a console easter egg to peek at it anytime */
    var monsoon = (K === "storm" || K === "rain") ||
      window.__forceMonsoon === true;
    document.getElementById("wx-monsoon").style.display =
      monsoon ? "block" : "none";
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
    /* ocotillo: bare canes most of the year; leafs out after real rain.
       window.__forceLeafy is a console easter egg to peek anytime (and
       the headless-test hook, set before load like the other flags) */
    var oco = document.querySelector(".ocotillo");
    if (oco) oco.classList.toggle("leafy",
      (K === "rain" || K === "storm") || window.__forceLeafy === true);
  }

  /* rainbow after the storm: when update.py catches a real rain->clear
     transition it opens a 2h window (rainbow_until in data.json) and the
     bow — primary plus a fainter reversed secondary — hangs over the
     mesas. window.__forceRainbow is a console easter egg to peek anytime
     (and the headless-test hook, set before load like the other flags) */
  function paintRainbow(untilIso) {
    window.__rainbowUntil = untilIso || null; /* minute-tick re-check */
    var on = window.__forceRainbow === true;
    if (!on && untilIso) {
      var exp = Date.parse(untilIso);
      on = !isNaN(exp) && Date.now() < exp;
    }
    document.getElementById("wx-rainbow").classList.toggle("on", on);
  }
  window.__paintRainbow = paintRainbow; /* headless hook */

  /* rain on the glass: when phoenix is actually raining (open-meteo
     rain/storm, same gate as the wx-rain streaks outside), droplets bead
     and streak down the inside of the window pane — the inside answer to
     the weather outside. beads grow, then run leaving thin trails; storm
     drops are fatter and run faster. idle under prefers-reduced-motion.
     window.__forceGlassDrops is a console easter egg to peek anytime (and
     the headless-test hook, set before load like the other flags) */
  function glassDropsWatch() {
    var box = document.getElementById("glassdrops");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var K = window.__wxKind || "clear";
    var wet = (K === "rain" || K === "storm") ||
      window.__forceGlassDrops === true;
    if (box) {
      box.style.display = (wet && !reduced) ? "block" : "none";
      if (wet && !reduced) {
        var stormy = K === "storm";
        var n = stormy ? 3 : 2;
        for (var i = 0; i < n; i++) {
          (function () {
            var d = document.createElement("div");
            d.className = "gdrop";
            var s = stormy ? (0.24 + Math.random() * 0.14)
                          : (0.20 + Math.random() * 0.10);
            var travel = (4 + Math.random() * 6).toFixed(2);
            var dur = stormy ? (3.2 + Math.random() * 2.2)
                             : (4.6 + Math.random() * 2.8);
            d.style.setProperty("--x", (Math.random() * 96).toFixed(1) + "%");
            d.style.setProperty("--y0", (Math.random() * 55).toFixed(1) + "%");
            d.style.setProperty("--s", s.toFixed(3) + "rem");
            d.style.setProperty("--travel", travel + "rem");
            d.style.setProperty("--dur", dur.toFixed(2) + "s");
            d.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
            box.appendChild(d);
            setTimeout(function () { d.remove(); }, dur * 1000 + 900);
          })();
        }
      }
    }
    window.__glassT = setTimeout(glassDropsWatch, 900 + Math.random() * 1600);
  }
  window.__spawnGlassDrop = glassDropsWatch; /* headless hook */

  /* meteors: shooting stars, one every 8-22s when the night sky is up —
     but when a real meteor shower is peaking (update.py stashes the annual
     shower calendar in data.json), the interval tightens with the shower's
     zhr, a tiny label names the shower, and the meteors stream out of the
     real radiant point — the patch of sky the naming constellation owns —
     instead of streaking random directions. on peak night the label glows.
     window.__forceShower is a console easter egg to peek anytime (and the
     headless-test hook, set before load like the other flags). about
     one in twelve shower meteors is a fireball: slow, amber-red, with a
     lingering ember trail — the draconids are famous for them.
     window.__forceFireball forces one */
  function meteorWatch() {
    var stars = document.getElementById("stars");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var night = stars && stars.style.opacity === "1";
    var sh = window.__forceShower === true
      ? { name: "Meteor shower", peak: "", zhr: 60, radiant: [38, 12] }
      : (window.__shower || null);
    var lab = document.getElementById("shower-label");
    if (lab) lab.style.display = (night && !reduced && sh) ? "block" : "none";
    if (night && !reduced) {
      var sky = document.getElementById("sky");
      if (sky) {
        var m = document.createElement("div");
        m.className = "meteor";
        /* during an active shower, ~1 in 12 meteors is a fireball —
           slow, amber-red, with a lingering ember trail. draconids are
           famous for these. window.__forceFireball is the console easter
           egg (set before load, like __forceShower) + headless hook */
        var fb = !!sh && (window.__forceFireball === true || Math.random() < 1 / 12);
        if (fb) m.classList.add("fireball");
        var rad = sh && sh.radiant;
        if (rad) {
          /* radiant stream: pick a random ray out of the radiant, spawn
             the meteor along it, and aim the streak along the same ray */
          var a = Math.random() * Math.PI * 2;
          var d = 6 + Math.random() * 24;
          var px = Math.min(95, Math.max(2, rad[0] + Math.cos(a) * d));
          var py = Math.min(46, Math.max(3, rad[1] + Math.sin(a) * d * 0.7));
          var ang = Math.atan2(py - rad[1], px - rad[0]) * 180 / Math.PI;
          m.style.left = px + "%";
          m.style.top = py + "%";
          m.style.setProperty("--ang", ang + "deg");
        } else {
          m.style.left = (8 + Math.random() * 55) + "%";
          m.style.top = (6 + Math.random() * 28) + "%";
          m.style.setProperty("--ang", -(18 + Math.random() * 26) + "deg");
        }
        m.style.setProperty("--dist", fb ? (12 + Math.random() * 4) + "rem"
                                         : (7 + Math.random() * 5) + "rem");
        sky.appendChild(m);
        requestAnimationFrame(function () { m.classList.add("go"); });
        setTimeout(function () { m.remove(); }, fb ? 2600 : 1200);
        if (fb) {
          /* the ember trail lingers where the fireball burned through */
          var tr = document.createElement("div");
          tr.className = "firetrail";
          tr.style.left = m.style.left;
          tr.style.top = m.style.top;
          tr.style.setProperty("--ang", m.style.getPropertyValue("--ang"));
          tr.style.setProperty("--dist", m.style.getPropertyValue("--dist"));
          sky.appendChild(tr);
          setTimeout(function () { tr.remove(); }, 3800);
        }
      }
    }
    var lo = 8000, hi = 22000;
    if (sh) {
      var f = Math.min(1, Math.max(0.12, 8 / sh.zhr));
      lo = 8000 * f; hi = 22000 * f;
    }
    window.__meteorT = setTimeout(meteorWatch, lo + Math.random() * (hi - lo));
  }

  /* meteor showers: the real annual shower calendar, not a schedule i
     picked. update.py emits a shower when a major one is within 3 days of
     its peak; meteorWatch speeds the sky up and a label names it.
     window.__forceShower is the console easter egg + headless hook */
  function paintShower(sh) {
    window.__shower = sh || null;
    var s = window.__forceShower === true ? { name: "Meteor shower", peak: "" }
      : (sh || null);
    document.body.classList.toggle("showering", !!s);
    var lab = document.getElementById("shower-label");
    if (lab) {
      lab.textContent = s
        ? "\u2726 " + s.name + (s.peak_in === 0 ? " \u00b7 peak tonight"
            : (s.peak ? " \u00b7 peak " + s.peak : ""))
        : "";
      /* on peak night the label glows — the next real sky moment */
      lab.classList.toggle("peaktonight", !!s && s.peak_in === 0);
    }
  }
  window.__paintShower = paintShower; /* headless-test hook */

  /* the telescope on the sill: a little brass refractor on a tripod, set
     up on the window frame whenever a real meteor shower is active. it
     slews to the shower's radiant (the same sky-relative point the meteors
     stream out of) and waits there all night — fades in at dusk with the
     meteors, away by dawn. the tube pivots at (35,38) in its own viewBox;
     the angle is recomputed from live rects so the aim survives layout.
     static once aimed, so reduced-motion has nothing to idle.
     the thermos (brushed steel + a steaming cup, #thermos) rides the same
     body.scopeout gate — where the telescope goes, the thermos follows.
     the star chart (#starchart, thumbtacked to the wall) rides it too —
     paintScope marks the real radiant on it, so one radiant shows in
     three places: the chart, the tube's aim, the meteors.
     window.__forceScope is the console easter egg to peek anytime (and
     the headless hook, set before load like the other flags) */
  function paintScope() {
    var force = window.__forceScope;
    var stars = document.getElementById("stars");
    var night = stars && stars.style.opacity === "1";
    var s = force === true
      ? { name: "Meteor shower", peak: "", radiant: [30, 10] }
      : (window.__shower || null);
    var on = force === true ? true : (night && !!s);
    document.body.classList.toggle("scopeout", on);
    if (on && s && s.radiant) {
      var sky = document.getElementById("sky").getBoundingClientRect();
      var tel = document.getElementById("telescope").getBoundingClientRect();
      var mx = tel.left + tel.width * 35 / 70 - sky.left;
      var my = tel.top + tel.height * 38 / 92 - sky.top;
      var deg = Math.atan2(s.radiant[1] / 100 * sky.height - my,
                           s.radiant[0] / 100 * sky.width - mx)
                * 180 / Math.PI + 90;
      var tube = document.getElementById("scope-tube");
      if (tube) tube.setAttribute("transform",
        "rotate(" + deg.toFixed(1) + " 35 38)");
      /* the star chart on the wall marks the same radiant the tube aims at
         and the meteors stream out of — one radiant, three witnesses */
      var chart = document.getElementById("starchart");
      if (chart) {
        chart.style.setProperty("--rx", s.radiant[0] + "%");
        chart.style.setProperty("--ry", s.radiant[1] + "%");
        var cap = chart.querySelector(".chart-cap");
        if (cap) cap.textContent = "✦ " + String(s.name || "shower").toLowerCase() + " radiant";
      }
    }
  }
  window.__paintScope = paintScope; /* headless-test hook */

  /* wall calendar: the real phoenix month, today ringed in terracotta,
     meteor-shower peaks starred. fully static (built once from data.json),
     so reduced-motion has nothing to idle. the note line counts down to
     the next peak this month, or names the desert season. */
  var CAL_SMON = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  function paintCal(cal) {
    if (!cal) return;
    document.getElementById("cal-month").textContent =
      cal.month_name + " " + cal.year;
    var grid = document.getElementById("cal-grid");
    grid.innerHTML = "";
    "smtwtfs".split("").forEach(function (d) {
      var w = document.createElement("span");
      w.className = "cal-dow"; w.textContent = d;
      grid.appendChild(w);
    });
    var first = new Date(cal.year, cal.month - 1, 1).getDay();
    var days = new Date(cal.year, cal.month, 0).getDate();
    var peaks = {};
    (cal.showers || []).forEach(function (s) { peaks[s.day] = s; });
    for (var b = 0; b < first; b++) {
      var blank = document.createElement("span");
      blank.className = "cal-blank";
      grid.appendChild(blank);
    }
    for (var d = 1; d <= days; d++) {
      var cell = document.createElement("span");
      cell.className = "cal-day";
      if (d === cal.today) cell.classList.add("today");
      cell.textContent = d;
      if (peaks[d]) {
        cell.classList.add("peak");
        var star = document.createElement("i");
        star.textContent = "\u2726";
        star.title = peaks[d].name + " peak";
        cell.appendChild(star);
      }
      grid.appendChild(cell);
    }
    var note = document.getElementById("cal-note");
    var upcoming = (cal.showers || [])
      .filter(function (s) { return s.day >= cal.today; })
      .sort(function (a, b) { return a.day - b.day; })[0];
    if (upcoming) {
      var n = upcoming.day - cal.today;
      note.textContent = "\u2726 " + upcoming.name.toLowerCase() + " peak " +
        CAL_SMON[cal.month - 1] + " " + upcoming.day +
        (n === 0 ? " \u2014 tonight!"
                 : " \u2014 " + n + (n === 1 ? " night" : " nights") + " away");
    } else if (cal.month === 5 || cal.month === 6) {
      note.textContent = "\u{1F335} saguaro bloom season";
    } else {
      note.textContent = "";
    }
  }
  window.__paintCal = paintCal; /* headless-test hook */

  /* the desk terminal doubles as the room's weather station: the same real
     phoenix conditions the window wears, plus the shower calendar the sky
     follows. text from data.json via the __wx* stashes; no new gate, so it
     updates whenever loadRoom refreshes the weather. static (no animation
     loop) under prefers-reduced-motion except the blink, which idles there */
  function paintTerm() {
    var el = document.getElementById("term-status");
    if (!el) return;
    var t = Math.round(window.__wxTemp || 0);
    var k = window.__wxKind || "clear";
    var w = Math.round(window.__wxWind || 0);
    var lines = t + "\u00b0f " + k + "\nwind " + w + "km/h";
    /* the lunar line: real phase + illumination + the moonrise/moonset
       pair update.py's ephemeris governs the pool by. no new gate — it
       rides the same __moonData paintMoon stashes, so set
       window.__moonData before calling __paintTerm to peek headless */
    var md = window.__moonData || null;
    if (md && md.name) {
      var ml = "\u263E " + md.name + " " + (md.illum || 0) + "%";
      if (typeof md.rise_min === "number" && typeof md.set_min === "number")
        ml += " \u2191" + fmtMin(md.rise_min) + " \u2193" + fmtMin(md.set_min);
      lines += "\n" + ml;
    }
    var s = window.__forceShower === true ? { name: "meteor shower", peak: "" }
      : (window.__shower || null);
    if (s) lines += "\n\u2726 " + s.name + (s.peak ? " pk " + s.peak : "");
    el.textContent = lines;
    function fmtMin(m) {
      m = Math.round(((m % 1440) + 1440) % 1440);
      var hh = Math.floor(m / 60), mm = m % 60;
      return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
    }
  }
  window.__paintTerm = paintTerm; /* headless-test hook */

  /* satellites: a tiny blinking dot crosses the night sky on a slow straight
     path — the most boring thing in orbit, and the easiest to miss. visits
     every 2.5-6min, 24-40s crossings, random direction, blinking 0.5-1.4s;
     most nights white, occasionally the reddish tint of a sunlit
     rocket body. gated on night (stars opacity == 1, like the meteors),
     idle under prefers-reduced-motion; window.__forceSat=true is the
     console easter egg + headless hook, window.__spawnSat the direct call */
  function spawnSat() {
    var sky = document.getElementById("sky");
    if (!sky) return;
    var s = document.createElement("div");
    s.className = "sat";
    if (Math.random() < 0.5) s.classList.add("rtl");
    s.style.top = (8 + Math.random() * 34) + "%";
    s.style.setProperty("--dur", (24 + Math.random() * 16).toFixed(1) + "s");
    var dot = document.createElement("i");
    dot.style.setProperty("--blink", (0.5 + Math.random() * 0.9).toFixed(2) + "s");
    if (Math.random() < 0.18) dot.classList.add("red");
    s.appendChild(dot);
    sky.appendChild(s);
    requestAnimationFrame(function () { s.classList.add("go"); });
    setTimeout(function () { s.remove(); }, 45000);
  }
  window.__spawnSat = spawnSat; /* headless hook */
  function satelliteWatch() {
    var stars = document.getElementById("stars");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var night = stars && stars.style.opacity === "1";
    var force = window.__forceSat === true; /* easter egg: peek anytime */
    if ((night || force) && !reduced) spawnSat(); /* visits every 2.5-6min */
    window.__satT = setTimeout(satelliteWatch, 150000 + Math.random() * 210000);
  }

  /* the sleeping cat breathes (pure css) and twitches in its sleep: every
     45-105s a tail flick or an ear twitch, dreams presumably. css breathes,
     this only fires the twitches; idle under prefers-reduced-motion.
     window.__flickCat=true is the console easter egg + headless hook,
     window.__flickCatNow() the direct call */
  window.__flickCatNow = function () {
    var cat = document.querySelector(".cat");
    if (!cat) return;
    if (Math.random() < 0.5) {
      var tail = cat.querySelector(".tail");
      if (tail) {
        tail.classList.remove("flick"); void tail.offsetWidth;
        tail.classList.add("flick");
        setTimeout(function () { tail.classList.remove("flick"); }, 700);
        return;
      }
    }
    var which = Math.random() < 0.5 ? "twitch1" : "twitch2";
    cat.classList.remove("twitch1", "twitch2"); void cat.offsetWidth;
    cat.classList.add(which);
    setTimeout(function () { cat.classList.remove(which); }, 650);
  };
  function catWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (window.__flickCat === true) window.__flickCatNow(); /* peek anytime */
    window.__catT = setTimeout(function tick() {
      window.__flickCatNow();
      window.__catT = setTimeout(tick, 45000 + Math.random() * 60000);
    }, 45000 + Math.random() * 60000); /* a twitch every 45-105s */
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

  /* wildlife: a cottontail hops the ground strip every 60-150s, night only */
  var BUNNY_SVG =
    '<svg viewBox="0 0 40 32" aria-hidden="true">' +
    '<g fill="#1a130c">' +
    '<circle cx="8" cy="18" r="3.2" fill="#241b12"/>' +
    '<ellipse cx="19" cy="20" rx="9.5" ry="6.2"/>' +
    '<circle cx="30" cy="14" r="5.2"/>' +
    '<g class="ears">' +
    '<path d="M27.5 10 L25 1 L28.5 1.2 L30 10 Z"/>' +
    '<path d="M31 9.5 L31.5 0 L35 0.8 L34 10 Z"/>' +
    '</g>' +
    '<path d="M25 25 L24.5 30 L27 30 L27.5 25 Z"/>' +
    '<path d="M14 25 C13 27.5 12 29 11 30 L15 30 C16 28.5 16.5 26.5 17 25 Z"/>' +
    '</g></svg>';
  /* moths around the lit lamp: 2-4 tiny moths flutter a wobbly loop around
     the warm bulb after dark — drawn to the light like they always are.
     gated on body.lamplit (the same real-night gate as the lamp itself, so
     paintLamp's minute tick covers dusk/dawn); visits every 2-5min; idle
     under prefers-reduced-motion; window.__forceMoth=true is the console
     easter egg + headless hook, window.__spawnMoth the direct call */
  var MOTH_SVG =
    '<svg viewBox="0 0 22 16" aria-hidden="true">' +
    '<g class="wing" fill="#d9b983"><ellipse cx="6.5" cy="6" rx="5.4" ry="4.2"/></g>' +
    '<g class="wing" fill="#cda871"><ellipse cx="15.5" cy="6" rx="5.4" ry="4.2"/></g>' +
    '<ellipse cx="11" cy="8.5" rx="1.8" ry="5.2" fill="#8a6840"/>' +
    '<circle cx="11" cy="3.4" r="1.5" fill="#8a6840"/></svg>';
  function spawnMoth() {
    var room = document.querySelector(".room");
    if (!room) return;
    var m = document.createElement("div");
    m.className = "moth" + (Math.random() < 0.5 ? " rev" : "");
    m.innerHTML = MOTH_SVG;
    m.style.setProperty("--orb", (0.6 + Math.random() * 0.8).toFixed(2) + "rem");
    m.style.animationDuration = (18 + Math.random() * 14).toFixed(1) + "s";
    room.appendChild(m);
    setTimeout(function () { m.remove(); }, 45000 + Math.random() * 20000);
  }
  window.__spawnMoth = spawnMoth; /* headless hook */
  function mothWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lit = document.body.classList.contains("lamplit");
    var force = window.__forceMoth === true; /* easter egg: peek anytime */
    if ((lit || force) && !reduced) {
      var n = 2 + Math.floor(Math.random() * 3); /* 2-4 moths */
      for (var i = 0; i < n; i++) {
        (function (k) { setTimeout(spawnMoth, k * 1500); })(i);
      }
      if (Math.random() < 0.75) { /* most visits end with one bump of the shade */
        setTimeout(flickLamp, 8000 + Math.random() * 22000);
      }
    }
    window.__mothT = setTimeout(mothWatch, 120000 + Math.random() * 180000);
  }
  /* lamp flicker: once in a while a moth bumps the bulb and the light
     sputters. flickLamp() fires the .lampflicker class for 0.95s (the css
     does the dip timing); the lit gate is re-checked at fire time so a
     dawn boundary between schedule and fire is fine. idle under
     prefers-reduced-motion; window.__flickLamp is the console easter egg
     + headless hook */
  function flickLamp() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !document.body.classList.contains("lamplit")) return;
    document.body.classList.add("lampflicker");
    setTimeout(function () { document.body.classList.remove("lampflicker"); }, 950);
  }
  window.__flickLamp = flickLamp; /* headless hook */

  /* gecko on the warm glass: a desert gecko pads along the inside of the
     window pane after dark, hunting the lamp moths — freeze, dart, freeze.
     gated on night (stars opacity == 1) AND body.lamplit (the moths are
     out, so the predator follows the prey); visits every 5-10min; idle
     under prefers-reduced-motion; window.__forceGecko=true is the console
     easter egg + headless hook, window.__spawnGecko the direct call */
  var GECKO_SVG =
    '<svg viewBox="0 0 64 42" aria-hidden="true">' +
    '<path d="M26 20 C18 17.5 11 19.5 4 25.5 C11 26.5 19 25 26 24 Z" fill="#d5c9a8"/>' +
    '<ellipse cx="36" cy="22" rx="12" ry="6.8" fill="#ded4b8"/>' +
    '<path d="M45 17 C51 17.5 55.5 20 57 22.5 C55.5 25.5 50.5 27.5 45 27 Z" fill="#e3d9bd"/>' +
    '<circle cx="51" cy="20.8" r="1.1" fill="#3a3128"/>' +
    '<g stroke="#ded4b8" stroke-width="2.4" stroke-linecap="round" fill="none">' +
    '<path d="M41 16.5 C44 13 46 10.5 47.5 8.5"/>' +
    '<path d="M44 27.5 C46 31 47.5 33.5 49 35.5"/>' +
    '<path d="M31 16.5 C28 13.5 26 11 24.5 8.5"/>' +
    '<path d="M30 27.5 C28 31 26.5 33.5 25 36"/>' +
    '</g>' +
    '<g fill="#e3d9bd">' +
    '<ellipse cx="47.8" cy="7.6" rx="1.7" ry="1.2"/>' +
    '<ellipse cx="49.3" cy="36.3" rx="1.7" ry="1.2"/>' +
    '<ellipse cx="24.2" cy="7.6" rx="1.7" ry="1.2"/>' +
    '<ellipse cx="24.7" cy="36.8" rx="1.7" ry="1.2"/>' +
    '</g></svg>';
  function spawnGecko() {
    var win = document.querySelector(".window");
    if (!win) return;
    var g = document.createElement("div");
    g.className = "gecko" + (Math.random() < 0.5 ? " rtl" : "");
    g.innerHTML = GECKO_SVG;
    win.appendChild(g);
    setTimeout(function () { g.remove(); }, 58000);
  }
  window.__spawnGecko = spawnGecko; /* headless hook */
  function geckoWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lit = document.body.classList.contains("lamplit");
    var stars = document.getElementById("stars");
    var night = stars && stars.style.opacity === "1";
    var force = window.__forceGecko === true; /* easter egg: peek anytime */
    if (((lit && night) || force) && !reduced) {
      spawnGecko();
    }
    window.__geckoT = setTimeout(geckoWatch, 300000 + Math.random() * 300000);
  }

  function bunnyWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stars = document.getElementById("stars");
    var win = document.querySelector(".window");
    if (win && stars && stars.style.opacity === "1" && !reduced) {
      var b = document.createElement("div");
      b.className = "bunny" + (Math.random() < 0.5 ? " rtl" : "");
      b.innerHTML = BUNNY_SVG;
      win.appendChild(b);
      setTimeout(function () { b.remove(); }, 11500);
    }
    window.__bunnyT = setTimeout(bunnyWatch, 60000 + Math.random() * 90000);
  }

  /* wildlife: a javelina ambles the ground strip every 75-145s, swinging its legs */
  var PIG_SVG =
    '<svg viewBox="0 0 56 36" aria-hidden="true">' +
    '<g fill="#1a130c">' +
    '<ellipse cx="24" cy="18" rx="13.5" ry="8.2"/>' +
    '<ellipse cx="11" cy="20" rx="6" ry="6.4"/>' +
    '<path d="M35 12 L45.5 12.5 L47.8 16.2 L44.5 19.8 L35.5 19 Z"/>' +
    '<circle cx="46.4" cy="16" r="2.8"/>' +
    '<path d="M36.2 11.5 L34.6 5.6 L39.4 8 Z"/>' +
    '</g>' +
    '<g class="legs-back" fill="#1a130c">' +
    '<path d="M13 23 L11.6 33.4 L14.4 33.4 L15.2 23 Z"/>' +
    '<path d="M17.5 23.5 L16.4 33.4 L19 33.4 L19.8 23.5 Z"/>' +
    '</g>' +
    '<g class="legs-front" fill="#1a130c">' +
    '<path d="M32.5 23 L31 33.4 L33.8 33.4 L34.7 23 Z"/>' +
    '<path d="M36.4 23.5 L35.2 33.4 L38 33.4 L38.8 23.5 Z"/>' +
    '</g>' +
    '<g stroke="#1a130c" stroke-width="1.4" stroke-linecap="round" fill="none">' +
    '<path d="M11 11 L9 7.5 M16 10 L14 6.5 M21 9.6 L19 6.1 M26 9.8 L24.2 6.4 M31 10.5 L29.4 7.3"/>' +
    '<path d="M4.6 16.5 L1.2 15.8"/>' +
    '</g></svg>';
  function pigWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    if (win && !reduced) {
      var p = document.createElement("div");
      p.className = "javelina" + (Math.random() < 0.5 ? " rtl" : "");
      p.innerHTML = PIG_SVG;
      win.appendChild(p);
      setTimeout(function () { p.remove(); }, 13600);
    }
    window.__pigT = setTimeout(pigWatch, 75000 + Math.random() * 70000);
  }

  /* wildlife: a coyote trots the ground strip at night, pausing mid-crossing
     to throw its head back in a silent howl.
     window.__forceCoyote is a console easter egg to peek at it anytime */
  var COYOTE_SVG =
    '<svg viewBox="0 0 62 38" aria-hidden="true">' +
    '<g fill="#120d08">' +
    '<g class="tail">' +
    '<path d="M21 19 C15 20 10 24 7 30 L11 30.5 C14 25.5 19 22.5 23 21.5 Z"/>' +
    '</g>' +
    '<ellipse cx="31" cy="21" rx="12" ry="5"/>' +
    '<g class="head">' +
    '<path d="M38 18 L42 10 L47 12 L43 20 Z"/>' +
    '<ellipse cx="44" cy="12.5" rx="4.2" ry="3.4"/>' +
    '<path d="M47.5 11 L55 13.5 L47.5 15.5 Z"/>' +
    '<path d="M41 10.5 L39.6 3.6 L44.4 9.4 Z"/>' +
    '<path d="M45.4 10 L46.2 3.2 L49.6 9.2 Z"/>' +
    '</g>' +
    '</g>' +
    '<g class="legs-back" fill="#120d08">' +
    '<path d="M23 25 L22 36 L24.4 36 L25 25 Z"/>' +
    '<path d="M27.5 25 L26.8 36 L29.2 36 L29.8 25 Z"/>' +
    '</g>' +
    '<g class="legs-front" fill="#120d08">' +
    '<path d="M36 25 L35 36 L37.4 36 L38 25 Z"/>' +
    '<path d="M40 25 L39.2 36 L41.6 36 L42 25 Z"/>' +
    '</g></svg>';
  function coyoteWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stars = document.getElementById("stars");
    var win = document.querySelector(".window");
    var night = stars && stars.style.opacity === "1";
    if (win && !reduced && (night || window.__forceCoyote === true)) {
      var c = document.createElement("div");
      c.className = "coyote" + (Math.random() < 0.5 ? " rtl" : "");
      c.innerHTML = COYOTE_SVG;
      win.appendChild(c);
      setTimeout(function () { c.classList.add("howling"); }, 5200);
      setTimeout(function () { c.classList.remove("howling"); }, 8800);
      setTimeout(function () { c.remove(); }, 20000);
    }
    window.__coyoteT = setTimeout(coyoteWatch, 240000 + Math.random() * 300000);
  }

  /* wildlife: on windy days a tumbleweed bowls across the ground strip,
     bouncing as it rolls. gated on phoenix wind (>=14 km/h), storm, or the
     window.__forceTumble console easter egg to peek at it anytime */
  var TUMBLE_SVG =
    '<svg viewBox="0 0 60 60" aria-hidden="true">' +
    '<g stroke="#171208" stroke-width="1.7" fill="none" stroke-linecap="round">' +
    '<path d="M8 32 Q22 10 40 14 Q56 18 54 36 Q50 54 28 54 Q10 52 8 32 Z"/>' +
    '<path d="M14 10 Q30 26 52 22"/>' +
    '<path d="M10 48 Q32 40 54 46"/>' +
    '<path d="M30 4 Q26 30 34 56"/>' +
    '<path d="M4 26 Q30 20 56 30"/>' +
    '<path d="M16 54 Q36 32 46 6"/>' +
    '<path d="M22 6 Q26 32 20 55"/>' +
    '<path d="M46 5 Q42 30 50 56"/>' +
    '<path d="M8 20 Q20 32 10 46"/>' +
    '<path d="M54 24 Q44 34 56 44"/>' +
    '<path d="M26 52 Q30 44 24 38"/>' +
    '<path d="M44 12 Q40 18 46 22"/>' +
    '</g></svg>';
  function tumbleWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    var windy = (window.__wxWind >= 14) || window.__wxKind === "storm";
    if (win && !reduced && (windy || window.__forceTumble === true)) {
      var t = document.createElement("div");
      t.className = "tumbleweed" + (Math.random() < 0.5 ? " rtl" : "");
      t.style.width = (1.1 + Math.random() * 0.8).toFixed(2) + "rem";
      t.innerHTML = TUMBLE_SVG;
      win.appendChild(t);
      setTimeout(function () { t.remove(); }, 22000);
    }
    window.__tumbleT = setTimeout(tumbleWatch, 200000 + Math.random() * 360000);
  }

  /* weather: on partly days a cloud's shadow races the ground strip —
     the shadow of the drifting clouds, keyed to real phoenix weather
     (not under storm/rain/overcast, where the sky is too uniform).
     window.__forceShadow is a console easter egg to peek anytime (and
     the headless-test hook, set before load like the other flags) */
  function shadowWatch() {
    var box = document.getElementById("wx-gshadow");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var orb = document.getElementById("orb");
    var day = orb && orb.style.display === "block";
    var K = window.__wxKind || "clear";
    var ok = !reduced && day && (K === "partly" || K === "cloudy");
    if (box && (ok || window.__forceShadow === true)) {
      var s = document.createElement("div");
      s.className = "gshadow";
      if (Math.random() < 0.5) s.classList.add("rtl");
      var dur = 22 + Math.random() * 12;
      s.style.setProperty("--dur", dur.toFixed(1) + "s");
      box.appendChild(s);
      setTimeout(function () { s.remove(); }, dur * 1000 + 500);
    }
    window.__shadowT = setTimeout(shadowWatch, 120000 + Math.random() * 180000);
  }

  /* weather: on hot (90f+), calm (<=12 km/h) clear/partly days a dust devil
     spins up — a dust column wobbling across the ground strip, fading in
     and out at the edges of its run. the calm-wind complement to the
     tumbleweed. window.__forceDust is a console easter egg to peek anytime */
  var DUST_SVG =
    '<svg viewBox="0 0 60 120" aria-hidden="true">' +
    '<defs>' +
    '<linearGradient id="dustg" x1="0" y1="1" x2="0" y2="0">' +
    '<stop offset="0" stop-color="rgba(172,122,62,0.72)"/>' +
    '<stop offset="0.5" stop-color="rgba(182,134,76,0.52)"/>' +
    '<stop offset="1" stop-color="rgba(192,150,92,0.30)"/>' +
    '</linearGradient>' +
    '<clipPath id="dustclip">' +
    '<path d="M25 116 C27 90 22 70 14 48 C8 30 5 18 4 8 L56 8 C55 18 52 30 46 48 C38 70 33 90 35 116 Z"/>' +
    '</clipPath>' +
    '</defs>' +
    '<path d="M25 116 C27 90 22 70 14 48 C8 30 5 18 4 8 L56 8 C55 18 52 30 46 48 C38 70 33 90 35 116 Z" fill="url(#dustg)"/>' +
    '<g clip-path="url(#dustclip)">' +
    '<ellipse class="dswirl" cx="30" cy="104" rx="6" ry="3" fill="none" stroke="#7d5527" stroke-width="2.2" style="animation-delay:0s"/>' +
    '<ellipse class="dswirl" cx="30" cy="86" rx="8" ry="3" fill="none" stroke="#7d5527" stroke-width="2.2" style="animation-delay:-0.48s"/>' +
    '<ellipse class="dswirl" cx="30" cy="68" rx="10" ry="3" fill="none" stroke="#7d5527" stroke-width="2.2" style="animation-delay:-0.96s"/>' +
    '<ellipse class="dswirl" cx="30" cy="50" rx="13" ry="3.2" fill="none" stroke="#7d5527" stroke-width="2.2" style="animation-delay:-1.44s"/>' +
    '<ellipse class="dswirl" cx="30" cy="32" rx="16" ry="3.4" fill="none" stroke="#7d5527" stroke-width="2.2" style="animation-delay:-1.92s"/>' +
    '</g>' +
    '<ellipse class="dpuff" cx="30" cy="113" rx="7" ry="3" fill="rgba(190,145,88,0.55)" style="animation-delay:0s"/>' +
    '<ellipse class="dpuff" cx="24" cy="115" rx="5" ry="2.4" fill="rgba(190,145,88,0.5)" style="animation-delay:-1.4s"/>' +
    '</svg>';
  function dustWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    var orbUp = document.getElementById("orb") &&
      document.getElementById("orb").style.display === "block";
    var hotCalm = (window.__wxKind === "clear" || window.__wxKind === "partly") &&
      typeof window.__wxTemp === "number" && window.__wxTemp >= 90 &&
      typeof window.__wxWind === "number" && window.__wxWind <= 12;
    if (win && !reduced && orbUp && (hotCalm || window.__forceDust === true)) {
      var d = document.createElement("div");
      d.className = "dustdevil" + (Math.random() < 0.5 ? " rtl" : "");
      d.style.width = (1.6 + Math.random() * 1.0).toFixed(2) + "rem";
      var dur = 34000 + Math.random() * 18000;
      d.style.setProperty("--dur", (dur / 1000).toFixed(1) + "s");
      d.innerHTML = DUST_SVG;
      win.appendChild(d);
      setTimeout(function () { d.remove(); }, dur + 4000);
    }
    window.__dustT = setTimeout(dustWatch, 240000 + Math.random() * 300000);
  }

  /* weather: a haboob dust wall — when update.py's real open-meteo
     visibility drops under 5000m under a clear-ish code it demotes the
     kind to "dusty" (the monsoon signature), and a towering billowing
     wall rolls in over the horizon behind the mesas: 34-52s crossing,
     churning innards, random direction, visits every 3-7min while the
     air stays dusty. under prefers-reduced-motion the wall parks
     statically, mid-approach, no crossing. window.__forceHaboob is a
     console easter egg to peek anytime (and the headless-test hook, set
     before load like the other flags) */
  /* NOTE (2026-10-02): the haboob's gradient + clipPath live in a hidden
     body-level <defs> block (HABOOB_DEFS, injected once by haboobWatch),
     NOT inside the animated node's own svg. Chromium fails to resolve
     url(#...) paint servers defined inside the crossing-animated node
     (the wall painted invisible), while a document-level def resolves
     fine. the dust devil's local defs still work, so this is specific
     to this svg; global defs are the robust shape for it. */
  var HABOOB_DEFS =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<linearGradient id="hbwall" x1="0" y1="1" x2="0" y2="0">' +
    '<stop offset="0" stop-color="#5f3a1c"/>' +
    '<stop offset="0.45" stop-color="#8a5c2e"/>' +
    '<stop offset="0.8" stop-color="#b5854f"/>' +
    '<stop offset="1" stop-color="#d9ac72"/>' +
    '</linearGradient>' +
    '<clipPath id="hbclip">' +
    '<path d="M0,420 L0,250 Q25,185 65,200 Q90,130 150,155 Q185,80 255,115 ' +
    'Q300,50 370,105 Q420,60 470,125 Q520,85 570,145 Q620,110 660,185 ' +
    'Q700,165 720,235 L720,420 Z"/>' +
    '</clipPath>' +
    '</defs></svg>';
  var HABOOB_SVG =
    '<svg viewBox="0 0 720 420" preserveAspectRatio="none" aria-hidden="true">' +
    '<g class="hwall">' +
    '<path d="M0,420 L0,250 Q25,185 65,200 Q90,130 150,155 Q185,80 255,115 ' +
    'Q300,50 370,105 Q420,60 470,125 Q520,85 570,145 Q620,110 660,185 ' +
    'Q700,165 720,235 L720,420 Z" fill="url(#hbwall)"/>' +
    '<g clip-path="url(#hbclip)">' +
    '<ellipse class="hchurn" cx="150" cy="330" rx="72" ry="26" fill="rgba(60,35,16,0.4)" style="animation-delay:0s"/>' +
    '<ellipse class="hchurn" cx="330" cy="298" rx="92" ry="30" fill="rgba(60,35,16,0.38)" style="animation-delay:-1.2s"/>' +
    '<ellipse class="hchurn" cx="520" cy="322" rx="82" ry="28" fill="rgba(60,35,16,0.4)" style="animation-delay:-2.4s"/>' +
    '<ellipse class="hchurn" cx="240" cy="238" rx="56" ry="22" fill="rgba(60,35,16,0.34)" style="animation-delay:-3.1s"/>' +
    '<ellipse class="hchurn" cx="470" cy="248" rx="62" ry="24" fill="rgba(60,35,16,0.34)" style="animation-delay:-0.6s"/>' +
    '<ellipse class="hchurn" cx="610" cy="286" rx="58" ry="22" fill="rgba(60,35,16,0.36)" style="animation-delay:-1.8s"/>' +
    '<ellipse cx="360" cy="410" rx="340" ry="36" fill="rgba(48,28,13,0.55)"/>' +
    '</g>' +
    '<path d="M0,250 Q25,185 65,200 Q90,130 150,155 Q185,80 255,115 ' +
    'Q300,50 370,105 Q420,60 470,125 Q520,85 570,145 Q620,110 660,185 ' +
    'Q700,165 720,235" fill="none" stroke="#e8c08a" stroke-width="7" opacity="0.55"/>' +
    '</g>' +
    '</svg>';
  function haboobWatch() {
    var box = document.getElementById("wx-haboob");
    var dusty = (window.__wxKind || "clear") === "dusty";
    if (box && (dusty || window.__forceHaboob === true)) {
      if (!document.getElementById("hbwall")) {
        var defs = document.createElement("div");
        defs.innerHTML = HABOOB_DEFS;
        document.body.appendChild(defs);
      }
      var h = document.createElement("div");
      h.className = "haboob";
      if (Math.random() < 0.5) h.classList.add("rtl");
      var dur = 34 + Math.random() * 18;
      h.style.setProperty("--dur", dur.toFixed(1) + "s");
      h.innerHTML = HABOOB_SVG;
      box.appendChild(h);
      setTimeout(function () { h.remove(); }, dur * 1000 + 500);
    }
    window.__haboobT = setTimeout(haboobWatch, 180000 + Math.random() * 240000);
  }

  /* wildlife: a gambel's quail family — two adults and a scurry of chicks —
     crosses the ground strip on sunny days. the teardrop topknot is the
     giveaway. window.__forceQuail is a console easter egg to peek at them */
  var QUAIL_ADULT_SVG =
    '<svg viewBox="0 0 48 40" aria-hidden="true">' +
    '<g fill="#14100b">' +
    '<path d="M12 24 L3 32 L7 34 L15 26 Z"/>' +
    '<ellipse cx="23" cy="26" rx="12" ry="8.2"/>' +
    '<circle cx="36" cy="16" r="5.6"/>' +
    '<path d="M41.4 14.8 L46.5 16.6 L41.4 18.6 Z"/>' +
    '<ellipse cx="35.4" cy="2.4" rx="1.7" ry="2.2"/>' +
    '<path d="M21 33.5 L20.4 39 L22.4 39 L23 33.5 Z"/>' +
    '<path d="M26 33.5 L25.6 39 L27.6 39 L28.2 33.5 Z"/>' +
    '</g>' +
    '<path d="M36 10.6 C35.5 8 35.2 5.8 35.4 4.4" stroke="#14100b" stroke-width="1.2" fill="none"/>' +
    '</svg>';
  var QUAIL_CHICK_SVG =
    '<svg viewBox="0 0 22 17" aria-hidden="true">' +
    '<g fill="#14100b">' +
    '<ellipse cx="9.5" cy="10.5" rx="6.2" ry="4.6"/>' +
    '<circle cx="15.5" cy="6.6" r="3.1"/>' +
    '<path d="M18.4 6 L20.8 6.9 L18.4 7.8 Z"/>' +
    '<circle cx="15.5" cy="2.9" r="1.05"/>' +
    '<path d="M7.5 14.8 L7.2 16.6 L8.3 16.6 L8.6 14.8 Z"/>' +
    '<path d="M11 14.8 L10.8 16.6 L11.9 16.6 L12.1 14.8 Z"/>' +
    '</g></svg>';
  function isQuailFair() {
    /* window.__forceQuail is a console easter egg to peek at the quail anytime */
    if (window.__forceQuail === true) return true;
    var orb = document.getElementById("orb");
    var day = !!(orb && orb.style.display === "block");
    var K = window.__wxKind || "clear";
    return day && (K === "clear" || K === "partly");
  }
  function quailWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    if (win && isQuailFair() && !reduced) {
      var q = document.createElement("div");
      q.className = "quailparty" + (Math.random() < 0.5 ? " rtl" : "");
      q.innerHTML =
        '<div class="adult a1">' + QUAIL_ADULT_SVG + "</div>" +
        '<div class="adult a2">' + QUAIL_ADULT_SVG + "</div>" +
        '<div class="chick c1">' + QUAIL_CHICK_SVG + "</div>" +
        '<div class="chick c2">' + QUAIL_CHICK_SVG + "</div>" +
        '<div class="chick c3">' + QUAIL_CHICK_SVG + "</div>";
      win.appendChild(q);
      setTimeout(function () { q.remove(); }, 17000);
    }
    window.__quailT = setTimeout(quailWatch, 300000 + Math.random() * 240000);
  }

  /* wildlife: a desert lizard basks on the warm rock between the saguaros —
     flattening out in the heat, doing push-ups now and then, as lizards do.
     gated on real phoenix heat: day + temp >= 90 + clear/partly (the same
     heat gate the shimmer and dust devil fire on). visits every 4-8min,
     lingers 60-90s, push-up burst every 10-22s; idle under
     prefers-reduced-motion (watch never spawns it); window.__forceLizard
     is a console easter egg to peek at it anytime, window.__spawnLizard
     the direct call (headless hook) */
  var LIZARD_SVG =
    '<svg viewBox="0 0 64 30" aria-hidden="true">' +
    '<g fill="#1a130c">' +
    '<path d="M22,20 C14,19 8,15 2,7 C1.6,6.3 2.4,5.2 3.2,5.8 C9.5,12.5 15.5,16 22.5,17 Z"/>' +
    '<ellipse cx="32" cy="17" rx="11" ry="5.2"/>' +
    '<ellipse cx="44" cy="13.5" rx="5" ry="3.8"/>' +
    '<path d="M48.5,12 L54.5,14.2 L48.5,16.6 Z"/>' +
    '<path d="M38,21 L36.5,27 L38.5,27 L40,21.5 Z"/>' +
    '<path d="M43,21 L42.5,27 L44.5,27 Z"/>' +
    '<path d="M26,21 L24,27 L26,27 L27.5,21.5 Z"/>' +
    '<path d="M21,21 L19.5,26.5 L21.5,26.5 Z"/>' +
    '</g></svg>';
  function isLizardHot() {
    if (window.__forceLizard === true) return true;
    var orb = document.getElementById("orb");
    var day = !!(orb && orb.style.display === "block");
    var hot = typeof window.__wxTemp === "number" && window.__wxTemp >= 90;
    var K = window.__wxKind || "clear";
    return day && hot && (K === "clear" || K === "partly");
  }
  function spawnLizard() {
    var win = document.querySelector(".window");
    if (!win) return;
    var l = document.createElement("div");
    l.className = "lizard" + (Math.random() < 0.5 ? " rtl" : "");
    l.innerHTML = LIZARD_SVG;
    win.appendChild(l);
    function burst() {
      if (!l.isConnected) return;
      l.classList.add("push");
      setTimeout(function () { l.classList.remove("push"); }, 2000);
    }
    setTimeout(burst, 2500);
    var pushT = setInterval(function () {
      if (!l.isConnected) { clearInterval(pushT); return; }
      burst();
    }, 10000 + Math.random() * 12000);
    setTimeout(function () { clearInterval(pushT); l.remove(); },
      60000 + Math.random() * 30000);
  }
  window.__spawnLizard = spawnLizard; /* headless hook */
  function lizardWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    if (win && !reduced && isLizardHot()) spawnLizard();
    window.__lizardT = setTimeout(lizardWatch, 240000 + Math.random() * 240000);
  }

  /* wildlife: desert fireflies — a loose cluster of blinking dots drifting
     low over the ground strip on humid monsoon nights. arizona does have
     real fireflies; they come out when the desert air turns soupy.
     gate: night + phoenix humidity >= 60% + june-through-september, so the
     window stays an environmental instrument, not a schedule i picked.
     window.__forceFirefly is a console easter egg to peek at them anytime */
  function isFireflyNight() {
    if (window.__forceFirefly === true) return true;
    var stars = document.getElementById("stars");
    var night = !!(stars && stars.style.opacity === "1");
    var humid = typeof window.__wxHumidity === "number" &&
      window.__wxHumidity >= 60;
    var m = phxNow().getMonth() + 1;
    var monsoon = m >= 6 && m <= 9;
    return night && humid && monsoon;
  }
  function fireflyWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    if (win && !reduced && isFireflyNight()) {
      var cl = document.createElement("div");
      cl.className = "fireflies";
      var linger = 25000 + Math.random() * 15000;
      cl.style.setProperty("--linger", (linger / 1000).toFixed(1) + "s");
      var n = 4 + Math.floor(Math.random() * 4); /* 4-7 fireflies */
      for (var i = 0; i < n; i++) {
        var f = document.createElement("div");
        f.className = "firefly";
        f.style.left = (8 + Math.random() * 80) + "%";
        f.style.bottom = (0.4 + Math.random() * 0.8).toFixed(2) + "rem";
        f.style.setProperty("--wx1", ((Math.random() * 3 - 1.5).toFixed(2)) + "rem");
        f.style.setProperty("--wy1", ((Math.random() * 1 - 0.5).toFixed(2)) + "rem");
        f.style.setProperty("--wx2", ((Math.random() * 3 - 1.5).toFixed(2)) + "rem");
        f.style.setProperty("--wy2", ((Math.random() * 1 - 0.5).toFixed(2)) + "rem");
        f.style.setProperty("--wx3", ((Math.random() * 3 - 1.5).toFixed(2)) + "rem");
        f.style.setProperty("--wy3", ((Math.random() * 1 - 0.5).toFixed(2)) + "rem");
        f.style.setProperty("--drift", (16 + Math.random() * 14).toFixed(1) + "s");
        var bl = document.createElement("i");
        bl.style.setProperty("--blink", (4 + Math.random() * 3).toFixed(2) + "s");
        bl.style.animationDelay = (-Math.random() * 7).toFixed(2) + "s";
        f.appendChild(bl);
        cl.appendChild(f);
      }
      win.appendChild(cl);
      setTimeout(function () { cl.remove(); }, linger + 5000);
    }
    window.__fireflyT = setTimeout(fireflyWatch,
      180000 + Math.random() * 210000); /* every 3-6.5 min */
  }
  window.__fireflyWatch = fireflyWatch; /* headless-test hook */

  /* dawn birds: a little flock lands on the wire at dawn; one always peels off */
  var PERCH_SVG =
    '<svg viewBox="0 0 26 30" aria-hidden="true">' +
    '<g fill="#14100b">' +
    '<ellipse cx="13" cy="16" rx="7" ry="8.6"/>' +
    '<circle cx="17.5" cy="8" r="4.6"/>' +
    '<path d="M21.6 7 L26 8.6 L21.6 10.2 Z"/>' +
    '<path d="M7.5 21 L3 28.5 L7.5 26.5 L9.5 24 Z"/>' +
    '<rect x="10" y="24" width="1.6" height="4" rx="0.8"/>' +
    '<rect x="15" y="24" width="1.6" height="4" rx="0.8"/>' +
    '</g></svg>';
  var FLY_SVG =
    '<svg viewBox="0 0 44 26" aria-hidden="true">' +
    '<g fill="#14100b">' +
    '<ellipse cx="22" cy="15" rx="9" ry="4.6"/>' +
    '<circle cx="31.5" cy="12.5" r="3.6"/>' +
    '<path d="M34.5 11.5 L40 13.2 L34.5 15.2 Z"/>' +
    '<path d="M13 14 L6.5 17.5 L13 19 Z"/>' +
    '</g>' +
    '<g class="wings" fill="#14100b">' +
    '<path d="M20 13 C14 6 9 3 4 2 C9 8 14 12 19 15 Z"/>' +
    '<path d="M20 15 C14 22 9 25 4 26 C9 20 14 16 19 13 Z"/>' +
    '</g></svg>';
  function isDawn() {
    /* window.__forceDawn is a console easter egg to peek at the flock anytime */
    if (window.__forceDawn === true) return true;
    var h = phxNow().getHours() + phxNow().getMinutes() / 60;
    return h >= 5 && h < 7;
  }
  function birdWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var sky = document.getElementById("sky");
    if (sky && isDawn() && !reduced) {
      var wire = document.getElementById("wire");
      if (wire) wire.classList.add("on");
      var n = 3 + Math.floor(Math.random() * 3);
      var birds = [];
      for (var i = 0; i < n; i++) {
        var b = document.createElement("div");
        b.className = "perchbird" + (Math.random() < 0.5 ? " rtl" : "");
        b.style.left = (8 + (i + 0.5) * (84 / n) + (Math.random() * 6 - 3)) + "%";
        b.style.animationDelay = (-Math.random() * 7).toFixed(2) + "s";
        b.innerHTML = PERCH_SVG;
        sky.appendChild(b);
        birds.push(b);
      }
      /* one bird peels off mid-visit */
      setTimeout(function () {
        if (birds.length) {
          var b = birds[Math.floor(Math.random() * birds.length)];
          b.classList.add(b.classList.contains("rtl") ? "fly-rtl" : "fly-ltr");
          b.innerHTML = FLY_SVG;
        }
      }, 14000 + Math.random() * 16000);
      setTimeout(function () {
        birds.forEach(function (b) { b.remove(); });
        if (wire) wire.classList.remove("on");
      }, 45000);
    }
    window.__birdT = setTimeout(birdWatch, 90000 + Math.random() * 90000);
  }

  /* dusk swallows: a few swallows swoop erratic insect-runs at dusk;
     one always pulls a barrel roll mid-run */
  var SWALLOW_SVG =
    '<svg viewBox="0 0 46 22" aria-hidden="true">' +
    '<g class="wings" fill="#14100b">' +
    '<path d="M24 11 C19 5 12 1 5 1 C10 6 16 10 23 13 Z"/>' +
    '<path d="M24 13 C19 18 13 21 7 20 C13 17 19 14 23 12 Z"/>' +
    '</g>' +
    '<g fill="#14100b">' +
    '<ellipse cx="26" cy="12" rx="8" ry="3.2"/>' +
    '<circle cx="33" cy="10.6" r="3"/>' +
    '<path d="M36 9.8 L40.5 10.8 L36 12 Z"/>' +
    '<path d="M18 11 L9 7.5 L12 11 L9 14.5 Z"/>' +
    '</g></svg>';
  function isDusk() {
    /* window.__forceDusk is a console easter egg to peek at the swallows anytime */
    if (window.__forceDusk === true) return true;
    var h = phxNow().getHours() + phxNow().getMinutes() / 60;
    return h >= 17 && h < 19;
  }
  function swallowWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var sky = document.getElementById("sky");
    if (sky && isDusk() && !reduced) {
      var n = 3 + Math.floor(Math.random() * 4);
      var birds = [];
      for (var i = 0; i < n; i++) {
        var s = document.createElement("div");
        s.className = "swallow" + (Math.random() < 0.5 ? " rtl" : "");
        s.style.setProperty("--y0", (1 + Math.random() * 4).toFixed(2) + "rem");
        s.style.setProperty("--dy1", (-2.2 + Math.random() * 1.5).toFixed(2) + "rem");
        s.style.setProperty("--dy2", (0.8 + Math.random() * 1.8).toFixed(2) + "rem");
        s.style.setProperty("--dy3", (-1.8 + Math.random() * 2.4).toFixed(2) + "rem");
        s.style.setProperty("--dur", (8 + Math.random() * 5).toFixed(2) + "s");
        s.style.setProperty("--delay", (Math.random() * 6).toFixed(2) + "s");
        s.innerHTML = SWALLOW_SVG;
        sky.appendChild(s);
        birds.push(s);
      }
      /* one bird always pulls a barrel roll mid-run */
      birds[Math.floor(Math.random() * birds.length)].classList.add("loop");
      setTimeout(function () {
        birds.forEach(function (b) { b.remove(); });
      }, 25000);
    }
    window.__swallowT = setTimeout(swallowWatch, 150000 + Math.random() * 150000);
  }

  /* night freight: five boxcars and an engine thread the horizon, windows lit */
  var TRAIN_SVG =
    '<svg viewBox="0 0 128 22" aria-hidden="true">' +
    '<g fill="#0d0a06">' +
    '<rect x="8" y="9" width="17" height="8"/>' +
    '<rect x="26.5" y="9" width="17" height="8"/>' +
    '<rect x="45" y="9" width="17" height="8"/>' +
    '<rect x="63.5" y="9" width="17" height="8"/>' +
    '<rect x="82" y="9" width="17" height="8"/>' +
    '<rect x="100.5" y="9" width="23" height="8"/>' +
    '<rect x="111" y="4" width="9" height="7"/>' +
    '<circle cx="11" cy="19" r="1.6"/><circle cx="23" cy="19" r="1.6"/>' +
    '<circle cx="29.5" cy="19" r="1.6"/><circle cx="41.5" cy="19" r="1.6"/>' +
    '<circle cx="48" cy="19" r="1.6"/><circle cx="60" cy="19" r="1.6"/>' +
    '<circle cx="66.5" cy="19" r="1.6"/><circle cx="78.5" cy="19" r="1.6"/>' +
    '<circle cx="85" cy="19" r="1.6"/><circle cx="97" cy="19" r="1.6"/>' +
    '<circle cx="103" cy="19" r="1.6"/><circle cx="121" cy="19" r="1.6"/>' +
    '</g>' +
    '<g fill="#ffcf7a" opacity="0.85">' +
    '<rect x="12" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="18.4" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="30.5" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="36.9" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="49" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="55.4" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="67.5" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="73.9" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="86" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="92.4" y="10.8" width="2.2" height="2.6"/>' +
    '<rect x="113.5" y="5.6" width="3.4" height="3.2"/>' +
    '</g>' +
    '<circle cx="4.5" cy="12" r="1.1" fill="#e0432f" opacity="0.9"/>' +
    '<circle cx="126.5" cy="13" r="5" fill="#ffd97a" opacity="0.16"/>' +
    '<circle class="headlamp" cx="124.6" cy="13" r="1.5" fill="#fff6d8"/>' +
    '</svg>';
  function isNightTrain() {
    /* window.__forceTrain is a console easter egg to peek at the train anytime */
    if (window.__forceTrain === true) return true;
    var stars = document.getElementById("stars");
    return !!(stars && stars.style.opacity === "1");
  }
  function trainWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    if (win && isNightTrain() && !reduced) {
      var t = document.createElement("div");
      t.className = "train" + (Math.random() < 0.5 ? " rtl" : "");
      t.innerHTML = TRAIN_SVG;
      win.appendChild(t);
      setTimeout(function () { t.remove(); }, 26000);
    }
    window.__trainT = setTimeout(trainWatch, 180000 + Math.random() * 180000);
  }

  /* fair-weather balloon: a fiesta-colored hot-air balloon drifts the sky
     on clear/partly days, bobbing gently; every 3-8 min */
  window.__balloonN = 0;
  var ENVELOPE_D =
    "M3 17 C3 8 10.5 2.5 20 2.5 C29.5 2.5 37 8 37 17 " +
    "C37 26.5 28.5 33 20 33 C11.5 33 3 26.5 3 17 Z";
  function balloonSVG() {
    var uid = "bclip-" + (++window.__balloonN);
    return (
    '<svg viewBox="0 0 40 62" aria-hidden="true">' +
    '<defs><clipPath id="' + uid + '"><path d="' + ENVELOPE_D + '"/></clipPath></defs>' +
    '<path d="' + ENVELOPE_D + '" fill="#f2e3c6"/>' +
    '<g clip-path="url(#' + uid + ')">' +
    '<rect x="4" y="0" width="6" height="36" fill="#e07840"/>' +
    '<rect x="10" y="0" width="6" height="36" fill="#2f8f83"/>' +
    '<rect x="17" y="0" width="6" height="36" fill="#c9a13b"/>' +
    '<rect x="24" y="0" width="6" height="36" fill="#2f8f83"/>' +
    '<rect x="30" y="0" width="6" height="36" fill="#7a3b54"/>' +
    '<ellipse cx="13" cy="10" rx="3.2" ry="4.6" fill="#ffffff" opacity="0.28"/>' +
    '</g>' +
    '<g stroke="#3a2c1c" stroke-width="0.8" fill="none">' +
    '<path d="M11 31 L16.8 46"/>' +
    '<path d="M29 31 L23.2 46"/>' +
    '</g>' +
    '<path d="M16 46 L24 46 L22.8 55.5 L17.2 55.5 Z" fill="#5b3d22"/>' +
    '<path d="M16.7 49.4 L23.3 49.4" stroke="#7a5630" stroke-width="0.7"/>' +
    '</svg>');
  }
  function isBalloonFair() {
    /* window.__forceBalloon is a console easter egg to peek at the balloon anytime */
    if (window.__forceBalloon === true) return true;
    var orb = document.getElementById("orb");
    var day = !!(orb && orb.style.display === "block");
    var K = window.__wxKind || "clear";
    return day && (K === "clear" || K === "partly");
  }
  function balloonWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    if (win && isBalloonFair() && !reduced) {
      var b = document.createElement("div");
      b.className = "balloon" + (Math.random() < 0.5 ? " rtl" : "");
      b.style.setProperty("--y", (1.5 + Math.random() * 2.5).toFixed(2) + "rem");
      b.style.setProperty("--dur", (38 + Math.random() * 14).toFixed(2) + "s");
      b.innerHTML = balloonSVG();
      win.appendChild(b);
      setTimeout(function () { b.remove(); }, 56000);
    }
    window.__balloonT = setTimeout(balloonWatch, 180000 + Math.random() * 300000);
  }

  /* wildlife: a red-tailed hawk rides a thermal, circling high in the sky —
     two orbits, mostly gliding, the odd burst of wingbeats.
     window.__forceHawk is a console easter egg to peek at it anytime */
  var HAWK_SVG =
    '<svg viewBox="0 0 84 32" aria-hidden="true">' +
    '<g fill="#14100b">' +
    '<g class="wing-l">' +
    '<path d="M37 15 C28 8 16 5 4 7 C9 9 11 10 13 11.5 C9 11.5 6 12.5 4 14' +
    ' C8 15 10.5 16 12 17 C9.5 17.5 7.5 18.5 6 20 C10 21 14 21.5 18 22' +
    ' C26 23 32 21 37 18 Z"/>' +
    '</g>' +
    '<g transform="translate(84,0) scale(-1,1)"><g class="wing-r">' +
    '<path d="M37 15 C28 8 16 5 4 7 C9 9 11 10 13 11.5 C9 11.5 6 12.5 4 14' +
    ' C8 15 10.5 16 12 17 C9.5 17.5 7.5 18.5 6 20 C10 21 14 21.5 18 22' +
    ' C26 23 32 21 37 18 Z"/>' +
    '</g></g>' +
    '<ellipse cx="42" cy="17" rx="6" ry="2.8"/>' +
    '<circle cx="48.5" cy="16" r="2.4"/>' +
    '<path d="M36 16.5 L27 13.5 L26.5 20.5 L29.5 23.5 L36.5 20 Z"/>' +
    '</g></svg>';
  function isHawkFair() {
    /* window.__forceHawk is a console easter egg to peek at the hawk anytime */
    if (window.__forceHawk === true) return true;
    var orb = document.getElementById("orb");
    var day = !!(orb && orb.style.display === "block");
    var K = window.__wxKind || "clear";
    return day && (K === "clear" || K === "partly");
  }
  function hawkWatch() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var win = document.querySelector(".window");
    if (win && isHawkFair() && !reduced) {
      var dur = 56 + Math.random() * 20;
      var h = document.createElement("div");
      h.className = "hawk" + (Math.random() < 0.5 ? " rev" : "");
      h.style.setProperty("--dur", dur.toFixed(1) + "s");
      h.style.top = (16 + Math.random() * 8).toFixed(1) + "%";
      h.innerHTML = HAWK_SVG;
      win.appendChild(h);
      setTimeout(function () { h.remove(); }, Math.round(dur * 2000) + 5000);
    }
    window.__hawkT = setTimeout(hawkWatch, 240000 + Math.random() * 300000);
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
        paintCurtains(); /* real wind is stashed now; paint before the next minute tick */
        paintWindmill(); /* the old mill answers the same real wind */
        paintRainbow(d.rainbow_until);
        paintMoon(d.moon);
        paintGlow();
        paintSun();
        paintSagShadows();
        paintBloom(d.bloom);
        paintPear(d.pear_bloom);
        paintShower(d.shower);
        paintScope(); /* the telescope joins the shower as soon as data lands */
        paintCal(d.calendar);
        paintTerm();
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
  paintGlow();
  seedMotes();
  paintSun();
  weaveRug();
  meteorWatch();
  satelliteWatch();
  runnerWatch();
  bunnyWatch();
  pigWatch();
  coyoteWatch();
  tumbleWatch();
  dustWatch();
  haboobWatch();
  shadowWatch();
  glassDropsWatch();
  birdWatch();
  swallowWatch();
  trainWatch();
  balloonWatch();
  hawkWatch();
  quailWatch();
  lizardWatch();
  fireflyWatch();
  mothWatch();
  geckoWatch();
  catWatch();
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
  setInterval(paintGlow, 60000);
  setInterval(paintSun, 60000);
  setInterval(function () {
    if (window.__moonData) paintMoon(window.__moonData);
  }, 60000); /* the silver patch rides the moon's real arc through the night */
  setInterval(paintSagShadows, 60000);
  setInterval(function () { paintRainbow(window.__rainbowUntil); }, 60000);
  loadRoom();
})();
