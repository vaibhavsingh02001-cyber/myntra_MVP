/**
 * Dev seed script — populates the database with sample data for local testing.
 * Run: ts-node shared/db/seed.ts
 * WARNING: Only run in development. Clears existing seed data first.
 */
import { db } from './client';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('🌱 Starting seed...\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO users (
      user_id, email, device_token,
      body_shape, body_height_range, fit_preference, comfort_priority,
      salary_profile, avg_order_day, orders_per_month,
      notif_price_drop, notif_salary_nudge, notif_expiry, notif_stock_alert
    ) VALUES
    (
      '11111111-1111-1111-1111-111111111111',
      'priya@example.com',
      'fcm_token_priya_001',
      'pear', '5''2''-5''5''', 'regular', 'drape',
      'EARLY', 3, 2.5,
      TRUE, TRUE, TRUE, TRUE
    ),
    (
      '22222222-2222-2222-2222-222222222222',
      'ananya@example.com',
      'fcm_token_ananya_002',
      'hourglass', '5''5''-5''8''', 'slim', 'structure',
      'LATE', 29, 1.8,
      TRUE, FALSE, TRUE, TRUE
    ),
    (
      '33333333-3333-3333-3333-333333333333',
      'rahul@example.com',
      NULL,
      NULL, NULL, NULL, NULL,
      'IRREGULAR', NULL, 0.5,
      TRUE, TRUE, TRUE, TRUE
    )
    ON CONFLICT (user_id) DO NOTHING
  `);
  console.log('  ✅ Users seeded (3 records)');

  // ── Products ───────────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO products (
      product_id, external_id, title, category,
      current_price, stock_count,
      attr_cut, attr_fabric, attr_silhouette, attr_fit_type, attr_length,
      attr_source, description
    ) VALUES
    (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'MYN-DRESS-001',
      'Floral Wrap Midi Dress',
      'women/dresses',
      1299.00, 12,
      'wrap', 'chiffon', 'a-line', 'regular', 'midi',
      'structured',
      'A beautiful floral wrap dress in lightweight chiffon with an A-line silhouette.'
    ),
    (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'MYN-TOP-002',
      'Classic White Oxford Shirt',
      'men/shirts',
      899.00, 45,
      'straight', 'cotton', 'relaxed', 'regular', 'full',
      'structured',
      'A crisp white Oxford shirt crafted in 100% cotton with a relaxed straight cut.'
    ),
    (
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      'MYN-SKIRT-003',
      'Pleated Flared Mini Skirt',
      'women/skirts',
      749.00, 3,
      'flared', 'polyester', 'a-line', 'slim', 'mini',
      'structured',
      'A playful pleated flared mini skirt in lightweight polyester.'
    ),
    (
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'MYN-DRESS-004',
      'Bodycon Ribbed Knit Dress with Square Neck',
      'women/dresses',
      2490.00, 15,
      'fitted', 'jersey', 'bodycon', 'slim', 'midi',
      'structured',
      'Fitted ribbed knit bodycon dress with modern square neckline.'
    ),
    (
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      'MYN-SHORTS-005',
      'Men Printed Cotton Woven Shorts',
      'men/shorts',
      999.00, 20,
      'straight', 'cotton', 'relaxed', 'regular', 'short',
      'structured',
      'Levis Men Printed Cotton Woven Shorts in breathable cotton fabric.'
    ),
    (
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      'MYN-SHIRT-006',
      'Men Slim Fit Solid Casual Linen Shirt',
      'men/shirts',
      699.00, 30,
      'slim', 'linen', 'fitted', 'slim', 'full',
      'structured',
      'Highlander Men Slim Fit Solid Casual Linen Shirt.'
    ),
    (
      '99999999-9999-9999-9999-999999999999',
      'MYN-ACTIVE-007',
      'Women High-Waist Athletic Training Leggings',
      'women/activewear',
      1599.00, 25,
      'fitted', 'spandex', 'bodycon', 'slim', 'full',
      'structured',
      'Puma Women High-Waist Athletic Training Leggings.'
    )
    ON CONFLICT (product_id) DO NOTHING
  `);
  console.log('  ✅ Products seeded (7 records)');

  // ── Price History ──────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO product_price_history (product_id, price, recorded_at) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1799.00, NOW() - INTERVAL '25 days'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1599.00, NOW() - INTERVAL '10 days'),
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1299.00, NOW() - INTERVAL '2 days'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 999.00,  NOW() - INTERVAL '30 days'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 899.00,  NOW() - INTERVAL '5 days'),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', 999.00,  NOW() - INTERVAL '20 days'),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', 749.00,  NOW() - INTERVAL '3 days')
  `);
  console.log('  ✅ Price history seeded');

  // ── Wishlist Items ─────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO wishlist_items (user_id, product_id, price_at_add, added_at) VALUES
      ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1799.00, NOW() - INTERVAL '22 days'),
      ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 999.00,  NOW() - INTERVAL '5 days'),
      ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1799.00, NOW() - INTERVAL '8 days'),
      ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 999.00,  NOW() - INTERVAL '29 days')
    ON CONFLICT (user_id, product_id) DO NOTHING
  `);
  console.log('  ✅ Wishlist items seeded (4 records)');

  console.log('\n🎉 Database seeded successfully.');
  await db.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
