/* Bot Honda SPS: menu + simulasi kredit. Tanpa server, tanpa biaya.
   Memakai data dan rumus yang SAMA dengan kalkulator di index.html (D, IMG, KURANG, NOMOR, kelompok),
   jadi kalau harga/tabel di index.html diubah, bot ikut berubah. Tidak ada data yang diketik ulang di sini. */
(function () {
  "use strict";
  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }

  ready(function () {
    if (!window.D || !window.D.m || !window.D.m.length) { console.warn("Bot: data D tidak ditemukan"); return; }

    var NOTE = "Estimasi. Angka final mengikuti leasing dan promo saat pengajuan.";
    var rp = function (n) { return "Rp " + Math.round(n).toLocaleString("id-ID"); };
    var norm = function (t) { return String(t || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); };
    var nomor = function () { return window.NOMOR || "6285609734971"; };
    var wa = function (t) { return "https://wa.me/" + nomor() + "?text=" + encodeURIComponent(t); };
    /* Unit yang di katalog website masuk "BigBike" (disembunyikan) tetap ditampilkan di bot, dengan kategori ini: */
    var PETA = [["crf 250", "Sport"], ["forza", "Matic"], ["monkey", "Cub"]];
    var kel = function (n) {
      var l = String(n).toLowerCase();
      for (var i = 0; i < PETA.length; i++) { if (l.indexOf(PETA[i][0]) >= 0) return PETA[i][1]; }
      var k = typeof window.kelompok === "function" ? window.kelompok(n) : "Lainnya";
      return k === "BigBike" ? "Lainnya" : k;
    };
    var tabs = function () { return (window.TAB && window.TAB.length) ? window.TAB : ["Matic", "Sport", "Cub", "EV"]; };
    var units = function () { return window.D.m; };
    var warna = function (m) { return ((window.IMG || {})[m.n.toLowerCase()] || []).map(function (w) { return w[0]; }); };

    /* Rumus sama dengan fungsi hitung() di kalkulator: angsuran tabel dikurangi potongan (p dikurangi KURANG per tenor) */
    function cicilan(m, row, t) {
      var reguler = row[1 + m.t.indexOf(t)] * 1000;
      var pot = Math.max(0, m.p - ((window.KURANG || {})[t] || 0));
      return Math.max(0, reguler - pot);
    }
    function barisDP(m, dp) {
      var pick = m.r[0];
      for (var i = 0; i < m.r.length; i++) { if (m.r[i][0] * 1000 <= dp) pick = m.r[i]; }
      return pick;
    }
    function parseRp(s) {
      s = String(s).toLowerCase().replace(/rp\.?/g, "");
      var j = s.match(/(\d+(?:[.,]\d+)?)\s*(jt|juta)/);
      if (j) return parseFloat(j[1].replace(",", ".")) * 1e6;
      var n = parseInt(s.replace(/[^\d]/g, ""), 10);
      if (!n) return 0;
      if (n < 1000) return n * 1e6;
      if (n < 100000) return n * 1000;
      return n;
    }
    function ringkas(m) {
      var T = m.t.indexOf(35) >= 0 ? 35 : m.t[m.t.length - 1];
      return "DP mulai " + rp(m.r[0][0] * 1000) + ", angsuran " + rp(cicilan(m, m.r[0], T)) + "/bln (" + T + " bln)";
    }

    /* ===== tampilan ===== */
    var css =
      "#sb-fab{position:fixed;left:14px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9001;display:flex;align-items:center;gap:8px;padding:12px 16px;border:0;border-radius:999px;background:#c8102e;color:#fff;font:700 14px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.28);cursor:pointer}" +
      "#sb-box{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9500;width:360px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100vh - 24px);display:flex;flex-direction:column;background:#fff;color:#1c1c1c;border-radius:16px;box-shadow:0 10px 34px rgba(0,0,0,.35);overflow:hidden;font:15px/1.45 system-ui,sans-serif}" +
      "#sb-box[hidden],#sb-fab[hidden]{display:none}" +
      "#sb-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#c8102e;color:#fff}" +
      "#sb-x{border:0;background:none;color:#fff;font-size:26px;line-height:1;cursor:pointer}" +
      "#sb-msgs{flex:1;overflow-y:auto;padding:12px;background:#f3f3f3}" +
      ".sb-m{max-width:88%;margin:0 0 8px;padding:8px 11px;border-radius:12px;background:#fff;word-wrap:break-word}" +
      ".sb-u{margin-left:auto;background:#c8102e;color:#fff}" +
      "#sb-btns{display:flex;flex-direction:column;gap:6px;max-height:38%;overflow-y:auto;padding:8px;border-top:1px solid #e3e3e3}" +
      "#sb-btns button,#sb-btns a{display:block;text-align:left;text-decoration:none;border:1.5px solid #c8102e;border-radius:10px;background:#fff;color:#c8102e;padding:8px 11px;font:600 14px system-ui,sans-serif;cursor:pointer}" +
      "#sb-btns a.sb-wa{background:#128c4a;border-color:#128c4a;color:#fff}" +
      "#sb-f{display:flex;gap:6px;padding:8px;border-top:1px solid #e3e3e3}" +
      "#sb-in{flex:1;min-width:0;border:1.5px solid #bbb;border-radius:10px;padding:8px 10px;font:16px system-ui,sans-serif}" +
      "#sb-go{border:0;border-radius:10px;background:#c8102e;color:#fff;padding:0 14px;font:700 14px system-ui,sans-serif;cursor:pointer}" +
      "#sb-fab:focus-visible,#sb-x:focus-visible,#sb-btns button:focus-visible,#sb-btns a:focus-visible,#sb-in:focus-visible,#sb-go:focus-visible{outline:3px solid #1a73e8;outline-offset:2px}" +
      "@media(max-width:480px){#sb-box{left:8px;right:8px;width:auto;max-width:none}}";
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

    var root = document.createElement("div");
    root.innerHTML =
      '<button id="sb-fab" type="button" aria-label="Buka asisten motor">Tanya motor</button>' +
      '<div id="sb-box" hidden role="dialog" aria-label="Asisten Honda SPS">' +
      '<div id="sb-head"><b>Asisten Honda SPS</b><button id="sb-x" type="button" aria-label="Tutup">&times;</button></div>' +
      '<div id="sb-msgs" aria-live="polite"></div><div id="sb-btns"></div>' +
      '<form id="sb-f" autocomplete="off"><input id="sb-in" type="text" aria-label="Ketik pesan" placeholder="Ketik nama motor, mis. vario 160"><button id="sb-go" type="submit">Kirim</button></form></div>';
    document.body.appendChild(root);

    var fab = root.querySelector("#sb-fab"), box = root.querySelector("#sb-box");
    var msgs = root.querySelector("#sb-msgs"), btns = root.querySelector("#sb-btns"), inp = root.querySelector("#sb-in");
    var started = false, ctx = { m: null, dp: false };

    fab.onclick = function () { box.hidden = false; fab.hidden = true; if (!started) { started = true; menu(); } };
    root.querySelector("#sb-x").onclick = function () { box.hidden = true; fab.hidden = false; };
    root.querySelector("#sb-f").onsubmit = function (e) { e.preventDefault(); var v = inp.value; inp.value = ""; ketik(v); };

    function say(h, user) {
      var d = document.createElement("div");
      d.className = "sb-m" + (user ? " sb-u" : "");
      if (user) d.textContent = h; else d.innerHTML = h;
      msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    }
    function setBtns(list) {
      btns.innerHTML = ""; btns.scrollTop = 0;
      list.forEach(function (b) {
        var el = document.createElement(b.href ? "a" : "button");
        el.textContent = b.t;
        if (b.href) { el.href = b.href; el.target = "_blank"; el.rel = "noopener"; el.className = "sb-wa"; }
        else { el.type = "button"; el.onclick = b.f; }
        btns.appendChild(el);
      });
    }
    function goPage(h) { box.hidden = true; fab.hidden = false; location.hash = "#" + h; }
    var home = { t: "Menu utama", f: function () { ctx.dp = false; menu(); } };

    /* ===== alur ===== */
    function menu() {
      say("Halo! Saya asisten Honda SPS. Mau cari motor, hitung kredit, atau tanya harga cash? Bisa juga ketik nama motor, misalnya <b>vario 160</b>.");
      setBtns([
        { t: "Lihat motor, harga, dan warna", f: function () { say("Lihat motor", 1); pilihMotor(info); } },
        { t: "Simulasi kredit", f: function () { say("Simulasi kredit", 1); pilihMotor(kredit); } },
        { t: "Harga cash", f: function () { say("Harga cash", 1); pilihMotor(cash); } },
        { t: "Diskon, DP, atau nego angsuran", f: function () { say("Diskon, DP, atau nego angsuran", 1); nego(); } },
        { t: "Lihat halaman promo", f: function () { goPage("promo"); } }
      ]);
    }
    function pilihMotor(next) {
      ctx.dp = false;
      say("Pilih kelompok motor:");
      var us = units();
      setBtns(tabs().map(function (c) {
        var list = us.filter(function (m) { return kel(m.n) === c; });
        return list.length ? { t: c + " (" + list.length + " unit)", f: function () { say(c, 1); daftar(c, list, next); } } : null;
      }).filter(Boolean).concat([home]));
    }
    function daftar(c, list, next) {
      say("Pilih unit " + c + ":");
      setBtns(list.map(function (m) {
        return { t: m.n + " · " + rp(m.o), f: function () { say(m.n, 1); next(m); } };
      }).concat([{ t: "Kembali ke kelompok", f: function () { pilihMotor(next); } }, home]));
    }
    function info(m) {
      ctx.dp = false;
      var w = warna(m);
      say("<b>Honda " + m.n + "</b><br>Harga OTR Yogyakarta: " + rp(m.o) + (w.length ? "<br>Warna: " + w.join(", ") : "") + "<br>" + ringkas(m) + "<br><small>" + NOTE + "</small>");
      setBtns([
        { t: "Simulasi kredit unit ini", f: function () { say("Simulasi kredit", 1); kredit(m); } },
        { t: "Tanya sales lewat WhatsApp", href: wa("Halo Honda SPS, saya tertarik dengan Honda " + m.n + ". Mohon info ketersediaan warna dan promonya.") },
        home
      ]);
    }
    function cash(m) {
      ctx.dp = false;
      say("Harga cash <b>Honda " + m.n + "</b>: <b>" + rp(m.o) + "</b> (OTR Yogyakarta). Diskon atau promo cash berbeda tiap periode dan stok, jadi paling akurat dikonfirmasi langsung oleh sales.");
      setBtns([
        { t: "Tanya diskon cash lewat WhatsApp", href: wa("Halo Honda SPS, saya mau beli cash Honda " + m.n + " (OTR " + rp(m.o) + "). Apakah ada diskon atau promo cash?") },
        { t: "Syarat pembelian cash", f: function () { goPage("cash"); } },
        home
      ]);
    }
    function kredit(m) {
      ctx.m = m; ctx.dp = true;
      var n = m.r.length, seen = {};
      var idx = [0, 0.25, 0.5, 0.75, 1].map(function (f) { return Math.round((n - 1) * f); }).filter(function (i) { if (seen[i]) return false; seen[i] = 1; return true; });
      say("Simulasi kredit <b>Honda " + m.n + "</b> (OTR " + rp(m.o) + "). DP paling ringan di simulasi: <b>" + rp(m.r[0][0] * 1000) + "</b>. Pilih DP di bawah, atau ketik nominal sendiri, misalnya <b>3 juta</b>.");
      setBtns(idx.map(function (i) {
        var d = m.r[i][0] * 1000;
        return { t: (i === 0 ? "DP paling ringan " : "DP ") + rp(d), f: function () { say("DP " + rp(d), 1); hasil(m, d); } };
      }).concat([home]));
    }
    function hasil(m, dp) {
      var row = barisDP(m, dp), d = row[0] * 1000, catatan = "";
      if (dp < m.r[0][0] * 1000) catatan = "DP paling ringan di simulasi adalah " + rp(d) + ", jadi saya pakai angka itu. DP lebih ringan perlu dikonfirmasi ke sales.<br>";
      else if (dp > m.r[m.r.length - 1][0] * 1000) catatan = "DP tertinggi di simulasi adalah " + rp(d) + ", jadi saya pakai angka itu.<br>";
      else if (d !== dp) catatan = "DP terdekat di tabel: " + rp(d) + ".<br>";
      var baris = m.t.map(function (t) { return t + " bulan: <b>" + rp(cicilan(m, row, t)) + "</b>"; });
      var teks = m.t.map(function (t) { return t + " bln " + rp(cicilan(m, row, t)); }).join(", ");
      ctx.m = m; ctx.dp = true;
      say("<b>Honda " + m.n + "</b><br>Harga OTR: " + rp(m.o) + "<br>DP: <b>" + rp(d) + "</b><br>" + catatan + "<br>Estimasi angsuran per bulan:<br>" + baris.join("<br>") + "<br><small>" + NOTE + " Ketik DP lain kalau mau coba angka berbeda.</small>");
      setBtns([
        { t: "Lanjut dengan sales lewat WhatsApp", href: wa("Halo Honda SPS, saya tertarik dengan Honda " + m.n + ". Harga OTR: " + rp(m.o) + ". Warna pilihan: mohon konfirmasi ketersediaan. DP: " + rp(d) + ". Estimasi angsuran: " + teks + ". Mohon informasi dan bantuan proses pengajuannya.") },
        { t: "Ganti DP", f: function () { kredit(m); } },
        { t: "Pilih unit lain", f: function () { pilihMotor(kredit); } },
        home
      ]);
    }
    function nego() {
      ctx.dp = false;
      say("Diskon cash, DP lebih ringan, dan angsuran yang bisa dinego mengikuti promo dan syarat leasing yang berlaku saat ini, jadi dikonfirmasi langsung oleh sales. Angka di simulasi adalah angka standar, bukan janji potongan.");
      setBtns([
        { t: "Tanya sales lewat WhatsApp", href: wa("Halo Honda SPS, saya mau tanya soal diskon, DP, dan angsuran motor.") },
        { t: "Lihat halaman promo", f: function () { goPage("promo"); } },
        home
      ]);
    }

    /* ===== ketikan bebas (tanpa AI): angka DP, kata kunci, atau nama motor ===== */
    function ketik(t) {
      t = String(t || "").trim(); if (!t) return;
      say(t, 1);
      var n = norm(t);
      if (ctx.dp && ctx.m) { var v = parseRp(t); if (v) { hasil(ctx.m, v); return; } }
      if (/diskon|nego|potongan|tawar|dp kurang|dp murah/.test(n)) return nego();
      if (/\b(cash|tunai)\b/.test(n)) return pilihMotor(cash);
      if (/kredit|cicil|angsur|simulasi/.test(n)) return pilihMotor(kredit);
      var tok = n.split(" ").filter(Boolean);
      var cocok = tok.length ? units().filter(function (m) { var nm = norm(m.n); return tok.every(function (x) { return nm.indexOf(x) >= 0; }); }) : [];
      if (!cocok.length) {
        say("Belum ketemu unit dengan nama itu. Coba nama lain seperti <b>beat</b>, <b>scoopy</b>, atau <b>vario 160</b>, atau pilih dari menu. Untuk unit lain, sales kami siap bantu.");
        setBtns([{ t: "Tanya sales lewat WhatsApp", href: wa("Halo Honda SPS, saya mencari motor: " + t) }, home]);
        return;
      }
      say("Unit yang cocok:");
      setBtns(cocok.slice(0, 12).map(function (m) { return { t: m.n + " · " + rp(m.o), f: function () { say(m.n, 1); info(m); } }; }).concat([home]));
    }
  });
})();
