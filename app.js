// Paw Parcel frontend interactions
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const toast = $('#toast');
let toastTimer;
let saved = {};
try { saved = JSON.parse(localStorage.getItem('pawParcelState') || '{}'); } catch (_) { saved = {}; }
const state = {
  quantities: saved.quantities || {},
  added: saved.added || [],
  paused: !!saved.paused,
  skipDate: saved.skipDate || '',
  frequency: saved.frequency || 'Every 4 weeks',
  petName: saved.petName || 'Milo',
  pets: saved.pets || []
};
const catalog = {
  salmon: { icon: '🐟', name: 'Salmon skin bites', desc: 'Treats · 3 oz', price: 299 },
  ball: { icon: '🎾', name: 'Bouncy good-time ball', desc: 'Toys · One size', price: 349 },
  brush: { icon: '🪮', name: 'Gentle grooming brush', desc: 'Grooming · Soft bristles', price: 499 },
  wipes: { icon: '🫧', name: 'Paw & nose wipes', desc: 'Care · 50 count', price: 249 },
  treats: { icon: '🍪', name: 'Calming oat biscuits', desc: 'Treats · 8 oz', price: 399 }
};
function save() { localStorage.setItem('pawParcelState', JSON.stringify(state)); }
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function setPetName(name) {
  state.petName = name || 'Milo';
  $('#petName').textContent = state.petName;
  const possessive = state.petName.endsWith('s') ? `${state.petName}’` : `${state.petName}’s`;
  const heroLine = $('.hero-copy p');
  if (heroLine) heroLine.textContent = `${possessive} next box is being packed with all the favorites. Get ready for tail wags.`;
  const h3 = $('.delivery-card h3');
  if (h3) h3.textContent = `Almost there, ${state.petName}!`;
  const tip = $('.care-note b');
  if (tip) tip.textContent = `A little ${state.petName} tip`;
  save();
}
function getQuantity(row) { return Number($('.qty span', row)?.textContent || 1); }
function updateTotal() {
  let sum = 0;
  $$('.product').forEach(row => { sum += Number(row.dataset.price) * getQuantity(row); });
  $('#totalPrice').textContent = `₹${sum.toLocaleString('en-IN')}`;
}
function makeProductRow(id, product, quantity = 1) {
  const row = document.createElement('div');
  row.className = 'product';
  row.dataset.id = id;
  row.dataset.price = product.price;
  row.innerHTML = `<div class="product-thumb">${product.icon}</div><div class="product-info"><b>${product.name}</b><small>${product.desc}</small></div><div class="qty"><button aria-label="Decrease quantity" data-change="-1">−</button><span>${quantity}</span><button aria-label="Increase quantity" data-change="1">+</button></div><span class="price">₹${product.price.toLocaleString('en-IN')}</span>`;
  return row;
}
function addProduct(id) {
  const product = catalog[id];
  if (!product) return;
  const existing = $(`.product[data-id="${id}"]`);
  if (existing) {
    const q = $('.qty span', existing);
    q.textContent = Number(q.textContent) + 1;
  } else {
    $('#productList').appendChild(makeProductRow(id, product));
    if (!state.added.includes(id)) state.added.push(id);
  }
  const suggestion = $(`.add-row[data-add="${id}"] .add-btn`);
  if (suggestion) { suggestion.textContent = '✓ Added'; suggestion.disabled = true; }
  state.quantities[id] = getQuantity($(`.product[data-id="${id}"]`));
  updateTotal(); save();
  showToast(`${product.name} added to ${state.petName}’s box!`);
}
function applySavedState() {
  $$('.product').forEach(row => {
    const q = state.quantities[row.dataset.id];
    if (q) $('.qty span', row).textContent = q;
  });
  state.added.forEach(id => {
    if (catalog[id] && !$(`.product[data-id="${id}"]`)) $('#productList').appendChild(makeProductRow(id, catalog[id], state.quantities[id] || 1));
    const button = $(`.add-row[data-add="${id}"] .add-btn`);
    if (button) { button.textContent = '✓ Added'; button.disabled = true; }
  });
  setPetName(state.petName);
  $('.sub-label small').textContent = `Ships ${state.frequency.toLowerCase()} · Next box ${state.skipDate ? 'Dec 2' : 'Nov 4'}`;
  if (state.skipDate) {
    $('.ship-tag b').textContent = `Arriving ${state.skipDate}`;
    $('.ship-tag').lastChild.textContent = 'Your delivery was rescheduled 📦';
  }
  if (state.paused) setPaused(true, false);
  updateTotal();
}
function openModal(title, body, actions = '<button class="btn btn-primary" data-action="close">Done</button>') {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = body;
  $('#modalActions').innerHTML = actions;
  $('#modalBackdrop').classList.add('open');
}
function closeModal() { $('#modalBackdrop').classList.remove('open'); }
function editPlan() {
  openModal('Make it your pet’s kind of plan', '<p>Choose how often their box should arrive. You can change this any time.</p><label for="frequency">Delivery frequency</label><select id="frequency"><option>Every 2 weeks</option><option>Every 4 weeks</option><option>Every 6 weeks</option><option>Every 8 weeks</option></select><label for="deliveryDate">Next delivery</label><select id="deliveryDate"><option>Wednesday, November 4</option><option>Wednesday, November 11</option><option>Wednesday, November 18</option></select>', '<button class="btn btn-outline" data-action="close">Cancel</button><button class="btn btn-primary" data-action="save-plan">Save changes</button>');
  $('#frequency').value = state.frequency;
  if (state.skipDate) {
    const option = document.createElement('option'); option.textContent = state.skipDate; $('#deliveryDate').appendChild(option);
    $('#deliveryDate').value = state.skipDate;
  }
}
function openShop() {
  const items = Object.entries(catalog).map(([id, p]) => `<div class="add-row"><div class="mini-thumb">${p.icon}</div><div class="add-info"><b>${p.name}</b><small>₹${p.price.toLocaleString('en-IN')} · ${p.desc.split(' · ')[0]}</small></div><button class="add-btn" data-action="shop-add" data-id="${id}">${$(`.product[data-id="${id}"]`) ? '✓ Added' : '+ Add'}</button></div>`).join('');
  openModal('Shop pet favorites', `<p>Add something extra to your next box. Your box total updates instantly.</p>${items}`, '<button class="btn btn-primary" data-action="close">Keep browsing</button>');
}
function openPets() {
  const otherPets = state.pets.map(p => `<div class="add-row"><div class="mini-thumb">🐾</div><div class="add-info"><b>${escapeHtml(p)}</b><small>Pet profile</small></div><button class="add-btn" data-action="select-pet" data-name="${escapeHtml(p)}">View</button></div>`).join('');
  openModal('Your pets', `<p>Keep each pet’s favorites and delivery plan organized in one place.</p><div class="add-row"><div class="mini-thumb">🐕</div><div class="add-info"><b>${escapeHtml(state.petName)}</b><small>Dog · Food & play essentials</small></div><span class="status">ACTIVE</span></div>${otherPets}<label for="newPetName">Add a pet</label><input id="newPetName" placeholder="Pet’s name" maxlength="24" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;background:#fffefa">`, '<button class="btn btn-outline" data-action="close">Close</button><button class="btn btn-primary" data-action="save-pet">Add pet</button>');
}
function openHistory() {
  openModal('Delivery history', '<p>Recent boxes for your household.</p><div style="background:#edf1e8;border-radius:12px;padding:13px;font-size:12px;line-height:1.9"><b>📦 Nov 4 · On the way</b><br><span style="color:#777c70">Food & play essentials · ₹2,547</span></div><div style="background:#f4f2ec;border-radius:12px;padding:13px;font-size:12px;line-height:1.9;margin-top:9px"><b>✓ Oct 7 · Delivered</b><br><span style="color:#777c70">Food & play essentials · ₹2,547</span></div><div style="background:#f4f2ec;border-radius:12px;padding:13px;font-size:12px;line-height:1.9;margin-top:9px"><b>✓ Sep 9 · Delivered</b><br><span style="color:#777c70">Food & play essentials · ₹2,399</span></div>');
}
function openProfile() {
  openModal('Your account', '<p>Account details for your Paw Parcel profile.</p><div style="background:#f4f2ec;border-radius:12px;padding:14px;font-size:12px;line-height:1.9"><b>Jamie Parker</b><br><span style="color:#777c70">jamie@email.com</span><br><span style="color:#777c70">Delivery address · Phagwara, Punjab</span></div>', '<button class="btn btn-outline" data-action="close">Close</button><button class="btn btn-primary" data-action="account-help">Get account help</button>');
}
function setPaused(value, notify = true) {
  state.paused = value;
  const badge = $('.status');
  const button = $('#pauseBtn');
  if (value) {
    badge.textContent = 'Ⅱ PAUSED'; badge.style.cssText = 'background:#fff0e9;color:#bd6043';
    button.textContent = 'Resume plan'; button.classList.remove('btn-orange'); button.classList.add('btn-primary');
  } else {
    badge.textContent = '● ACTIVE'; badge.style.cssText = '';
    button.textContent = 'Pause plan'; button.classList.add('btn-orange'); button.classList.remove('btn-primary');
  }
  save();
  if (notify) showToast(value ? 'Plan paused. No boxes will ship for now.' : 'Plan resumed — the next box is back on track! 🐾');
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

applySavedState();
$('#productList').addEventListener('click', e => {
  const btn = e.target.closest('[data-change]');
  if (!btn) return;
  const row = btn.closest('.product');
  const q = $('.qty span', row);
  const next = Number(q.textContent) + Number(btn.dataset.change);
  if (next < 1) { showToast('Each box needs at least one item. Add-ons can be removed from your box.'); return; }
  if (next > 5) { showToast('For bigger orders, our team can help!'); return; }
  q.textContent = next; state.quantities[row.dataset.id] = next; updateTotal(); save();
});
$('#closeModal').addEventListener('click', closeModal);
$('#modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
$('#modalActions').addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'close') closeModal();
  if (action === 'save-plan') {
    state.frequency = $('#frequency').value;
    const selectedDate = $('#deliveryDate').value;
    state.skipDate = selectedDate;
    $('.sub-label small').textContent = `Ships ${state.frequency.toLowerCase()} · Next box ${selectedDate.replace('Wednesday, ', '')}`;
    $('.ship-tag b').textContent = `Arriving ${selectedDate.replace('Wednesday, ', '')}`;
    save(); closeModal(); showToast('Subscription preferences saved! 🐾');
  }
  if (action === 'confirm-skip') {
    state.skipDate = 'Wednesday, December 2';
    $('.sub-label small').textContent = `Ships ${state.frequency.toLowerCase()} · Next box Dec 2`;
    $('.ship-tag b').textContent = `Arriving ${state.skipDate}`;
    $('.ship-tag').lastChild.textContent = 'Your delivery was rescheduled 📦';
    save(); closeModal(); showToast('Box skipped — your next delivery is December 2.');
  }
  if (action === 'confirm-pause') { closeModal(); setPaused(true); }
  if (action === 'account-help') { closeModal(); openModal('Account support', '<p>Email our pet people at <a href="mailto:hello@pawparcel.com" style="color:var(--green);font-weight:700">hello@pawparcel.com</a> and we’ll help with your account.</p>'); }
  if (action === 'save-pet') {
    const input = $('#newPetName'); const name = input?.value.trim();
    if (!name) { input?.focus(); showToast('Enter your pet’s name first.'); return; }
    state.pets.push(name); save(); closeModal(); setPetName(name); showToast(`${name}’s profile is ready! 🐾`);
  }
});
$('#modalBody').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]'); if (!btn) return;
  if (btn.dataset.action === 'shop-add') {
    const id = btn.dataset.id;
    addProduct(id);
    btn.textContent = '✓ Added';
  }
  if (btn.dataset.action === 'select-pet') { setPetName(btn.dataset.name); closeModal(); showToast(`Now viewing ${btn.dataset.name}’s plan.`); }
});
$('#editPlanTop').addEventListener('click', editPlan);
$('#manageBtn').addEventListener('click', editPlan);
$('#trackBtn').addEventListener('click', () => openModal('Your box is on its way!', '<p>Your box has left our warehouse and is heading to you.</p><div style="background:#edf1e8;border-radius:12px;padding:14px;font-size:12px;line-height:1.9"><b>✓</b> Order packed with love<br><b>✓</b> Picked up by carrier<br><span style="color:#7c8177">○ &nbsp;Out for delivery · Nov 4</span><br><span style="color:#7c8177">○ &nbsp;Delivered to your door</span></div><p style="font-size:10px">Tracking number: PP-4829-1037</p>'));
$('#skipBtn').addEventListener('click', () => openModal('Skip this box?', '<p>We’ll hold the current box and move your next delivery to December 2. Your subscription will stay active.</p><div style="background:#f3f2eb;border-radius:12px;padding:13px;font-size:12px"><b>New delivery date</b><br><span style="color:#777c70">Wednesday, December 2</span></div>', '<button class="btn btn-outline" data-action="close">Keep my box</button><button class="btn btn-primary" data-action="confirm-skip">Skip this box</button>'));
$('#pauseBtn').addEventListener('click', () => {
  if (state.paused) { setPaused(false); return; }
  openModal('Pause this plan?', '<p>Taking a little break is easy. Your plan and favorite items will be here when you’re ready.</p><label for="pauseLength">Pause for</label><select id="pauseLength"><option>One delivery</option><option>Two deliveries</option><option>Until I turn it back on</option></select>', '<button class="btn btn-outline" data-action="close">Never mind</button><button class="btn btn-primary" data-action="confirm-pause">Pause plan</button>');
});
$$('.add-row[data-add] .add-btn').forEach(btn => btn.addEventListener('click', () => addProduct(btn.closest('.add-row').dataset.add)));
$('#shopBtn').addEventListener('click', openShop);
$('#petSwitch').addEventListener('click', openPets);
$('#notifBtn').addEventListener('click', () => openModal('Notifications', '<p>You’re all caught up.</p><div style="background:#edf1e8;border-radius:12px;padding:13px;font-size:12px">📦 <b>Your next box is on its way</b><br><span style="color:#777c70">Expected Wednesday, November 4.</span></div>'));
$('#profileBtn').addEventListener('click', openProfile);
$('#helpLink').addEventListener('click', e => { e.preventDefault(); openModal('We’re here to help', '<p>Talk to our pet people about a delivery, product, or plan.</p><a href="mailto:hello@pawparcel.com" class="btn btn-primary" style="display:inline-block">Email hello@pawparcel.com</a>'); });
$('#menuBtn').addEventListener('click', () => openModal('Explore Paw Parcel', '<p>Choose a section below to continue.</p><div class="add-row"><button class="add-btn" data-action="go-shop">Shop</button><button class="add-btn" data-action="go-pets">Your pets</button><button class="add-btn" data-action="go-plan">Subscriptions</button></div>'));
$('#modalBody').addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'go-shop') { closeModal(); openShop(); }
  if (action === 'go-pets') { closeModal(); openPets(); }
  if (action === 'go-plan') { closeModal(); editPlan(); }
});
function navigate(page) {
  $$('.nav [data-page], .mobile-nav [data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $('#crumbCurrent').textContent = page === 'Home' ? 'Overview' : page;
  if (page === 'Subscriptions') editPlan();
  else if (page === 'Shop') openShop();
  else if (page === 'Your pets') openPets();
  else if (page === 'Delivery history') openHistory();
  else if (page === 'Profile') openProfile();
}
$$('[data-page]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.page)));
// Profile's overflow menu is a real shortcut, too.
if ($('.dots')) { $('.dots').style.cursor = 'pointer'; $('.dots').addEventListener('click', openProfile); }
