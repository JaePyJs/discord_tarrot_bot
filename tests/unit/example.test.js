const formatCardName = require('../../src/utils/formatCardName');

describe('formatCardName Utility', () => {
  it('should format card names with spaces and special characters', () => {
    expect(formatCardName('the fool')).toBe('The Fool');
    expect(formatCardName('ace of swords')).toBe('Ace Of Swords');
    expect(formatCardName('queen of pentacles')).toBe('Queen Of Pentacles');
  });

  it('should handle already formatted names', () => {
    expect(formatCardName('The Magician')).toBe('The Magician');
    expect(formatCardName('King of Wands')).toBe('King Of Wands');
  });

  it('should handle empty or invalid input', () => {
    expect(formatCardName('')).toBe('');
    expect(formatCardName(null)).toBe('');
    expect(formatCardName(undefined)).toBe('');
  });
});
