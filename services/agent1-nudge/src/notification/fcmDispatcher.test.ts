import { NudgeTemplates } from './templates';

describe('NudgeTemplates', () => {
  describe('price_drop', () => {
    it('includes old and new price in the body', () => {
      const n = NudgeTemplates.price_drop('Floral Dress', 1799, 1299);
      expect(n.title).toContain('Price Drop');
      expect(n.body).toContain('₹1,799');
      expect(n.body).toContain('₹1,299');
    });

    it('truncates long product titles to ≤ 42 chars (40 + ellipsis)', () => {
      const longTitle = 'A'.repeat(60);
      const n = NudgeTemplates.price_drop(longTitle, 500, 400);
      expect(n.body.length).toBeLessThan(200);
      expect(n.body).toContain('…');
    });

    it('formats prices with Indian locale commas', () => {
      const n = NudgeTemplates.price_drop('Item', 10000, 8999);
      expect(n.body).toContain('10,000');
      expect(n.body).toContain('8,999');
    });
  });

  describe('salary_day', () => {
    it('uses singular form for 1 item', () => {
      const n = NudgeTemplates.salary_day(1);
      expect(n.body).toContain('item is waiting');
    });

    it('uses plural form for multiple items', () => {
      const n = NudgeTemplates.salary_day(5);
      expect(n.body).toContain('5 wishlisted items');
    });

    it('has the 💰 emoji in the title', () => {
      expect(NudgeTemplates.salary_day(2).title).toContain('💰');
    });
  });

  describe('expiry', () => {
    it('includes days count in the body', () => {
      const n = NudgeTemplates.expiry('Pleated Skirt', 25);
      expect(n.body).toContain('25 days');
    });

    it('uses singular "day" for 1 day', () => {
      const n = NudgeTemplates.expiry('Item', 1);
      expect(n.body).toContain('1 day');
      expect(n.body).not.toContain('1 days');
    });

    it('has the ⏳ emoji in title', () => {
      expect(NudgeTemplates.expiry('Item', 20).title).toContain('⏳');
    });
  });

  describe('stock_alert', () => {
    it('shows remaining stock count', () => {
      const n = NudgeTemplates.stock_alert('White Oxford Shirt', 3);
      expect(n.body).toContain('3');
      expect(n.title).toContain('🔥');
    });

    it('truncates long product title', () => {
      const longTitle = 'B'.repeat(50);
      const n = NudgeTemplates.stock_alert(longTitle, 2);
      expect(n.body).toContain('…');
    });
  });
});
