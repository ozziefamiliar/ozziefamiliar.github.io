/* the room: desert clock, living sky, cron-pinned board */
(function () {
  "use strict";
  var PHX = "America/Phoenix";

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

  tickClock();
  paintSky();
  setInterval(tickClock, 1000);
  setInterval(paintSky, 60000);
  loadRoom();
})();
