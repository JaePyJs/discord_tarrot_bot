const fs = require("fs");
const path = require("path");

// Load card data
const majorArcana = require("../data/major-arcana.json");
const minorArcanaCups = require("../data/minor-arcana-cups.json");
const minorArcanaWands = require("../data/minor-arcana-wands.json");
const minorArcanaSwords = require("../data/minor-arcana-swords.json");
const minorArcanaPentacles = require("../data/minor-arcana-pentacles.json");
const enhancedCardData = require("../data/enhanced-card-data.json");

class CardUtils {
  constructor() {
    this.allCards = [
      ...majorArcana,
      ...minorArcanaCups,
      ...minorArcanaWands,
      ...minorArcanaSwords,
      ...minorArcanaPentacles,
    ];
    this.cooldowns = new Map(); // In-memory cooldown tracking
    console.log(
      `✅ Loaded ${this.allCards.length} tarot cards (${
        majorArcana.length
      } Major + ${this.allCards.length - majorArcana.length} Minor Arcana)`
    );
  }

  // Get a random card with optional exclusions
  drawCard(excludeIds = []) {
    const availableCards = this.allCards.filter(
      (card) => !excludeIds.includes(card.id)
    );
    if (availableCards.length === 0) {
      throw new Error("No cards available to draw");
    }

    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = availableCards[randomIndex];

    // Determine if card is reversed (30% chance)
    const isReversed = Math.random() < 0.3;

    return {
      ...card,
      isReversed,
      position: null, // Will be set by spread functions
    };
  }

  // Draw multiple unique cards
  drawCards(count, excludeIds = []) {
    const drawnCards = [];
    const usedIds = [...excludeIds];

    for (let i = 0; i < count; i++) {
      const card = this.drawCard(usedIds);
      drawnCards.push(card);
      usedIds.push(card.id);
    }

    return drawnCards;
  }

  // Single card reading
  singleCardReading() {
    const card = this.drawCard();
    card.position = "Present Situation";
    return [card];
  }

  // Three card spread (Past, Present, Future)
  threeCardReading() {
    const cards = this.drawCards(3);
    const positions = ["Past", "Present", "Future"];

    return cards.map((card, index) => ({
      ...card,
      position: positions[index],
    }));
  }

  // Celtic Cross spread (10 cards)
  celticCrossReading() {
    const cards = this.drawCards(10);
    const positions = [
      "Present Situation",
      "Challenge/Cross",
      "Distant Past/Foundation",
      "Recent Past",
      "Possible Outcome",
      "Near Future",
      "Your Approach",
      "External Influences",
      "Hopes and Fears",
      "Final Outcome",
    ];

    return cards.map((card, index) => ({
      ...card,
      position: positions[index],
    }));
  }

  // Horseshoe spread (7 cards)
  horseshoeReading() {
    const cards = this.drawCards(7);
    const positions = [
      "Past",
      "Present",
      "Hidden Influences",
      "Obstacles",
      "External Influences",
      "Advice",
      "Likely Outcome",
    ];

    return cards.map((card, index) => ({
      ...card,
      position: positions[index],
    }));
  }

  // Relationship spread (6 cards)
  relationshipReading() {
    const cards = this.drawCards(6);
    const positions = [
      "You",
      "Your Partner",
      "The Relationship",
      "Your Needs",
      "Their Needs",
      "Where This is Heading",
    ];

    return cards.map((card, index) => ({
      ...card,
      position: positions[index],
    }));
  }

  // Yes/No spread (1 card with special interpretation)
  yesNoReading() {
    const card = this.drawCard();
    card.position = "Answer";

    // Determine yes/no based on card energy and orientation
    const yesCards = [0, 1, 3, 6, 10, 17, 19, 21]; // Major Arcana with positive energy
    const isYes = yesCards.includes(card.id) && !card.isReversed;

    card.yesNoAnswer = isYes ? "Yes" : "No";
    card.confidence = this.getYesNoConfidence(card);

    return [card];
  }

  // Daily card reading
  dailyCardReading() {
    const card = this.drawCard();
    card.position = "Daily Guidance";
    return [card];
  }

  // Career spread (5 cards)
  careerReading() {
    const cards = this.drawCards(5);
    const positions = [
      "Current Career Situation",
      "Challenges",
      "Hidden Opportunities",
      "Advice",
      "Potential Outcome",
    ];

    return cards.map((card, index) => ({
      ...card,
      position: positions[index],
    }));
  }

  // Get confidence level for yes/no readings
  getYesNoConfidence(card) {
    const strongYes = [19, 21, 1]; // Sun, World, Magician
    const strongNo = [13, 16, 15]; // Death, Tower, Devil

    if (strongYes.includes(card.id) && !card.isReversed) return "Very High";
    if (strongNo.includes(card.id) && !card.isReversed) return "Very High";
    if (card.isReversed) return "Moderate";
    return "High";
  }

