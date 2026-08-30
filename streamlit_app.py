import streamlit as st
import pandas as pd
import time

# ── PAGE CONFIG & STYLING ──────────────────────────────────────────────────
st.set_page_config(
    page_title="Myntra AI Agent System",
    page_icon="🛍️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Myntra aesthetics
st.markdown("""
    <style>
    :root {
        --myntra-pink: #ff3f6c;
        --myntra-orange: #f5a623;
        --myntra-dark: #282c3f;
    }
    
    .stApp {
        background-color: #fafbfc;
    }

    .main-header {
        background: linear-gradient(135deg, #282c3f 0%, #1a1c29 100%);
        padding: 24px 32px;
        border-radius: 16px;
        color: white;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .main-header h1 {
        color: white !important;
        font-size: 2.2rem !important;
        font-weight: 800 !important;
        margin: 0 !important;
    }
    .main-header p {
        color: #a9abb6 !important;
        font-size: 1.05rem !important;
        margin-top: 6px !important;
    }
    
    .badge-agent1 {
        background-color: rgba(255, 63, 108, 0.15);
        color: #ff3f6c;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;
        border: 1px solid rgba(255, 63, 108, 0.3);
    }
    .badge-agent2 {
        background-color: rgba(32, 201, 151, 0.15);
        color: #20c997;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;
        border: 1px solid rgba(32, 201, 151, 0.3);
    }
    
    .fit-badge-high {
        background: #e6f9f0;
        color: #0e8a50;
        padding: 6px 14px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.9rem;
        display: inline-block;
        border: 1px solid #b2eecf;
    }
    .fit-badge-good {
        background: #e8f4fe;
        color: #1877f2;
        padding: 6px 14px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.9rem;
        display: inline-block;
        border: 1px solid #b6dcfe;
    }
    .fit-badge-fair {
        background: #fff8e6;
        color: #d97706;
        padding: 6px 14px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.9rem;
        display: inline-block;
        border: 1px solid #fef08a;
    }
    
    .product-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        border: 1px solid #eaeaec;
        box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        margin-bottom: 20px;
        height: 100%;
    }
    </style>
""", unsafe_allow_html=True)

# ── PRODUCT CATALOG SEED DATA ──────────────────────────────────────────────
PRODUCTS = [
    {
        "productId": "p1",
        "brand": "DRESSBERRY",
        "title": "Floral Wrap Midi Dress in Lightweight Chiffon",
        "currentPrice": 1299,
        "originalPrice": 1799,
        "discountPercent": 28,
        "img": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80",
        "cut": "wrap", "silhouette": "a-line", "fitType": "regular", "fabric": "chiffon"
    },
    {
        "productId": "p2",
        "brand": "ROADSTER",
        "title": "Classic White Oxford Shirt in 100% Cotton",
        "currentPrice": 899,
        "originalPrice": 999,
        "discountPercent": 10,
        "img": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80",
        "cut": "straight", "silhouette": "relaxed", "fitType": "regular", "fabric": "cotton"
    },
    {
        "productId": "p3",
        "brand": "TOKIO LAUGH",
        "title": "Pleated Flared Mini Skirt in Soft Polyester",
        "currentPrice": 749,
        "originalPrice": 999,
        "discountPercent": 25,
        "img": "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80",
        "cut": "flared", "silhouette": "a-line", "fitType": "slim", "fabric": "polyester"
    },
    {
        "productId": "p4",
        "brand": "MANGO",
        "title": "Bodycon Ribbed Knit Dress with Square Neck",
        "currentPrice": 2490,
        "originalPrice": 3490,
        "discountPercent": 28,
        "img": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
        "cut": "fitted", "silhouette": "bodycon", "fitType": "slim", "fabric": "jersey"
    },
    {
        "productId": "p5",
        "brand": "LEVI'S",
        "title": "Men Printed Cotton Woven Shorts",
        "currentPrice": 999,
        "originalPrice": 1499,
        "discountPercent": 33,
        "img": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80",
        "cut": "straight", "silhouette": "relaxed", "fitType": "regular", "fabric": "cotton"
    },
    {
        "productId": "p6",
        "brand": "HIGHLANDER",
        "title": "Men Slim Fit Solid Casual Linen Shirt",
        "currentPrice": 699,
        "originalPrice": 1399,
        "discountPercent": 50,
        "img": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
        "cut": "slim", "silhouette": "fitted", "fitType": "slim", "fabric": "linen"
    },
    {
        "productId": "p7",
        "brand": "PUMA",
        "title": "Women High-Waist Athletic Training Leggings",
        "currentPrice": 1599,
        "originalPrice": 2499,
        "discountPercent": 36,
        "img": "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=80",
        "cut": "fitted", "silhouette": "bodycon", "fitType": "slim", "fabric": "spandex"
    }
]

# ── HEURISTIC SCORING ENGINE ───────────────────────────────────────────────
SILHOUETTE_MATRIX = {
    "pear": {"a-line": 1.0, "flared": 0.9, "wrap": 0.9, "relaxed": 0.7, "straight": 0.6, "fitted": 0.4, "bodycon": 0.2},
    "apple": {"wrap": 1.0, "relaxed": 0.9, "a-line": 0.8, "straight": 0.7, "flared": 0.6, "fitted": 0.3, "bodycon": 0.2},
    "hourglass": {"wrap": 1.0, "fitted": 0.9, "bodycon": 0.8, "a-line": 0.8, "straight": 0.7, "flared": 0.7, "relaxed": 0.6},
    "rectangle": {"flared": 0.9, "a-line": 0.8, "wrap": 0.8, "fitted": 0.7, "bodycon": 0.7, "straight": 0.6, "relaxed": 0.6},
    "inverted_triangle": {"flared": 1.0, "a-line": 0.9, "straight": 0.8, "wrap": 0.7, "relaxed": 0.7, "fitted": 0.5, "bodycon": 0.4}
}

FIT_PREF_MATRIX = {
    "slim": {"slim": 1.0, "regular": 0.6, "petite": 0.8},
    "regular": {"slim": 0.7, "regular": 1.0, "petite": 0.7},
    "relaxed": {"slim": 0.3, "regular": 0.7, "petite": 0.6}
}

def calculate_fit_score(user_shape, user_fit_pref, item):
    shape_scores = SILHOUETTE_MATRIX.get(user_shape, SILHOUETTE_MATRIX["hourglass"])
    silhouette_score = shape_scores.get(item["silhouette"], 0.7)
    cut_score = shape_scores.get(item["cut"], 0.7)
    
    pref_scores = FIT_PREF_MATRIX.get(user_fit_pref, FIT_PREF_MATRIX["regular"])
    fit_score = pref_scores.get(item["fitType"], 0.7)
    
    # Weighted average: 40% silhouette, 35% cut, 25% fit preference
    total = (silhouette_score * 0.40) + (cut_score * 0.35) + (fit_score * 0.25)
    return int(total * 100)

# ── SESSION STATE INITIALIZATION ──────────────────────────────────────────
if "wishlist" not in st.session_state:
    st.session_state.wishlist = set(["p1", "p5"])

if "notifications" not in st.session_state:
    st.session_state.notifications = [
        {"title": "📉 Price Drop Alert! (Agent 1)", "body": "Your wishlisted LEVI'S Shorts dropped from ₹1,499 to ₹999 (33% OFF)!", "time": "10 mins ago"},
        {"title": "💰 Payday Window Alert! (Agent 1)", "body": "Salary window is active! Perfect time to purchase your wishlisted items.", "time": "Just now"}
    ]

# ── HEADER BANNER ─────────────────────────────────────────────────────────
st.markdown("""
    <div class="main-header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>Myntra AI Agent System 🛍️</h1>
                <p>Wishlist-to-Purchase Conversion Engine Powered by Timing & Fit Confidence Matching</p>
            </div>
            <div>
                <span class="badge-agent1">🟢 Agent 1: Smart Nudge</span>
                <span class="badge-agent2" style="margin-left: 8px;">🟢 Agent 2: Fit Engine</span>
            </div>
        </div>
    </div>
""", unsafe_allow_html=True)

# ── SIDEBAR CONTROLS ──────────────────────────────────────────────────────
with st.sidebar:
    st.image("https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png", width=140)
    st.title("🎯 AI Agent Setup")
    
    st.markdown("### Agent 2: Fit Profile")
    body_shape = st.selectbox(
        "Body Shape",
        options=["hourglass", "pear", "apple", "rectangle", "inverted_triangle"],
        format_func=lambda x: x.replace("_", " ").title(),
        index=0
    )
    fit_pref = st.selectbox(
        "Preferred Fit",
        options=["slim", "regular", "relaxed"],
        format_func=lambda x: x.title(),
        index=1
    )
    height = st.slider("Height (cm)", 145, 200, 165)
    
    st.markdown("---")
    st.markdown("### Agent 1: Smart Nudge Simulation")
    payday_active = st.toggle("Payday Window Active (Month-End)", value=True)
    trigger_price_drop = st.button("🔔 Trigger Price Drop Alert")
    trigger_festive = st.button("🎉 Trigger Festive Offer Nudge")
    
    if trigger_price_drop:
        st.session_state.notifications.insert(0, {
            "title": "📉 Instant Price Drop Alert! (Agent 1)",
            "body": "Extra 15% discount unlocked on high fit-confidence items in your wishlist!",
            "time": "Just now"
        })
        st.toast("📉 Price drop alert generated!", icon="🔔")

    if trigger_festive:
        st.session_state.notifications.insert(0, {
            "title": "🎉 Festive Season Smart Nudge (Agent 1)",
            "body": "Special Diwali festive discount active for 2 hours on your saved sizes!",
            "time": "Just now"
        })
        st.toast("🎉 Festive nudge triggered!", icon="✨")

# ── MAIN TABS ─────────────────────────────────────────────────────────────
tab_catalog, tab_wishlist, tab_arch = st.tabs([
    "🛍️ Recommended Catalog & Fit Matches",
    f"❤️ My Wishlist ({len(st.session_state.wishlist)})",
    "🧠 AI Agent System Architecture"
])

# ── TAB 1: CATALOG & FIT MATCHES ──────────────────────────────────────────
with tab_catalog:
    st.subheader(f"Catalog for Body Shape: **{body_shape.replace('_', ' ').title()}** | Preferred Fit: **{fit_pref.title()}**")
    
    col_filter1, col_filter2 = st.columns([2, 2])
    with col_filter1:
        sort_by = st.selectbox("Sort Products By", ["Highest Fit Match Score", "Price: Low to High", "Discount %"])
    with col_filter2:
        search_query = st.text_input("Search catalog", placeholder="Search by brand or title...")
        
    # Calculate fit scores for all products
    scored_products = []
    for item in PRODUCTS:
        score = calculate_fit_score(body_shape, fit_pref, item)
        p = item.copy()
        p["fitScore"] = score
        scored_products.append(p)
        
    # Filtering & Sorting
    if search_query:
        scored_products = [p for p in scored_products if search_query.lower() in p["title"].lower() or search_query.lower() in p["brand"].lower()]
        
    if sort_by == "Highest Fit Match Score":
        scored_products.sort(key=lambda x: x["fitScore"], reverse=True)
    elif sort_by == "Price: Low to High":
        scored_products.sort(key=lambda x: x["currentPrice"])
    elif sort_by == "Discount %":
        scored_products.sort(key=lambda x: x["discountPercent"], reverse=True)

    # Render Product Grid (3 Columns)
    cols = st.columns(3)
    for index, item in enumerate(scored_products):
        col = cols[index % 3]
        with col:
            with st.container():
                st.image(item["img"], use_container_width=True)
                
                # Fit Score Badge
                score = item["fitScore"]
                if score >= 85:
                    badge_html = f'<div class="fit-badge-high">✨ High Match: {score}% Fit Confidence</div>'
                elif score >= 70:
                    badge_html = f'<div class="fit-badge-good">👍 Good Match: {score}% Fit Confidence</div>'
                else:
                    badge_html = f'<div class="fit-badge-fair">⚠️ Fair Match: {score}% Fit Confidence</div>'
                st.markdown(badge_html, unsafe_allow_html=True)
                
                st.markdown(f"**{item['brand']}**")
                st.write(item["title"])
                st.markdown(f"**₹{item['currentPrice']}** <span style='text-decoration:line-through; color:#888;'>₹{item['originalPrice']}</span> <span style='color:#ff3f6c;'>({item['discountPercent']}% OFF)</span>", unsafe_allow_html=True)
                st.caption(f"Cut: {item['cut'].title()} | Silhouette: {item['silhouette'].title()} | Fabric: {item['fabric'].title()}")
                
                # Wishlist Button Action
                is_wishlisted = item["productId"] in st.session_state.wishlist
                btn_label = "❤️ Saved to Wishlist" if is_wishlisted else "🤍 Add to Wishlist"
                
                if st.button(btn_label, key=f"btn_{item['productId']}"):
                    if is_wishlisted:
                        st.session_state.wishlist.remove(item["productId"])
                    else:
                        st.session_state.wishlist.add(item["productId"])
                    st.rerun()

# ── TAB 2: WISHLIST & SMART NUDGES ────────────────────────────────────────
with tab_wishlist:
    st.subheader("Your AI-Monitored Wishlist & Smart Nudges")
    
    col_wish, col_nudge = st.columns([3, 2])
    
    with col_wish:
        wishlisted_items = [p for p in PRODUCTS if p["productId"] in st.session_state.wishlist]
        if not wishlisted_items:
            st.info("Your wishlist is currently empty! Explore the catalog tab to add items.")
        else:
            for item in wishlisted_items:
                score = calculate_fit_score(body_shape, fit_pref, item)
                c1, c2, c3 = st.columns([1, 3, 1])
                with c1:
                    st.image(item["img"], width=90)
                with c2:
                    st.markdown(f"**{item['brand']}** - {item['title']}")
                    st.markdown(f"**₹{item['currentPrice']}** ({item['discountPercent']}% OFF)")
                    st.markdown(f"Fit Confidence: **{score}%**")
                with c3:
                    if st.button("Remove", key=f"rem_{item['productId']}"):
                        st.session_state.wishlist.remove(item["productId"])
                        st.rerun()
                st.markdown("---")
                
    with col_nudge:
        st.markdown("### 🔔 Active Agent 1 Push Notifications")
        if payday_active:
            st.success("💰 **Payday Trigger Active**: User salary window detected. Boosted purchase intent priority.")
        
        for notif in st.session_state.notifications:
            with st.expander(f"{notif['title']} — {notif['time']}", expanded=True):
                st.write(notif["body"])
                st.button("Claim Offer & Checkout", key=f"claim_{notif['title']}")

# ── TAB 3: ARCHITECTURE & SYSTEM OVERVIEW ────────────────────────────────
with tab_arch:
    st.subheader("Myntra Wishlist-to-Purchase AI Agent System Architecture")
    
    st.markdown("""
    ### 🏗️ Dual-Agent Architecture
    
    1. **Agent 1: Smart Nudge & Timing Engine**
       - **Price Drop Watcher**: Monitored price history; triggers pushes when drop exceeds 15%.
       - **Payday Modeler**: Analyzes user salary window (28th–5th) to time push notifications when liquidity is highest.
       - **Stock Expiry Watcher**: Alerts users when wishlist item inventory drops below threshold.
       
    2. **Agent 2: Fit-Confidence Match Engine**
       - **Body Silhouette Matrix**: Maps user height/weight/body shape (Hourglass, Pear, Apple, etc.) to product cuts and silhouettes.
       - **LLM Attribute Extractor**: Extracts structural attributes (`silhouette`, `cut`, `fabric`, `stretch`) from unstructured fashion text.
       - **Confidence Scoring**: Computes a weighted 0-100% Fit Match Badge for instant consumer confidence.
    """)
    
    st.info("Deployed live on Streamlit Cloud from `https://github.com/vaibhavsingh02001-cyber/myntra_MVP`")
