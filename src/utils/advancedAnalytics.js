const DatabaseManager = require('../database/DatabaseManager');
const moment = require('moment-timezone');
const logger = require('./logger');

class AdvancedAnalyticsEngine {
  constructor() {
    this.db = new DatabaseManager();
    this.timezone = 'Asia/Manila';
  }

  // Analyze user's reading patterns
  async analyzeUserPatterns(userId) {
    try {
      const readings = await this.db.getAllUserReadings(userId);
      
      if (readings.length === 0) {
        return {
          hasData: false,
          message: 'No readings found for analysis'
        };
      }

      const patterns = {
        hasData: true,
        totalReadings: readings.length,
        timePatterns: this.analyzeTimePatterns(readings),
        cardPatterns: this.analyzeCardPatterns(readings),
        spreadPreferences: this.analyzeSpreadPreferences(readings),
        emotionalJourney: this.analyzeEmotionalJourney(readings),
        cyclicalPatterns: this.analyzeCyclicalPatterns(readings),
        insights: this.generateInsights(readings),
        recommendations: this.generateRecommendations(readings)
      };

      return patterns;
    } catch (error) {
      logger.error('User pattern analysis failed:', error);
      throw error;
    }
  }

  // Analyze when user typically gets readings
  analyzeTimePatterns(readings) {
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);
    const monthCounts = new Array(12).fill(0);

