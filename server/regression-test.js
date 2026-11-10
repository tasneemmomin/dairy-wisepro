/* Full business-flow regression: every endpoint the UI touches */
const BASE = 'http://localhost:5000/api';
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('  PASS', name); } else { fail++; console.log('  FAIL', name); } };

async function api(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
}

(async () => {
  console.log('── Public / config ──');
  let r = await api('GET', '/config');
  ok('GET /config exposes UPI + WhatsApp', r.status === 200 && r.data.upiId && r.data.whatsappNumber);
  r = await api('GET', '/health');
  ok('GET /health', r.status === 200 && r.data.mongodb === 'connected');
  r = await api('GET', '/products?category=milk');
  ok('GET /products filtered (shop page)', r.status === 200 && r.data.length === 2);
  const milk = r.data;
  r = await api('GET', '/products?search=paneer');
  ok('GET /products search', r.status === 200 && r.data.some(p => /paneer/i.test(p.name)));

  console.log('── Auth ──');
  const stamp = Date.now();
  r = await api('POST', '/auth/register', { name: 'Regression User', email: `reg${stamp}@x.com`, password: 'abc123' });
  ok('register', r.status === 201 && r.data.token);
  const cust = r.data;
  r = await api('POST', '/auth/login', { email: `REG${stamp}@X.COM`, password: 'abc123' });
  ok('login (case-insensitive email)', r.status === 200 && r.data.token);
  r = await api('POST', '/auth/login', { email: 'vasantdadaagency816@gmail.com', password: 'vasantdada123' });
  ok('admin login', r.status === 200 && r.data.user.role === 'OWNER');
  const adm = r.data;
  r = await api('GET', '/auth/me', null, cust.token);
  ok('GET /auth/me', r.status === 200 && r.data.email === `reg${stamp}@x.com`);
  r = await api('PUT', '/auth/profile', { address: { street: '1 Test St', city: 'Sangli', state: 'MH', pincode: '416416' } }, cust.token);
  ok('PUT /auth/profile address', r.status === 200 && r.data.user.address?.city === 'Sangli');
  r = await api('GET', '/auth/users', null, adm.token);
  ok('GET /auth/users (admin)', r.status === 200 && Array.isArray(r.data));
  r = await api('GET', '/auth/users', null, cust.token);
  ok('GET /auth/users blocked for customer', r.status === 403);

  console.log('── Orders ──');
  r = await api('POST', '/orders', { items: [{ product: milk[0]._id, quantity: 2 }] }, cust.token);
  ok('place order', r.status === 201 && r.data.totalAmount === milk[0].price * 2);
  const order = r.data;
  r = await api('POST', '/orders', { items: [{ product: milk[0]._id, quantity: 1.5 }] }, cust.token);
  ok('reject non-integer quantity', r.status === 400);
  r = await api('POST', '/orders', { items: [] }, cust.token);
  ok('reject empty items', r.status === 400);
  r = await api('GET', '/orders/my', null, cust.token);
  ok('GET /orders/my', r.status === 200 && r.data.length === 1);
  r = await api('GET', '/orders', null, cust.token);
  ok('GET /orders blocked for customer', r.status === 403);
  r = await api('GET', `/orders/${order._id}`, null, adm.token);
  ok('GET /orders/:id (admin)', r.status === 200);

  console.log('── Payments (QR flow) ──');
  r = await api('POST', '/payments/generate-qr', { orderId: order._id, amount: 1 }, cust.token);
  ok('generate-qr prices from order, not client', r.status === 200 && r.data.payment.amount === milk[0].price * 2 && r.data.payment.upiId);
  const paymentId = r.data.payment.id;
  r = await api('POST', `/payments/order/${order._id}/mark-paid`, { utr: '312345678901' }, cust.token);
  ok('mark-paid with UTR', r.status === 200 && r.data.payment.status === 'verified_by_user');
  r = await api('POST', `/payments/order/${order._id}/mark-paid`, { utr: '312345678902' }, cust.token);
  ok('double mark-paid blocked', r.status === 400);
  r = await api('GET', `/payments/order/${order._id}`, null, adm.token);
  ok('GET payment by order (admin)', r.status === 200 && r.data.utr === '312345678901');
  r = await api('GET', '/payments/pending/all', null, adm.token);
  ok('GET pending payments (admin)', r.status === 200 && r.data.some(p => p._id === paymentId));
  r = await api('POST', `/payments/${paymentId}/approve`, { verificationNotes: 'ok' }, adm.token);
  ok('approve payment → order confirmed+paid', r.status === 200 && r.data.order.status === 'confirmed' && r.data.order.paymentStatus === 'paid');

  console.log('── Order cancel + stock restore ──');
  const before = (await api('GET', `/products/${milk[1]._id}`)).data.stock;
  r = await api('POST', '/orders', { items: [{ product: milk[1]._id, quantity: 3 }], paymentMethod: 'cod' }, cust.token);
  ok('COD order placed', r.status === 201);
  r = await api('PUT', `/orders/${r.data._id}/cancel`, null, cust.token);
  ok('customer cancels order', r.status === 200 && r.data.order.status === 'cancelled');
  const after = (await api('GET', `/products/${milk[1]._id}`)).data.stock;
  ok('stock restored after cancel', after === before);
  r = await api('PUT', `/orders/${order._id}/cancel`, null, cust.token);
  ok('cannot cancel already-confirmed paid order', r.status === 400);

  console.log('── Subscriptions ──');
  r = await api('POST', '/subscriptions', { product: milk[0]._id, planType: 'daily', dailyQuantity: 1, pricePerUnit: milk[0].price }, cust.token);
  ok('create subscription', r.status === 201);
  const sub = r.data;
  r = await api('POST', '/subscriptions', { product: milk[0]._id, planType: 'weekly', weeklyPlan: milk[0] && 'x' && [{ day: 'monday', quantity: 2, enabled: true }], pricePerUnit: milk[0].price }, cust.token);
  ok('create weekly subscription (no crash)', r.status === 201);
  r = await api('GET', '/subscriptions/my', null, cust.token);
  ok('GET /subscriptions/my', r.status === 200 && r.data.length === 2);
  r = await api('GET', '/subscriptions', null, adm.token);
  const adminViewMine = (r.data || []).filter(s => {
    const uid = s.user?._id || (typeof s.user === 'string' ? s.user : s.user?.id);
    return uid && (cust.user?.id || cust.user?._id) && uid.toString() === (cust.user.id || cust.user._id).toString();
  });
  ok('GET /subscriptions (admin view shows all customers)', r.status === 200 && adminViewMine.length === 2);
  r = await api('PUT', `/subscriptions/${sub._id}/pause`, null, adm.token);
  ok('admin pauses customer sub', r.status === 200 && r.data.status === 'paused');
  r = await api('PUT', `/subscriptions/${sub._id}/resume`, null, cust.token);
  ok('owner resumes sub', r.status === 200 && r.data.status === 'active');
  r = await api('PUT', `/subscriptions/${sub._id}/cancel`, null, cust.token);
  ok('owner cancels sub', r.status === 200 && r.data.status === 'cancelled');

  console.log('── Products CRUD (admin) ──');
  r = await api('POST', '/products', { name: 'Test Lassi', category: 'other', price: 45, stock: 10 }, adm.token);
  ok('create product', r.status === 201);
  const prod = r.data;
  r = await api('POST', '/products', { name: 'Bad', category: 'other', price: -5 }, adm.token);
  ok('reject negative price', r.status === 400);
  r = await api('PUT', `/products/${prod._id}`, { price: 50, stock: 20 }, adm.token);
  ok('update product', r.status === 200 && r.data.price === 50);
  r = await api('DELETE', `/products/${prod._id}`, null, adm.token);
  ok('delete product', r.status === 200);

  console.log('── Billing ──');
  const now = new Date();
  r = await api('POST', '/billing/generate-all', { month: now.getMonth() + 1, year: now.getFullYear() }, adm.token);
  ok('generate bills from real orders', r.status === 201);
  r = await api('POST', '/billing/generate-all', { month: now.getMonth() + 1, year: now.getFullYear() }, adm.token);
  ok('regenerate is idempotent', r.status === 201);
  r = await api('GET', '/billing', null, adm.token);
  ok('GET /billing (admin)', r.status === 200 && r.data.length >= 1);
  const bill = r.data[0];
  r = await api('PUT', `/billing/${bill._id}`, { status: 'Paid', paidAmount: bill.totalAmount }, adm.token);
  ok('mark bill paid', r.status === 200 && r.data.status === 'Paid');
  r = await api('POST', '/billing/generate-all', { month: 13, year: 2026 }, adm.token);
  ok('reject invalid month', r.status === 400);

  console.log('── Delivery ──');
  r = await api('GET', '/delivery/daily', null, adm.token);
  ok('GET /delivery/daily', r.status === 200 && Array.isArray(r.data));
  r = await api('GET', '/delivery/stats', null, adm.token);
  ok('GET /delivery/stats', r.status === 200 && typeof r.data.deliveredCount === 'number');
  const custId = (await api('GET', '/auth/users', null, adm.token)).data.find(u => u.email.startsWith('reg'))?._id;
  r = await api('POST', '/delivery/log', { customerId: custId, status: 'Delivered', products: [{ quantity: 1, unit: 'L' }] }, adm.token);
  ok('POST /delivery/log (admin-fixed safe)', r.status === 201);
  r = await api('POST', '/delivery/log', { customerId: custId, status: 'Bogus' }, adm.token);
  ok('reject invalid delivery status', r.status === 400);

  console.log('── Notifications ──');
  r = await api('GET', '/notifications', null, cust.token);
  ok('GET /notifications (customer scope)', r.status === 200);
  const myNotif = r.data[0];
  r = await api('PUT', `/notifications/${myNotif._id}/read`, null, cust.token);
  ok('mark notification read', r.status === 200);
  r = await api('PUT', '/notifications/read-all', null, cust.token);
  ok('mark all read', r.status === 200);

  console.log('── Analytics ──');
  for (const ep of ['dashboard', 'revenue-chart', 'top-products', 'customer-growth']) {
    r = await api('GET', `/analytics/${ep}`, null, adm.token);
    ok(`GET /analytics/${ep}`, r.status === 200);
  }
  r = await api('GET', '/analytics/dashboard', null, cust.token);
  ok('analytics blocked for customer', r.status === 403);

  console.log('── Vendors ──');
  r = await api('POST', '/vendors', { name: 'Test Vendor', phone: '9876543210', products: ['milk'] }, adm.token);
  ok('create vendor', r.status === 201);
  const vendor = r.data;
  r = await api('PUT', `/vendors/${vendor._id}`, { rating: 4.5 }, adm.token);
  ok('update vendor', r.status === 200 && r.data.rating === 4.5);
  r = await api('DELETE', `/vendors/${vendor._id}`, null, adm.token);
  ok('delete vendor', r.status === 200);

  console.log('── Validation / edge ──');
  r = await api('GET', '/orders/invalidid', null, adm.token);
  ok('malformed id → 400 (not 500)', r.status === 400);
  r = await api('GET', '/does-not-exist', null, adm.token);
  ok('unknown route → 404', r.status === 404);
  r = await api('GET', '/orders/my', null, 'garbage.token.here');
  ok('bad token → 401', r.status === 401);

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SUITE ERROR:', e); process.exit(1); });
