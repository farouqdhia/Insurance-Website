document.addEventListener('DOMContentLoaded', () => {
  /* ----------------- Utilities ----------------- */
  const numberFormat = n => Number(n).toLocaleString('id-ID');
  const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const getAgeFromDOB = dob => {
    const b = new Date(dob);
    const diff = Date.now() - b.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  /* ----------------- Storage helpers ----------------- */
  const USERS_KEY = 'insura_users_v1';
  const SESSION_KEY = 'insura_session_v1';
  const HISTORY_KEY = 'insura_history_v1';

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function writeUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  function setSession(email) { localStorage.setItem(SESSION_KEY, email); }
  function getSession() { return localStorage.getItem(SESSION_KEY); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function writeHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

  /* ----------------- Mock product data ----------------- */
  const products = [];
  ['car', 'health', 'life'].forEach(type => {
    for (let i = 1; i <= 3; i++) {
      products.push({
        id: `${type}-${i}`,
        type,
        title: type === 'car' ? `Comfy Auto ${i}` : type === 'health' ? `HealthCare ${i}` : `LifeGuard ${i}`,
        price: type === 'car' ? 100000000 * (i + 1) : type === 'health' ? 500000 * (i + 1) : 1500000 * (i + 1),
        desc: type === 'car' ? 'Asuransi all-risk untuk kendaraan pribadi.' : 'Produk proteksi kesehatan/jiwa.', 
        benefits: ['Perlindungan dasar', 'Proses klaim cepat', 'Layanan 24/7']
      });
    }
  });

  /* ----------------- DOM refs ----------------- */
  const pages = document.querySelectorAll('.page');
  const productsList = document.getElementById('productsList');
  const authBox = document.getElementById('authBox');
  const navHistory = document.getElementById('nav-history');

  // forms / widgets
  const formSignup = document.getElementById('formSignup');
  const suMsg = document.getElementById('suMsg');
  const formLogin = document.getElementById('formLogin');
  const loginMsg = document.getElementById('loginMsg');

  const carCalcMsg = document.getElementById('carCalc');
  const healthCalcMsg = document.getElementById('healthCalc');
  const lifeCalcMsg = document.getElementById('lifeCalc');

  const checkoutSummary = document.getElementById('checkoutSummary');
  const historyList = document.getElementById('historyList');

  /* ----------------- SPA navigation ----------------- */
  function showPage(id) {
    pages.forEach(p => p.style.display = 'none');
    const el = document.getElementById(`page-${id}`);
    if (el) el.style.display = 'block';
    renderAuthBox();
  }

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const nav = el.dataset.nav;
      if (nav) showPage(nav);
    });
  });

  /* ----------------- Products rendering & detail ----------------- */
  function renderProducts(filter = 'all') {
    if (!productsList) return;
    productsList.innerHTML = '';
    let list = products.slice();
    if (filter !== 'all') list = list.filter(p => p.type === filter);
    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product card';
      card.innerHTML = `
        <div class="tag">${p.type.toUpperCase()}</div>
        <h4>${p.title}</h4>
        <div class="muted">Mulai dari Rp ${numberFormat(p.price)}</div>
      `;
      card.addEventListener('click', () => openDetail(p.id));
      productsList.appendChild(card);
    });
  }

  function openDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const title = document.getElementById('detailTitle');
    const type = document.getElementById('detailType');
    const desc = document.getElementById('detailDesc');
    const benefits = document.getElementById('detailBenefits');
    const price = document.getElementById('detailPrice');
    const photos = document.getElementById('detailPhotos');
    title.textContent = p.title;
    type.textContent = p.type === 'car' ? 'Asuransi Mobil' : p.type === 'health' ? 'Asuransi Kesehatan' : 'Asuransi Jiwa';
    desc.textContent = p.desc;
    benefits.innerHTML = '';
    p.benefits.forEach(b => { const li = document.createElement('li'); li.textContent = b; benefits.appendChild(li); });
    price.textContent = 'Rp ' + numberFormat(p.price);
    photos.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const img = document.createElement('img');
      img.src = `https://picsum.photos/seed/${p.id}${i}/400/300`;
      photos.appendChild(img);
    }

    const btnBuy = document.getElementById('btnBuy');
    btnBuy.onclick = () => {
      if (!getSession()) { alert('Anda harus login untuk membeli.'); showPage('login'); return; }
      if (p.type === 'car') prepareCarPurchase(p);
      else if (p.type === 'health') prepareHealthPurchase(p);
      else prepareLifePurchase(p);
    };

    showPage('detail');
  }

  /* ----------------- Auth UI & Actions ----------------- */
  function renderAuthBox() {
    const user = getSession();
    if (!authBox) return;
    if (user) {
      authBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>${user}</strong><div class="muted">Anda masuk</div></div>
          <div><button class="btn ghost" id="btnLogout">Logout</button></div>
        </div>
      `;
      const btnLogout = document.getElementById('btnLogout');
      if (btnLogout) btnLogout.addEventListener('click', () => { clearSession(); renderAuthBox(); showPage('home'); });
      if (navHistory) navHistory.style.display = 'inline-block';
    } else {
      authBox.innerHTML = `
        <div style="text-align:center">
          <div class="muted">Belum login</div>
          <div style="margin-top:10px">
            <button class="btn" data-nav="login">Login</button>
            <button class="btn ghost" data-nav="signup">Sign Up</button>
          </div>
        </div>
      `;
      // re-bind small nav buttons inside authBox
      authBox.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); showPage(el.dataset.nav); }));
      if (navHistory) navHistory.style.display = 'none';
    }
  }

  // Signup
  if (formSignup) {
    formSignup.addEventListener('submit', e => {
      e.preventDefault();
      const email = (document.getElementById('suEmail') || {}).value?.trim() || '';
      const pw = (document.getElementById('suPassword') || {}).value || '';
      const pw2 = (document.getElementById('suPassword2') || {}).value || '';
      const name = (document.getElementById('suFullname') || {}).value?.trim() || '';
      const phone = (document.getElementById('suPhone') || {}).value?.trim() || '';
      if (!suMsg) return;
      suMsg.textContent = ''; suMsg.className = 'muted';

      const users = readUsers();
      if (!email || !pw || !name || !phone) { suMsg.textContent = 'Email, kata sandi, nama, dan nomor handphone harus diisi.'; suMsg.className = 'error'; return; }
      if (!validateEmail(email)) { suMsg.textContent = 'Format email tidak valid.'; suMsg.className = 'error'; return; }
      if (pw.length < 8) { suMsg.textContent = 'Kata sandi minimal 8 karakter.'; suMsg.className = 'error'; return; }
      if (pw !== pw2) { suMsg.textContent = 'Kata sandi dan konfirmasi tidak sesuai.'; suMsg.className = 'error'; return; }
      if (name.length < 3 || name.length > 32 || /\d/.test(name)) { suMsg.textContent = 'Nama lengkap harus 3-32 karakter dan tidak boleh mengandung angka.'; suMsg.className = 'error'; return; }
      if (!/^08\d{8,14}$/.test(phone)) { suMsg.textContent = 'Nomor handphone harus diawali 08 dan panjang 10-16 digit.'; suMsg.className = 'error'; return; }
      if (users.find(u => u.email === email)) { suMsg.textContent = 'Email sudah terdaftar.'; suMsg.className = 'error'; return; }

      users.push({ email, password: pw, name, phone });
      writeUsers(users);
      suMsg.textContent = 'Pendaftaran berhasil. Silakan login.'; suMsg.className = 'success';
      if (location.pathname.endsWith('auth.html')) {
        setTimeout(()=>{ showPage('login'); }, 800);
      } else {
        setTimeout(()=>{ window.location.href = 'auth.html'; }, 800);
      }
    });
  }

  // Login
  if (formLogin) {
    formLogin.addEventListener('submit', e => {
      e.preventDefault();
      const email = (document.getElementById('loginEmail') || {}).value?.trim() || '';
      const pw = (document.getElementById('loginPassword') || {}).value || '';
      if (!loginMsg) return;
      loginMsg.textContent = ''; loginMsg.className = 'muted';
      if (!email || !pw) { loginMsg.textContent = 'Email dan kata sandi harus diisi.'; loginMsg.className = 'error'; return; }
      const users = readUsers();
      const u = users.find(x => x.email === email && x.password === pw);
      if (!u) { loginMsg.textContent = 'Email atau kata sandi salah.'; loginMsg.className = 'error'; return; }
      setSession(email); loginMsg.textContent = 'Login berhasil.'; loginMsg.className = 'success';
      if (location.pathname.endsWith('auth.html')) {
        setTimeout(()=> { window.location.href = 'home.html'; }, 600);
      } else
      renderAuthBox();
      setTimeout(() => showPage('home'), 500);
    });
  }

  /* ----------------- Purchase flows ----------------- */

  // CAR
  function prepareCarPurchase(product) {
    const titleEl = document.getElementById('carModelTitle');
    if (titleEl) titleEl.textContent = product.title;
    if (document.getElementById('formCar')) document.getElementById('formCar').reset();
    if (carCalcMsg) { carCalcMsg.textContent = ''; carCalcMsg.className = 'muted'; }

    document.getElementById('calcCar').onclick = () => {
      const brand = (document.getElementById('carBrand') || {}).value?.trim() || '';
      const typeModel = (document.getElementById('carType') || {}).value?.trim() || '';
      const year = Number((document.getElementById('carYear') || {}).value || 0);
      const price = Number((document.getElementById('carPrice') || {}).value || 0);
      const plate = (document.getElementById('carPlate') || {}).value?.trim() || '';
      const engine = (document.getElementById('carEngine') || {}).value?.trim() || '';
      const chassis = (document.getElementById('carChassis') || {}).value?.trim() || '';
      const owner = (document.getElementById('carOwner') || {}).value?.trim() || '';
      const front = (document.getElementById('imgFront') || {}).files?.[0];
      const back = (document.getElementById('imgBack') || {}).files?.[0];
      const left = (document.getElementById('imgLeft') || {}).files?.[0];
      const right = (document.getElementById('imgRight') || {}).files?.[0];
      const dash = (document.getElementById('imgDash') || {}).files?.[0];
      const engph = (document.getElementById('imgEnginePhoto') || {}).files?.[0];

      if (!carCalcMsg) return;
      if (!brand || !typeModel || !year || !price || !plate || !engine || !chassis || !owner) {
        carCalcMsg.textContent = 'Semua field harus diisi.'; carCalcMsg.className = 'error'; return;
      }
      if (!front || !back || !left || !right || !dash || !engph) {
        carCalcMsg.textContent = 'Semua foto wajib diunggah.'; carCalcMsg.className = 'error'; return;
      }

      const now = new Date().getFullYear();
      const age = now - year;
      const x = price;
      let premi = 0;
      if (age >= 0 && age <= 3) premi = 0.025 * x;
      else if (age > 3 && age <= 5) premi = x < 200000000 ? 0.04 * x : 0.03 * x;
      else if (age > 5) premi = 0.05 * x;

      carCalcMsg.innerHTML = `Umur mobil: ${age} tahun. Premi per tahun: <strong>Rp ${numberFormat(Math.round(premi))}</strong>.`;
      carCalcMsg.className = 'success';

      const current = {
        type: 'car', product: product.title, brand, typeModel, year, price: x, age, premi,
        plate, engine, chassis, owner, images: ['front','back','left','right','dash','engine']
      };
      sessionStorage.setItem('insura_currentPurchase', JSON.stringify(current));
    };

    document.getElementById('toCheckoutFromCar').onclick = () => {
      if (!getSession()) { alert('Anda harus login untuk checkout.'); showPage('login'); return; }
      if (!sessionStorage.getItem('insura_currentPurchase')) { alert('Hitung premi terlebih dahulu.'); return; }
      showCheckout();
    };

    showPage('buy-car');
  }

  // HEALTH
  function prepareHealthPurchase(product) {
    const titleEl = document.getElementById('healthTitle'); if (titleEl) titleEl.textContent = product.title;
    if (document.getElementById('formHealth')) document.getElementById('formHealth').reset();
    if (healthCalcMsg) { healthCalcMsg.textContent = ''; healthCalcMsg.className = 'muted'; }

    document.getElementById('calcHealth').onclick = () => {
      const name = (document.getElementById('hName') || {}).value?.trim() || '';
      const dob = (document.getElementById('hDOB') || {}).value || '';
      const job = (document.getElementById('hJob') || {}).value?.trim() || '';
      const smoke = Number((document.getElementById('hSmoke') || {}).value || 0);
      const hip = Number((document.getElementById('hHipert') || {}).value || 0);
      const diab = Number((document.getElementById('hDiab') || {}).value || 0);

      if (!healthCalcMsg) return;
      if (!name || !dob || !job) { healthCalcMsg.textContent = 'Semua field harus diisi.'; healthCalcMsg.className = 'error'; return; }

      const age = getAgeFromDOB(dob);
      const P = 2000000;
      let m = 0;
      if (age <= 20) m = 0.1;
      else if (age > 20 && age <= 35) m = 0.2;
      else if (age > 35 && age <= 50) m = 0.25;
      else m = 0.4;
      const annual = P + (m * P) + (smoke * 0.5 * P) + (hip * 0.4 * P) + (diab * 0.5 * P);
      healthCalcMsg.innerHTML = `Umur: ${age} tahun. Premi per tahun: <strong>Rp ${numberFormat(Math.round(annual))}</strong>`;
      healthCalcMsg.className = 'success';

      const current = { type: 'health', product: product.title, name, dob, job, smoke, hip, diab, age, annual };
      sessionStorage.setItem('insura_currentPurchase', JSON.stringify(current));
    };

    document.getElementById('toCheckoutFromHealth').onclick = () => {
      if (!getSession()) { alert('Anda harus login untuk checkout.'); showPage('login'); return; }
      if (!sessionStorage.getItem('insura_currentPurchase')) { alert('Hitung premi terlebih dahulu.'); return; }
      showCheckout();
    };

    showPage('buy-health');
  }

  // LIFE
  function prepareLifePurchase(product) {
    const titleEl = document.getElementById('lifeTitle'); if (titleEl) titleEl.textContent = product.title;
    if (document.getElementById('formLife')) document.getElementById('formLife').reset();
    if (lifeCalcMsg) { lifeCalcMsg.textContent = ''; lifeCalcMsg.className = 'muted'; }

    document.getElementById('calcLife').onclick = () => {
      const name = (document.getElementById('lName') || {}).value?.trim() || '';
      const dob = (document.getElementById('lDOB') || {}).value || '';
      const cov = Number((document.getElementById('lCoverage') || {}).value || 0);
      if (!lifeCalcMsg) return;
      if (!name || !dob || !cov) { lifeCalcMsg.textContent = 'Semua field harus diisi.'; lifeCalcMsg.className = 'error'; return; }

      const age = getAgeFromDOB(dob);
      let m = 0;
      if (age <= 30) m = 0.2;
      else if (age > 30 && age <= 50) m = 0.4;
      else m = 1.0;
      const monthly = ((m / 100) * cov) / 12;
      lifeCalcMsg.innerHTML = `Umur: ${age} tahun. Premi per bulan: <strong>Rp ${numberFormat(Math.round(monthly))}</strong> (m=${m}%)`;
      lifeCalcMsg.className = 'success';

      const current = { type: 'life', product: product.title, name, dob, cov, age, monthly, m };
      sessionStorage.setItem('insura_currentPurchase', JSON.stringify(current));
    };

    document.getElementById('toCheckoutFromLife').onclick = () => {
      if (!getSession()) { alert('Anda harus login untuk checkout.'); showPage('login'); return; }
      if (!sessionStorage.getItem('insura_currentPurchase')) { alert('Hitung premi terlebih dahulu.'); return; }
      showCheckout();
    };

    showPage('buy-life');
  }

  /* ----------------- Checkout & Payment (simulated) ----------------- */
  function showCheckout() {
    const cur = JSON.parse(sessionStorage.getItem('insura_currentPurchase') || 'null');
    if (!cur) { alert('Tidak ada pembelian aktif'); return; }
    let summ = '';
    if (cur.type === 'car') {
      summ = `Produk: ${cur.product}\nMerk/Jenis: ${cur.brand || cur.typeModel || '-'}\nTahun: ${cur.year}\nHarga mobil: Rp ${numberFormat(cur.price)}\nPremi per tahun: Rp ${numberFormat(Math.round(cur.premi || 0))}`;
    } else if (cur.type === 'health') {
      summ = `Produk: ${cur.product}\nNama: ${cur.name}\nUmur: ${cur.age}\nPremi per tahun: Rp ${numberFormat(Math.round(cur.annual || 0))}`;
    } else {
      summ = `Produk: ${cur.product}\nNama: ${cur.name}\nBesaran pertanggungan: Rp ${numberFormat(cur.cov || 0)}\nPremi per bulan: Rp ${numberFormat(Math.round(cur.monthly || 0))}`;
    }
    if (checkoutSummary) checkoutSummary.innerText = summ;
    showPage('checkout');
  }

  const payNowBtn = document.getElementById('payNow');
  if (payNowBtn) {
    payNowBtn.addEventListener('click', () => {
      const cur = JSON.parse(sessionStorage.getItem('insura_currentPurchase') || 'null');
      if (!cur) { alert('Tidak ada pembelian.'); return; }
      const hist = readHistory();
      const now = new Date().toISOString();
      const price = cur.premi ? Math.round(cur.premi) : cur.annual ? Math.round(cur.annual) : Math.round((cur.monthly || 0) * 12);
      const rec = { id: 'INV' + Date.now(), product: cur.product, type: cur.type, date: now, price, status: 'Lunas' };
      hist.unshift(rec); writeHistory(hist);
      sessionStorage.removeItem('insura_currentPurchase');
      alert('Pembayaran berhasil. Anda dialihkan ke History.');
      renderHistory();
      showPage('history');
    });
  }

  /* ----------------- History ----------------- */
  function renderHistory() {
    const list = readHistory();
    if (!historyList) return;
    if (!list.length) {
      historyList.innerHTML = '<div class="muted">Belum ada histori pembelian.</div>';
      return;
    }
    const rows = list.map(r => `
      <tr>
        <td>${r.product}</td>
        <td>${r.type}</td>
        <td>${new Date(r.date).toLocaleString()}</td>
        <td>Rp ${numberFormat(r.price)}</td>
        <td class="status-paid">${r.status}</td>
      </tr>
    `).join('');
    historyList.innerHTML = `<table><thead><tr><th>Produk</th><th>Jenis</th><th>Tanggal</th><th>Harga</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  /* ----------------- Small helpers / seed ----------------- */
  (function seedDemoUser() {
    const u = readUsers();
    if (!u.find(x => x.email === 'demo@insura.com')) {
      u.push({ email: 'demo@insura.com', password: 'password123', name: 'Demo User', phone: '081234567890' });
      writeUsers(u);
    }
  })();

  // header nav specific
  if (navHistory) navHistory.addEventListener('click', (e) => { e.preventDefault(); renderHistory(); showPage('history'); });

  // initial render
  renderProducts('all');
  renderAuthBox();
  showPage('home');
});