  // Format card for Discord embed
  formatCard(card, includePosition = true) {
    const orientation = card.isReversed ? "Reversed" : "Upright";
    const meaning = card.isReversed ? card.reversed : card.upright;

    let title = `${card.name}`;
    if (card.isReversed) {
      title += " (Reversed)";
    }

    if (includePosition && card.position) {
      title = `${card.position}: ${title}`;
    }

    const fields = [
      {
        name: "Keywords",
        value: meaning.keywords.join(", "),
        inline: true,
      },
      {
        name: "Arcana",
        value:
          card.arcana === "major"
            ? "Major Arcana"
            : `Minor Arcana - ${
                card.suit
                  ? card.suit.charAt(0).toUpperCase() + card.suit.slice(1)
                  : ""
              }`,
        inline: true,
      },
    ];

    // Add Yes/No specific fields if present
    if (card.yesNoAnswer) {
      fields.unshift({
        name: "Answer",
        value: `**${card.yesNoAnswer}** (${card.confidence} confidence)`,
        inline: false,
      });
    }

    // Add crystal recommendations for Major Arcana cards
    const crystals = this.getCrystalRecommendations(card.name);
    if (crystals && crystals.length > 0) {
      fields.push({
        name: "💎 Recommended Crystals",
        value: crystals.join(", "),
        inline: false,
      });
    }

    // Add meditation suggestion for court cards
    const meditation = this.getMeditationSuggestion(card.name);
    if (meditation) {
      fields.push({
        name: "🧘 Meditation Focus",
        value: meditation,
        inline: false,
      });
    }

    return {
      title,
      description: meaning.meaning,
      fields,
      thumbnail: {
        url: card.image_url || null,
      },
      color: card.isReversed ? 0x8b0000 : 0x4b0082, // Dark red for reversed, indigo for upright
    };
  }

  // Check if user is on cooldown
  isOnCooldown(userId) {
    const cooldownTime = parseInt(process.env.COMMAND_COOLDOWN) * 1000 || 30000; // 30 seconds default
    const lastUsed = this.cooldowns.get(userId);

    if (!lastUsed) return false;

    const timePassed = Date.now() - lastUsed;
    return timePassed < cooldownTime;
  }

  // Get remaining cooldown time
  getCooldownTime(userId) {
    const cooldownTime = parseInt(process.env.COMMAND_COOLDOWN) * 1000 || 30000;
    const lastUsed = this.cooldowns.get(userId);

    if (!lastUsed) return 0;

    const timePassed = Date.now() - lastUsed;
    const remaining = cooldownTime - timePassed;

    return Math.max(0, Math.ceil(remaining / 1000));
  }

  // Set user cooldown
  setCooldown(userId) {
    this.cooldowns.set(userId, Date.now());
  }

  // Get reading type emoji
  getReadingEmoji(type) {
    const emojis = {
      single: "🔮",
      "three-card": "🃏",
      "celtic-cross": "✨",
      horseshoe: "🐴",
      relationship: "💕",
      "yes-no": "❓",
      daily: "🌅",
      career: "💼",
    };
    return emojis[type] || "🔮";
  }

  // Get crystal recommendations for a card
  getCrystalRecommendations(cardName) {
    const crystalPairings = enhancedCardData.crystalPairings;

    // Check Major Arcana crystals
    if (crystalPairings.major_arcana) {
      const cardKey = cardName.toLowerCase().replace(/\s+/g, "_");
      return crystalPairings.major_arcana[cardKey] || null;
    }

    return null;
  }

  // Get meditation suggestion for court cards
  getMeditationSuggestion(cardName) {
    const courtCards = enhancedCardData.courtCardPersonalities;
    const cardKey = cardName.toLowerCase().replace(/\s+/g, "_");

    if (courtCards[cardKey] && courtCards[cardKey].meditation) {
      return courtCards[cardKey].meditation;
    }

    // General meditation suggestions based on card type
    if (cardName.includes("Cup")) {
      return "Focus on emotional healing and intuitive insights. Visualize flowing water cleansing your heart.";
    } else if (cardName.includes("Wand")) {
      return "Channel your creative fire and passion. Visualize bright flames igniting your inner power.";
    } else if (cardName.includes("Sword")) {
      return "Clear your mind of mental clutter. Focus on sharp clarity and truthful communication.";
    } else if (cardName.includes("Pentacle")) {
      return "Ground yourself in the present moment. Visualize roots connecting you to Earth's stability.";
    }

    return null;
  }

  // Get detailed card description for button handlers
  getCardDescription(cardName) {
    const card = this.allCards.find(
      (c) => c.name.toLowerCase() === cardName.toLowerCase()
    );

    if (!card) {
      return null;
    }

    return {
      name: card.name,
      description: card.upright.meaning,
      keywords: card.upright.keywords,
      upright: card.upright.meaning,
      reversed: card.reversed.meaning,
      advice: this.getCardAdvice(card),
      arcana: card.arcana,
      suit: card.suit,
    };
  }

  // Get card-specific advice
  getCardAdvice(card) {
    // Generate advice based on card type
    if (card.arcana === "major") {
      return `This Major Arcana card represents a significant spiritual lesson. Reflect on how ${card.name} relates to your current life journey.`;
    } else {
      const suitAdvice = {
        cups: "Pay attention to your emotional responses and relationships.",
        wands: "Focus on taking action and pursuing your passions.",
        swords: "Use clear thinking and honest communication.",
        pentacles: "Consider practical matters and material concerns.",
      };

      return (
        suitAdvice[card.suit] ||
        "Consider how this card applies to your daily life."
      );
    }
  }
}

module.exports = new CardUtils();
