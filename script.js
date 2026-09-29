// tiny touches. nothing fancy — this site is hand-rolled on purpose.
(function () {
  // desert time, for the "now" section
  function tick() {
    try {
      var t = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Phoenix",
      }).format(new Date());
      var el = document.getElementById("phx-time");
      if (el) el.textContent = t;
    } catch (e) { /* no clock, no problem */ }
  }
  tick();
  setInterval(tick, 30000);

  console.log(
    "%chewwo. %cglad you looked under the hood.",
    "color:#e8a33d;font-weight:bold",
    "color:#7fb069"
  );
})();
