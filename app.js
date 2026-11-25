// ====== Aplikasi HP Umum UPKL: login, home, ruang, BBM, SPPD, pegawai ======
// Kerangka & tampilan sama dengan aplikasi Aset UPKL v1.4.
(function () {
  const APP_VERSION = '1.0';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LS = {
    get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
    del: k => { try { localStorage.removeItem(k); } catch (e) {} }
  };
  let view = 'home', LOGIN = null;

  // ---------- util ----------
  let toastT = 0;
  function toast(t, ms) {
    const el = $('toast'); el.textContent = t; el.classList.remove('hidden');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.add('hidden'), ms || 2600);
  }
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => ymd(new Date());
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function tgl(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? (+m[3]) + ' ' + BLN[+m[2] - 1] + ' ' + m[1] : String(s || ''); }
  function badge(st) {
    st = String(st || '-');
    const c = /setuju|terima|selesai/i.test(st) ? 'ok' : /tunggu|proses/i.test(st) ? 'wait' : /tolak|batal|revisi/i.test(st) ? 'tolak' : 'no';
    return '<span class="badge ' + c + '">' + esc(st) + '</span>';
  }
  const isAdmin = () => !!(LOGIN && LOGIN.admin);
  const isGuest = () => !!(LOGIN && LOGIN.mode === 'guest');
  const isMine = r => !!(r.milik || (LOGIN && LOGIN.nip && r.nip === LOGIN.nip) || (isGuest() && guestIds().indexOf(r.id) >= 0));
  // GUEST: ID pinjaman disimpan di HP agar statusnya bisa dilihat
  function guestIds() { try { const a = JSON.parse(LS.get('umum-guest-ids', '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function addGuestId(id) { LS.set('umum-guest-ids', JSON.stringify([id].concat(guestIds()).slice(0, 20))); }
  const errBox = e => '<div class="empty">' + esc(e && e.message || e) + '</div>';

  // ---------- tab ----------
  const TABS = ['home', 'ruang', 'bbm', 'sppd', 'pegawai'];
  const LOCKED = ['bbm', 'sppd', 'pegawai'];   // tab yang tidak dibuka untuk GUEST
  const NAMA_TAB = { bbm: 'Kupon BBM', sppd: 'Lapor SPPD', pegawai: 'Data Pegawai' };
  function go(v) {
    view = v;
    const kunci = isGuest() && LOCKED.indexOf(v) >= 0;
    TABS.forEach(x => $('view' + x[0].toUpperCase() + x.slice(1)).classList.toggle('hidden', kunci || x !== v));
    $('viewLock').classList.toggle('hidden', !kunci);
    if (kunci) $('lockTitle').textContent = NAMA_TAB[v] + ' · khusus pegawai';
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    window.scrollTo(0, 0);
    if (APP.pin() && !kunci) renderActive();
  }
  function renderActive() {
    if (isGuest() && LOCKED.indexOf(view) >= 0) return;
    if (view === 'home') renderHome();
    else if (view === 'ruang') renderRuang();
    else if (view === 'bbm') renderBbm();
    else if (view === 'sppd') renderSppd();
    else if (view === 'pegawai') renderPegawai();
  }

  // ---------- HOME ----------
  function sapa() { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi,' : h < 15 ? 'Selamat siang,' : h < 18 ? 'Selamat sore,' : 'Selamat malam,'; }
  const JN_TAB = { Ruang: 'ruang', BBM: 'bbm', SPPD: 'sppd' };
  async function renderHome() {
    setTimeout(() => { try { hLayout(); } catch (e) {} }, 0);
    $('hHi').textContent = sapa();
    $('hName').textContent = isGuest() ? 'Tamu (GUEST)' : (LOGIN && LOGIN.nama) || 'Pegawai UPKL';
    if (!APP.pin()) return;
    try {
      const d = await APP.call('home', []);
      if (isGuest()) {
        const ids = guestIds();
        const rs = ids.length ? await APP.call('ruangStatus', [ids]) : [];
        d.recent = rs.sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5).map(r => ({ jenis: 'Ruang', judul: r.ruang + ' · ' + (r.acara || ''), sub: rentang(r.tanggal, r.sampai) + ' · ' + r.mulai + '–' + r.selesai, status: r.status }));
      }
      $('hPct').textContent = d.pegawai + ' org';
      HO[0].i = d.ruangHariIni ? 'Hari ini ada ' + d.ruangHariIni + ' jadwal rapat. Cek jam kosong & pinjam ruangnya. Ketuk ruangannya!' : HO0;
      HO[1].i = d.bbmMenunggu ? d.bbmMenunggu + ' pengajuan kupon masih menunggu. Ajukan & pantau kupon BBM di sini.' : HO1;
      $('hRecent').innerHTML = d.recent.length ? d.recent.map(r =>
        '<div class="it" data-t="' + esc(JN_TAB[r.jenis] || 'home') + '" style="cursor:pointer"><span class="jn">' + esc(r.jenis) + '</span><div class="m"><b>' + esc(r.judul) + '</b><small>' + esc(r.sub) + '</small></div>' + badge(r.status) + '</div>').join('')
        : '<div class="empty">' + (isGuest() ? 'Belum ada. Peminjaman ruang dari HP ini akan muncul di sini.' : 'Belum ada. Pengajuan ruang, kupon BBM dan SPPD Anda akan muncul di sini.') + '</div>';
    } catch (e) { $('hRecent').innerHTML = errBox(e); }
  }
  // ---------- HOME ANIMASI: petugas berjalan mengikuti kursor / ke objek ----------
  const HO0 = 'Cek jadwal & pinjam ruang rapat. Jam yang bentrok ditolak otomatis. Ketuk ruangannya!';
  const HO1 = 'Ajukan kupon BBM kendaraan dinas & pantau statusnya. Ketuk pompanya!';
  const HO = [
    { tab: 'ruang', stand: 236, j: 'Ini ruang rapat', i: HO0 },
    { tab: 'bbm', stand: 196, j: 'Pom BBM', i: HO1 },
    { tab: 'sppd', stand: 270, j: 'Koper SPPD', i: 'Pulang perjalanan dinas? Laporkan SPPD + lampiran tiket & nota di sini.' },
    { tab: 'pegawai', stand: 270, j: 'Papan pegawai', i: 'Kenali pegawai UPK Lombok: foto, unit dan jabatan.' }];
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hx = 200, hdir = 1, hi = -1, hHover = false, hWalkT = 0;
  const HB = { o0: 109, o1: 248, o2: 339, o3: 336, bld: 195, c1: 70, c2: 257 };
  const HS0 = [236, 196, 270, 270];
  let HW = 390, HDX = { o0: 0, o1: 0, o2: 0, o3: 0, bld: 0, c1: 0, c2: 0 };
  function hLayout() {
    const wrap = $('hHero'), pw = wrap.clientWidth || 390;
    const tinggi = pw < 700 ? pw * 400 / 390 : Math.min(460, Math.max(360, window.innerHeight * .5));
    HW = Math.max(390, Math.round(pw * 400 / tinggi));
    if (HW <= 430) { Object.keys(HDX).forEach(k => HDX[k] = 0); }
    else {
      const tgt = { o0: .2, o1: .42, o2: .62, o3: .82, bld: .5, c1: .12, c2: .7 };
      Object.keys(tgt).forEach(k => HDX[k] = Math.round(HW * tgt[k] - HB[k]));
    }
    $('hSvg').setAttribute('viewBox', '0 0 ' + HW + ' 400');
    document.querySelectorAll('#hSvg [data-l]').forEach(g => g.setAttribute('transform', 'translate(' + HDX[g.dataset.l] + ',0)'));
    HO.forEach((o, k) => { o.stand = HS0[k] + HDX['o' + k]; });
    hx = Math.max(40, Math.min(HW - 40, hx));
    hPlace(0);
  }
  function hBubble(j, i) {
    $('hBubT').textContent = j; $('hBubI').textContent = i;
    const b = $('hBub'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }
  function hPlace(dur) {
    const man = $('hMan');
    man.style.transition = 'transform ' + (reduce ? 0 : dur) + 's linear';
    man.style.transform = 'translate(' + hx + 'px,392px) scale(' + (.78 * hdir) + ',.78)';
    const bub = $('hBub'), W = $('hSvg').getBoundingClientRect().width || 390, bw = bub.offsetWidth || 220;
    const px = hx / HW * W, left = Math.max(6, Math.min(W - bw - 6, px - bw * .7));
    bub.style.transition = 'left ' + (reduce ? 0 : dur) + 's linear'; bub.style.left = left + 'px';
    $('hBubTail').style.left = Math.max(14, Math.min(bw - 30, px - left - 7)) + 'px';
  }
  function hWalk(x, k) {
    x = Math.max(40, Math.min(HW - 40, x));
    const d = Math.abs(x - hx);
    if (d < 4 && k === hi) return;
    const dur = Math.min(1.6, Math.max(.25, d / 160));
    if (x !== hx) hdir = x < hx ? -1 : 1;
    hx = x;
    const prev = hi; hi = k;
    document.querySelectorAll('#hSvg .hl').forEach(g => g.classList.toggle('on', Number(g.dataset.k) === k));
    if (k !== prev) { if (k >= 0) hBubble(HO[k].j, HO[k].i); else hBubble(sapa().replace(',', '') + '!', 'Arahkan kursor / sentuh benda di sekitar saya untuk tahu fungsinya.'); }
    $('hBeam').style.display = 'none';
    $('hManIn').classList.toggle('walk', d > 4 && !reduce);
    hPlace(dur);
    clearTimeout(hWalkT);
    hWalkT = setTimeout(() => { $('hManIn').classList.remove('walk'); }, dur * 1000);
  }
  (function () {
    const svg = $('hSvg');
    const toX = e => { const r = svg.getBoundingClientRect(); return (e.clientX - r.left) * HW / r.width; };
    svg.addEventListener('mousemove', e => { if (e.target.classList.contains('hit')) return; hHover = true; hWalk(toX(e), -1); });
    svg.addEventListener('mouseleave', () => { hHover = false; });
    document.querySelectorAll('#hSvg .hit').forEach(r => {
      const k = Number(r.dataset.k);
      r.addEventListener('mouseenter', () => { hHover = true; hWalk(HO[k].stand, k); });
      r.addEventListener('focus', () => hWalk(HO[k].stand, k));
      r.addEventListener('click', () => go(HO[k].tab));
      r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(HO[k].tab); } });
    });
    setInterval(() => { if (view === 'home' && !hHover && !document.hidden) hWalk(HO[(hi + 1) % 4].stand, (hi + 1) % 4); }, 4000);
    window.addEventListener('resize', hLayout);
    setTimeout(() => { hBubble('Halo!', 'Saya petugas Umum. Sentuh benda di sekitar saya untuk tahu fungsinya.'); hLayout(); }, 50);
  })();
  $('hAll').addEventListener('click', () => go(isGuest() ? 'ruang' : 'bbm'));
  $('hRecent').addEventListener('click', e => { const it = e.target.closest('.it'); if (it && it.dataset.t) go(it.dataset.t); });
  document.querySelectorAll('#menu .soonBtn').forEach(b => b.addEventListener('click', () => { $('menu').classList.add('hidden'); toast(b.textContent.replace('(segera)', '').trim() + ': segera dibangun'); }));
  document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => go(b.dataset.v)));

  // ---------- FORMULIR (halaman penuh, tombol kembali HP menutup) ----------
  let fSubmit = null;
  function openForm(title, sub, html, onSubmit) {
    $('fTitle').textContent = title; $('fSub').textContent = sub || '';
    $('fForm').innerHTML = html + '<button class="full" type="submit" id="fBtn">Simpan</button><div class="msg" id="fMsg"></div>';
    fSubmit = onSubmit;
    $('fSheet').classList.remove('hidden'); document.body.style.overflow = 'hidden';
    history.pushState({ sheet: 'fSheet' }, '');
    const first = $('fForm').querySelector('input,select,textarea'); if (first) setTimeout(() => first.focus(), 150);
  }
  function closeFormUi() { $('fSheet').classList.add('hidden'); document.body.style.overflow = ''; }
  const closeForm = () => history.back();
  window.addEventListener('popstate', () => { tutupKamera(); if (!$('fSheet').classList.contains('hidden')) closeFormUi(); });
  $('btnFBack').addEventListener('click', closeForm);
  $('fForm').addEventListener('submit', async e => {
    e.preventDefault();
    const b = $('fBtn'), m = $('fMsg');
    const d = {};
    $('fForm').querySelectorAll('[name]').forEach(el => {
      if (el.type === 'file') return;
      if (el.type === 'checkbox') { if (!(el.name in d)) d[el.name] = ''; if (el.checked) d[el.name] = d[el.name] ? d[el.name] + ', ' + el.value : el.value; return; }
      if (el.type === 'radio') { if (el.checked) d[el.name] = el.value; else if (!(el.name in d)) d[el.name] = ''; return; }
      d[el.name] = el.value.trim();
    });
    const kosong = [...$('fForm').querySelectorAll('[required]')].find(el => !el.value.trim());
    if (kosong) { m.className = 'msg err'; m.textContent = 'Lengkapi: ' + (kosong.dataset.l || kosong.name); kosong.focus(); return; }
    b.disabled = true; m.className = 'msg'; m.textContent = 'Menyimpan…';
    try { await fSubmit(d); closeForm(); }
    catch (err) { m.className = 'msg err'; m.textContent = err.message; }
    b.disabled = false;
  });
  // GUEST wajib menulis identitasnya; pegawai otomatis dari NIP
  const namaField = () => !isGuest() ? '' :
    '<div class="fsec">Peminjam</div>' +
    '<label for="f_nama">Nama peminjam</label><input id="f_nama" name="nama" required data-l="Nama peminjam" autocomplete="name">' +
    '<label for="f_unit">Unit / instansi</label><input id="f_unit" name="unit" required data-l="Unit / instansi" placeholder="mis. PLN UIW NTB, Dinas ESDM">' +
    '<label for="f_hp">No HP / WhatsApp</label><input id="f_hp" name="hp" type="tel" inputmode="tel" required data-l="No HP" autocomplete="tel">';
  const chips = (name, type, opts, checked) => '<div class="chips">' + opts.map(o => '<label><input type="' + type + '" name="' + name + '" value="' + esc(o) + '"' + (checked === o ? ' checked' : '') + '>' + esc(o) + '</label>').join('') + '</div>';

  // ---------- RUANG: cek ketersediaan -> pilih ruang -> isi detail ----------
  const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const MAX_HARI = 14;
  const toD = s => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const jmlHari = (a, b) => Math.round((toD(b) - toD(a)) / 864e5) + 1;
  function rentang(a, b) {
    if (!a) return '';
    if (!b || a === b) { const d = toD(a); return HARI[d.getDay()] + ', ' + tgl(a); }
    const A = toD(a), B = toD(b);
    const kiri = A.getFullYear() === B.getFullYear() ? A.getDate() + (A.getMonth() === B.getMonth() ? '' : ' ' + BLN[A.getMonth()]) : tgl(a);
    return kiri + ' – ' + tgl(b) + ' (' + jmlHari(a, b) + ' hari)';
  }
  // pilihan jam 06:00 – 22:00 tiap 30 menit
  const JAM = []; for (let m = 6 * 60; m <= 22 * 60; m += 30) JAM.push(pad(Math.floor(m / 60)) + ':' + pad(m % 60));
  $('rMulai').innerHTML = JAM.slice(0, -1).map(j => '<option>' + j + '</option>').join('');
  $('rSelesai').innerHTML = JAM.slice(1).map(j => '<option>' + j + '</option>').join('');
  $('rMulai').value = '08:00'; $('rSelesai').value = '12:00';
  $('rMulai').addEventListener('change', () => { if ($('rSelesai').value <= $('rMulai').value) $('rSelesai').value = JAM[Math.min(JAM.indexOf($('rMulai').value) + 2, JAM.length - 1)]; });

  // ---- kalender dropdown (pilih tanggal mulai lalu tanggal selesai) ----
  const DP = { dari: today(), sampai: today(), bln: null, tahap: 0 };
  function dpTxt() { $('rRangeTxt').textContent = rentang(DP.dari, DP.sampai); }
  function dpRender() {
    const b = DP.bln, y = b.getFullYear(), m = b.getMonth();
    const awal = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(), t = today();
    const bulanIni = new Date(); bulanIni.setDate(1); bulanIni.setHours(0, 0, 0, 0);
    let g = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(x => '<div class="dn">' + x + '</div>').join('');
    for (let i = 0; i < awal; i++) g += '<div></div>';
    for (let d = 1; d <= n; d++) {
      const s = y + '-' + pad(m + 1) + '-' + pad(d);
      const c = [s === t ? 'td' : '', s === DP.dari ? 's' : '', s === DP.sampai ? 'e' : '', s > DP.dari && s < DP.sampai ? 'in' : ''].join(' ');
      g += '<button type="button" data-d="' + s + '" class="' + c + '"' + (s < t ? ' disabled' : '') + '>' + d + '</button>';
    }
    $('dpPop').innerHTML = '<div class="dpHead"><button type="button" data-nav="-1" aria-label="Bulan sebelumnya"' + (b <= bulanIni ? ' disabled' : '') + '>‹</button><b>' +
      ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][m] + ' ' + y +
      '</b><button type="button" data-nav="1" aria-label="Bulan berikutnya">›</button></div><div class="dpGrid">' + g + '</div>' +
      '<div class="dpFoot"><span>' + (DP.tahap ? 'Ketuk tanggal <b>selesai</b> (ketuk sama = 1 hari)' : 'Ketuk tanggal <b>mulai</b>') + '</span><button type="button" data-ok="1">Selesai</button></div>';
  }
  function dpOpen() { DP.bln = toD(DP.dari); DP.bln.setDate(1); DP.tahap = 0; dpRender(); $('dpPop').classList.remove('hidden'); }
  function dpClose() { $('dpPop').classList.add('hidden'); }
  $('rRange').addEventListener('click', e => { e.stopPropagation(); $('dpPop').classList.contains('hidden') ? dpOpen() : dpClose(); });
  $('dpPop').addEventListener('click', e => {
    e.stopPropagation();
    const nav = e.target.closest('[data-nav]'), day = e.target.closest('[data-d]');
    if (nav) { DP.bln.setMonth(DP.bln.getMonth() + Number(nav.dataset.nav)); dpRender(); return; }
    if (e.target.closest('[data-ok]')) { dpClose(); cekRuang(); return; }
    if (!day) return;
    const s = day.dataset.d;
    if (!DP.tahap || s < DP.dari) { DP.dari = DP.sampai = s; DP.tahap = 1; }
    else if (jmlHari(DP.dari, s) > MAX_HARI) { toast('Maksimal ' + MAX_HARI + ' hari per peminjaman'); return; }
    else { DP.sampai = s; DP.tahap = 0; dpTxt(); dpRender(); setTimeout(() => { dpClose(); cekRuang(); }, 250); return; }
    dpTxt(); dpRender();
  });
  document.addEventListener('click', e => { if (!e.target.closest('.dp')) dpClose(); });
  dpTxt();

  // ---- hasil cek ----
  let RU = { ruang: [] }, Q = null;
  async function renderRuang() { cekRuang(); }
  async function cekRuang() {
    if ($('rSelesai').value <= $('rMulai').value) { toast('Jam selesai harus setelah jam mulai'); return; }
    Q = { dari: DP.dari, sampai: DP.sampai, mulai: $('rMulai').value, selesai: $('rSelesai').value };
    $('rInfo').textContent = rentang(Q.dari, Q.sampai) + ' · ' + Q.mulai + '–' + Q.selesai;
    $('rList').innerHTML = '<div class="empty">Mengecek ketersediaan…</div>';
    try { RU = await APP.call('ruangCek', [Q]); } catch (e) { $('rList').innerHTML = errBox(e); return; }
    const ada = RU.ruang.filter(r => r.tersedia).length;
    $('rInfo').textContent = ada + ' dari ' + RU.ruang.length + ' ruang tersedia · ' + rentang(Q.dari, Q.sampai) + ' · ' + Q.mulai + '–' + Q.selesai;
    $('rList').innerHTML = RU.ruang.map((r, i) =>
      '<div class="room"><div class="r"><div><b>' + esc(r.nama) + '</b><small>' + esc(r.lokasi) + (r.kapasitas ? ' · ' + esc(r.kapasitas) + ' orang' : '') + (r.fasilitas ? ' · ' + esc(r.fasilitas) : '') + '</small></div>' +
      (r.tersedia ? '<span class="badge ok">Tersedia</span>' : '<span class="badge tolak">Terpakai</span>') + '</div>' +
      r.jadwal.map(b => '<div class="bk rk' + (b.bentrok ? ' bt' : '') + '"><div class="jam">' + esc(b.mulai) + '–' + esc(b.selesai) + '<small style="display:block;font-weight:400;color:var(--muted);font-size:11.5px">' + esc(rentang(b.tanggal, b.sampai)) + '</small></div>' +
        '<div class="m">' + (b.acara ? esc(b.acara) : '<i>Terpakai</i>') +
        (b.nama ? '<small>' + esc(b.nama) + (b.unit ? ' · ' + esc(b.unit) : '') + (b.peserta ? ' · ' + esc(b.peserta) + ' orang' : '') + '</small>' : '') +
        (b.tataLetak ? '<div class="det">Tata letak <b>' + esc(b.tataLetak) + '</b> · Konsumsi <b>' + esc(b.konsumsi) + (b.menu ? ' (' + esc(b.menu) + ')' : '') + '</b>' +
          (b.perlengkapan ? ' · Perlengkapan <b>' + esc(b.perlengkapan) + '</b>' : '') + (b.hp ? ' · HP <a href="tel:' + esc(b.hp) + '">' + esc(b.hp) + '</a>' : '') + (b.catatan ? '<br>Catatan: ' + esc(b.catatan) : '') + '</div>' : '') +
        '<div class="acts">' + badge(b.status) + (isAdmin() && b.status === 'Menunggu' ? '<button type="button" data-proses="' + esc(b.id) + '">Proses</button>' : '') +
        (((isMine(b) && !isGuest()) || isAdmin()) ? '<button class="sec" type="button" data-batal="' + esc(b.id) + '">Batal</button>' : '') + '</div></div></div>').join('') +
      (r.tersedia ? '<button class="pin" type="button" data-pesan="' + i + '">Pesan ruang ini →</button>'
        : '<div class="det" style="margin-top:8px">Bentrok di jam/tanggal yang dipilih. Ubah jam atau tanggal, lalu cek lagi.</div>') + '</div>'
    ).join('') || '<div class="empty">Belum ada data ruang. Isi sheet "DaftarRuang" di spreadsheet.</div>';
  }
  $('rCek').addEventListener('click', cekRuang);
  $('btnReloadR').addEventListener('click', cekRuang);

  function formRuang(r) {
    const q = Q;
    openForm('Pinjam ruang', 'Diproses admin Umum',
      '<div class="pick"><b>' + esc(r.nama) + '</b>' + esc(rentang(q.dari, q.sampai)) + '<br>Jam ' + esc(q.mulai) + '–' + esc(q.selesai) + (q.dari !== q.sampai ? ' setiap hari' : '') +
      '<br><button type="button" class="sec" id="f_ubah">Ubah ruang / tanggal</button></div>' +
      '<input type="hidden" name="ruang" value="' + esc(r.nama) + '"><input type="hidden" name="tanggal" value="' + q.dari + '"><input type="hidden" name="sampai" value="' + q.sampai + '">' +
      '<input type="hidden" name="mulai" value="' + q.mulai + '"><input type="hidden" name="selesai" value="' + q.selesai + '">' +
      namaField() +
      '<div class="fsec">Acara</div>' +
      '<label for="f_a">Nama acara / keperluan</label><input id="f_a" name="acara" required data-l="Acara" placeholder="mis. Rapat koordinasi bulanan">' +
      '<label for="f_p">Jumlah peserta / tamu' + (r.kapasitas ? ' (kapasitas ' + esc(r.kapasitas) + ')' : '') + '</label><input id="f_p" name="peserta" type="number" min="1" inputmode="numeric" required data-l="Jumlah peserta">' +
      '<div class="fsec">Konsumsi</div>' +
      chips('konsumsi', 'radio', ['Tidak ada', 'Disiapkan Umum', 'Dari eksternal'], 'Tidak ada') +
      '<div id="f_menuBox" class="hidden"><label>Jenis konsumsi (boleh lebih dari satu)</label>' + chips('menu', 'checkbox', ['Kopi/Teh', 'Snack', 'Makan']) + '</div>' +
      '<div class="fsec">Tata letak & perlengkapan</div>' +
      chips('tataLetak', 'radio', ['Meja rapat', 'U-shape', 'Melingkar', 'Kelas', 'Teater + panggung']) +
      '<label>Perlengkapan (opsional)</label>' + chips('perlengkapan', 'checkbox', ['TV / proyektor', 'Sound & mic', 'Zoom / vicon', 'Backdrop / banner']) +
      '<label for="f_c">Catatan (opsional)</label><textarea id="f_c" name="catatan" placeholder="mis. makan siang 25 kotak, 2 peserta vegetarian"></textarea>',
      async d => {
        if (!d.tataLetak) throw new Error('Pilih tata letak ruangan.');
        if (d.konsumsi !== 'Tidak ada' && !d.menu) throw new Error('Pilih jenis konsumsi: kopi/teh, snack, dan/atau makan.');
        if (d.konsumsi === 'Tidak ada') d.menu = '';
        const res = await APP.call('ruangBook', [d]);
        if (isGuest() && res && res.id) addGuestId(res.id);
        toast('Permintaan terkirim · menunggu persetujuan Umum', 3500); cekRuang();
      });
    $('f_ubah').addEventListener('click', closeForm);
    $('fForm').querySelectorAll('input[name="konsumsi"]').forEach(el => el.addEventListener('change', () => {
      $('f_menuBox').classList.toggle('hidden', $('fForm').querySelector('input[name="konsumsi"]:checked').value === 'Tidak ada');
    }));
  }
  $('rList').addEventListener('click', async e => {
    const p = e.target.closest('[data-pesan]'); if (p) return formRuang(RU.ruang[p.dataset.pesan]);
    const pr = e.target.closest('[data-proses]'); if (pr) return formStatus('ruang', pr.dataset.proses, ['Disetujui', 'Ditolak'], false);
    const b = e.target.closest('[data-batal]'); if (!b) return;
    if (!confirm('Batalkan peminjaman ruang ini?')) return;
    b.disabled = true;
    try { await APP.call('ruangBatal', [b.dataset.batal]); toast('Peminjaman dibatalkan'); cekRuang(); }
    catch (err) { toast(err.message); b.disabled = false; }
  });

  // ---------- proses admin (BBM / SPPD) ----------
  function formStatus(modul, id, opsi, kupon) {
    openForm('Proses pengajuan', id,
      '<label for="f_st">Status</label><select id="f_st" name="status">' + opsi.map(o => '<option>' + o + '</option>').join('') + '</select>' +
      (kupon ? '<label for="f_kp">No. kupon (bila disetujui)</label><input id="f_kp" name="kupon" placeholder="mis. KB-0123">' : '') +
      '<label for="f_ct">Catatan (opsional)</label><input id="f_ct" name="catatan">',
      async d => { await APP.call('setStatus', [Object.assign({ modul: modul, id: id }, d)]); toast('Status diperbarui'); renderActive(); });
  }

  // ---------- BBM ----------
  let BB = [];
  async function renderBbm() {
    $('bInfo').textContent = isAdmin() ? 'Semua pengajuan (admin)' : 'Riwayat pengajuan ' + ((LOGIN && LOGIN.nama) || 'saya');
    $('bList').innerHTML = '<div class="empty">Memuat…</div>';
    try { BB = await APP.call('bbmList', []); } catch (e) { $('bList').innerHTML = errBox(e); return; }
    $('bList').innerHTML = BB.length ? BB.map(r =>
      '<div class="it"><div class="m"><b>' + esc(r.jenis) + ' · ' + esc(r.liter) + ' L · ' + esc(r.nopol) + '</b><small>' + (isAdmin() || !isMine(r) ? esc(r.nama) + ' · ' : '') + esc(tgl(r.waktu)) + '</small>' +
      '<div class="x">' + esc(r.keperluan) + (r.kupon ? ' · <b>Kupon ' + esc(r.kupon) + '</b>' : '') + (r.catatan ? ' · ' + esc(r.catatan) : '') + '</div>' +
      (r.km || r.foto ? '<div class="x">' + (r.km ? 'KM ' + esc(Number(r.km).toLocaleString('id-ID')) : '') + (/^https:\/\//.test(r.foto || '') ? ' · <a href="' + esc(r.foto) + '" target="_blank" rel="noopener">📷 Foto KM</a>' : '') + '</div>' : '') +
      (isAdmin() && r.status === 'Menunggu' ? '<div class="acts"><button type="button" data-st="' + esc(r.id) + '">Proses</button></div>' : '') + '</div>' + badge(r.status) + '</div>').join('')
      : '<div class="empty">Belum ada pengajuan kupon BBM.</div>';
  }
  // ---- kamera dalam aplikasi: foto KM hanya dari kamera langsung (tanpa galeri), diberi cap waktu ----
  let camStream = null, kmFoto = null;
  async function bukaKamera() {
    $('camMsg').textContent = 'Memulai kamera…'; $('camShot').disabled = true;
    $('camView').classList.remove('hidden'); document.body.style.overflow = 'hidden';
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Browser ini tidak mendukung kamera. Buka aplikasi di Chrome HP.');
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      $('camVid').srcObject = camStream; await $('camVid').play();
      $('camMsg').textContent = 'Arahkan ke angka KM / odometer, pastikan terbaca jelas.'; $('camShot').disabled = false;
    } catch (e) {
      $('camMsg').textContent = /Permission|NotAllowed/i.test(e.name + e.message) ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser.' : (e.message || 'Kamera tidak bisa dibuka.');
    }
  }
  function tutupKamera() {
    if (camStream) camStream.getTracks().forEach(t => t.stop()); camStream = null;
    $('camVid').srcObject = null; $('camView').classList.add('hidden');
    if ($('fSheet').classList.contains('hidden')) document.body.style.overflow = '';
  }
  function ambilFoto() {
    const v = $('camVid'); if (!v.videoWidth) return;
    const sk = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas'); c.width = Math.round(v.videoWidth * sk); c.height = Math.round(v.videoHeight * sk);
    const g = c.getContext('2d'); g.drawImage(v, 0, 0, c.width, c.height);
    // cap: nama, waktu & nopol, agar foto tidak bisa dipakai ulang
    const d = new Date(), fs = Math.max(14, Math.round(c.width / 40));
    const cap = [(LOGIN && LOGIN.nama) || '', HARI[d.getDay()] + ' ' + tgl(ymd(d)) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' WITA', ($('f_n') && $('f_n').value.toUpperCase()) || ''].filter(String).join(' · ');
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, c.height - fs * 2, c.width, fs * 2);
    g.fillStyle = '#ffd400'; g.font = '700 ' + fs + 'px sans-serif'; g.textBaseline = 'middle'; g.fillText(cap, fs * .6, c.height - fs);
    const url = c.toDataURL('image/jpeg', .8);
    kmFoto = { b64: url.split(',')[1], waktu: Date.now() };
    $('kmImg').src = url; $('kmImg').classList.remove('hidden'); $('kmBtn').textContent = '📷 Ulangi foto'; $('kmHint').textContent = 'Foto diambil ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + '. Pastikan angka KM terbaca.';
    tutupKamera();
  }
  $('camShot').addEventListener('click', ambilFoto);
  $('camClose').addEventListener('click', tutupKamera);

  $('bBaru').addEventListener('click', () => {
    kmFoto = null;
    openForm('Ajukan kupon BBM', 'Kendaraan dinas',
      '<label for="f_n">Nomor polisi</label><input id="f_n" name="nopol" required data-l="Nomor polisi" placeholder="DR 1234 AB" autocapitalize="characters">' +
      '<div class="two"><div><label for="f_j">Jenis BBM</label><select id="f_j" name="jenis"><option>Pertalite</option><option>Pertamax</option><option>Dexlite</option><option>Pertamina Dex</option><option>Solar</option></select></div>' +
      '<div><label for="f_l">Liter</label><input id="f_l" name="liter" type="number" min="1" inputmode="numeric" required data-l="Liter"></div></div>' +
      '<div class="fsec">KM / odometer hari ini</div>' +
      '<label for="f_km">Angka KM</label><input id="f_km" name="km" type="number" min="1" inputmode="numeric" required data-l="Angka KM" placeholder="mis. 45210">' +
      '<label>Foto KM / MID (wajib, langsung dari kamera)</label>' +
      '<div class="kmBox"><img id="kmImg" class="hidden" alt="Foto KM"><button type="button" class="sec" id="kmBtn">📷 Ambil foto KM</button>' +
      '<div class="hint" id="kmHint">Foto dari galeri tidak bisa dipakai. Foto diberi cap nama & waktu otomatis.</div></div>' +
      '<label for="f_k">Keperluan</label><textarea id="f_k" name="keperluan" required data-l="Keperluan" placeholder="Tujuan perjalanan / kegiatan"></textarea>',
      async d => {
        if (!(Number(d.liter) > 0)) throw new Error('Jumlah liter tidak valid.');
        if (!kmFoto) throw new Error('Ambil foto KM / odometer dulu.');
        if (Date.now() - kmFoto.waktu > 30 * 60 * 1000) { kmFoto = null; throw new Error('Foto KM lebih dari 30 menit. Ambil ulang foto.'); }
        d.foto = { b64: kmFoto.b64 };
        await APP.call('bbmAdd', [d]); kmFoto = null; toast('Pengajuan kupon terkirim'); renderBbm();
      });
    $('kmBtn').addEventListener('click', bukaKamera);
  });
  $('btnReloadB').addEventListener('click', renderBbm);
  $('bList').addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (b) formStatus('bbm', b.dataset.st, ['Disetujui', 'Ditolak'], true); });

  // ---------- SPPD ----------
  let SP = [];
  const MAX_MB = 4;
  const bacaFile = f => new Promise((ok, no) => {
    if (f.size > MAX_MB * 1024 * 1024) return no(new Error(f.name + ' lebih dari ' + MAX_MB + ' MB.'));
    const r = new FileReader();
    r.onload = () => ok({ name: f.name, type: f.type, b64: String(r.result).split(',')[1] });
    r.onerror = () => no(new Error('Gagal membaca ' + f.name)); r.readAsDataURL(f);
  });
  async function renderSppd() {
    $('sInfo').textContent = isAdmin() ? 'Semua laporan (admin)' : 'Laporan ' + ((LOGIN && LOGIN.nama) || 'saya');
    $('sList').innerHTML = '<div class="empty">Memuat…</div>';
    try { SP = await APP.call('sppdList', []); } catch (e) { $('sList').innerHTML = errBox(e); return; }
    $('sList').innerHTML = SP.length ? SP.map(r => {
      const lk = String(r.lampiran || '').split('\n').filter(Boolean);
      return '<div class="it"><div class="m"><b>' + esc(r.tujuan) + '</b><small>' + (isAdmin() || !isMine(r) ? esc(r.nama) + ' · ' : '') + esc(r.no) + ' · ' + esc(tgl(r.berangkat)) + ' – ' + esc(tgl(r.pulang)) + '</small>' +
        '<div class="x">' + esc(r.laporan) + (r.catatan ? ' · ' + esc(r.catatan) : '') + '</div>' +
        (lk.length ? '<div class="x">' + lk.map((u, i) => /^https:\/\//.test(u) ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">📎 Lampiran ' + (i + 1) + '</a>' : esc(u)).join(' · ') + '</div>' : '') +
        (isAdmin() && r.status === 'Menunggu' ? '<div class="acts"><button type="button" data-st="' + esc(r.id) + '">Proses</button></div>' : '') + '</div>' + badge(r.status) + '</div>';
    }).join('') : '<div class="empty">Belum ada laporan SPPD.</div>';
  }
  $('sBaru').addEventListener('click', () => {
    openForm('Laporan SPPD', 'Perjalanan dinas', 
      '<label for="f_no">Nomor SPPD</label><input id="f_no" name="no" required data-l="Nomor SPPD" placeholder="mis. 012/SPPD/UPKL/2026">' +
      '<label for="f_tj">Tujuan</label><input id="f_tj" name="tujuan" required data-l="Tujuan" placeholder="Kota / unit tujuan">' +
      '<div class="two"><div><label for="f_b">Berangkat</label><input id="f_b" name="berangkat" type="date" required data-l="Tanggal berangkat"></div>' +
      '<div><label for="f_pl">Pulang</label><input id="f_pl" name="pulang" type="date" required data-l="Tanggal pulang"></div></div>' +
      '<label for="f_lp">Ringkasan hasil perjalanan</label><textarea id="f_lp" name="laporan" required data-l="Ringkasan"></textarea>' +
      '<label for="f_f">Lampiran: tiket, nota, foto (maks. 5 file, ' + MAX_MB + ' MB/file)</label><input id="f_f" type="file" multiple accept="image/*,application/pdf">' +
      '<div class="files" id="f_fl"></div>',
      async d => {
        if (d.pulang < d.berangkat) throw new Error('Tanggal pulang sebelum tanggal berangkat.');
        d.files = await Promise.all([...$('f_f').files].slice(0, 5).map(bacaFile));
        await APP.call('sppdAdd', [d]); toast('Laporan SPPD terkirim'); renderSppd();
      });
    $('f_f').addEventListener('change', () => { $('f_fl').textContent = [...$('f_f').files].slice(0, 5).map(f => f.name).join(', '); });
  });
  $('btnReloadS').addEventListener('click', renderSppd);
  $('sList').addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (b) formStatus('sppd', b.dataset.st, ['Diterima', 'Perlu revisi'], false); });

  // ---------- PEGAWAI: nama, unit, jabatan, foto ----------
  const fotoUrl = (id, w) => 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (w || 200);
  const inisial = n => esc(String(n || '?').trim().charAt(0));
  let PG = [];
  async function renderPegawai() {
    $('pList').innerHTML = '<div class="empty">Memuat…</div>';
    try { PG = await APP.call('pegawai', []); } catch (e) { $('pList').innerHTML = errBox(e); return; }
    $('pInfo').textContent = PG.length + ' pegawai · per unit';
    const grup = {};
    PG.forEach((p, i) => { p.i = i; (grup[p.unit] = grup[p.unit] || []).push(p); });
    const urut = Object.keys(grup).sort((a, b) => (a === 'UPK LOMBOK' ? -1 : b === 'UPK LOMBOK' ? 1 : a.localeCompare(b)));
    $('pList').innerHTML = urut.map(g => '<div class="grp">' + esc(g) + ' · ' + grup[g].length + '</div>' +
      grup[g].map(p => '<div class="it pg" data-i="' + p.i + '"><div class="ava">' +
        (p.foto ? '<img loading="lazy" src="' + esc(fotoUrl(p.foto, 120)) + '" alt="" referrerpolicy="no-referrer" data-ini="' + inisial(p.nama) + '">' : inisial(p.nama)) +
        '</div><div class="m"><b>' + esc(p.nama) + '</b><small class="u">' + esc(p.unit) + '</small><small>' + esc(p.jabatan) + '</small></div></div>').join('')).join('')
      || '<div class="empty">Belum ada data di sheet Dapeg.</div>';
  }
  $('btnReloadP').addEventListener('click', renderPegawai);
  // foto gagal dimuat (belum dibagikan / terhapus) -> tampilkan huruf depan nama
  $('pList').addEventListener('error', e => { const im = e.target; if (im.tagName === 'IMG') im.replaceWith(document.createTextNode(im.dataset.ini || '?')); }, true);
  $('pList').addEventListener('click', e => {
    const it = e.target.closest('.pg'); if (!it) return;
    const p = PG[it.dataset.i];
    $('pvImg').src = p.foto ? fotoUrl(p.foto, 600) : 'icon-512.png';
    $('pvNama').textContent = p.nama; $('pvUnit').textContent = p.unit; $('pvJab').textContent = p.jabatan;
    $('pv').classList.remove('hidden');
  });
  $('pvClose').addEventListener('click', () => $('pv').classList.add('hidden'));
  $('pv').addEventListener('click', e => { if (e.target.id === 'pv') $('pv').classList.add('hidden'); });

  // ---------- LOGIN ----------
  function showLogin(msg) { $('login').classList.remove('hidden'); $('loginMsg').textContent = msg || ''; $('pinIn').value = ''; setTimeout(() => $('pinIn').focus(), 100); }
  async function doLogin() {
    const pin = $('pinIn').value.trim(); if (!pin) { $('loginMsg').textContent = 'Isi NIP dulu, atau pilih Masuk sebagai GUEST.'; return; }
    masuk(pin);
  }
  async function masuk(pin) {
    $('btnLogin').disabled = true; $('loginMsg').className = 'msg'; $('loginMsg').textContent = 'Memeriksa…';
    try {
      const r = await APP.call('infoApp', [], pin);
      LS.set('umum-pin', pin);
      $('login').classList.add('hidden');
      afterLogin(r);
      go(r.login && r.login.mode === 'guest' ? 'ruang' : 'home');
    } catch (e) { $('loginMsg').className = 'msg err'; $('loginMsg').textContent = e.offline ? 'Tidak ada sinyal. Login butuh internet.' : e.message; }
    $('btnLogin').disabled = false;
  }
  function afterLogin(r) {
    if (r && r.login) { LOGIN = r.login; LS.set('umum-login', JSON.stringify(r.login)); }
    renderActive();
  }
  APP.onPinInvalid = () => { LS.del('umum-pin'); LS.del('umum-login'); LOGIN = null; showLogin('NIP tidak terdaftar lagi (mutasi?). Masukkan NIP terbaru atau pilih GUEST.'); };
  $('btnLogin').addEventListener('click', doLogin);
  $('btnGuest').addEventListener('click', () => masuk('GUEST'));
  function keluar() { LS.del('umum-pin'); LS.del('umum-login'); LOGIN = null; $('menu').classList.add('hidden'); showLogin(''); }
  $('lockLogin').addEventListener('click', keluar);
  $('lockRuang').addEventListener('click', () => go('ruang'));
  $('pinIn').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  // ---------- menu ----------
  $('btnMenu').addEventListener('click', e => {
    e.stopPropagation();
    const siapa = LOGIN ? (LOGIN.mode === 'nip' ? esc(LOGIN.nama) + ' · NIP ' + esc(LOGIN.nip) + (isAdmin() ? ' · <b>admin Umum</b>' : '') + '<br>' + esc(LOGIN.unit || '') : 'Masuk sebagai <b>GUEST</b>') : '';
    $('aboutTxt').innerHTML = 'Aplikasi v' + APP_VERSION + ' · ID perangkat <b>app-' + esc(APP.device()) + '</b><br>' + siapa + '<br>© Han with Claude🤖✨';
    $('menu').classList.toggle('hidden');
  });
  document.addEventListener('click', e => { if (!$('menu').contains(e.target)) $('menu').classList.add('hidden'); });
  $('btnRefresh').addEventListener('click', () => { renderActive(); toast('Memuat ulang…', 1200); });
  $('mReload').addEventListener('click', () => { $('menu').classList.add('hidden'); renderActive(); });
  $('mLogout').addEventListener('click', () => {
    if (!confirm('Keluar dari aplikasi di HP ini? NIP perlu dimasukkan lagi.')) return;
    keluar();
  });
  // pasang ke layar utama (Android/Chrome)
  let installEvt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const terpasang = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const IOS_TXT = 'iPhone/iPad: buka di Safari → ketuk tombol Bagikan (kotak panah ke atas) → "Tambahkan ke Layar Utama".';
  function updInstall() {
    const bisa = !terpasang() && (!!installEvt || isIOS);
    ['hInstall', 'lInstall'].forEach(id => {
      const el = $(id); el.classList.toggle('hidden', !bisa); el.classList.toggle('ios', isIOS && !installEvt);
      if (isIOS && !installEvt) el.querySelector('.instTxt').textContent = IOS_TXT;
    });
    $('mInstall').classList.toggle('hidden', !bisa);
  }
  async function pasang() {
    $('menu').classList.add('hidden');
    if (installEvt) {
      installEvt.prompt();
      try { await installEvt.userChoice; } catch (e) {}
      installEvt = null; updInstall();
    } else if (isIOS) toast(IOS_TXT, 7000);
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; updInstall(); });
  window.addEventListener('appinstalled', () => { installEvt = null; updInstall(); toast('Aplikasi terpasang di layar utama'); });
  document.querySelectorAll('.instBtn').forEach(b => b.addEventListener('click', pasang));
  $('mInstall').addEventListener('click', pasang);
  updInstall();

  // ---------- pembaruan aplikasi (service worker) ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      const tawarkan = w => { if (!w) return; $('updBar').classList.remove('hidden'); $('btnUpd').onclick = () => w.postMessage('skip'); };
      if (reg.waiting && navigator.serviceWorker.controller) tawarkan(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) tawarkan(w); });
      });
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    }).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
  }

  // ---------- mulai ----------
  if (APP.demo()) $('demoBar').classList.remove('hidden');
  try { LOGIN = JSON.parse(LS.get('umum-login', 'null')); } catch (e) { LOGIN = null; }
  go(isGuest() ? 'ruang' : 'home');   // aplikasi selalu dibuka di Home
  if (!APP.pin()) showLogin('');
  else { APP.call('infoApp').then(afterLogin).catch(() => {}); }
})();
