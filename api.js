// Penghubung aplikasi -> server (Apps Script doPost). Sama seperti aplikasi Aset UPKL.
(function () {
  const LS = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const APP = window.APP = window.APP || {};
  APP.pin = () => LS('umum-pin');
  APP.device = () => {
    let d = LS('umum-device');
    if (!d) {
      const abc = 'abcdefghijkmnpqrstuvwxyz23456789';
      d = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => abc[b % 32]).join('');
      try { localStorage.setItem('umum-device', d); } catch (e) {}
    }
    return d;
  };
  APP.demo = () => !((window.CONFIG && CONFIG.API_URL) || '');
  function offlineErr() { const e = new Error('Tidak ada sinyal / internet.'); e.offline = true; return e; }
  APP.call = async function (fn, args, pinOverride) {
    const pin = pinOverride || APP.pin();
    if (!pin) throw new Error('Belum login.');
    if (APP.demo()) return APP.mock(fn, args || [], pin);
    const url = CONFIG.API_URL;
    if (!/^https:\/\/script\.google\.com\//.test(url)) throw new Error('API_URL belum diisi dengan benar di config.js.');
    if (navigator.onLine === false) throw offlineErr();
    let res;
    try {
      res = await fetch(url, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fn: fn, args: args || [], pin: pin, device: APP.device() })
      });
    } catch (e) { throw offlineErr(); }
    let j;
    try { j = await res.json(); }
    catch (e) { throw new Error('Jawaban server tidak valid. Cek API_URL di config.js dan akses deployment harus "Siapa saja".'); }
    if (!j.ok) {
      if (/PIN salah|NIP tidak terdaftar/.test(j.error || '') && !pinOverride && APP.onPinInvalid) APP.onPinInvalid();
      throw new Error(j.error || 'Gagal.');
    }
    return j.data;
  };
})();
