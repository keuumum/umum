// MODE DEMO: dipakai hanya bila API_URL di config.js kosong. Data contoh di memori, tidak tersimpan.
// Fungsi & bentuk datanya sama dengan apps-script/Code.gs.
(function () {
  const APP = window.APP = window.APP || {};
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const now = () => { const d = new Date(); return ymd(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const T = ymd(new Date()), T1 = ymd(new Date(Date.now() + 864e5));
  const db = {
    // contoh berbentuk sheet Dapeg (nama, unit, jabatan); foto kosong di mode demo
    peg: [
      { nip: '8006200Z', nama: 'DODDY RIZQI', unit: 'UPK LOMBOK', jabatan: 'MANAGER UNIT PELAKSANA PEMBANGKITAN LOMBOK' },
      { nip: '8809008H2', nama: 'FATMA ULAN SARI', unit: 'SIE ADM DAN MUM', jabatan: 'OFFICER ADMINISTRASI DAN UMUM', admin: true },
      { nip: '7293084H', nama: 'ARSAD MOHAMAD', unit: 'BAG OP DAN HAR KIT', jabatan: 'SENIOR TECHNICIAN KINERJA OPERASI DAN PEMELIHARAAN PEMBANGKIT' },
      { nip: '7394052S', nama: 'DIDIK KURNIAWAN', unit: 'BAG OP DAN HAR KIT', jabatan: 'SENIOR TECHNICIAN KINERJA OPERASI DAN PEMELIHARAAN PEMBANGKIT' },
      { nip: '7393102H', nama: 'JOKO WAHYUDI', unit: 'BAG OP DAN HAR KIT', jabatan: 'SENIOR TECHNICIAN KINERJA OPERASI DAN PEMELIHARAAN PEMBANGKIT' }],
    ruang: [
      { nama: 'Ruang Rapat Utama', kapasitas: '20', lokasi: 'Gedung Kantor Lt. 2', fasilitas: 'TV, sound, AC' },
      { nama: 'Aula', kapasitas: '80', lokasi: 'Gedung Serbaguna', fasilitas: 'Panggung, sound, proyektor' }],
    pinjam: [
      { id: 'RU1', waktu: T + ' 07:10', nip: '7293084H', nama: 'ARSAD MOHAMAD', unit: 'BAG OP DAN HAR KIT', hp: '', ruang: 'Ruang Rapat Utama', tanggal: T, mulai: '09:00', selesai: '11:00', acara: 'Rapat evaluasi pembangkit', peserta: '12', konsumsi: 'Disiapkan Umum', menu: 'Kopi/Teh, Snack', tataLetak: 'Meja rapat', perlengkapan: 'TV / proyektor', catatan: '', status: 'Disetujui' },
      { id: 'RU2', waktu: T + ' 08:30', nip: 'GUEST', nama: 'Rahman', unit: 'Dinas ESDM NTB', hp: '081300000009', ruang: 'Aula', tanggal: T1, sampai: ymd(new Date(Date.now() + 3 * 864e5)), mulai: '08:00', selesai: '12:00', acara: 'Sosialisasi K3', peserta: '45', konsumsi: 'Dari eksternal', menu: 'Snack, Makan', tataLetak: 'Teater + panggung', perlengkapan: 'Sound & mic', catatan: '', status: 'Menunggu' }],
    bbm: [
      { id: 'BB1', waktu: T + ' 07:45', nip: '7293084H', nama: 'ARSAD MOHAMAD', unit: 'BAG OP DAN HAR KIT', nopol: 'DR 1234 AB', jenis: 'Dexlite', liter: '30', km: '45210', keperluan: 'Patroli lokasi PLTD', status: 'Menunggu', kupon: '', catatan: '' }],
    sppd: []
  };
  let n = 10;
  const aktif = s => !/batal|tolak/i.test(s);
  const kena = (r, a, b) => r.tanggal <= b && (r.sampai || r.tanggal) >= a;
  const wait = v => new Promise(r => setTimeout(() => r(JSON.parse(JSON.stringify(v))), 250));
  const fail = m => Promise.reject(new Error(m));
  APP.mock = function (fn, args, pin) {
    pin = String(pin).trim().toUpperCase();
    const p = db.peg.find(x => x.nip.toUpperCase() === pin);
    const u = pin === 'GUEST' ? { mode: 'guest', nip: '', nama: 'Tamu', unit: '', admin: false }
      : p ? { mode: 'nip', nip: p.nip, nama: p.nama, unit: p.unit, jabatan: p.jabatan, admin: !!p.admin } : null;
    if (!u) return fail('NIP tidak terdaftar. Periksa NIP Anda atau masuk sebagai GUEST.');
    if (u.mode === 'guest' && ['infoApp', 'home', 'ruangList', 'ruangBook', 'ruangStatus'].indexOf(fn) < 0) return fail('Khusus pegawai. Silakan masuk dengan NIP.');
    const d = args[0] || {}, own = r => u.nip && r.nip === u.nip;
    const out = (r, full) => {
      const boleh = full || u.admin || own(r);
      const o = { id: r.id, ruang: r.ruang, tanggal: r.tanggal, sampai: r.sampai || r.tanggal, mulai: r.mulai, selesai: r.selesai, status: r.status, milik: !!own(r) };
      if (u.mode !== 'guest' || boleh) Object.assign(o, { nama: r.nama, unit: r.unit, acara: r.acara, peserta: r.peserta });
      if (boleh) Object.assign(o, { hp: r.hp, konsumsi: r.konsumsi, menu: r.menu, tataLetak: r.tataLetak, perlengkapan: r.perlengkapan, catatan: r.catatan });
      return o;
    };
    switch (fn) {
      case 'infoApp': return wait({ login: u });
      case 'home': {
        const rec = u.mode === 'guest' ? [] : [].concat(
          db.pinjam.filter(own).map(r => ({ jenis: 'Ruang', judul: r.ruang + ' · ' + r.acara, sub: r.tanggal + ' · ' + r.mulai + '–' + r.selesai, status: r.status, waktu: r.waktu })),
          db.bbm.filter(own).map(r => ({ jenis: 'BBM', judul: 'Kupon ' + r.jenis + ' · ' + r.liter + ' L', sub: r.nopol, status: r.status, waktu: r.waktu })),
          db.sppd.filter(own).map(r => ({ jenis: 'SPPD', judul: r.tujuan, sub: r.no + ' · ' + r.berangkat, status: r.status, waktu: r.waktu })))
          .sort((a, b) => b.waktu.localeCompare(a.waktu)).slice(0, 5);
        return wait({ ruangHariIni: db.pinjam.filter(r => r.tanggal === T && aktif(r.status)).length,
          bbmMenunggu: db.bbm.filter(r => (u.admin || own(r)) && r.status === 'Menunggu').length, pegawai: db.peg.length, recent: rec });
      }
      case 'pegawai': return wait(db.peg.map(p => ({ nama: p.nama, unit: p.unit, jabatan: p.jabatan, foto: '' })));
      case 'ruangList': return wait({ ruang: db.ruang, booking: db.pinjam.filter(r => kena(r, args[0] || T, args[0] || T) && aktif(r.status)).map(r => out(r)).sort((a, b) => a.mulai.localeCompare(b.mulai)) });
      case 'ruangCek': {
        const q = d; if (q.dari < T) return fail('Tanggal sudah lewat.');
        return wait({ ruang: db.ruang.map(r => {
          const jadwal = db.pinjam.filter(b => b.ruang === r.nama && aktif(b.status) && kena(b, q.dari, q.sampai))
            .map(b => Object.assign(out(b), { bentrok: q.mulai < b.selesai && q.selesai > b.mulai }));
          return Object.assign({}, r, { tersedia: !jadwal.some(j => j.bentrok), jadwal: jadwal });
        }) });
      }
      case 'ruangStatus': return wait(db.pinjam.filter(r => (args[0] || []).indexOf(r.id) >= 0).map(r => out(r, true)));
      case 'ruangBook': {
        if (d.tanggal < T) return fail('Tanggal sudah lewat.');
        const b = db.pinjam.find(r => r.ruang === d.ruang && kena(r, d.tanggal, d.sampai || d.tanggal) && aktif(r.status) && d.mulai < r.selesai && d.selesai > r.mulai);
        if (b) return fail('Bentrok dengan jadwal ' + b.mulai + '–' + b.selesai + '. Cek ketersediaan lagi.');
        const g = u.mode === 'guest';
        db.pinjam.push(Object.assign({}, d, { id: 'RU' + (++n), waktu: now(), nip: g ? 'GUEST' : u.nip, nama: g ? d.nama : u.nama, unit: g ? d.unit : u.unit, status: 'Menunggu' }));
        return wait({ id: 'RU' + n });
      }
      case 'ruangBatal': { const r = db.pinjam.find(x => x.id === args[0]); if (r) r.status = 'Batal'; return wait(true); }
      case 'bbmList': return wait(db.bbm.filter(r => u.admin || own(r)).slice().reverse());
      case 'bbmAdd': if (!d.foto) return fail('Foto KM wajib.'); db.bbm.push(Object.assign({}, d, { foto: '',  nip: u.nip, nama: u.nama, unit: u.unit, nopol: String(d.nopol).toUpperCase(), id: 'BB' + (++n), waktu: now(), status: 'Menunggu', kupon: '', catatan: '' })); return wait({ id: 'BB' + n });
      case 'sppdList': return wait(db.sppd.filter(r => u.admin || own(r)).slice().reverse());
      case 'sppdAdd': db.sppd.push(Object.assign({}, d, { nip: u.nip, nama: u.nama, unit: u.unit, files: undefined, lampiran: (d.files || []).map(f => '(demo) ' + f.name).join('\n'), id: 'SP' + (++n), waktu: now(), status: 'Menunggu', catatan: '' })); return wait({ id: 'SP' + n });
      case 'setStatus': {
        if (!u.admin) return fail('Khusus admin Umum.');
        const r = ({ bbm: db.bbm, sppd: db.sppd, ruang: db.pinjam }[d.modul] || []).find(x => x.id === d.id);
        if (r) { r.status = d.status; r.catatan = d.catatan || ''; if (d.kupon) r.kupon = d.kupon; }
        return wait(true);
      }
    }
    return fail('Fungsi tidak dikenal: ' + fn);
  };
})();
