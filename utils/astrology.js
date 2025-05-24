const moment = require('moment-timezone');
const enhancedCardData = require('../data/enhanced-card-data.json');

class AstrologyUtils {
  constructor() {
    this.moonPhases = enhancedCardData.moonPhases;
  }

  // Calculate current moon phase based on date
  getCurrentMoonPhase() {
    const now = moment().tz('Asia/Manila');
    
    // Simplified moon phase calculation
    // In a real implementation, you'd use an astronomy library
    const dayOfMonth = now.date();
    
    if (dayOfMonth >= 1 && dayOfMonth <= 3) {
      return 'new_moon';
    } else if (dayOfMonth >= 4 && dayOfMonth <= 7) {
      return 'waxing_crescent';
    } else if (dayOfMonth >= 8 && dayOfMonth <= 10) {
      return 'first_quarter';
    } else if (dayOfMonth >= 11 && dayOfMonth <= 14) {
      return 'waxing_gibbous';
    } else if (dayOfMonth >= 15 && dayOfMonth <= 17) {
      return 'full_moon';
    } else if (dayOfMonth >= 18 && dayOfMonth <= 21) {
      return 'waning_gibbous';
    } else if (dayOfMonth >= 22 && dayOfMonth <= 25) {
      return 'last_quarter';
    } else {
      return 'waning_crescent';
    }
  }

  // Get moon phase information
  getMoonPhaseInfo(phase = null) {
    const currentPhase = phase || this.getCurrentMoonPhase();
    return {
      phase: currentPhase,
      ...this.moonPhases[currentPhase]
    };
  }

  // Get astrological influence for a reading
  getAstrologicalInfluence() {
    const moonPhase = this.getMoonPhaseInfo();
    const planetaryInfluence = this.getCurrentPlanetaryInfluence();
    
    return {
      moon: moonPhase,
      planetary: planetaryInfluence,
      recommendation: this.getTimingRecommendation(moonPhase, planetaryInfluence)
    };
  }

  // Get current planetary influence (simplified)
  getCurrentPlanetaryInfluence() {
    const now = moment().tz('Asia/Manila');
    const dayOfWeek = now.day(); // 0 = Sunday, 1 = Monday, etc.
    
    const planetaryDays = {
      0: { planet: 'Sun', influence: 'Leadership, vitality, self-expression', energy: 'Yang' },
      1: { planet: 'Moon', influence: 'Intuition, emotions, subconscious', energy: 'Yin' },
      2: { planet: 'Mars', influence: 'Action, courage, conflict resolution', energy: 'Yang' },
      3: { planet: 'Mercury', influence: 'Communication, learning, travel', energy: 'Neutral' },
      4: { planet: 'Jupiter', influence: 'Expansion, wisdom, good fortune', energy: 'Yang' },
      5: { planet: 'Venus', influence: 'Love, beauty, relationships, harmony', energy: 'Yin' },
      6: { planet: 'Saturn', influence: 'Discipline, responsibility, life lessons', energy: 'Neutral' }
    };

    return planetaryDays[dayOfWeek];
  }

  // Get timing recommendation based on astrological factors
  getTimingRecommendation(moonPhase, planetaryInfluence) {
    const recommendations = {
      new_moon: {
        best_for: ['new beginnings', 'setting intentions', 'planning'],
        avoid: ['major decisions', 'endings', 'confrontations']
      },
      waxing_crescent: {
        best_for: ['taking action', 'building momentum', 'starting projects'],
        avoid: ['giving up', 'major changes', 'rushing']
      },
      first_quarter: {
        best_for: ['overcoming challenges', 'making decisions', 'problem solving'],
        avoid: ['avoiding conflict', 'procrastination', 'indecision']
      },
      waxing_gibbous: {
        best_for: ['refinement', 'patience', 'steady progress'],
        avoid: ['impatience', 'major changes', 'giving up']
      },
      full_moon: {
        best_for: ['manifestation', 'completion', 'celebration'],
        avoid: ['starting new things', 'major decisions', 'emotional reactions']
      },
      waning_gibbous: {
        best_for: ['gratitude', 'sharing wisdom', 'teaching'],
        avoid: ['selfishness', 'hoarding', 'isolation']
      },
      last_quarter: {
        best_for: ['releasing', 'forgiveness', 'letting go'],
        avoid: ['holding grudges', 'starting new projects', 'accumulating']
      },
      waning_crescent: {
        best_for: ['rest', 'reflection', 'preparation'],
        avoid: ['major activities', 'stress', 'overexertion']
      }
    };

    const moonRec = recommendations[moonPhase.phase];
    
    return {
      moon_guidance: moonRec,
      planetary_guidance: {
        planet: planetaryInfluence.planet,
        focus: planetaryInfluence.influence,
        energy_type: planetaryInfluence.energy
      },
      overall_advice: this.generateOverallAdvice(moonPhase, planetaryInfluence, moonRec)
    };
  }

  // Generate overall astrological advice
  generateOverallAdvice(moonPhase, planetaryInfluence, moonRec) {
    const advice = [];
    
    // Moon phase advice
    advice.push(`The ${moonPhase.phase.replace('_', ' ')} brings energy of ${moonPhase.energy.toLowerCase()}.`);
    
    // Planetary advice
    advice.push(`${planetaryInfluence.planet}'s influence today emphasizes ${planetaryInfluence.influence.toLowerCase()}.`);
    
    // Combined timing advice
    if (moonRec.best_for.length > 0) {
      advice.push(`This is an excellent time for ${moonRec.best_for.slice(0, 2).join(' and ')}.`);
    }
    
    return advice.join(' ');
  }

