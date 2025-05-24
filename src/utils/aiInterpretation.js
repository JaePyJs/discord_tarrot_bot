const logger = require('./logger');

class AIInterpretationEngine {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.enabled = !!this.apiKey;
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-3.5-turbo';
    this.maxTokens = 500;
  }

  // Generate AI-enhanced interpretation for a reading
  async generateInterpretation(cards, readingType, userContext = {}) {
    if (!this.enabled) {
      logger.warn('AI interpretation disabled - no API key provided');
      return null;
    }

    try {
      const prompt = this.buildPrompt(cards, readingType, userContext);
      const response = await this.callOpenAI(prompt);
      
      if (response) {
        logger.info('AI interpretation generated successfully');
        return this.formatInterpretation(response);
      }
      
      return null;
    } catch (error) {
      logger.error('AI interpretation failed:', error);
      return null;
    }
  }

  // Build the prompt for AI interpretation
  buildPrompt(cards, readingType, userContext) {
    const cardDescriptions = cards.map(card => {
      const orientation = card.isReversed ? 'reversed' : 'upright';
      const position = card.position ? ` in position "${card.position}"` : '';
      return `${card.name} (${orientation})${position}`;
    }).join(', ');

    const contextInfo = this.buildContextInfo(userContext);
    
    const prompt = `You are a wise and intuitive tarot reader providing personalized interpretations. 

Reading Type: ${readingType}
Cards Drawn: ${cardDescriptions}
${contextInfo}

Please provide a thoughtful, personalized interpretation that:
1. Connects the cards meaningfully to each other
2. Considers the specific positions and their relationships
3. Offers practical guidance and insights
4. Maintains a supportive and encouraging tone
5. Acknowledges this is for entertainment and self-reflection

Keep the interpretation between 200-400 words, focusing on the overall narrative and key insights rather than individual card meanings.

Format your response as a cohesive interpretation without headers or bullet points.`;

    return prompt;
  }

  // Build context information from user data
  buildContextInfo(userContext) {
    let context = '';
    
    if (userContext.recentReadings) {
      context += `\nRecent reading patterns: The querent has been exploring themes of ${userContext.recentReadings.join(', ')}.`;
    }
    
    if (userContext.moonPhase) {
      context += `\nCurrent moon phase: ${userContext.moonPhase} - consider how this lunar energy might influence the reading.`;
    }
    
    if (userContext.timeOfDay) {
      const timeContext = this.getTimeContext(userContext.timeOfDay);
      context += `\nTime context: ${timeContext}`;
    }
    
    if (userContext.readingHistory) {
      context += `\nReading history: This person has done ${userContext.readingHistory.total} readings, with a preference for ${userContext.readingHistory.favoriteType} spreads.`;
    }

    return context;
  }

  // Get contextual information based on time of day
  getTimeContext(hour) {
    if (hour >= 5 && hour < 12) {
      return 'Morning reading - focus on new beginnings and daily guidance';
    } else if (hour >= 12 && hour < 17) {
      return 'Afternoon reading - consider current challenges and decision-making';
    } else if (hour >= 17 && hour < 21) {
      return 'Evening reading - reflect on the day and prepare for rest';
    } else {
      return 'Late night reading - deep introspection and subconscious insights';
    }
  }

  // Call OpenAI API
  async callOpenAI(prompt) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an experienced tarot reader who provides insightful, personalized interpretations. Your readings are thoughtful, encouraging, and help people gain clarity about their situations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.maxTokens,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim();
      
    } catch (error) {
      logger.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  // Format the AI interpretation for Discord
  formatInterpretation(interpretation) {
    // Clean up the interpretation
    let formatted = interpretation
      .replace(/\*\*(.*?)\*\*/g, '**$1**') // Ensure Discord bold formatting
      .replace(/\n\n+/g, '\n\n') // Clean up excessive line breaks
      .trim();

    // Add a subtle indicator that this is AI-enhanced
    formatted += '\n\n*✨ Enhanced with AI insights*';

    return {
      content: formatted,
      isAIGenerated: true,
      timestamp: new Date().toISOString()
    };
  }

  // Generate a quick card insight (shorter version)
  async generateQuickInsight(card, context = {}) {
    if (!this.enabled) return null;

    try {
      const orientation = card.isReversed ? 'reversed' : 'upright';
      const prompt = `Provide a brief, insightful interpretation for ${card.name} (${orientation}) in 1-2 sentences. Focus on practical guidance and positive framing. This is for entertainment and self-reflection.`;

      const response = await this.callOpenAI(prompt);
      
      if (response) {
        return {
          content: response.trim(),
          isAIGenerated: true,
          type: 'quick_insight'
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Quick insight generation failed:', error);
      return null;
    }
  }

  // Generate reading questions based on cards
  async generateReflectionQuestions(cards, readingType) {
    if (!this.enabled) return null;

    try {
      const cardList = cards.map(card => `${card.name} (${card.isReversed ? 'reversed' : 'upright'})`).join(', ');
      
      const prompt = `Based on these tarot cards: ${cardList} in a ${readingType} reading, generate 3 thoughtful reflection questions that would help someone gain deeper insights. Make them open-ended and introspective. Format as a simple list.`;

      const response = await this.callOpenAI(prompt);
      
      if (response) {
        const questions = response
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.?\s*/, '').trim())
          .filter(q => q.length > 10);

        return {
          questions: questions.slice(0, 3),
          isAIGenerated: true,
          type: 'reflection_questions'
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Reflection questions generation failed:', error);
      return null;
    }
  }

  // Check if AI features are available
  isAvailable() {
    return this.enabled;
  }

  // Get AI feature status
  getStatus() {
    return {
      enabled: this.enabled,
      model: this.model,
      maxTokens: this.maxTokens,
      hasApiKey: !!this.apiKey
    };
  }

  // Generate personalized daily affirmation based on daily card
  async generateDailyAffirmation(card, userContext = {}) {
    if (!this.enabled) return null;

    try {
      const orientation = card.isReversed ? 'reversed' : 'upright';
      const prompt = `Create a positive, empowering daily affirmation inspired by ${card.name} (${orientation}). Make it personal, actionable, and uplifting. Keep it to 1-2 sentences. This should help someone start their day with intention.`;

      const response = await this.callOpenAI(prompt);
      
      if (response) {
        return {
          content: response.trim(),
          isAIGenerated: true,
          type: 'daily_affirmation',
          card: card.name
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Daily affirmation generation failed:', error);
      return null;
    }
  }

  // Generate compatibility analysis for relationship readings
  async generateCompatibilityInsight(cards, partners = []) {
    if (!this.enabled || cards.length < 2) return null;

    try {
      const cardDescriptions = cards.map((card, index) => {
        const partner = partners[index] || `Person ${index + 1}`;
        return `${partner}: ${card.name} (${card.isReversed ? 'reversed' : 'upright'})`;
      }).join(', ');

      const prompt = `Analyze the compatibility and relationship dynamics based on these tarot cards: ${cardDescriptions}. Provide insights about the relationship potential, challenges, and advice for harmony. Keep it balanced and constructive. 2-3 sentences.`;

      const response = await this.callOpenAI(prompt);
      
      if (response) {
        return {
          content: response.trim(),
          isAIGenerated: true,
          type: 'compatibility_insight'
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Compatibility insight generation failed:', error);
      return null;
    }
  }
}

module.exports = AIInterpretationEngine;
