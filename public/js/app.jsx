// ── MOODMELT — FRONTEND ONLY ────────────────────────────────────────────
// No backend. No server. Works on Netlify/Vercel with custom domain.
// Orders → EmailJS | Analytics → Google Sheets webhook
// ────────────────────────────────────────────────────────────────────────

const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

// ── CONFIG ────────────────────────────────────────────────────────────────
const CONFIG = {
  emailjs: {
    publicKey:  'AXY0Z10Dk1h7V_RZP',
    serviceId:  'service_g9f0jef',
    templateId: 'template_tm3thr8',
    toEmail:    'moodmeltteam@gmail.com',
  },
  // !! REPLACE with your Google Apps Script webhook URL after you get it !!
  sheetsWebhook: 'https://script.google.com/macros/s/AKfycbx8PZOL4usrLmwjIb_CbdrOOlLMNTIys34ZF7zWX64oP0cMNxvYOiBXw3iAeXlDgaUM/exec',
  whatsapp: '923323503023',
  instagram: 'moodmelt_official',
};

// ── HARDCODED DATA ────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: 1, name: 'Classic Fudge', slug: 'classic-fudge-single', variant: 'Single Brownie', type: 'single', pieces: 1, price: 225, emoji: '🍫', badge: 'Bestseller', mood: ['happy','craving'], short_desc: 'Dense & rich. Pure fudge perfection.', description: 'Our iconic fudgy brownie. Dense, rich, melt-in-your-mouth — made fresh daily.', ingredients: 'Butter, premium cocoa, sugar, eggs, flour, vanilla extract, dark chocolate chips', is_featured: 1, images: [] },
  { id: 2, name: 'Classic Fudge Box', slug: 'classic-fudge-box4', variant: '4-Piece Box', type: 'box', pieces: 4, price: 900, emoji: '🎁', badge: 'Popular', mood: ['gifting','happy'], short_desc: '4 brownies, one glorious box.', description: 'Four hand-picked Classic Fudge brownies in our signature box. Perfect for sharing — or not.', ingredients: 'Butter, premium cocoa, sugar, eggs, flour, vanilla extract, dark chocolate chips', is_featured: 1, images: [] },
  { id: 3, name: 'Classic Fudge Box', slug: 'classic-fudge-box6', variant: '6-Piece Box', type: 'box', pieces: 6, price: 1350, emoji: '🎁', badge: 'Best Value', mood: ['gifting','happy'], short_desc: '6 brownies. Maximum mood melt.', description: 'Six Classic Fudge brownies in our premium gift box. The ultimate Moodmelt experience.', ingredients: 'Butter, premium cocoa, sugar, eggs, flour, vanilla extract, dark chocolate chips', is_featured: 1, images: [] },
  { id: 4, name: 'Choco Burst', slug: 'choco-burst-single', variant: 'Single Brownie', type: 'single', pieces: 1, price: 250, emoji: '🍪', badge: 'New Fave', mood: ['craving','stressed'], short_desc: 'Triple chocolate. Zero regrets.', description: 'An explosion of chocolate — gooey center, crispy top, triple-chocolate loaded.', ingredients: 'Butter, dark chocolate, milk chocolate chips, white chocolate drizzle, cocoa, sugar, eggs, flour, sea salt', is_featured: 1, images: [] },
  { id: 5, name: 'Choco Burst Box', slug: 'choco-burst-box4', variant: '4-Piece Box', type: 'box', pieces: 4, price: 1000, emoji: '🎁', badge: 'Fan Pick', mood: ['gifting','craving'], short_desc: '4 choco burst brownies in a box.', description: 'Four triple-chocolate Choco Burst brownies. Warning: highly addictive.', ingredients: 'Butter, dark chocolate, milk chocolate chips, white chocolate drizzle, cocoa, sugar, eggs, flour, sea salt', is_featured: 1, images: [] },
  { id: 6, name: 'Choco Burst Box', slug: 'choco-burst-box6', variant: '6-Piece Box', type: 'box', pieces: 6, price: 1500, emoji: '🎁', badge: 'Best Value', mood: ['gifting','craving','stressed'], short_desc: '6 choco burst brownies. Go big.', description: 'Six Choco Burst brownies for the chocolate lover who means business.', ingredients: 'Butter, dark chocolate, milk chocolate chips, white chocolate drizzle, cocoa, sugar, eggs, flour, sea salt', is_featured: 1, images: [] },
];

const REVIEWS = [
  { id: 1, customer_name: 'Sana M.', customer_city: 'Lahore', rating: 5, review_text: "Ordered the Classic Fudge box for Eid and everyone went crazy. Best brownie I've had in Pakistan." },
  { id: 2, customer_name: 'Ahmed K.', customer_city: 'Karachi', rating: 5, review_text: "Choco Burst is life. Ordered singles first, immediately reordered a 6-pack. Worth every rupee." },
  { id: 3, customer_name: 'Hira R.', customer_city: 'Islamabad', rating: 5, review_text: "Sent a box as a gift — the recipient called me immediately to ask where I got them from." },
  { id: 4, customer_name: 'Usman B.', customer_city: 'Faisalabad', rating: 5, review_text: "Arrives so fresh even with nationwide delivery. Packaging is perfect. My family is hooked." },
  { id: 5, customer_name: 'Zara T.', customer_city: 'Lahore', rating: 5, review_text: "Best brownies I've ever eaten. Period. Moodmelt needs to open a store." },
  { id: 6, customer_name: 'Bilal S.', customer_city: 'Multan', rating: 5, review_text: "Ordered twice this month. Classic Fudge hits different late at night. 100% homemade taste." },
];

const DELIVERY_ZONES = [
  { name: 'Lahore', cities: ['lahore'], charge: 150, days: '1-2 days' },
  { name: 'Karachi', cities: ['karachi'], charge: 250, days: '2-3 days' },
  { name: 'Islamabad / Rawalpindi', cities: ['islamabad','rawalpindi'], charge: 200, days: '2-3 days' },
  { name: 'Faisalabad', cities: ['faisalabad'], charge: 180, days: '2-3 days' },
  { name: 'Punjab (Other)', cities: ['multan','gujranwala','sialkot','sargodha','bahawalpur','sheikhupura'], charge: 200, days: '2-4 days' },
  { name: 'Rest of Pakistan', cities: ['all'], charge: 300, days: '3-5 days' },
];

const DISCOUNT_CODES = [
  { code: '1A2S3D', type: 'percentage', value: 10 },
  { code: '2A3S4D', type: 'percentage', value: 20 },
];

const FILTERS = [
  { id: 1, group_name: 'flavour', group_label: 'Flavour', value: 'classic-fudge', label: 'Classic Fudge' },
  { id: 2, group_name: 'flavour', group_label: 'Flavour', value: 'choco-burst', label: 'Choco Burst' },
  { id: 3, group_name: 'mood', group_label: 'Mood', value: 'happy', label: 'Happy' },
  { id: 4, group_name: 'mood', group_label: 'Mood', value: 'stressed', label: 'Stressed' },
  { id: 5, group_name: 'mood', group_label: 'Mood', value: 'gifting', label: 'Gifting' },
  { id: 6, group_name: 'mood', group_label: 'Mood', value: 'craving', label: 'Craving' },
  { id: 7, group_name: 'packaging', group_label: 'Packaging', value: 'single', label: 'Single Brownie' },
  { id: 8, group_name: 'packaging', group_label: 'Packaging', value: 'box4', label: '4-Piece Box' },
  { id: 9, group_name: 'packaging', group_label: 'Packaging', value: 'box6', label: '6-Piece Box' },
];

// ── DELIVERY LOOKUP ───────────────────────────────────────────────────────
function lookupDelivery(city) {
  const c = city.trim().toLowerCase();
  for (const zone of DELIVERY_ZONES) {
    if (zone.cities.includes('all')) continue;
    if (zone.cities.some(z => c.includes(z) || z.includes(c))) {
      return { charge: zone.charge, zone: zone.name, days: zone.days };
    }
  }
  return { charge: 300, zone: 'Rest of Pakistan', days: '3-5 days' };
}

// ── DISCOUNT VALIDATION ───────────────────────────────────────────────────
function validateDiscount(code) {
  const found = DISCOUNT_CODES.find(d => d.code === code.toUpperCase());
  if (!found) return { valid: false, error: 'Invalid discount code' };
  return { valid: true, value: found.value, code: found.code };
}

// ── GOOGLE SHEETS ANALYTICS ───────────────────────────────────────────────
function getSessionId() {
  let sid = sessionStorage.getItem('mm_sid');
  if (!sid) {
    sid = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    sessionStorage.setItem('mm_sid', sid);
  }
  return sid;
}

