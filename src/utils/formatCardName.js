/**
 * Formats a tarot card name to title case
 * @param {string} cardName - The card name to format
 * @returns {string} The formatted card name
 */
function formatCardName(cardName) {
  if (!cardName) return '';
  
  return cardName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = formatCardName;
