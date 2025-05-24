const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../database/DatabaseManager');
const cardUtils = require('../utils/cardUtils');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('runes')
    .setDescription('Cast ancient Norse runes for wisdom and guidance')
    .addSubcommand(subcommand =>
      subcommand
        .setName('single')
        .setDescription('Draw a single rune for guidance')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('three')
        .setDescription('Cast three runes for past, present, future')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('daily')
        .setDescription('Daily rune guidance')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('norns')
        .setDescription('The Norns spread - fate, destiny, and choice')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const db = new DatabaseManager();

    try {
      // Check cooldown
      if (cardUtils.isOnCooldown(userId)) {
        const remainingTime = cardUtils.getCooldownTime(userId);
        const embed = new EmbedBuilder()
          .setColor(0xFF6B6B)
          .setTitle('🕐 The runes need time to settle...')
          .setDescription(`Please wait ${remainingTime} seconds before casting again.`)
          .setFooter({ text: 'Ancient wisdom requires patience' });

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.deferReply();

      switch (subcommand) {
        case 'single':
          await this.handleSingle(interaction, db, userId);
          break;
        case 'three':
          await this.handleThree(interaction, db, userId);
          break;
        case 'daily':
          await this.handleDaily(interaction, db, userId);
          break;
        case 'norns':
          await this.handleNorns(interaction, db, userId);
          break;
      }

      // Set cooldown
      cardUtils.setCooldown(userId);

    } catch (error) {
      logger.error('Error in runes command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('⚡ Rune Error')
        .setDescription('The ancient energies are disturbed. Please try again later.')
        .setFooter({ text: 'The runes will speak when the time is right' });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },

  async handleSingle(interaction, db, userId) {
    const rune = this.drawRune();

    const embed = new EmbedBuilder()
      .setColor(0x8B4513)
      .setTitle('⚡ Single Rune Casting')
      .setDescription('Ancient Norse wisdom for your current situation')
      .setAuthor({
        name: `${interaction.user.displayName}'s Rune Reading`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        {
          name: `${rune.symbol} ${rune.name}`,
          value: `**Meaning:** ${rune.meaning}`,
          inline: false
        },
        {
          name: '🔮 Interpretation',
          value: rune.interpretation,
          inline: false
        },
        {
          name: '⚔️ Action Guidance',
          value: rune.action,
          inline: false
        },
        {
          name: '🌟 Keywords',
          value: rune.keywords.join(' • '),
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'The ancestors speak through the ancient runes' });

    // Save reading to database
    await db.saveReading(userId, interaction.guild?.id, 'runes:single', [rune]);

    await interaction.editReply({ embeds: [embed] });
  },

  async handleThree(interaction, db, userId) {
    const runes = [
      this.drawRune(),
      this.drawRune(),
      this.drawRune()
    ];

    const positions = ['Past Influences', 'Present Situation', 'Future Path'];
    
    const mainEmbed = new EmbedBuilder()
      .setColor(0x8B4513)
      .setTitle('⚡ Three Rune Casting')
      .setDescription('Past, Present, and Future revealed by ancient wisdom')
      .setAuthor({
        name: `${interaction.user.displayName}'s Rune Reading`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp()
      .setFooter({ text: 'The threads of fate are woven by the Norns' });

    const embeds = [mainEmbed];

    // Create individual rune embeds
    runes.forEach((rune, index) => {
      rune.position = positions[index];
      const runeEmbed = new EmbedBuilder()
        .setColor(0x8B4513)
        .setTitle(`${positions[index]}: ${rune.symbol} ${rune.name}`)
        .setDescription(`**Meaning:** ${rune.meaning}`)
        .addFields(
          {
            name: '🔮 Interpretation',
            value: rune.interpretation,
            inline: false
          },
          {
            name: '⚔️ Guidance',
            value: rune.action,
            inline: false
          },
          {
            name: '🌟 Keywords',
            value: rune.keywords.join(' • '),
            inline: false
          }
        );

      embeds.push(runeEmbed);
    });

    // Save reading to database
    await db.saveReading(userId, interaction.guild?.id, 'runes:three', runes);

    await interaction.editReply({ embeds });
  },

  async handleDaily(interaction, db, userId) {
    // Check if user already has a daily rune reading today
    const today = moment().tz('Asia/Manila').format('YYYY-MM-DD');
    const existingReading = await db.getDailyRuneReading(userId, today);

    if (existingReading) {
      const rune = JSON.parse(existingReading.cards_drawn)[0];
      
      const embed = new EmbedBuilder()
        .setColor(0x8B4513)
        .setTitle('🌅 Your Daily Rune (Already Cast)')
        .setDescription('You\'ve already received your daily rune guidance today.')
        .addFields(
          {
            name: `${rune.symbol} ${rune.name}`,
            value: `**Meaning:** ${rune.meaning}`,
            inline: false
          },
          {
            name: '🔮 Today\'s Message',
            value: rune.interpretation,
            inline: false
          }
        )
        .setFooter({ text: 'Carry this wisdom with you throughout the day' });

      return await interaction.editReply({ embeds: [embed] });
    }

    // Draw new daily rune
    const rune = this.drawRune();

    const embed = new EmbedBuilder()
      .setColor(0x8B4513)
      .setTitle('🌅 Your Daily Rune')
      .setDescription('Ancient wisdom to guide your day')
      .setAuthor({
        name: `${interaction.user.displayName}'s Daily Rune`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        {
          name: `${rune.symbol} ${rune.name}`,
          value: `**Meaning:** ${rune.meaning}`,
          inline: false
        },
        {
          name: '🔮 Today\'s Message',
          value: rune.interpretation,
          inline: false
        },
        {
          name: '⚔️ Daily Focus',
          value: rune.action,
          inline: false
        },
        {
          name: '🌟 Energy for Today',
          value: rune.keywords.join(' • '),
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'May the ancestors guide your path today' });

    // Save daily reading
    await db.saveReading(userId, interaction.guild?.id, 'runes:daily', [rune]);

    await interaction.editReply({ embeds: [embed] });
  },

  async handleNorns(interaction, db, userId) {
    const runes = [
      this.drawRune(),
      this.drawRune(),
      this.drawRune()
    ];

    const nornPositions = ['Urd (Past/Fate)', 'Verdandi (Present/Becoming)', 'Skuld (Future/Debt)'];
    
    const mainEmbed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('🔮 The Norns Spread')
      .setDescription('The three sisters of fate reveal your destiny')
      .setAuthor({
        name: `${interaction.user.displayName}'s Norns Reading`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields({
        name: '🌟 About the Norns',
        value: 'Urd weaves the threads of past and fate, Verdandi shapes the present moment, and Skuld holds the potential of what is to come.',
        inline: false
      })
      .setTimestamp()
      .setFooter({ text: 'The Norns weave the tapestry of your destiny' });

    const embeds = [mainEmbed];

    // Create individual Norn embeds
    runes.forEach((rune, index) => {
      rune.position = nornPositions[index];
      const nornEmbed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle(`${nornPositions[index]}: ${rune.symbol} ${rune.name}`)
        .setDescription(`**Meaning:** ${rune.meaning}`)
        .addFields(
          {
            name: '🔮 Norn\'s Message',
            value: this.getNornMessage(rune, index),
            inline: false
          },
          {
            name: '⚔️ Wisdom',
            value: rune.action,
            inline: false
          }
        );

      embeds.push(nornEmbed);
    });

    // Save reading to database
    await db.saveReading(userId, interaction.guild?.id, 'runes:norns', runes);

    await interaction.editReply({ embeds });
  },

  drawRune() {
    const runes = this.getRuneSet();
    const randomIndex = Math.floor(Math.random() * runes.length);
    return { ...runes[randomIndex] };
  },

  getRuneSet() {
    return [
      {
        name: 'Fehu',
        symbol: 'ᚠ',
        meaning: 'Cattle, Wealth, Abundance',
        interpretation: 'Material prosperity and spiritual wealth flow into your life. This rune speaks of new financial opportunities and the responsible use of resources.',
        action: 'Focus on building sustainable abundance. Share your wealth wisely and invest in your future.',
        keywords: ['Prosperity', 'Resources', 'Responsibility', 'Growth']
      },
      {
        name: 'Uruz',
        symbol: 'ᚢ',
        meaning: 'Aurochs, Strength, Vitality',
        interpretation: 'Raw power and primal strength surge within you. This is a time of physical and spiritual vitality, courage, and determination.',
        action: 'Channel your inner strength constructively. Take bold action but remain grounded in wisdom.',
        keywords: ['Strength', 'Courage', 'Vitality', 'Determination']
      },
      {
        name: 'Thurisaz',
        symbol: 'ᚦ',
        meaning: 'Giant, Thorn, Protection',
        interpretation: 'Protective forces surround you, but challenges may arise. This rune warns of obstacles while promising the strength to overcome them.',
        action: 'Prepare for challenges with wisdom. Use difficulties as opportunities for growth and protection.',
        keywords: ['Protection', 'Challenge', 'Strength', 'Defense']
      },
      {
        name: 'Ansuz',
        symbol: 'ᚨ',
        meaning: 'God, Divine Message, Communication',
        interpretation: 'Divine wisdom flows through you. Messages, insights, and communication play important roles in your current situation.',
        action: 'Listen carefully to messages from the divine. Speak your truth with wisdom and clarity.',
        keywords: ['Wisdom', 'Communication', 'Divine', 'Inspiration']
      },
      {
        name: 'Raidho',
        symbol: 'ᚱ',
        meaning: 'Journey, Travel, Movement',
        interpretation: 'A significant journey begins, whether physical, spiritual, or emotional. Movement and progress are highlighted.',
        action: 'Embrace the journey ahead. Trust in the path and remain open to new experiences.',
        keywords: ['Journey', 'Progress', 'Movement', 'Adventure']
      },
      {
        name: 'Kenaz',
        symbol: 'ᚲ',
        meaning: 'Torch, Knowledge, Illumination',
        interpretation: 'Inner fire and creative inspiration illuminate your path. Knowledge and understanding bring clarity to confusion.',
        action: 'Follow your creative inspiration. Seek knowledge and let your inner light guide others.',
        keywords: ['Creativity', 'Knowledge', 'Inspiration', 'Illumination']
      },
      {
        name: 'Gebo',
        symbol: 'ᚷ',
        meaning: 'Gift, Exchange, Partnership',
        interpretation: 'Sacred exchange and partnership bring balance. Gifts given and received create harmony and connection.',
        action: 'Honor the balance of giving and receiving. Strengthen partnerships through mutual respect.',
        keywords: ['Partnership', 'Balance', 'Exchange', 'Harmony']
      },
      {
        name: 'Wunjo',
        symbol: 'ᚹ',
        meaning: 'Joy, Harmony, Fellowship',
        interpretation: 'Joy and harmony bless your path. Community, friendship, and shared happiness bring fulfillment.',
        action: 'Celebrate with others. Share your joy and create harmony in your relationships.',
        keywords: ['Joy', 'Harmony', 'Community', 'Celebration']
      },
      {
        name: 'Hagalaz',
        symbol: 'ᚺ',
        meaning: 'Hail, Disruption, Transformation',
        interpretation: 'Sudden change and disruption lead to necessary transformation. What seems destructive brings renewal.',
        action: 'Accept change as a catalyst for growth. Find opportunity within disruption.',
        keywords: ['Change', 'Disruption', 'Transformation', 'Renewal']
      },
      {
        name: 'Nauthiz',
        symbol: 'ᚾ',
        meaning: 'Need, Necessity, Constraint',
        interpretation: 'Constraints and limitations teach important lessons. Necessity drives innovation and inner strength.',
        action: 'Work within limitations creatively. Use constraints as motivation for growth.',
        keywords: ['Necessity', 'Constraint', 'Innovation', 'Endurance']
      },
      {
        name: 'Isa',
        symbol: 'ᛁ',
        meaning: 'Ice, Stillness, Patience',
        interpretation: 'A time of stillness and patience. Like ice, this period preserves and prepares for future growth.',
        action: 'Practice patience and stillness. Use this time for inner reflection and preparation.',
        keywords: ['Stillness', 'Patience', 'Preservation', 'Reflection']
      },
      {
        name: 'Jera',
        symbol: 'ᛃ',
        meaning: 'Year, Harvest, Cycles',
        interpretation: 'The harvest of your efforts approaches. Natural cycles and timing bring rewards for patience and hard work.',
        action: 'Trust in natural timing. Prepare to harvest what you have sown with patience.',
        keywords: ['Harvest', 'Cycles', 'Timing', 'Reward']
      },
      {
        name: 'Eihwaz',
        symbol: 'ᛇ',
        meaning: 'Yew Tree, Endurance, Protection',
        interpretation: 'Deep roots and enduring strength support you. Like the yew tree, you have the power to endure and protect.',
        action: 'Draw upon your inner strength. Protect what matters most with enduring commitment.',
        keywords: ['Endurance', 'Protection', 'Strength', 'Stability']
      },
      {
        name: 'Perthro',
        symbol: 'ᛈ',
        meaning: 'Dice Cup, Fate, Mystery',
        interpretation: 'The mysteries of fate unfold. Hidden knowledge and unexpected revelations shape your path.',
        action: 'Embrace mystery and trust in fate. Be open to unexpected revelations and hidden wisdom.',
        keywords: ['Mystery', 'Fate', 'Revelation', 'Hidden Knowledge']
      },
      {
        name: 'Algiz',
        symbol: 'ᛉ',
        meaning: 'Elk, Protection, Higher Self',
        interpretation: 'Divine protection surrounds you. Your higher self guides you toward spiritual growth and safety.',
        action: 'Trust in divine protection. Connect with your higher self for guidance and strength.',
        keywords: ['Protection', 'Spirituality', 'Guidance', 'Higher Self']
      },
      {
        name: 'Sowilo',
        symbol: 'ᛊ',
        meaning: 'Sun, Success, Vitality',
        interpretation: 'Success and vitality shine upon you. Like the sun, your energy illuminates and energizes everything around you.',
        action: 'Shine your light brightly. Share your success and vitality with others generously.',
        keywords: ['Success', 'Vitality', 'Energy', 'Illumination']
      },
      {
        name: 'Tiwaz',
        symbol: 'ᛏ',
        meaning: 'Tyr, Justice, Honor',
        interpretation: 'Justice and honor guide your actions. Courage in the face of adversity brings victory and respect.',
        action: 'Act with honor and integrity. Stand up for justice even when it requires sacrifice.',
        keywords: ['Justice', 'Honor', 'Courage', 'Victory']
      },
      {
        name: 'Berkano',
        symbol: 'ᛒ',
        meaning: 'Birch, Growth, Renewal',
        interpretation: 'New growth and renewal emerge. Like the birch tree in spring, fresh beginnings and fertility bless your path.',
        action: 'Nurture new growth in your life. Embrace renewal and fresh starts with optimism.',
        keywords: ['Growth', 'Renewal', 'Fertility', 'New Beginnings']
      },
      {
        name: 'Ehwaz',
        symbol: 'ᛖ',
        meaning: 'Horse, Partnership, Progress',
        interpretation: 'Partnership and cooperation accelerate progress. Like horse and rider, harmony between different forces creates momentum.',
        action: 'Seek harmonious partnerships. Work together with others to achieve common goals.',
        keywords: ['Partnership', 'Cooperation', 'Progress', 'Harmony']
      },
      {
        name: 'Mannaz',
        symbol: 'ᛗ',
        meaning: 'Man, Humanity, Self',
        interpretation: 'Human connection and self-awareness bring wisdom. Your relationship with others reflects your relationship with yourself.',
        action: 'Cultivate self-awareness and human connection. Serve the greater good while honoring your individual path.',
        keywords: ['Humanity', 'Self-Awareness', 'Connection', 'Service']
      },
      {
        name: 'Laguz',
        symbol: 'ᛚ',
        meaning: 'Water, Flow, Intuition',
        interpretation: 'Intuitive wisdom flows like water. Trust your emotional intelligence and adapt fluidly to changing circumstances.',
        action: 'Follow your intuition. Flow around obstacles like water and trust your emotional wisdom.',
        keywords: ['Intuition', 'Flow', 'Adaptation', 'Emotion']
      },
      {
        name: 'Ingwaz',
        symbol: 'ᛜ',
        meaning: 'Ing, Fertility, Completion',
        interpretation: 'A cycle reaches completion, bringing fertility and new potential. Gestation period ends with successful manifestation.',
        action: 'Celebrate completion and prepare for new cycles. Trust in the fertility of your efforts.',
        keywords: ['Completion', 'Fertility', 'Manifestation', 'Potential']
      },
      {
        name: 'Othala',
        symbol: 'ᛟ',
        meaning: 'Inheritance, Heritage, Home',
        interpretation: 'Ancestral wisdom and inherited gifts support your journey. Your heritage provides strength and guidance.',
        action: 'Honor your heritage and ancestors. Use inherited wisdom to build a strong foundation.',
        keywords: ['Heritage', 'Ancestry', 'Foundation', 'Wisdom']
      },
      {
        name: 'Dagaz',
        symbol: 'ᛞ',
        meaning: 'Day, Awakening, Breakthrough',
        interpretation: 'Dawn breaks with new awareness and breakthrough. Enlightenment and clarity illuminate your path forward.',
        action: 'Embrace new awareness. Share your enlightenment and help others find their way to clarity.',
        keywords: ['Awakening', 'Breakthrough', 'Clarity', 'Enlightenment']
      }
    ];
  },

  getNornMessage(rune, nornIndex) {
    const nornMessages = [
      `Urd reveals how ${rune.meaning.toLowerCase()} has shaped your destiny. ${rune.interpretation}`,
      `Verdandi shows ${rune.meaning.toLowerCase()} manifesting in your present moment. ${rune.interpretation}`,
      `Skuld whispers of ${rune.meaning.toLowerCase()} in your future path. ${rune.interpretation}`
    ];
    
    return nornMessages[nornIndex] || rune.interpretation;
  }
};