function trackToSheet(eventType, data = {}) {
  if (!CONFIG.sheetsWebhook || CONFIG.sheetsWebhook === 'PASTE_YOUR_WEBHOOK_URL_HERE') return;
  const payload = {
    session_id: getSessionId(),
    event: eventType,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...data,
  };
  fetch(CONFIG.sheetsWebhook, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

async function fetchAnalyticsReport() {
  if (!CONFIG.sheetsWebhook || CONFIG.sheetsWebhook === 'PASTE_YOUR_WEBHOOK_URL_HERE') {
    return 'Analytics not configured yet.';
  }
  try {
    const res = await fetch(CONFIG.sheetsWebhook + '?action=report&days=7');
    const data = await res.json();
    return data.report || 'No analytics data available yet.';
  } catch {
    return 'Could not fetch analytics at this time.';
  }
}

// ── EMAILJS ORDER EMAIL ───────────────────────────────────────────────────
async function sendOrderEmail(orderData, analyticsReport) {
  try {
    emailjs.init(CONFIG.emailjs.publicKey);
    const items = orderData.items.map(i => `${i.name} (${i.variant}) x${i.quantity} = Rs.${(i.price * i.quantity).toLocaleString()}`).join('\n');
    await emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, {
      to_email:         CONFIG.emailjs.toEmail,
      order_number:     orderData.order_number,
      customer_name:    orderData.customer_name,
      customer_phone:   orderData.customer_phone,
      customer_email:   orderData.customer_email || '—',
      address:          orderData.address,
      city:             orderData.city,
      notes:            orderData.notes || '—',
      items:            items,
      subtotal:         `Rs. ${orderData.subtotal.toLocaleString()}`,
      discount:         orderData.discount_amount > 0 ? `-Rs. ${orderData.discount_amount.toLocaleString()} (${orderData.discount_code})` : '—',
      delivery_charge:  `Rs. ${orderData.delivery_charge}`,
      total:            `Rs. ${orderData.total.toLocaleString()}`,
      payment_method:   orderData.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment',
      analytics_report: analyticsReport,
    });
    return true;
  } catch (e) {
    console.error('EmailJS error:', e);
    return false;
  }
}

// ── GENERATE ORDER NUMBER ─────────────────────────────────────────────────
function generateOrderNumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `MM-${date}-${rand}`;
}

// ── BUILD WHATSAPP URL ────────────────────────────────────────────────────
function buildWAUrl(order) {
  const lines = order.items.map(i => `• ${i.name} (${i.variant}) x${i.quantity} = Rs.${(i.price*i.quantity).toLocaleString()}`).join('\n');
  const text = `New Moodmelt Order #${order.order_number}\n\nCustomer: ${order.customer_name}\nPhone: ${order.customer_phone}\nAddress: ${order.address}, ${order.city}\nPayment: ${order.payment_method === 'cod' ? 'COD' : 'Online'}\n\nItems:\n${lines}\n\nTotal: Rs. ${order.total.toLocaleString()}\n\nPlease confirm!`;
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
}

// ── CART CONTEXT ──────────────────────────────────────────────────────────
const CartContext = createContext(null);

function CartProvider({ children }) {
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('mm_cart') || '[]'); } catch { return []; } });
  const [appliedDiscount, setAppliedDiscount] = useState(() => { try { return JSON.parse(localStorage.getItem('mm_discount') || 'null'); } catch { return null; } });
  const [cartOpen, setCartOpen] = useState(false);

  const saveCart = (c) => { setCart(c); localStorage.setItem('mm_cart', JSON.stringify(c)); };
  const saveDiscount = (d) => { setAppliedDiscount(d); localStorage.setItem('mm_discount', JSON.stringify(d)); };
  const clearDiscount = () => { setAppliedDiscount(null); localStorage.removeItem('mm_discount'); };
  const cartTotal = () => cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = () => cart.reduce((s, i) => s + i.quantity, 0);

  const validateMinOrder = () => {
    if (!cart.length) return { valid: false, reason: 'empty' };
    let singles = 0, boxes = 0;
    cart.forEach(i => { if (i.type === 'single') singles += i.quantity; else boxes += i.quantity * (i.pieces || 1); });
    if (singles === 0) return { valid: true };
    const total = singles + boxes;
    if (singles % 4 === 0 || singles % 6 === 0 || total % 4 === 0 || total % 6 === 0) return { valid: true };
    return { valid: false, reason: 'min_order' };
  };

  const addToCart = (product) => {
    const newCart = [...cart];
    const idx = newCart.findIndex(i => i.id === product.id);
    if (idx >= 0) newCart[idx] = { ...newCart[idx], quantity: newCart[idx].quantity + 1 };
    else newCart.push({ ...product, quantity: 1 });
    saveCart(newCart);
    setCartOpen(true);
    trackToSheet('add_to_cart', { product_name: product.name });
    document.querySelectorAll('.cart-btn').forEach(b => { b.classList.add('bounce'); setTimeout(() => b.classList.remove('bounce'), 580); });
  };

  const changeQty = (idx, d) => { const nc = [...cart]; nc[idx] = { ...nc[idx], quantity: nc[idx].quantity + d }; if (nc[idx].quantity <= 0) nc.splice(idx, 1); saveCart(nc); };
  const removeItem = (idx) => { const nc = [...cart]; nc.splice(idx, 1); saveCart(nc); };
  const clearCart = () => saveCart([]);

  return (
    <CartContext.Provider value={{ cart, cartOpen, setCartOpen, cartTotal, cartCount, validateMinOrder, addToCart, changeQty, removeItem, clearCart, appliedDiscount, saveDiscount, clearDiscount }}>
      {children}
    </CartContext.Provider>
  );
}

// ── ROUTER CONTEXT ────────────────────────────────────────────────────────
const RouterContext = createContext(null);

function RouterProvider({ children }) {
  const [path, setPath] = useState(window.location.pathname + window.location.search);
  const navigate = useCallback((to) => {
    document.body.classList.add('page-transition-out');
    setTimeout(() => { window.history.pushState({}, '', to); setPath(to); document.body.classList.remove('page-transition-out'); window.scrollTo(0, 0); }, 220);
  }, []);
  useEffect(() => { const fn = () => setPath(window.location.pathname + window.location.search); window.addEventListener('popstate', fn); return () => window.removeEventListener('popstate', fn); }, []);
  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

function useRouter() { return useContext(RouterContext); }
function useCart() { return useContext(CartContext); }

// ── TOAST ─────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = (msg) => { const id = Date.now(); setToasts(t => [...t, { id, msg }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600); };
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div id="toast-container">{toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}</div>
    </ToastContext.Provider>
  );
}
function useToast() { return useContext(ToastContext); }

// ── MICROANIMATIONS ───────────────────────────────────────────────────────
function useMoodRipple() {
  useEffect(() => {
    const handler = (e) => {
      const card = e.currentTarget;
      const r = document.createElement('span'); r.className = 'mood-ripple';
      const rect = card.getBoundingClientRect();
      r.style.left = (e.clientX - rect.left) + 'px'; r.style.top = (e.clientY - rect.top) + 'px';
      card.appendChild(r); setTimeout(() => r.remove(), 700);
    };
    const cards = document.querySelectorAll('.mood-card');
    cards.forEach(c => c.addEventListener('click', handler));
    return () => cards.forEach(c => c.removeEventListener('click', handler));
  });
}

function useHeadingLines() {
  useEffect(() => {
    const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('line-active'), 150); obs.unobserve(e.target); } }); }, { threshold: 0.4 });
    document.querySelectorAll('h1,h2,.detail-name').forEach(el => { el.classList.add('heading-line'); obs.observe(el); });
    return () => obs.disconnect();
  });
}

function useCardReveal(dep) {
  useEffect(() => {
    const obs = new IntersectionObserver(entries => { entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('card-visible'), i * 80); obs.unobserve(e.target); } }); }, { threshold: 0.1 });
    document.querySelectorAll('.product-card').forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, [dep]);
}

