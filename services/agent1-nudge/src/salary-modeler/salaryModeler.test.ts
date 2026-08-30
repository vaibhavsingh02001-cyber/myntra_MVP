import { SalaryModeler } from './salaryModeler';

describe('SalaryModeler.inferProfile', () => {
  // ── EARLY profile ──────────────────────────────────────────────────────
  it('returns EARLY when ≥60% orders fall in days 1–7', () => {
    const days = [2, 3, 1, 5, 4, 20, 22]; // 5/7 = 71% early
    expect(SalaryModeler.inferProfile(days)).toBe('EARLY');
  });

  it('returns EARLY for exactly 60% early orders', () => {
    const days = [1, 2, 3, 15, 20, 28]; // 3/6 = 50% — NOT early
    expect(SalaryModeler.inferProfile(days)).toBe('IRREGULAR');
  });

  it('classifies a strongly early user correctly', () => {
    const days = [1, 2, 3, 4, 5, 6, 7]; // 100% early
    expect(SalaryModeler.inferProfile(days)).toBe('EARLY');
  });

  // ── LATE profile ───────────────────────────────────────────────────────
  it('returns LATE when ≥60% orders fall in days 25–31', () => {
    const days = [28, 29, 30, 31, 27, 5, 10]; // 5/7 = 71% late
    expect(SalaryModeler.inferProfile(days)).toBe('LATE');
  });

  it('returns LATE for exactly 60% late orders', () => {
    const days = [25, 28, 30, 10, 14, 20]; // 3/6 = 50% — NOT late
    expect(SalaryModeler.inferProfile(days)).toBe('IRREGULAR');
  });

  // ── IRREGULAR profile ──────────────────────────────────────────────────
  it('returns IRREGULAR when fewer than 3 orders', () => {
    expect(SalaryModeler.inferProfile([])).toBe('IRREGULAR');
    expect(SalaryModeler.inferProfile([5])).toBe('IRREGULAR');
    expect(SalaryModeler.inferProfile([5, 15])).toBe('IRREGULAR');
  });

  it('returns IRREGULAR for scattered purchase days', () => {
    const days = [3, 10, 17, 22, 28, 5, 14, 21]; // mixed
    expect(SalaryModeler.inferProfile(days)).toBe('IRREGULAR');
  });

  it('returns IRREGULAR when no clear majority', () => {
    const days = [1, 2, 25, 26, 15]; // 2 early + 2 late = both 40% < 60%
    expect(SalaryModeler.inferProfile(days)).toBe('IRREGULAR');
  });

  // ── Edge cases ─────────────────────────────────────────────────────────
  it('handles exactly 3 orders correctly', () => {
    expect(SalaryModeler.inferProfile([1, 2, 3])).toBe('EARLY');   // 3/3 = 100%
    expect(SalaryModeler.inferProfile([28, 29, 30])).toBe('LATE'); // 3/3 = 100%
  });

  it('treats day 7 as early and day 25 as late', () => {
    const earlyDays = [7, 7, 7, 7, 14, 20]; // 4/6 = 67% early
    expect(SalaryModeler.inferProfile(earlyDays)).toBe('EARLY');

    const lateDays = [25, 25, 25, 25, 10, 14]; // 4/6 = 67% late
    expect(SalaryModeler.inferProfile(lateDays)).toBe('LATE');
  });
});