    readings.forEach(reading => {
      const date = moment(reading.created_at).tz(this.timezone);
      hourCounts[date.hour()]++;
      dayOfWeekCounts[date.day()]++;
      monthCounts[date.month()]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
    const peakMonth = monthCounts.indexOf(Math.max(...monthCounts));

    return {
      peakHour,
      peakDay,
      peakMonth,
      hourDistribution: hourCounts,
      dayDistribution: dayOfWeekCounts,
      monthDistribution: monthCounts,
      preferredTime: this.getTimeDescription(peakHour),
      preferredDay: moment().day(peakDay).format('dddd'),
      preferredMonth: moment().month(peakMonth).format('MMMM')
    };
  }

  // Analyze which cards appear frequently
  analyzeCardPatterns(readings) {
    const cardCounts = {};
    const reversedCounts = {};
    const suitCounts = { cups: 0, wands: 0, swords: 0, pentacles: 0, major: 0 };

    readings.forEach(reading => {
      const cards = JSON.parse(reading.cards_drawn || reading.cards);
      
      cards.forEach(card => {
        // Count individual cards
        cardCounts[card.name] = (cardCounts[card.name] || 0) + 1;
        
        // Count reversed cards
        if (card.isReversed) {
          reversedCounts[card.name] = (reversedCounts[card.name] || 0) + 1;
        }

        // Count suits
        if (card.name.includes('Cup')) suitCounts.cups++;
        else if (card.name.includes('Wand')) suitCounts.wands++;
        else if (card.name.includes('Sword')) suitCounts.swords++;
        else if (card.name.includes('Pentacle')) suitCounts.pentacles++;
        else suitCounts.major++;
      });
    });

    // Find most frequent cards
    const sortedCards = Object.entries(cardCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    // Calculate reversal rate
    const totalCards = Object.values(cardCounts).reduce((sum, count) => sum + count, 0);
    const totalReversed = Object.values(reversedCounts).reduce((sum, count) => sum + count, 0);
    const reversalRate = totalCards > 0 ? (totalReversed / totalCards) * 100 : 0;

    return {
      mostFrequentCards: sortedCards,
      suitDistribution: suitCounts,
      reversalRate: Math.round(reversalRate),
      totalUniqueCards: Object.keys(cardCounts).length,
      cardDiversity: this.calculateCardDiversity(cardCounts)
    };
  }

  // Analyze spread type preferences
  analyzeSpreadPreferences(readings) {
    const spreadCounts = {};
    
    readings.forEach(reading => {
      const type = reading.reading_type;
      spreadCounts[type] = (spreadCounts[type] || 0) + 1;
    });

    const sortedSpreads = Object.entries(spreadCounts)
      .sort(([,a], [,b]) => b - a);

    const totalReadings = readings.length;
    const preferences = sortedSpreads.map(([spread, count]) => ({
      spread,
      count,
      percentage: Math.round((count / totalReadings) * 100)
    }));

    return {
      preferences,
      favoriteSpread: sortedSpreads[0]?.[0],
      spreadDiversity: Object.keys(spreadCounts).length
    };
  }

  // Analyze emotional journey through card meanings
  analyzeEmotionalJourney(readings) {
    const emotionalTones = [];
    const themes = {
      love: 0,
      career: 0,
      spirituality: 0,
      challenges: 0,
      growth: 0
    };

    readings.forEach(reading => {
      const date = moment(reading.created_at).tz(this.timezone);
      const cards = JSON.parse(reading.cards_drawn || reading.cards);
      
      let positiveCards = 0;
      let challengingCards = 0;

      cards.forEach(card => {
        // Analyze emotional tone (simplified)
        if (this.isPositiveCard(card)) positiveCards++;
        if (this.isChallengingCard(card)) challengingCards++;
        
        // Analyze themes
        this.categorizeCardThemes(card, themes);
      });

      const tone = positiveCards > challengingCards ? 'positive' : 
                   challengingCards > positiveCards ? 'challenging' : 'neutral';

      emotionalTones.push({
        date: date.format('YYYY-MM-DD'),
        tone,
        positiveRatio: cards.length > 0 ? positiveCards / cards.length : 0
      });
    });

    return {
      emotionalTones,
      dominantThemes: this.getDominantThemes(themes),
      overallTrend: this.calculateEmotionalTrend(emotionalTones),
      recentMood: this.getRecentMood(emotionalTones)
    };
  }

  // Analyze cyclical patterns (weekly, monthly)
  analyzeCyclicalPatterns(readings) {
    const weeklyPatterns = {};
    const monthlyPatterns = {};
    
    readings.forEach(reading => {
      const date = moment(reading.created_at).tz(this.timezone);
      const weekOfYear = date.week();
      const dayOfMonth = date.date();
      
      weeklyPatterns[weekOfYear] = (weeklyPatterns[weekOfYear] || 0) + 1;
      monthlyPatterns[dayOfMonth] = (monthlyPatterns[dayOfMonth] || 0) + 1;
    });

    return {
      weeklyActivity: weeklyPatterns,
      monthlyActivity: monthlyPatterns,
      mostActiveWeek: this.findPeakPeriod(weeklyPatterns),
      mostActiveDay: this.findPeakPeriod(monthlyPatterns),
      consistency: this.calculateConsistency(readings)
    };
  }

  // Generate insights based on patterns
  generateInsights(readings) {
    const insights = [];
    const recentReadings = readings.slice(-10); // Last 10 readings
    
    // Reading frequency insight
    const avgDaysBetween = this.calculateAverageInterval(readings);
    if (avgDaysBetween < 1) {
      insights.push({
        type: 'frequency',
        level: 'high',
        message: 'You have a very active tarot practice with frequent readings.',
        icon: '🔥'
      });
    } else if (avgDaysBetween > 7) {
      insights.push({
        type: 'frequency',
        level: 'low',
        message: 'You tend to space out your readings, allowing time for reflection.',
        icon: '🌙'
      });
    }

    // Card diversity insight
    const uniqueCards = new Set();
    readings.forEach(reading => {
      const cards = JSON.parse(reading.cards_drawn || reading.cards);
      cards.forEach(card => uniqueCards.add(card.name));
    });

    if (uniqueCards.size > 50) {
      insights.push({
        type: 'diversity',
        level: 'high',
        message: `You've encountered ${uniqueCards.size} different cards, showing great diversity in your readings.`,
        icon: '🌈'
      });
    }

    // Recent trend insight
    if (recentReadings.length >= 5) {
      const recentTrend = this.analyzeRecentTrend(recentReadings);
      insights.push({
        type: 'trend',
        level: recentTrend.direction,
        message: recentTrend.message,
        icon: recentTrend.icon
      });
    }

    return insights;
  }

  // Generate personalized recommendations
  generateRecommendations(readings) {
    const recommendations = [];
    const patterns = this.analyzeCardPatterns(readings);
    const timePatterns = this.analyzeTimePatterns(readings);

    // Spread recommendation
    if (patterns.suitDistribution.major < patterns.suitDistribution.cups) {
      recommendations.push({
        type: 'spread',
        title: 'Try Major Arcana Focus',
        description: 'Consider doing readings that emphasize spiritual growth and life lessons.',
        action: 'Use Celtic Cross or custom spreads focusing on major life themes'
      });
    }

    // Timing recommendation
    if (timePatterns.peakHour < 6 || timePatterns.peakHour > 22) {
      recommendations.push({
        type: 'timing',
        title: 'Morning Reflection',
        description: 'Try morning readings for daily guidance and intention setting.',
        action: 'Set a daily reminder for 8-9 AM readings'
      });
    }

    // Journaling recommendation
    const notedReadings = readings.filter(r => r.notes && r.notes.trim()).length;
    const noteRate = readings.length > 0 ? (notedReadings / readings.length) * 100 : 0;
    
    if (noteRate < 30) {
      recommendations.push({
        type: 'journaling',
        title: 'Enhance Your Practice',
        description: 'Adding notes to your readings can deepen insights and track growth.',
        action: 'Try adding a reflection note to your next 3 readings'
      });
    }

    return recommendations;
  }

  // Helper methods
  getTimeDescription(hour) {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  }

  calculateCardDiversity(cardCounts) {
    const totalCards = Object.values(cardCounts).reduce((sum, count) => sum + count, 0);
    const uniqueCards = Object.keys(cardCounts).length;
    return totalCards > 0 ? Math.round((uniqueCards / totalCards) * 100) : 0;
  }

  isPositiveCard(card) {
    const positiveCards = ['The Sun', 'The Star', 'Three of Cups', 'Ten of Pentacles', 'Ace of Cups'];
    return positiveCards.includes(card.name) && !card.isReversed;
  }

  isChallengingCard(card) {
    const challengingCards = ['The Tower', 'Death', 'The Devil', 'Five of Swords', 'Ten of Swords'];
    return challengingCards.includes(card.name) || card.isReversed;
  }

  categorizeCardThemes(card, themes) {
    if (card.name.includes('Cup') || ['The Lovers', 'Two of Cups'].includes(card.name)) {
      themes.love++;
    }
    if (card.name.includes('Pentacle') || ['The Magician', 'Eight of Pentacles'].includes(card.name)) {
      themes.career++;
    }
    if (['The High Priestess', 'The Hermit', 'The Star'].includes(card.name)) {
      themes.spirituality++;
    }
    if (card.isReversed || ['The Tower', 'Five of Swords'].includes(card.name)) {
      themes.challenges++;
    }
    if (['The Fool', 'Death', 'The World'].includes(card.name)) {
      themes.growth++;
    }
  }

  getDominantThemes(themes) {
    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([theme, count]) => ({ theme, count }));
  }

  calculateEmotionalTrend(emotionalTones) {
    if (emotionalTones.length < 3) return 'insufficient_data';
    
    const recent = emotionalTones.slice(-5);
    const positiveCount = recent.filter(t => t.tone === 'positive').length;
    const challengingCount = recent.filter(t => t.tone === 'challenging').length;
    
    if (positiveCount > challengingCount) return 'improving';
    if (challengingCount > positiveCount) return 'challenging';
    return 'stable';
  }

  getRecentMood(emotionalTones) {
    if (emotionalTones.length === 0) return 'unknown';
    
    const recent = emotionalTones.slice(-3);
    const avgPositivity = recent.reduce((sum, t) => sum + t.positiveRatio, 0) / recent.length;
    
    if (avgPositivity > 0.6) return 'optimistic';
    if (avgPositivity < 0.4) return 'reflective';
    return 'balanced';
  }

  findPeakPeriod(patterns) {
    const entries = Object.entries(patterns);
    if (entries.length === 0) return null;
    
    return entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    )[0];
  }