// ── SVGs ──────────────────────────────────────────────────────────────────
const CartSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const WASvg = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="white">
    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.415.641 4.68 1.763 6.64L2 30l7.574-1.738A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6c-2.244 0-4.34-.618-6.132-1.692l-.44-.262-4.496 1.03 1.07-4.372-.288-.46A11.554 11.554 0 014.4 16C4.4 9.593 9.593 4.4 16 4.4S27.6 9.593 27.6 16 22.407 27.6 16 27.6zm6.33-8.698c-.347-.174-2.053-1.013-2.373-1.128-.32-.116-.552-.174-.785.174-.232.347-.9 1.128-1.104 1.36-.203.232-.406.26-.753.087-.347-.174-1.464-.54-2.787-1.719-1.03-.918-1.725-2.05-1.928-2.398-.203-.347-.022-.535.152-.707.157-.156.347-.406.522-.609.174-.203.232-.347.347-.58.116-.231.058-.434-.029-.608-.087-.174-.785-1.893-1.075-2.592-.283-.682-.57-.59-.785-.6-.203-.01-.434-.012-.666-.012s-.609.087-.928.434c-.319.347-1.218 1.19-1.218 2.904s1.247 3.37 1.42 3.602c.174.232 2.453 3.746 5.944 5.252.832.358 1.481.572 1.987.733.834.265 1.594.228 2.194.138.67-.1 2.053-.84 2.343-1.651.29-.811.29-1.506.203-1.651-.087-.145-.319-.232-.667-.406z"/>
  </svg>
);

