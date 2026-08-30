import { AttributeParser } from './attributeParser';

jest.mock('../../../../shared/db/client', () => ({
  db: { query: jest.fn().mockResolvedValue({ rowCount: 1 }) },
}));

describe('AttributeParser', () => {
  describe('extract', () => {
    it('correctly maps DB row fields to ProductAttributes', () => {
      const row = {
        attr_cut: 'wrap',
        attr_fabric: 'chiffon',
        attr_silhouette: 'a-line',
        attr_fit_type: 'regular',
        attr_length: 'midi',
        attr_source: 'structured',
      };

      const attrs = AttributeParser.extract(row);
      expect(attrs.cut).toBe('wrap');
      expect(attrs.fabric).toBe('chiffon');
      expect(attrs.silhouette).toBe('a-line');
      expect(attrs.isComplete()).toBe(true);
    });

    it('returns isComplete() = false when key attributes are missing', () => {
      const row = {
        attr_cut: null,
        attr_silhouette: null,
        attr_fabric: 'cotton',
      };

      const attrs = AttributeParser.extract(row);
      expect(attrs.isComplete()).toBe(false);
    });
  });
});
