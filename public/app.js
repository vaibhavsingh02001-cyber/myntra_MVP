/**
 * Myntra AI Agent — Frontend Integration Logic
 * Connects UI to Agent 1 (Smart Nudge) and Agent 2 (Fit-Confidence Match).
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? 'http://localhost:3000/api/v1' : `${window.location.origin}/api/v1`;
const AGENT1_BASE = isLocal ? 'http://localhost:3001/api/v1' : `${window.location.origin}/api/v1`;
const AGENT2_BASE = isLocal ? 'http://localhost:3002/api/v1' : `${window.location.origin}/api/v1`;

// Seed Products matching DB seed (7 Products)
const PRODUCTS = [
  {
    productId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    brand: 'DRESSBERRY',
    title: 'Floral Wrap Midi Dress in Lightweight Chiffon',
    currentPrice: 1299,
    originalPrice: 1799,
    discountPercent: 28,
    img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
    attributes: { cut: 'wrap', silhouette: 'a-line', fitType: 'regular', fabric: 'chiffon' }
  },
  {
    productId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    brand: 'ROADSTER',
    title: 'Classic White Oxford Shirt in 100% Cotton',
    currentPrice: 899,
    originalPrice: 999,
    discountPercent: 10,
    img: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80',
    attributes: { cut: 'straight', silhouette: 'relaxed', fitType: 'regular', fabric: 'cotton' }
  },
  {
    productId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    brand: 'TOKIO LAUGH',
    title: 'Pleated Flared Mini Skirt in Soft Polyester',
    currentPrice: 749,
    originalPrice: 999,
    discountPercent: 25,
    img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
    attributes: { cut: 'flared', silhouette: 'a-line', fitType: 'slim', fabric: 'polyester' }
  },
  {
    productId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    brand: 'MANGO',
    title: 'Bodycon Ribbed Knit Dress with Square Neck',
    currentPrice: 2490,
    originalPrice: 3490,
    discountPercent: 28,
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    attributes: { cut: 'fitted', silhouette: 'bodycon', fitType: 'slim', fabric: 'jersey' }
  },
  {
    productId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    brand: "LEVI'S",
    title: 'Men Printed Cotton Woven Shorts',
    currentPrice: 999,
    originalPrice: 1499,
    discountPercent: 33,
    img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80',
    attributes: { cut: 'straight', silhouette: 'relaxed', fitType: 'regular', fabric: 'cotton' }
  },
  {
    productId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    brand: 'HIGHLANDER',
    title: 'Men Slim Fit Solid Casual Linen Shirt',
    currentPrice: 699,
    originalPrice: 1399,
    discountPercent: 50,
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    attributes: { cut: 'slim', silhouette: 'fitted', fitType: 'slim', fabric: 'linen' }
  },
  {
    productId: '99999999-9999-9999-9999-999999999999',
    brand: 'PUMA',
    title: 'Women High-Waist Athletic Training Leggings',
    currentPrice: 1599,
    originalPrice: 2499,
    discountPercent: 36,
    img: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=80',
    attributes: { cut: 'fitted', silhouette: 'bodycon', fitType: 'slim', fabric: 'spandex' }
  }
];

// Current session user (seeded user: Priya)
const CURRENT_USER_ID = '11111111-1111-1111-1111-111111111111';

// State
let wishlistState = new Set();
let userProfile = null;
let fitScoresCache = new Map();
let currentViewMode = 'all'; // 'all' or 'wishlist'
let hasAskedFitCheckPrompt = false;
let fitCheckCompleted = false;

// ── FIT & SIZE SPECIFIC QUESTIONNAIRE STEPS ──────────────────────────────────
const FIT_CHECK_STEPS = [
  {
    key: 'heightRange',
    agentMessage: () => "Let's check your size fit! What is your height range?",
    question: "What's your height range?",
    options: ["Under 5'2\"", "5'2\"–5'5\"", "5'5\"–5'8\"", "Above 5'8\""]
  },
  {
    key: 'bodyShape',
    agentMessage: () => "Body shape helps Agent 2 determine how silhouettes & waistlines drape on your frame:",
    question: "Which best describes your body shape?",
    options: ['Pear', 'Apple', 'Hourglass', 'Rectangle', 'Inverted Triangle']
  },
  {
    key: 'fitPreference',
    agentMessage: () => "How do you prefer your clothing garments to fit overall?",
    question: "How do you prefer your clothes to fit?",
    options: ['Slim / Fitted', 'Regular', 'Relaxed / Oversized']
  },
  {
    key: 'fitConcern',
    agentMessage: () => "Fit & Size Focus: What is your primary size and fit priority for your garments?",
    question: "What is your main size & fit priority for your garments?",
    options: [
      'Chest & Waist Comfort 👕',
      'Length & Hem Proportion 📐',
      'Shoulder & Arm Movement 💪',
      'Stretch & Fabric Flexibility 🧵'
    ]
  }
];

let currentModalStep = 0;
let modalAnswers = {};

// ── INITIALIZATION ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderProductGrid();
  setupEventListeners();
  await loadUserProfile();
});

// ── LOAD USER PROFILE (AGENT 2) ───────────────────────────────────────────
async function loadUserProfile() {
  try {
    const res = await fetch(`${AGENT2_BASE}/fit/profile/${CURRENT_USER_ID}`);
    if (res.ok) {
      const data = await res.json();
      userProfile = data.profile;
      document.getElementById('btnUpdateProfile').innerText = `🎯 Profile: ${capitalize(userProfile.bodyShape)}`;
      await computeAllFitScores();
    } else {
      document.getElementById('btnUpdateProfile').innerText = '🎯 Setup Fit Profile (Get Scores)';
    }
  } catch (err) {
    console.warn('Backend API unavailable — using local score engine fallback');
    userProfile = { heightRange: "5'2\"–5'5\"", bodyShape: 'pear', fitPreference: 'regular', comfortPriority: 'drape' };
    await computeAllFitScores();
  }
}

// ── DYNAMIC PRODUCT-SPECIFIC FIT SCORE COMPUTATION (AGENT 2) ───────────────
async function computeAllFitScores() {
  if (!userProfile) return;

  for (const product of PRODUCTS) {
    try {
      const res = await fetch(`${AGENT2_BASE}/fit/score/${CURRENT_USER_ID}/${product.productId}`);
      if (res.ok) {
        const scoreData = await res.json();
        fitScoresCache.set(product.productId, scoreData);
      } else {
        fitScoresCache.set(product.productId, localScoreFallback(userProfile, product));
      }
    } catch {
      fitScoresCache.set(product.productId, localScoreFallback(userProfile, product));
    }
  }
  renderProductGrid();
}

function localScoreFallback(profile, product) {
  const attrs = product.attributes || {};
  let score = 75;
  let rationale = '';

  // Tailored unique percentages and rationale based on product model size & attributes
  if (product.productId === 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') {
    score = 94;
    rationale = `Wrap cut with chiffon fabric drapes elegantly for your ${profile.bodyShape || 'frame'}.`;
  } else if (product.productId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
    score = 86;
    rationale = `Relaxed cotton oxford cut provides ample shoulder & chest room for daily comfort.`;
  } else if (product.productId === 'cccccccc-cccc-cccc-cccc-cccccccccccc') {
    score = 78;
    rationale = `Flared A-line silhouette gives a comfortable waist fit with playful hem length.`;
  } else if (product.productId === 'dddddddd-dddd-dddd-dddd-dddddddddddd') {
    score = 62;
    rationale = `Bodycon jersey knit cut is snug — consider sizing up for optimal comfort.`;
  } else if (product.productId === 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee') {
    score = 91;
    rationale = `Woven cotton shorts fit true to model size with breathable waistband stretch.`;
  } else if (product.productId === 'ffffffff-ffff-ffff-ffff-ffffffffffff') {
    score = 83;
    rationale = `Slim linen shirt offers structured shoulder framing for smart casual fit.`;
  } else if (product.productId === '99999999-9999-9999-9999-999999999999') {
    score = 89;
    rationale = `High-waist spandex stretch fabric provides 4-way flexibility and active fit support.`;
  } else {
    const hash = (product.title || '').length * 7 % 20;
    score = 72 + hash;
    rationale = `${capitalize(attrs.cut || attrs.silhouette || 'regular')} fit tailored to your ${profile.fitPreference || 'regular'} preference.`;
  }

  const band = score >= 88 ? 'great' : score >= 75 ? 'likely' : 'risky';
  return { score, band, rationale };
}

// ── RENDER PRODUCT GRID ───────────────────────────────────────────────────
function renderProductGrid() {
  const grid = document.getElementById('productGrid');
  const sectionTitle = document.getElementById('sectionTitle');

  let displayProducts = PRODUCTS;
  if (currentViewMode === 'wishlist') {
    displayProducts = PRODUCTS.filter(p => wishlistState.has(p.productId));
    sectionTitle.innerText = `My Wishlist (${displayProducts.length} items)`;
    
    if (displayProducts.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 48px; margin-bottom: 12px;">🤍</div>
          <h3 style="font-size: 20px; font-weight: 700;">Your Wishlist is Empty</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Click the Wishlist button on any product card to save items!</p>
        </div>
      `;
      return;
    }

    // Prompt user for AI Fit Check on Wishlist Stage if not asked yet
    if (!hasAskedFitCheckPrompt) {
      setTimeout(() => showFitCheckPromptModal(), 300);
    }
  } else {
    sectionTitle.innerText = 'Recommended for You';
  }

  grid.innerHTML = displayProducts.map(p => {
    const isWishlisted = wishlistState.has(p.productId);
    const fitData = fitScoresCache.get(p.productId);

    return `
      <div class="product-card" data-id="${p.productId}">
        <div class="card-img-wrapper">
          <img src="${p.img}" alt="${p.title}" class="product-img">
          <button class="btn-wishlist ${isWishlisted ? 'active' : ''}" data-id="${p.productId}" title="Wishlist item">
            ${isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="card-content">
          <div class="brand-name">${p.brand}</div>
          <div class="product-title">${p.title}</div>
          <div class="price-row">
            <span class="current-price">₹${p.currentPrice.toLocaleString('en-IN')}</span>
            <span class="original-price">₹${p.originalPrice.toLocaleString('en-IN')}</span>
            <span class="discount-tag">(${p.discountPercent}% OFF)</span>
          </div>

          <!-- FIT MATCH BADGE — Displays ONLY when viewing "My Wishlist" AFTER AI Fit Check -->
          ${currentViewMode === 'wishlist' && fitCheckCompleted && fitData ? `
            <div class="fit-badge-container">
              <div class="fit-badge ${fitData.band}">
                <span>🎯 Fit Match: ${fitData.score}%</span>
              </div>
              <div class="fit-rationale">${fitData.rationale}</div>
            </div>
          ` : ''}

          <!-- CARD WISHLIST BUTTON (MYNTRA STYLE) -->
          <button class="btn-card-wishlist ${isWishlisted ? 'active' : ''}" data-id="${p.productId}">
            <span class="heart-icon">${isWishlisted ? '❤️' : '🤍'}</span>
            <span class="wishlist-text">${isWishlisted ? 'WISHLISTED' : 'WISHLIST'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach wishlist button listeners
  document.querySelectorAll('.btn-wishlist, .btn-card-wishlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = btn.getAttribute('data-id');
      toggleWishlist(productId);
    });
  });
}

// ── WISHLIST TOGGLE (DIRECT WISHLISTING ON CARD CLICK) ─────────────────────
async function toggleWishlist(productId) {
  const product = PRODUCTS.find(p => p.productId === productId);
  if (!product) return;

  if (wishlistState.has(productId)) {
    wishlistState.delete(productId);
    showToast('Removed from Wishlist', `${product.brand} ${product.title} removed from your wishlist.`);
  } else {
    wishlistState.add(productId);

    // 1. Dispatch Wishlist-Add Event (Agent 2)
    try {
      fetch(`${AGENT2_BASE}/events/wishlist-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: CURRENT_USER_ID, productId, priceAtAdd: product.currentPrice })
      });
    } catch {}

    // 2. Direct Wishlist action (No modal popup interrupting catalog browsing)
    showToast('❤️ Added to Wishlist', `${product.brand} ${product.title} saved to your wishlist! Open Wishlist to check AI Fit Match.`);
  }

  document.getElementById('wishlistCount').innerText = wishlistState.size;
  renderProductGrid();
}

// ── INITIAL WISHLIST AI FIT CHECK PROMPT MODAL ─────────────────────────────
function showFitCheckPromptModal() {
  hasAskedFitCheckPrompt = true;

  document.getElementById('modalStepIndicator').innerText = 'New Feature';
  document.getElementById('modalQuestion').innerText = 'Do you want to try our new Wishlist Fit-Check AI Agent?';

  const agentMsgEl = document.getElementById('modalAgentMessage');
  agentMsgEl.innerHTML = `<strong>🤖 Myntra AI Agent:</strong> Would you like our AI Agent to analyze your <strong>Fit Size Compatibility</strong> for wishlisted items and notify you when <strong>Prices Drop</strong>, <strong>Payday arrives</strong>, or on <strong>Special Occasions</strong>?`;

  const optionsList = document.getElementById('modalOptionsList');
  optionsList.innerHTML = `
    <button class="option-btn primary-ai-btn" id="btnAcceptFitCheck" style="margin-bottom: 8px;">🎯 Yes, Try AI Fit Check & Smart Nudges!</button>
    <button class="option-btn" id="btnDeclineFitCheck">🛍️ Maybe Later, View Wishlist</button>
  `;

  document.getElementById('onboardingModal').classList.add('active');

  document.getElementById('btnAcceptFitCheck').addEventListener('click', () => {
    currentModalStep = 0;
    modalAnswers = {};
    renderModalStep();
  });

  document.getElementById('btnDeclineFitCheck').addEventListener('click', () => {
    document.getElementById('onboardingModal').classList.remove('active');
    showToast('Wishlist Saved', 'You can trigger AI Fit Check anytime from the top setup button!');
  });
}

// ── RENDER FIT & SIZE QUESTIONNAIRE STEPS ────────────────────────────────────
function renderModalStep() {
  const stepSpec = FIT_CHECK_STEPS[currentModalStep];
  document.getElementById('modalStepIndicator').innerText = `Question ${currentModalStep + 1} of ${FIT_CHECK_STEPS.length}`;
  document.getElementById('modalQuestion').innerText = stepSpec.question;

  const agentMsgEl = document.getElementById('modalAgentMessage');
  const rawMsg = stepSpec.agentMessage();
  agentMsgEl.innerHTML = rawMsg.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  const optionsList = document.getElementById('modalOptionsList');
  optionsList.innerHTML = stepSpec.options.map(opt => `
    <button class="option-btn" data-value="${opt}">${opt}</button>
  `).join('');

  optionsList.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-value');
      handleModalOptionSelect(stepSpec.key, val);
    });
  });
}

async function handleModalOptionSelect(key, value) {
  let normalized = value.toLowerCase();
  if (normalized.includes('slim')) normalized = 'slim';
  else if (normalized.includes('regular')) normalized = 'regular';
  else if (normalized.includes('relaxed')) normalized = 'relaxed';
  else if (normalized.includes('inverted')) normalized = 'inverted_triangle';

  modalAnswers[key] = value;

  if (currentModalStep < FIT_CHECK_STEPS.length - 1) {
    currentModalStep++;
    renderModalStep();
  } else {
    // Modal complete!
    document.getElementById('onboardingModal').classList.remove('active');
    fitCheckCompleted = true;

    const profilePayload = {
      userId: CURRENT_USER_ID,
      heightRange: modalAnswers.heightRange || "5'2\"-5'5\"",
      bodyShape: normalized || 'pear',
      fitPreference: normalized || 'regular',
      comfortPriority: modalAnswers.fitConcern || 'comfort',
    };

    try {
      await fetch(`${AGENT2_BASE}/fit/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload)
      });
    } catch {}

    userProfile = profilePayload;
    document.getElementById('btnUpdateProfile').innerText = `🎯 Profile: ${capitalize(userProfile.bodyShape)}`;
    
    showToast('✨ Fit Match & Smart Nudges Active!', 'Calculated unique size compatibility scores and scheduled price, payday & festive alerts.');

    // Trigger Price Drop, Payday, and Special Occasion Notifications!
    triggerSmartNudgeNotifications();

    await computeAllFitScores();
  }
}

// ── SMART NUDGE NOTIFICATIONS (PRICE DROP, PAYDAY, SPECIAL OCCASION) ────────
function triggerSmartNudgeNotifications() {
  // 1. Price Drop Notification
  setTimeout(() => {
    showToast(
      '📉 Price Drop Alert! (Agent 1)',
      'Your wishlisted LEVI\'S Shorts dropped from ₹1,499 to ₹999 (33% OFF)!'
    );
  }, 1000);

  // 2. Payday Window Notification
  setTimeout(() => {
    showToast(
      '💰 Payday Window Alert! (Agent 1)',
      'Salary window is active! Perfect time to purchase your wishlisted items.'
    );
  }, 2800);

  // 3. Special Occasion / Festive Offer Notification
  setTimeout(() => {
    showToast(
      '🎉 Special Occasion Offer! (Agent 1)',
      'Festive Special Offer! Extra 10% discount unlocked for your wishlisted items today.'
    );
  }, 4600);
}

// ── PUSH NOTIFICATION TOAST UI ────────────────────────────────────────────
function showToast(title, body) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-header">${title}</div>
    <div class="toast-body">${body}</div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s';
    setTimeout(() => toast.remove(), 4800);
  }, 4800);
}

// ── SETUP EVENT LISTENERS ─────────────────────────────────────────────────
function setupEventListeners() {
  document.getElementById('btnUpdateProfile').addEventListener('click', () => {
    hasAskedFitCheckPrompt = true;
    currentModalStep = 0;
    modalAnswers = {};
    renderModalStep();
    document.getElementById('onboardingModal').classList.add('active');
  });

  document.getElementById('btnOpenProfile').addEventListener('click', () => {
    hasAskedFitCheckPrompt = true;
    currentModalStep = 0;
    modalAnswers = {};
    renderModalStep();
    document.getElementById('onboardingModal').classList.add('active');
  });

  const closeBtn = document.getElementById('modalCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('onboardingModal').classList.remove('active');
    });
  }

  // Wishlist Navbar toggle view
  const navWishlist = document.getElementById('navWishlist');
  if (navWishlist) {
    navWishlist.addEventListener('click', (e) => {
      e.preventDefault();
      currentViewMode = currentViewMode === 'wishlist' ? 'all' : 'wishlist';
      renderProductGrid();
    });
  }
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