// ── WA LIGHTBOX ───────────────────────────────────────────────────────────
function WALightbox({ urls, startUrl, onClose }) {
  const startIdx = (() => { const i = urls.indexOf(startUrl); return i >= 0 ? i : 0; })();
  const [idx, setIdx] = React.useState(startIdx);
  const prev = () => setIdx(i => (i - 1 + urls.length) % urls.length);
  const next = () => setIdx(i => (i + 1) % urls.length);

  useEffect(() => {
    const h = (e) => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const arrowStyle = { position: 'fixed', top: '50%', transform: 'translateY(-50%)', width: '48px', height: '48px', background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '50%', fontSize: '1.8rem', color: '#6B4226', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 3010 };

  return (
    <div className="wa-lightbox open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {urls.length > 1 && <button style={{ ...arrowStyle, left: '20px' }} onClick={e => { e.stopPropagation(); prev(); }}>&#8249;</button>}
      <div className="wa-lb-inner">
        <button className="wa-lightbox-close" onClick={onClose}>✕</button>
        <img src={urls[idx]} alt="Customer review" style={{ cursor: 'zoom-in', maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain', display: 'block' }}
          onClick={e => { const s = e.currentTarget.style; s.transform = s.transform === 'scale(1.8)' ? '' : 'scale(1.8)'; s.cursor = s.transform ? 'zoom-out' : 'zoom-in'; }} />
        {urls.length > 1 && <div className="wa-lb-counter">{idx + 1} / {urls.length}</div>}
      </div>
      {urls.length > 1 && <button style={{ ...arrowStyle, right: '20px' }} onClick={e => { e.stopPropagation(); next(); }}>&#8250;</button>}
    </div>
  );
}

// ── NAVBAR ────────────────────────────────────────────────────────────────
function Navbar({ scrolled }) {
  const { cartCount, setCartOpen } = useCart();
  const { navigate, path } = useRouter();
  const [mobOpen, setMobOpen] = useState(false);
  const count = cartCount();

  const scrollTo = (id) => { setMobOpen(false); if (path !== '/') { navigate('/'); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 350); } else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <div className="navbar-inner">
            <a href="/" className="nav-logo" onClick={e => { e.preventDefault(); navigate('/'); }}><img src="/images/logo.png" alt="Moodmelt" /></a>
            <ul className="nav-links">
              <li><a href="/" className={path === '/' ? 'active' : ''} onClick={e => { e.preventDefault(); navigate('/'); }}>Home</a></li>
              <li><a href="/shop" className={path.startsWith('/shop') ? 'active' : ''} onClick={e => { e.preventDefault(); navigate('/shop'); }}>Shop</a></li>
              <li><a href="#story" onClick={e => { e.preventDefault(); scrollTo('story'); }}>Our Story</a></li>
              <li><a href="#reviews" onClick={e => { e.preventDefault(); scrollTo('reviews'); }}>Reviews</a></li>
              <li><a href="/contact" className={path === '/contact' ? 'active' : ''} onClick={e => { e.preventDefault(); navigate('/contact'); }}>Contact Us</a></li>
            </ul>
            <div className="nav-actions">
              <button className="cart-btn" onClick={() => setCartOpen(true)}>
                <CartSvg /><span className={`cart-count${count > 0 ? ' visible' : ''}`}>{count}</span>
              </button>
              <button className="hamburger" onClick={() => setMobOpen(true)}><span /><span /><span /></button>
            </div>
          </div>
        </div>
      </nav>
      <div className={`mob-overlay${mobOpen ? ' open' : ''}`} onClick={() => setMobOpen(false)} />
      <div className={`mob-menu${mobOpen ? ' open' : ''}`}>
        <button className="mob-close" onClick={() => setMobOpen(false)} />
        <ul className="mob-menu-links">
          <li><a href="/" onClick={e => { e.preventDefault(); setMobOpen(false); navigate('/'); }}>Home</a></li>
          <li><a href="/shop" onClick={e => { e.preventDefault(); setMobOpen(false); navigate('/shop'); }}>Shop</a></li>
          <li><a href="#story" onClick={e => { e.preventDefault(); scrollTo('story'); }}>Our Story</a></li>
          <li><a href="#reviews" onClick={e => { e.preventDefault(); scrollTo('reviews'); }}>Reviews</a></li>
          <li><a href="/contact" onClick={e => { e.preventDefault(); setMobOpen(false); navigate('/contact'); }}>Contact Us</a></li>
        </ul>
      </div>
    </>
  );
}

// ── CART DRAWER ───────────────────────────────────────────────────────────
function CartDrawer() {
  const { cart, cartOpen, setCartOpen, cartTotal, changeQty, removeItem, validateMinOrder } = useCart();
  const { navigate } = useRouter();
  const [minErr, setMinErr] = useState(false);

  const handleCheckout = () => {
    const v = validateMinOrder();
    if (v.reason === 'empty') return;
    if (!v.valid) { setMinErr(true); return; }
    setCartOpen(false); navigate('/checkout');
  };

  return (
    <>
      <div className={`cart-overlay${cartOpen ? ' open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-drawer${cartOpen ? ' open' : ''}`}>
        <div className="cart-head"><h3>Your Cart</h3><button className="close-cart" onClick={() => setCartOpen(false)} /></div>
        <div className="cart-body">
          {!cart.length ? (
            <div className="cart-empty-msg"><div className="cart-empty-icon" /><p style={{ color: 'var(--text-mid)', fontSize: '0.9rem' }}>Your cart is empty. Add some brownies!</p></div>
          ) : cart.map((item, i) => (
            <div className="cart-item" key={i}>
              <div className="c-item-thumb">{item.image ? <img src={item.image} alt={item.name} /> : (item.emoji || '🍫')}</div>
              <div className="c-item-info">
                <div className="c-item-name">{item.name}</div>
                <div className="c-item-var">{item.variant}</div>
                <div className="c-item-controls">
                  <button className="qty-btn" onClick={() => { changeQty(i, -1); setMinErr(false); }}>−</button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => changeQty(i, 1)}>+</button>
                  <button className="remove-btn" onClick={() => { removeItem(i); setMinErr(false); }}>✕ Remove</button>
                </div>
              </div>
              <div className="c-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="cart-foot">
            {minErr && <div className="min-order-err show">Add brownies in sets of 4 or 6 to proceed.</div>}
            <div className="cart-subtotal-row"><span>Subtotal</span><span>Rs. {cartTotal().toLocaleString()}</span></div>
            <p className="delivery-hint"><span style={{ color: '#1E8449', fontWeight: 600 }}>✓ Fixed delivery charge</span> — same price whether you order 1 or 10 boxes.</p>
            <button className="btn btn-dark btn-full" style={{ padding: '15px' }} onClick={handleCheckout}>Checkout →</button>
          </div>
        )}
      </div>
    </>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────
function Footer() {
  const { navigate } = useRouter();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo"><img src="/images/logo.png" alt="Moodmelt" /></div>
            <p className="footer-tagline">Handcrafted artisan brownies made with the finest imported cocoa. Baked fresh, delivered fudgy — nationwide across Pakistan.</p>
            <div className="footer-socials">
              <a href={`https://instagram.com/${CONFIG.instagram}`} target="_blank" className="soc-icon soc-instagram"><img src="/images/instagram.png" alt="Instagram" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /></a>
              <a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" className="soc-icon soc-whatsapp"><img src="/images/whatsapp.png" alt="WhatsApp" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /></a>
            </div>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>→ Home</a></li>
              <li><a href="/shop" onClick={e => { e.preventDefault(); navigate('/shop'); }}>→ Shop</a></li>
              <li><a href="#story" onClick={e => { e.preventDefault(); document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' }); }}>→ Our Story</a></li>
              <li><a href="/contact" onClick={e => { e.preventDefault(); navigate('/contact'); }}>→ Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul className="footer-links">
              <li><a href={`https://wa.me/${CONFIG.whatsapp}`}>→ WhatsApp Us</a></li>
              <li><a href={`https://instagram.com/${CONFIG.instagram}`} target="_blank">→ @{CONFIG.instagram}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Moodmelt. All rights reserved. Made with love in Pakistan.</p>
          <p>Made to melt your mood.</p>
        </div>
      </div>
    </footer>
  );
}

// ── WA FLOAT ──────────────────────────────────────────────────────────────
function WAFloat({ msg = 'Hi Moodmelt! I have a question' }) {
  return (
    <a href={`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" className="wa-float">
      <WASvg /><span className="wa-tip">Got a question?</span>
    </a>
  );
}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────
function ProductCard({ p, onAddToCart }) {
  const { navigate } = useRouter();
  const bc = p.badge === 'Most Popular' ? 'badge-popular' : p.badge === 'Best First Order' ? 'badge-first-order' : '';
  const perUnit = p.pieces > 1 ? <div className="pc-per-unit">Rs.{Math.round(p.price / p.pieces)} per brownie</div> : null;
  const moods = Array.isArray(p.mood) ? p.mood.join(',') : '';

  return (
    <div className="product-card" data-mood={moods} onClick={() => navigate(`/product/${p.slug}`)}>
      {p.badge && <div className={`pc-badge ${bc}`}>{p.badge}</div>}
      <div className="pc-img">
        {p.images && p.images.length ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : <span style={{ fontSize: '3.8rem' }}>{p.emoji || '🍫'}</span>}
      </div>
      <div className="pc-body">
        <div className="pc-stars">★★★★★ <span className="pc-rating-count">({Math.floor(Math.random() * 8) + 12})</span></div>
        <div className="pc-name">{p.name}</div>
        <div className="pc-desc">{p.variant} · {p.short_desc || ''}</div>
        <div className="pc-footer">
          <div><div className="pc-price"><span className="pc-price-from">Rs.</span>{p.price.toLocaleString()}</div>{perUnit}</div>
          <button className="pc-add" onClick={e => { e.stopPropagation(); e.currentTarget.classList.add('popped'); setTimeout(() => e.currentTarget.classList.remove('popped'), 500); onAddToCart && onAddToCart(p); }}>+</button>
        </div>
      </div>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────
function HomePage() {
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const showToast = useToast();
  const [slideIdx, setSlideIdx] = useState(0);
  const [rvModal, setRvModal] = useState(null);
  const [lbUrl, setLbUrl] = useState(null);
  const featured = PRODUCTS.filter(p => p.is_featured).slice(0, 3);

  useEffect(() => {
    trackToSheet('visit', { page: 'homepage' });
    const obs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('section-visible'); obs.unobserve(e.target); } }); }, { threshold: 0.05 });
    document.querySelectorAll('section, .trust-bar').forEach(s => { const r = s.getBoundingClientRect(); if (r.top < window.innerHeight) s.classList.add('section-visible'); else obs.observe(s); });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }); }, { threshold: 0.1 });
    document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('[data-counter]');
    const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (!e.isIntersecting) return; const el = e.target, tgt = parseInt(el.dataset.counter), sfx = el.dataset.suffix || ''; let cur = 0; const t = setInterval(() => { cur += tgt / 55; if (cur >= tgt) { el.textContent = tgt.toLocaleString() + sfx; clearInterval(t); } else el.textContent = Math.floor(cur).toLocaleString() + sfx; }, 22); obs.unobserve(el); }); }, { threshold: 0.6 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useMoodRipple();
  useHeadingLines();
  useCardReveal(featured);

  const doAddToCart = (p) => { addToCart({ id: `${p.id}-${p.slug}`, name: p.name, variant: p.variant, price: p.price, emoji: p.emoji, image: p.images?.[0] || null, type: p.type, pieces: p.pieces, slug: p.slug, productId: p.id }); showToast(`✓ ${p.name} added!`); };
  const goToMood = (mood) => navigate(`/shop?mood=${mood}`);

  const TRUST_BADGES = [
    { title: 'Freshly Baked Daily', sub: 'Never frozen, always fresh' },
    { title: '100% Homemade', sub: 'Artisan crafted with care' },
    { title: 'Delivered Fudgy', sub: 'Packed to stay perfect' },
    { title: 'Nationwide Delivery', sub: 'Across all of Pakistan' },
    { title: 'Finest Imported Cocoa', sub: 'Premium ingredients only' },
  ];

  return (
    <>
      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-glow-blob" />
        <div className="container">
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-badge-pill"><span className="hero-badge-dot" />Freshly Baked · Delivered Nationwide</div>
              <h1 className="hero-title">One Bite.<br /><em>Pure Mood Shift.</em></h1>
              <p className="hero-sub">Dense, fudgy brownies handcrafted with imported cocoa.<br />Baked fresh after every order. Delivered across Pakistan.</p>
              <div className="hero-ctas">
                <a href="/shop" className="btn btn-dark btn-lg" onClick={e => { e.preventDefault(); navigate('/shop'); }}>Order Now — Get Yours Today</a>
                <a href="#story" className="btn btn-outline btn-lg" onClick={e => { e.preventDefault(); document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' }); }}>Our Story</a>
              </div>
              <div className="hero-stats">
                <div><div className="stat-num" data-counter="100" data-suffix="+">0</div><div className="stat-label">Happy Customers</div></div>
                <div><div className="stat-num" data-counter="500" data-suffix="+">0</div><div className="stat-label">Brownies Delivered</div></div>
                <div><div className="stat-num">5</div><div className="stat-label">Avg Rating</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar">
        <div className="container">
          <div className="trust-inner">
            {TRUST_BADGES.map(b => (
              <div key={b.title} className="trust-item">
                <div><span className="trust-text-title">{b.title}</span><span className="trust-text-sub">{b.sub}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MOOD */}
      <section className="mood-section" id="mood">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="eyebrow reveal">Find Your Mood</span>
            <h2 className="reveal" style={{ color: 'var(--choc)' }}>There's a Brownie for Every Feeling</h2>
            <p className="section-sub reveal" style={{ margin: '10px auto 0', textAlign: 'center' }}>Pick your mood and we'll show you exactly what you need right now.</p>
            <div className="section-divider reveal" />
          </div>
          <div className="mood-grid reveal">
            {[
              { mood: 'happy', label: 'Happy', desc: 'Celebrate the moment', svg: <svg className="mood-icon-svg" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="22" stroke="#A47148" strokeWidth="2.5"/><path d="M19 32c2 4 6 7 9 7s7-3 9-7" stroke="#A47148" strokeWidth="2.5" strokeLinecap="round"/><circle cx="21" cy="24" r="2.5" fill="#A47148"/><circle cx="35" cy="24" r="2.5" fill="#A47148"/></svg> },
              { mood: 'stressed', label: 'Stressed', desc: 'You deserve this', svg: <svg className="mood-icon-svg" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="22" stroke="#A47148" strokeWidth="2.5"/><path d="M19 36c2-4 6-6 9-6s7 2 9 6" stroke="#A47148" strokeWidth="2.5" strokeLinecap="round"/><circle cx="21" cy="27" r="2" fill="#A47148"/><circle cx="35" cy="27" r="2" fill="#A47148"/></svg> },
              { mood: 'gifting', label: 'Gifting', desc: "Make someone's day", svg: <svg className="mood-icon-svg" viewBox="0 0 56 56" fill="none"><rect x="12" y="26" width="32" height="22" rx="2" stroke="#A47148" strokeWidth="2.5"/><rect x="10" y="18" width="36" height="10" rx="2" stroke="#A47148" strokeWidth="2.5"/><path d="M28 18v30" stroke="#A47148" strokeWidth="2.5"/><path d="M22 18c0-4 6-8 6-8s6 4 6 8" stroke="#A47148" strokeWidth="2.5" strokeLinecap="round"/></svg> },
              { mood: 'craving', label: 'Craving', desc: 'Midnight hunger? Same.', svg: <svg className="mood-icon-svg" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="22" stroke="#A47148" strokeWidth="2.5"/><path d="M20 30c0 0 2 6 8 6s8-6 8-6" stroke="#A47148" strokeWidth="2.5" strokeLinecap="round"/><circle cx="21" cy="24" r="2.5" fill="#A47148"/><circle cx="35" cy="24" r="2.5" fill="#A47148"/></svg> },
            ].map(({ mood, label, desc, svg }) => (
              <div key={mood} className="mood-card" data-mood={mood} onClick={() => goToMood(mood)}>
                <div className="mood-icon-wrap">{svg}</div>
                <div className="mood-name">{label}</div>
                <div className="mood-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products-section" id="products">
        <div className="container">
          <div className="sec-header">
            <div><span className="eyebrow">Our Menu</span><h2 className="choc-drip">The Brownies<br />Everyone Is Ordering</h2></div>
            <a href="/shop" className="btn btn-outline" onClick={e => { e.preventDefault(); navigate('/shop'); }}>See Full Menu →</a>
          </div>
          <div className="products-grid" id="home-grid">
            {featured.map(p => <ProductCard key={p.id} p={p} onAddToCart={doAddToCart} />)}
            <div className="product-card view-more-card" onClick={() => navigate('/shop')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', cursor: 'pointer', background: 'linear-gradient(135deg,var(--biscuit-lt),var(--biscuit))', border: '2px dashed rgba(107,66,38,0.25)' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--white)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)', marginBottom: '16px', fontSize: '1.6rem', color: 'var(--choc)' }}>+</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--choc)', fontWeight: 600, marginBottom: '8px' }}>View More</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-mid)', textAlign: 'center', padding: '0 20px' }}>Explore our full collection</div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="reviews-section" id="reviews">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="eyebrow reveal">Real Reviews</span>
            <h2 className="reveal">What Our Customers Say</h2>
            <div className="section-divider reveal" />
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="reviews-nav-btn reviews-nav-prev" onClick={() => { const t = document.getElementById('reviews-track'); if (!t) return; const cur = new DOMMatrix(getComputedStyle(t).transform).m41; t.style.animation = 'none'; t.style.transform = `translateX(${cur - 320}px)`; t.style.transition = 'transform 0.4s ease'; clearTimeout(window._rvTimer); window._rvTimer = setTimeout(() => { t.style.transition = ''; t.style.transform = ''; t.style.animation = ''; }, 3000); }} aria-label="Previous">&#8249;</button>
          <div className="reviews-track-wrap">
            <div className="reviews-track" id="reviews-track">
              {[...REVIEWS, ...REVIEWS].map((r, i) => (
                <div key={i} className="review-card" onClick={() => setRvModal(r)}>
                  <div className="review-stars">{'★'.repeat(r.rating || 5)}</div>
                  <p className="review-text">"{r.review_text}"</p>
                  <div className="review-author">
                    <div className="review-ava">{r.customer_name[0].toUpperCase()}</div>
                    <div><div className="review-name">{r.customer_name}</div><div className="review-city">{r.customer_city || ''}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="reviews-nav-btn reviews-nav-next" onClick={() => { const t = document.getElementById('reviews-track'); if (!t) return; const cur = new DOMMatrix(getComputedStyle(t).transform).m41; t.style.animation = 'none'; t.style.transform = `translateX(${cur + 320}px)`; t.style.transition = 'transform 0.4s ease'; clearTimeout(window._rvTimer); window._rvTimer = setTimeout(() => { t.style.transition = ''; t.style.transform = ''; t.style.animation = ''; }, 3000); }} aria-label="Next">&#8250;</button>
        </div>
      </section>

      {/* REVIEW MODAL */}
      {rvModal && (
        <div className="review-modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setRvModal(null); }}>
          <div className="review-modal-box">
            <button className="review-modal-close" onClick={() => setRvModal(null)} />
            <div className="review-modal-stars">{'★'.repeat(rvModal.rating || 5)}</div>
            <p className="review-modal-text">"{rvModal.review_text}"</p>
            <div className="review-modal-author">
              <div className="review-modal-ava"><div style={{ width: '100%', height: '100%', background: 'var(--biscuit)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--choc)' }}>{rvModal.customer_name[0]}</div></div>
              <div><div className="review-modal-name">{rvModal.customer_name}</div><div className="review-modal-city">{rvModal.customer_city || ''}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* FIRST TIME */}
      <section className="first-time-section" id="first-time">
        <div className="container">
          <div className="first-time-inner">
            <div className="ft-left reveal-l">
              <span className="eyebrow">New Here?</span>
              <h2 style={{ color: 'var(--choc)', marginBottom: '16px' }}>Not Sure What to Expect?</h2>
              <p style={{ color: 'var(--text-mid)', fontSize: '1rem', lineHeight: 1.85, fontWeight: 300, marginBottom: '28px' }}>We get it — ordering food online in Pakistan is a leap of faith. Here's exactly what happens when you place your first Moodmelt order.</p>
              <div className="ft-steps">
                {[{ n: 1, h: 'You order. We bake fresh.', p: 'Your brownies are baked from scratch after you order. Not stored, not frozen — made for you specifically.' }, { n: 2, h: 'Packed to stay perfect.', p: 'We use food-grade packaging that locks in the fudgy texture. They arrive exactly as they left our kitchen.' }, { n: 3, h: "One bite. You'll understand.", p: "Dense centre, slightly crisp edge, and a warmth that hits before you even finish chewing. That's the Moodmelt difference." }].map(s => (
                  <div key={s.n} className="ft-step reveal"><div className="ft-step-num">{s.n}</div><div><h4>{s.h}</h4><p>{s.p}</p></div></div>
                ))}
              </div>
              <a href="/shop" className="btn btn-checkout-green" style={{ marginTop: '32px' }} onClick={e => { e.preventDefault(); navigate('/shop'); }}>Try Your First Box — Risk Free →</a>
            </div>
            <div className="ft-right reveal-r">
              <div className="ft-guarantee-card">
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--choc)', marginBottom: '10px' }}>The Moodmelt Promise</h3>
                <p style={{ color: 'var(--text-mid)', fontSize: '0.88rem', lineHeight: 1.8, fontWeight: 300 }}>If your brownies arrive damaged or you're genuinely unsatisfied for any reason, message us on WhatsApp within 24 hours. We'll make it right. No questions asked.</p>
                <a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" className="btn btn-outline" style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.022-.535.152-.707.157-.156.347-.406.522-.609.174-.203.232-.347.347-.58.116-.231.058-.434-.029-.608-.087-.174-.785-1.893-1.075-2.592-.283-.682-.57-.59-.785-.6-.203-.01-.434-.012-.666-.012s-.609.087-.928.434c-.319.347-1.218 1.19-1.218 2.904s1.247 3.37 1.42 3.602c.174.232 2.453 3.746 5.944 5.252.832.358 1.481.572 1.987.733.834.265 1.594.228 2.194.138.67-.1 2.053-.84 2.343-1.651.29-.811.29-1.506.203-1.651-.087-.145-.319-.232-.667-.406z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.1 1.514 5.818L0 24l6.335-1.652A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                  Chat With Us First
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="story-section" id="story">
        <div className="container">
          <div className="story-inner">
            <div className="story-vis reveal-l">
              <div className="story-main" id="story-img-wrap" />
              <div className="story-accent-box">
                <div className="story-big-num" data-counter="100" data-suffix="%">0%</div>
                <p>Homemade Every Batch</p>
              </div>
            </div>
            <div className="reveal-r">
              <span className="eyebrow">Our Story</span>
              <h2 className="choc-drip">Melts Your Mood<br /><em>Within Seconds</em></h2>
              <div className="section-divider left" />
              <p className="section-sub" style={{ maxWidth: '100%', marginBottom: '20px' }}>Our main goal is not just to serve you with the finest brownies — beyond that, our main goal is to change your mood the moment you take your first bite, giving you a stress-free, joyful escape in the middle of a stressful life.</p>
              <p style={{ color: 'var(--text-mid)', fontSize: '0.88rem', lineHeight: 1.85, marginBottom: '28px', fontWeight: 300 }}>Every batch is handcrafted from scratch, using the finest imported cocoa and premium ingredients. No shortcuts. No compromise. From our kitchen to your door — nationwide.</p>
              <div className="story-features">
                {[
                  { h: 'Premium Imported Cocoa', p: 'Only the finest cocoa — because the chocolate is everything.' },
                  { h: 'Baked Fresh, Every Order', p: 'No pre-made batches. Your order is baked specifically for you.' },
                  { h: 'Packed to Stay Perfect', p: 'Every brownie arrives fudgy, fresh, and beautiful.' },
                ].map(f => (
                  <div key={f.h} className="story-feat reveal">
                    <div className="story-feat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A47148" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                    <div><h4>{f.h}</h4><p>{f.p}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="hiw-section" id="hiw">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="eyebrow reveal">Simple Process</span>
            <h2 className="reveal">From Kitchen to Your Door</h2>
            <div className="section-divider reveal" />
          </div>
          <div className="hiw-grid">
            {[
              { n: 1, h: 'Pick Your Brownies', p: 'Choose your flavour, box size, and quantity.' },
              { n: 2, h: 'We Bake Fresh', p: 'Your order triggers a fresh bake. Every brownie made just for you.' },
              { n: 3, h: 'Delivered Anywhere', p: 'Packed carefully and shipped nationwide. Arrives fudgy and fresh.' },
            ].map(s => (
              <div key={s.n} className="hiw-step reveal">
                <div className="hiw-icon-wrap">
                  <svg className="hiw-icon-svg" viewBox="0 0 32 32" fill="none" stroke="#A47148" strokeWidth="2" strokeLinecap="round"><circle cx="16" cy="16" r="12"/></svg>
                  <span className="hiw-step-num">{s.n}</span>
                </div>
                <h3>{s.h}</h3><p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lbUrl && <WALightbox urls={[lbUrl]} startUrl={lbUrl} onClose={() => setLbUrl(null)} />}
      <Footer />
      <WAFloat />
    </>
  );
}

// ── SHOP PAGE ─────────────────────────────────────────────────────────────
const MOOD_SVGS = {
  happy: `<svg viewBox="0 0 56 56" fill="none" style="width:20px;height:20px"><circle cx="28" cy="28" r="22" stroke="#A47148" stroke-width="2.5"/><path d="M19 32c2 4 6 7 9 7s7-3 9-7" stroke="#A47148" stroke-width="2.5" stroke-linecap="round"/><circle cx="21" cy="24" r="2.5" fill="#A47148"/><circle cx="35" cy="24" r="2.5" fill="#A47148"/></svg>`,
  stressed: `<svg viewBox="0 0 56 56" fill="none" style="width:20px;height:20px"><circle cx="28" cy="28" r="22" stroke="#A47148" stroke-width="2.5"/><path d="M19 36c2-4 6-6 9-6s7 2 9 6" stroke="#A47148" stroke-width="2.5" stroke-linecap="round"/><circle cx="21" cy="27" r="2" fill="#A47148"/><circle cx="35" cy="27" r="2" fill="#A47148"/></svg>`,
  gifting: `<svg viewBox="0 0 56 56" fill="none" style="width:20px;height:20px"><rect x="12" y="26" width="32" height="22" rx="2" stroke="#A47148" stroke-width="2.5"/><rect x="10" y="18" width="36" height="10" rx="2" stroke="#A47148" stroke-width="2.5"/><path d="M28 18v30" stroke="#A47148" stroke-width="2.5"/></svg>`,
  craving: `<svg viewBox="0 0 56 56" fill="none" style="width:20px;height:20px"><circle cx="28" cy="28" r="22" stroke="#A47148" stroke-width="2.5"/><path d="M20 30c0 0 2 6 8 6s8-6 8-6" stroke="#A47148" stroke-width="2.5" stroke-linecap="round"/><circle cx="21" cy="24" r="2.5" fill="#A47148"/><circle cx="35" cy="24" r="2.5" fill="#A47148"/></svg>`,
};

function ShopPage() {
  const { addToCart } = useCart();
  const { path, navigate } = useRouter();
  const showToast = useToast();
  const [checked, setChecked] = useState({});
  const [sort, setSort] = useState('default');

  useEffect(() => {
    trackToSheet('visit', { page: 'shop' });
    const mood = new URLSearchParams(path.split('?')[1] || '').get('mood');
    if (mood) setTimeout(() => setChecked({ mood: [mood] }), 100);
    const obs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('section-visible'); obs.unobserve(e.target); } }); }, { threshold: 0.05 });
    document.querySelectorAll('section,.page-hero').forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  useHeadingLines();
  useCardReveal(sort + JSON.stringify(checked));

  const grouped = {};
  FILTERS.forEach(f => { if (!grouped[f.group_name]) grouped[f.group_name] = { label: f.group_label, options: [] }; grouped[f.group_name].options.push(f); });

  const toggleFilter = (group, value) => setChecked(prev => { const arr = prev[group] || []; return { ...prev, [group]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] }; });

  const filtered = PRODUCTS.filter(p => {
    if (checked.mood?.length && !checked.mood.some(m => p.mood.includes(m))) return false;
    if (checked.flavour?.length) { const fs = p.slug.includes('classic-fudge') ? 'classic-fudge' : 'choco-burst'; if (!checked.flavour.includes(fs)) return false; }
    if (checked.packaging?.length) { const pk = p.variant?.includes('4') ? 'box4' : p.variant?.includes('6') ? 'box6' : 'single'; if (!checked.packaging.includes(pk)) return false; }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => { if (sort === 'price-low') return a.price - b.price; if (sort === 'price-high') return b.price - a.price; return 0; });

  const doAddToCart = (p) => { addToCart({ id: `${p.id}-${p.slug}`, name: p.name, variant: p.variant, price: p.price, emoji: p.emoji, image: p.images?.[0] || null, type: p.type, pieces: p.pieces, slug: p.slug, productId: p.id }); showToast(`✓ ${p.name} added!`); };

  return (
    <>
      <div className="page-hero" id="shop-hero-bg">
        <div className="page-hero-overlay" />
        <div className="container"><h1>Our Brownies</h1><p>Handcrafted. Fresh-baked. Made to melt your mood.</p></div>
      </div>
      <div className="container">
        <div className="shop-layout">
          <aside className="filters-panel">
            <div className="filter-card">
              <div className="filter-head"><h3>Filters</h3><span className="clear-btn" onClick={() => setChecked({})}>Clear all</span></div>
              {Object.entries(grouped).map(([group, data]) => (
                <div key={group} className="filter-group">
                  <div className="filter-g-title">{data.label}</div>
                  {data.options.map(opt => (
                    <div key={opt.id} className="filter-opt">
                      {group === 'mood' && MOOD_SVGS[opt.value] ? <div className="filter-opt-icon filter-opt-svg" dangerouslySetInnerHTML={{ __html: MOOD_SVGS[opt.value] }} /> : null}
                      <input type="checkbox" id={`f-${opt.id}`} checked={(checked[group] || []).includes(opt.value)} onChange={() => toggleFilter(group, opt.value)} />
                      <label htmlFor={`f-${opt.id}`}>{opt.label}</label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </aside>
          <div className="products-main">
            <div className="shop-topbar">
              <span className="shop-count">{sorted.length} product{sorted.length !== 1 ? 's' : ''}</span>
              <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="default">Sort: Featured</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
              </select>
            </div>
            <div className="products-grid" id="products-grid">
              {!sorted.length ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-mid)' }}>No products found.</div>
                : sorted.map(p => <ProductCard key={p.id} p={p} onAddToCart={doAddToCart} />)}
            </div>
          </div>
        </div>
      </div>
      <Footer /><WAFloat msg="Hi Moodmelt!" />
    </>
  );
}

// ── PRODUCT DETAIL PAGE ───────────────────────────────────────────────────
function ProductPage({ slug }) {
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const showToast = useToast();
  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState(null);

  const product = PRODUCTS.find(p => p.slug === slug);

  useEffect(() => {
    if (product) { document.title = `${product.name} — Moodmelt`; trackToSheet('visit', { page: 'product', product_name: product.name }); }
    document.querySelectorAll('section,.detail-page').forEach(s => s.classList.add('section-visible'));
  }, [slug]);

  useHeadingLines();

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '120px', color: 'var(--text-mid)' }}>
      Product not found. <a href="/shop" onClick={e => { e.preventDefault(); navigate('/shop'); }} style={{ color: 'var(--caramel)' }}>Shop All</a>
    </div>
  );

  const imgs = product.images || [];
  const related = PRODUCTS.filter(p => p.slug !== slug && p.mood.some(m => product.mood.includes(m))).slice(0, 3);

  const doAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart({ id: `${product.id}-${product.slug}`, name: product.name, variant: product.variant, price: product.price, emoji: product.emoji || '🍫', image: imgs[0] || null, type: product.type || 'box', pieces: product.pieces || 1, slug: product.slug, productId: product.id });
    showToast(`✓ ${product.name}${qty > 1 ? ` ×${qty}` : ''} added!`);
    setQty(1);
  };

  return (
    <>
      <div className="detail-page">
        <div className="container">
          <div className="detail-grid">
            <div className="detail-gallery">
              <div className="detail-main-img">
                {(mainImg || imgs[0]) ? <img src={mainImg || imgs[0]} alt={product.name} /> : <span style={{ fontSize: '5rem' }}>{product.emoji || '🍫'}</span>}
              </div>
              {imgs.length > 1 && <div className="detail-thumbs">{imgs.map((img, i) => <div key={i} className={`d-thumb${img === (mainImg || imgs[0]) ? ' active' : ''}`} onClick={() => setMainImg(img)}><img src={img} alt="" /></div>)}</div>}
            </div>
            <div className="detail-info">
              <div className="breadcrumb">
                <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>Home</a><span className="sep">/</span>
                <a href="/shop" onClick={e => { e.preventDefault(); navigate('/shop'); }}>Shop</a><span className="sep">/</span>
                <span>{product.name}</span>
              </div>
              {product.badge && <div className="detail-badge">{product.badge}</div>}
              <h1 className="detail-name heading-line">{product.name}</h1>
              <p className="detail-desc">{product.description || product.short_desc || ''}</p>
              <div className="detail-price">Rs.{product.price.toLocaleString()}</div>
              {product.pieces > 1 && <div style={{ fontSize: '0.82rem', color: 'var(--caramel)', fontWeight: 500, marginTop: '-18px', marginBottom: '22px' }}>That's just Rs.{Math.round(product.price / product.pieces)} per brownie</div>}
              <div className="reserve-batch-badge"><span className="reserve-batch-dot" />Fixed Batches Daily — Reserve Your Spot Before It Fills</div>
              <div className="opt-label">Variant</div>
              <div className="opt-btns"><button className="opt-btn active">{product.variant}</button></div>
              <div className="opt-label" style={{ marginTop: '18px' }}>Quantity</div>
              <div className="qty-row">
                <button className="qty-s-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-s-num">{qty}</span>
                <button className="qty-s-btn" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button className="btn btn-dark btn-full btn-checkout-green" onClick={doAddToCart} style={{ marginBottom: '10px' }}>Add to Cart — Order Fresh 🍫</button>
              <button className="btn btn-outline btn-full" onClick={() => navigate('/shop')}>← View All Brownies</button>
              <div className="detail-trust">
                <span className="d-badge">Freshly Baked</span><span className="d-badge">100% Homemade</span>
                <span className="d-badge">Nationwide</span><span className="d-badge">Imported Cocoa</span>
              </div>
              {product.ingredients && <div className="ingredients-panel"><h4>Ingredients</h4><p>{product.ingredients}</p></div>}
            </div>
          </div>

          {related.length > 0 && (
            <div id="upsell-section" style={{ marginTop: '64px', paddingTop: '48px', borderTop: '1px solid var(--border)' }}>
              <span className="eyebrow">You Might Also Love</span>
              <div className="products-grid" style={{ marginTop: '28px' }}>
                {related.map(p => <ProductCard key={p.id} p={p} onAddToCart={() => { addToCart({ id: `${p.id}-${p.slug}`, name: p.name, variant: p.variant, price: p.price, emoji: p.emoji, image: p.images?.[0] || null, type: p.type, pieces: p.pieces, slug: p.slug, productId: p.id }); showToast(`✓ ${p.name} added!`); }} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer /><WAFloat />
    </>
  );
}

// ── CHECKOUT PAGE ─────────────────────────────────────────────────────────
function CheckoutPage() {
  const { cart, cartTotal, appliedDiscount, saveDiscount, clearDiscount, clearCart } = useCart();
  const { navigate } = useRouter();
  const showToast = useToast();
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', province: '', notes: '', payment: 'cod', giftMsg: '', giftOn: false });
  const [delivery, setDelivery] = useState({ charge: 0, zone: '', days: '' });
  const [discountCode, setDiscountCode] = useState('');
  const [discMsg, setDiscMsg] = useState({ text: '', ok: false });
  const [placing, setPlacing] = useState(false);

  useEffect(() => { trackToSheet('visit', { page: 'checkout' }); document.querySelectorAll('.checkout-page').forEach(s => s.classList.add('section-visible')); }, []);

  const handleCityBlur = (city) => { if (!city.trim()) return; const d = lookupDelivery(city); setDelivery(d); };

  const applyDiscount = () => {
    if (!discountCode.trim()) return;
    const result = validateDiscount(discountCode);
    if (result.valid) { saveDiscount(result); setDiscMsg({ text: `✓ ${result.value}% off!`, ok: true }); }
    else setDiscMsg({ text: result.error, ok: false });
  };

  const sub = cartTotal();
  const disc = appliedDiscount ? Math.round(sub * appliedDiscount.value / 100) : 0;
  const total = sub - disc + delivery.charge;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.length) return;
    setPlacing(true);

    const orderNumber = generateOrderNumber();
    const orderData = {
      order_number: orderNumber,
      customer_name: form.name, customer_phone: form.phone, customer_email: form.email,
      address: form.address, city: form.city, province: form.province,
      notes: (form.notes + (form.giftOn && form.giftMsg ? `\nGift Message: ${form.giftMsg}` : '')).trim(),
      items: cart.map(i => ({ name: i.name, variant: i.variant, price: i.price, quantity: i.quantity, slug: i.slug })),
      subtotal: sub, discount_amount: disc, discount_code: appliedDiscount?.code || null,
      delivery_charge: delivery.charge, total, payment_method: form.payment,
    };

    // Track order in Google Sheets
    trackToSheet('order', {
      customer_name: form.name,
      order_number: orderNumber,
      total,
      products: cart.map(i => `${i.name} x${i.quantity}`).join(', '),
    });

    // Fetch analytics report from Google Sheets
    const analyticsReport = await fetchAnalyticsReport();

    // Send email via EmailJS
    const emailSent = await sendOrderEmail(orderData, analyticsReport);
    if (!emailSent) console.warn('Email notification failed — order still placed');

    // Build WhatsApp URL
    const waUrl = buildWAUrl(orderData);

    clearCart();
    clearDiscount();
    navigate(`/success?order=${orderNumber}&wa=${encodeURIComponent(waUrl)}`);
  };

  return (
    <>
      <div className="checkout-page">
        <div className="container">
          <div style={{ marginBottom: '28px' }}>
            <a href="/shop" onClick={e => { e.preventDefault(); navigate('/shop'); }} style={{ color: 'var(--caramel)', fontSize: '0.85rem', fontWeight: 600 }}>← Back to Shop</a>
          </div>
          <div className="checkout-layout">
            <div className="checkout-form-box">
              <h2 className="co-title">Your Details</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Full Name *</label><input type="text" className="form-control" placeholder="Your full name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Phone Number *</label><input type="tel" className="form-control" placeholder="+92 3XX XXXXXXX" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Email (optional)</label><input type="email" className="form-control" placeholder="For order confirmation" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Street Address *</label><input type="text" className="form-control" placeholder="House/Flat, Street, Area" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">City *</label><input type="text" className="form-control" placeholder="e.g. Lahore, Karachi" required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} onBlur={e => handleCityBlur(e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Province</label>
                    <select className="form-control" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })}>
                      <option value="">Select province</option>
                      {['Punjab','Sindh','KPK','Balochistan','Islamabad','AJK','GB'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Order Notes (optional)</label><textarea className="form-control" rows="3" placeholder="Any special instructions?" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '8px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--choc)', marginBottom: '18px' }}>Payment Method</h3>
                  <div className="payment-opts">
                    {['cod','online'].map(method => (
                      <div key={method} className={`pay-opt${form.payment === method ? ' active' : ''}`} onClick={() => setForm({ ...form, payment: method })}>
                        <input type="radio" name="payment" value={method} checked={form.payment === method} onChange={() => {}} />
                        <div className="pay-icon" />
                        <div className="pay-name">{method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</div>
                        <div className="pay-desc">{method === 'cod' ? 'Pay when you receive' : 'Bank / EasyPaisa'}</div>
                      </div>
                    ))}
                  </div>
                  {form.payment === 'online' && (
                    <div className="online-info">
                      <p><strong>EasyPaisa / JazzCash:</strong> 0332-3503023<br /><strong>Bank Transfer:</strong> Details shared via WhatsApp.<br /><em>Send payment proof after placing order.</em></p>
                      <a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" className="btn btn-dark btn-sm" style={{ marginTop: '12px' }}>WhatsApp Us</a>
                    </div>
                  )}
                </div>

                {/* Gift message */}
                <div style={{ background: 'var(--cream-soft)', borderRadius: 'var(--r-md)', padding: '16px 18px', marginTop: '18px', marginBottom: '18px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div><div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--choc)' }}>Sending as a Gift?</div><div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px' }}>Add a personal message</div></div>
                    <label style={{ position: 'relative', width: '42px', height: '24px', cursor: 'pointer', display: 'inline-block' }}>
                      <input type="checkbox" checked={form.giftOn} onChange={e => setForm({ ...form, giftOn: e.target.checked })} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                      <div style={{ position: 'absolute', inset: 0, background: form.giftOn ? 'var(--caramel)' : '#ccc', borderRadius: '12px', transition: '0.3s' }} />
                      <div style={{ position: 'absolute', height: '18px', width: '18px', left: form.giftOn ? '21px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.3s' }} />
                    </label>
                  </div>
                  {form.giftOn && <div style={{ marginTop: '14px' }}><label className="form-label">Gift Message</label><textarea className="form-control" rows="2" placeholder="e.g. Happy Birthday!" style={{ resize: 'none' }} value={form.giftMsg} onChange={e => setForm({ ...form, giftMsg: e.target.value })} /></div>}
                </div>

                <button type="submit" className="btn btn-dark btn-full" style={{ marginTop: '20px', padding: '17px', fontSize: '1rem' }} disabled={placing}>
                  {placing ? 'Placing Order...' : 'Place My Order — Secure Checkout'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-mid)', marginTop: '10px' }}>Secure checkout. We'll confirm via WhatsApp.</p>
              </form>
            </div>

            <div className="co-summary">
              <h3 className="co-sum-title">Order Summary</h3>
              {cart.map((i, idx) => (
                <div key={idx} className="co-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="co-item-name">{i.name} ({i.variant}) ×{i.quantity}</span>
                  <span className="co-item-price">Rs. {(i.price * i.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="co-item" style={{ display: 'flex', justifyContent: 'space-between' }}><span className="co-item-name">Subtotal</span><span className="co-item-price">Rs. {sub.toLocaleString()}</span></div>
              {disc > 0 && <div className="co-item" style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--success)' }}>Discount</span><span style={{ color: 'var(--success)' }}>-Rs. {disc.toLocaleString()}</span></div>}
              <div className="co-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="co-item-name">Delivery to {delivery.zone || '—'}</span>
                <span className="co-item-price">{delivery.charge > 0 ? `Rs. ${delivery.charge} (${delivery.days})` : 'Enter city above'}</span>
              </div>
              <div className="co-total-row"><span>Total</span><span>Rs. {total.toLocaleString()}</span></div>

              <div className="co-delivery-note">Delivery charges added based on your city.</div>
              <div className="co-trust">
                <div className="co-trust-item"><span>—</span> Freshly baked after your order</div>
                <div className="co-trust-item"><span>—</span> Packed to stay fudgy in transit</div>
                <div className="co-trust-item"><span>—</span> Confirmed via WhatsApp</div>
                <div className="co-trust-item"><span>—</span> Nationwide across Pakistan</div>
              </div>

              {/* Discount code */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Discount Code</div>
                <div className="discount-row" style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="discount-input form-control" placeholder="Enter code" value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())} style={{ flex: 1 }} />
                  <button type="button" className="btn btn-dark btn-sm" onClick={applyDiscount}>Apply</button>
                </div>
                {discMsg.text && <div style={{ fontSize: '0.8rem', marginTop: '6px', color: discMsg.ok ? 'var(--success)' : 'var(--error)' }}>{discMsg.text}</div>}
              </div>

              <div style={{ marginTop: '18px', padding: '14px', background: 'var(--cream-soft)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-mid)', marginBottom: '8px' }}>Have a question?</p>
                <a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" className="btn btn-outline btn-sm">WhatsApp Us</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

// ── SUCCESS PAGE ──────────────────────────────────────────────────────────
function SuccessPage() {
  const { path, navigate } = useRouter();
  const params = new URLSearchParams(path.split('?')[1] || '');
  const orderNum = params.get('order');
  const waUrl = params.get('wa');
  useEffect(() => { document.title = 'Order Placed — Moodmelt'; }, []);
  return (
    <>
      <nav className="navbar scrolled"><div className="container"><div className="navbar-inner"><a href="/" className="nav-logo" onClick={e => { e.preventDefault(); navigate('/'); }}><img src="/images/logo.png" alt="Moodmelt" /></a></div></div></nav>
      <div className="success-page">
        <div className="success-card">
          <span className="success-icon" />
          <h2>Order Placed!</h2>
          {orderNum && <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--choc)', marginBottom: '6px' }}>Order #{orderNum}</p>}
          <p>Your order is confirmed and your brownies are being baked fresh.<br />We'll be in touch via WhatsApp shortly. 🍫</p>
          <a href={waUrl ? decodeURIComponent(waUrl) : `https://wa.me/${CONFIG.whatsapp}`} target="_blank" className="btn btn-dark btn-full" style={{ marginBottom: '12px' }}>🟢 Confirm on WhatsApp</a>
          <a href="/shop" className="btn btn-outline btn-full" onClick={e => { e.preventDefault(); navigate('/shop'); }}>← Shop More Brownies</a>
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-mid)' }}>✅ Fresh-baked</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-mid)' }}>📦 Packed fudgy</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-mid)' }}>🚚 Nationwide</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── CONTACT PAGE ──────────────────────────────────────────────────────────
function ContactPage() {
  const { navigate } = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: 'General Enquiry', message: '' });
  const [success, setSuccess] = useState(false);
  useEffect(() => { trackToSheet('visit', { page: 'contact' }); document.querySelectorAll('.contact-page').forEach(s => s.classList.add('section-visible')); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `Moodmelt Contact Form\n\nName: ${form.name}\nPhone: ${form.phone || '—'}\nEmail: ${form.email || '—'}\nSubject: ${form.subject}\n\nMessage:\n${form.message}`;
    setSuccess(true);
    setTimeout(() => window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank'), 800);
    setForm({ name: '', phone: '', email: '', subject: 'General Enquiry', message: '' });
  };

  return (
    <>
      <div className="contact-page">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="eyebrow">Get In Touch</span>
            <h1 style={{ color: 'var(--choc-dark)', marginBottom: '12px' }}>Contact Us</h1>
            <p style={{ color: 'var(--text-mid)', fontSize: '1rem' }}>Have a question, special order, or just want to say hello?</p>
          </div>
          <div className="contact-grid">
            <div className="contact-info">
              <h2>We're Here For You</h2>
              <p>Whether you want to place a bulk order, ask about delivery, or just chat about brownies — reach out anytime.</p>
              {[
                { h: 'WhatsApp', c: <p>+92 332 3503023<br /><a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" style={{ color: 'var(--caramel)' }}>Chat with us directly →</a></p> },
                { h: 'Instagram', c: <p><a href={`https://instagram.com/${CONFIG.instagram}`} target="_blank" style={{ color: 'var(--caramel)' }}>@{CONFIG.instagram} →</a></p> },
                { h: 'Response Time', c: <p>We typically respond within a few hours on WhatsApp.</p> },
              ].map(item => (
                <div key={item.h} className="contact-detail">
                  <div className="contact-detail-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A47148" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg></div>
                  <div><h4>{item.h}</h4>{item.c}</div>
                </div>
              ))}
            </div>
            <div className="contact-form-wrap">
              <div className="contact-form-box">
                <h3>Send Us a Message</h3>
                {success && <div style={{ background: '#F0FBF4', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '18px', color: 'var(--success)', fontSize: '0.9rem' }}>Message sent! Redirecting to WhatsApp...</div>}
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Your Name *</label><input type="text" className="form-control" placeholder="Full name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-control" placeholder="+92 3XX XXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Subject</label>
                    <select className="form-control" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                      {['General Enquiry','Bulk / Custom Order','Delivery Question','Feedback','Other'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Message *</label><textarea className="form-control" rows="5" placeholder="Type your message here..." required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
                  <button type="submit" className="btn btn-dark btn-full" style={{ padding: '15px' }}>Send via WhatsApp →</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer /><WAFloat />
    </>
  );
}

// ── APP SHELL ─────────────────────────────────────────────────────────────
function App() {
  const { path } = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.body.classList.remove('page-transition-out');
    const obs = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('section-visible'); obs.unobserve(e.target); } }); }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('section, .trust-bar').forEach(s => { const r = s.getBoundingClientRect(); if (r.top < window.innerHeight) s.classList.add('section-visible'); else obs.observe(s); });
    return () => obs.disconnect();
  }, [path]);

  const cleanPath = path.split('?')[0];
  const productMatch = cleanPath.match(/^\/product\/(.+)$/);
  const isSuccess = cleanPath === '/success';
  const showNav = !isSuccess;

  return (
    <>
      {showNav && <Navbar scrolled={scrolled} />}
      <CartDrawer />
      <main>
        {cleanPath === '/'         && <HomePage />}
        {cleanPath === '/shop'     && <ShopPage />}
        {productMatch              && <ProductPage slug={productMatch[1]} />}
        {cleanPath === '/checkout' && <CheckoutPage />}
        {isSuccess                 && <SuccessPage />}
        {cleanPath === '/contact'  && <ContactPage />}
        {!['/','shop','/checkout','/success','/contact'].includes(cleanPath) && !productMatch && (
          <div style={{ textAlign: 'center', padding: '120px' }}>
            <h2>Page not found</h2>
            <a href="/" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} style={{ color: 'var(--caramel)' }}>← Go Home</a>
          </div>
        )}
      </main>
    </>
  );
}

// ── RENDER ────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider>
    <CartProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </CartProvider>
  </RouterProvider>
);