  // Get astrological correspondences for a card
  getCardAstrology(cardName) {
    // Major Arcana astrological correspondences
    const majorArcanaAstrology = {
      'The Fool': { sign: 'Uranus', element: 'Air', keywords: ['freedom', 'innovation', 'rebellion'] },
      'The Magician': { sign: 'Mercury', element: 'Air', keywords: ['communication', 'skill', 'manifestation'] },
      'The High Priestess': { sign: 'Moon', element: 'Water', keywords: ['intuition', 'mystery', 'subconscious'] },
      'The Empress': { sign: 'Venus', element: 'Earth', keywords: ['fertility', 'abundance', 'nurturing'] },
      'The Emperor': { sign: 'Aries', element: 'Fire', keywords: ['authority', 'structure', 'leadership'] },
      'The Hierophant': { sign: 'Taurus', element: 'Earth', keywords: ['tradition', 'teaching', 'conformity'] },
      'The Lovers': { sign: 'Gemini', element: 'Air', keywords: ['choice', 'relationships', 'harmony'] },
      'The Chariot': { sign: 'Cancer', element: 'Water', keywords: ['determination', 'control', 'victory'] },
      'Strength': { sign: 'Leo', element: 'Fire', keywords: ['courage', 'inner strength', 'compassion'] },
      'The Hermit': { sign: 'Virgo', element: 'Earth', keywords: ['introspection', 'guidance', 'wisdom'] },
      'Wheel of Fortune': { sign: 'Jupiter', element: 'Fire', keywords: ['luck', 'cycles', 'destiny'] },
      'Justice': { sign: 'Libra', element: 'Air', keywords: ['balance', 'fairness', 'truth'] },
      'The Hanged Man': { sign: 'Neptune', element: 'Water', keywords: ['sacrifice', 'surrender', 'perspective'] },
      'Death': { sign: 'Scorpio', element: 'Water', keywords: ['transformation', 'endings', 'rebirth'] },
      'Temperance': { sign: 'Sagittarius', element: 'Fire', keywords: ['moderation', 'patience', 'purpose'] },
      'The Devil': { sign: 'Capricorn', element: 'Earth', keywords: ['bondage', 'materialism', 'temptation'] },
      'The Tower': { sign: 'Mars', element: 'Fire', keywords: ['destruction', 'revelation', 'awakening'] },
      'The Star': { sign: 'Aquarius', element: 'Air', keywords: ['hope', 'inspiration', 'spirituality'] },
      'The Moon': { sign: 'Pisces', element: 'Water', keywords: ['illusion', 'intuition', 'subconscious'] },
      'The Sun': { sign: 'Sun', element: 'Fire', keywords: ['joy', 'success', 'vitality'] },
      'Judgement': { sign: 'Pluto', element: 'Fire', keywords: ['rebirth', 'inner calling', 'absolution'] },
      'The World': { sign: 'Saturn', element: 'Earth', keywords: ['completion', 'accomplishment', 'travel'] }
    };

    // Minor Arcana suit correspondences
    const suitAstrology = {
      'Cups': { element: 'Water', signs: ['Cancer', 'Scorpio', 'Pisces'], themes: ['emotions', 'relationships', 'spirituality'] },
      'Wands': { element: 'Fire', signs: ['Aries', 'Leo', 'Sagittarius'], themes: ['passion', 'creativity', 'action'] },
      'Swords': { element: 'Air', signs: ['Gemini', 'Libra', 'Aquarius'], themes: ['thoughts', 'communication', 'conflict'] },
      'Pentacles': { element: 'Earth', signs: ['Taurus', 'Virgo', 'Capricorn'], themes: ['material', 'practical', 'physical'] }
    };

    // Check if it's a Major Arcana card
    if (majorArcanaAstrology[cardName]) {
      return {
        type: 'Major Arcana',
        ...majorArcanaAstrology[cardName]
      };
    }

    // Check for Minor Arcana suits
    for (const [suit, astrology] of Object.entries(suitAstrology)) {
      if (cardName.includes(suit.slice(0, -1))) { // Remove 's' from suit name
        return {
          type: 'Minor Arcana',
          suit: suit,
          ...astrology
        };
      }
    }

    return null;
  }

  // Format astrological information for display
  formatAstrologyInfo(astrology) {
    if (!astrology) return null;

    const moonInfo = astrology.moon;
    const planetaryInfo = astrology.planetary;
    const recommendation = astrology.recommendation;

    return {
      title: '🌙 Astrological Influences',
      fields: [
        {
          name: `${this.getMoonEmoji(moonInfo.phase)} Moon Phase: ${this.formatPhaseName(moonInfo.phase)}`,
          value: moonInfo.energy,
          inline: false
        },
        {
          name: `🪐 Planetary Influence: ${planetaryInfo.planet}`,
          value: planetaryInfo.influence,
          inline: false
        },
        {
          name: '⭐ Cosmic Guidance',
          value: recommendation.overall_advice,
          inline: false
        }
      ]
    };
  }

  // Get moon phase emoji
  getMoonEmoji(phase) {
    const emojis = {
      new_moon: '🌑',
      waxing_crescent: '🌒',
      first_quarter: '🌓',
      waxing_gibbous: '🌔',
      full_moon: '🌕',
      waning_gibbous: '🌖',
      last_quarter: '🌗',
      waning_crescent: '🌘'
    };
    return emojis[phase] || '🌙';
  }

  // Format phase name for display
  formatPhaseName(phase) {
    return phase.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}

module.exports = AstrologyUtils;