  calculateConsistency(readings) {
    if (readings.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < readings.length; i++) {
      const prev = moment(readings[i-1].created_at);
      const curr = moment(readings[i].created_at);
      intervals.push(curr.diff(prev, 'days'));
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 100 - (stdDev * 10));
  }

  calculateAverageInterval(readings) {
    if (readings.length < 2) return 0;
    
    const firstReading = moment(readings[0].created_at);
    const lastReading = moment(readings[readings.length - 1].created_at);
    const totalDays = lastReading.diff(firstReading, 'days');
    
    return totalDays / (readings.length - 1);
  }

  analyzeRecentTrend(recentReadings) {
    const cards = recentReadings.flatMap(reading => 
      JSON.parse(reading.cards_drawn || reading.cards)
    );
    
    const positiveCards = cards.filter(card => this.isPositiveCard(card)).length;
    const challengingCards = cards.filter(card => this.isChallengingCard(card)).length;
    
    if (positiveCards > challengingCards * 1.5) {
      return {
        direction: 'positive',
        message: 'Your recent readings show a positive and uplifting trend.',
        icon: '📈'
      };
    } else if (challengingCards > positiveCards * 1.5) {
      return {
        direction: 'challenging',
        message: 'Recent readings suggest a period of growth through challenges.',
        icon: '🌱'
      };
    } else {
      return {
        direction: 'balanced',
        message: 'Your recent readings show a balanced mix of energies.',
        icon: '⚖️'
      };
    }
  }
}

module.exports = AdvancedAnalyticsEngine;
