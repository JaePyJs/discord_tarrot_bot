const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DatabaseManager = require('../../database/DatabaseManager');
const cardUtils = require('../../utils/cardUtils');
const logger = require('../../utils/logger');
const moment = require('moment-timezone');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oracle')
    .setDescription('Draw oracle cards for guidance and inspiration')
    .addSubcommand(subcommand =>
      subcommand
        .setName('single')
        .setDescription('Draw a single oracle card')
        .addStringOption(option =>
          option
            .setName('deck')
            .setDescription('Choose an oracle deck')
            .addChoices(
              { name: '🌟 Angel Guidance', value: 'angels' },
              { name: '🌸 Goddess Wisdom', value: 'goddess' },
              { name: '🦋 Spirit Animals', value: 'animals' },
              { name: '🌙 Moon Phases', value: 'moon' },
              { name: '💎 Crystal Energy', value: 'crystals' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('three')
        .setDescription('Draw three oracle cards for past, present, future')
        .addStringOption(option =>
          option
            .setName('deck')
            .setDescription('Choose an oracle deck')
            .addChoices(
              { name: '🌟 Angel Guidance', value: 'angels' },
              { name: '🌸 Goddess Wisdom', value: 'goddess' },
              { name: '🦋 Spirit Animals', value: 'animals' },
              { name: '🌙 Moon Phases', value: 'moon' },
              { name: '💎 Crystal Energy', value: 'crystals' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('daily')
        .setDescription('Daily oracle card guidance')
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
          .setTitle('🕐 The oracle needs time to recharge...')
          .setDescription(`Please wait ${remainingTime} seconds before requesting another reading.`)
          .setFooter({ text: 'Patience brings clarity to divine guidance' });

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
      }

      // Set cooldown
      cardUtils.setCooldown(userId);

    } catch (error) {
      logger.error('Error in oracle command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🔮 Oracle Error')
        .setDescription('The divine energies seem disrupted. Please try again later.')
        .setFooter({ text: 'The oracle will return when the energies align' });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },

  async handleSingle(interaction, db, userId) {
    const deckType = interaction.options.getString('deck') || 'angels';
    const card = this.drawOracleCard(deckType);

    const embed = new EmbedBuilder()
      .setColor(this.getDeckColor(deckType))
      .setTitle(`🔮 ${this.getDeckName(deckType)} Oracle`)
      .setDescription('A single card drawn for divine guidance')
      .setAuthor({
        name: `${interaction.user.displayName}'s Oracle Reading`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        {
          name: `${this.getDeckEmoji(deckType)} ${card.name}`,
          value: card.message,
          inline: false
        },
        {
          name: '✨ Guidance',
          value: card.guidance,
          inline: false
        },
        {
          name: '🌟 Affirmation',
          value: card.affirmation,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Trust in the divine guidance you receive' });

    // Save reading to database
    await db.saveReading(userId, interaction.guild?.id, `oracle:${deckType}:single`, [card]);

    await interaction.editReply({ embeds: [embed] });
  },

  async handleThree(interaction, db, userId) {
    const deckType = interaction.options.getString('deck') || 'angels';
    const cards = [
      this.drawOracleCard(deckType),
      this.drawOracleCard(deckType),
      this.drawOracleCard(deckType)
    ];

    const positions = ['Past Influences', 'Present Situation', 'Future Guidance'];
    
    const mainEmbed = new EmbedBuilder()
      .setColor(this.getDeckColor(deckType))
      .setTitle(`🔮 ${this.getDeckName(deckType)} Three-Card Oracle`)
      .setDescription('Past, Present, and Future guidance from the divine')
      .setAuthor({
        name: `${interaction.user.displayName}'s Oracle Reading`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp()
      .setFooter({ text: 'The divine speaks through these sacred messages' });

    const embeds = [mainEmbed];

    // Create individual card embeds
    cards.forEach((card, index) => {
      card.position = positions[index];
      const cardEmbed = new EmbedBuilder()
        .setColor(this.getDeckColor(deckType))
        .setTitle(`${positions[index]}: ${card.name}`)
        .setDescription(card.message)
        .addFields(
          {
            name: '✨ Guidance',
            value: card.guidance,
            inline: false
          },
          {
            name: '🌟 Affirmation',
            value: card.affirmation,
            inline: false
          }
        );

      embeds.push(cardEmbed);
    });

    // Save reading to database
    await db.saveReading(userId, interaction.guild?.id, `oracle:${deckType}:three`, cards);

    await interaction.editReply({ embeds });
  },

  async handleDaily(interaction, db, userId) {
    // Check if user already has a daily oracle reading today
    const today = moment().tz('Asia/Manila').format('YYYY-MM-DD');
    const existingReading = await db.getDailyOracleReading(userId, today);

    if (existingReading) {
      const card = JSON.parse(existingReading.cards_drawn)[0];
      
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('🌅 Your Daily Oracle (Already Drawn)')
        .setDescription('You\'ve already received your daily oracle guidance today.')
        .addFields(
          {
            name: `🌟 ${card.name}`,
            value: card.message,
            inline: false
          },
          {
            name: '✨ Today\'s Guidance',
            value: card.guidance,
            inline: false
          }
        )
        .setFooter({ text: 'Reflect on this message throughout your day' });

      return await interaction.editReply({ embeds: [embed] });
    }

    // Draw new daily oracle card (rotate through different decks)
    const deckTypes = ['angels', 'goddess', 'animals', 'moon', 'crystals'];
    const dayOfYear = moment().tz('Asia/Manila').dayOfYear();
    const deckType = deckTypes[dayOfYear % deckTypes.length];
    
    const card = this.drawOracleCard(deckType);

    const embed = new EmbedBuilder()
      .setColor(this.getDeckColor(deckType))
      .setTitle('🌅 Your Daily Oracle Guidance')
      .setDescription(`Today's message from the ${this.getDeckName(deckType)} Oracle`)
      .setAuthor({
        name: `${interaction.user.displayName}'s Daily Oracle`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        {
          name: `${this.getDeckEmoji(deckType)} ${card.name}`,
          value: card.message,
          inline: false
        },
        {
          name: '✨ Today\'s Guidance',
          value: card.guidance,
          inline: false
        },
        {
          name: '🌟 Daily Affirmation',
          value: card.affirmation,
          inline: false
        },
        {
          name: '🎯 Focus for Today',
          value: card.focus || 'Carry this message with you throughout the day',
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'May this guidance illuminate your path today' });

    // Save daily reading
    await db.saveReading(userId, interaction.guild?.id, `oracle:${deckType}:daily`, [card]);

    await interaction.editReply({ embeds: [embed] });
  },

  drawOracleCard(deckType) {
    const decks = this.getOracleDecks();
    const deck = decks[deckType] || decks.angels;
    const randomIndex = Math.floor(Math.random() * deck.length);
    return { ...deck[randomIndex], deckType };
  },

  getOracleDecks() {
    return {
      angels: [
        {
          name: 'Divine Protection',
          message: 'You are surrounded by loving angels who protect and guide you.',
          guidance: 'Trust that you are safe and supported in all your endeavors.',
          affirmation: 'I am divinely protected and guided in every moment.'
        },
        {
          name: 'New Beginnings',
          message: 'The angels herald a fresh start and new opportunities.',
          guidance: 'Embrace change with an open heart and trust in divine timing.',
          affirmation: 'I welcome new beginnings with joy and excitement.'
        },
        {
          name: 'Inner Wisdom',
          message: 'Your intuition is your direct connection to angelic guidance.',
          guidance: 'Listen to your inner voice and trust the wisdom within.',
          affirmation: 'I trust my intuition and inner guidance completely.'
        },
        {
          name: 'Healing Light',
          message: 'Divine healing energy flows through you, restoring balance.',
          guidance: 'Allow yourself to receive healing on all levels - physical, emotional, and spiritual.',
          affirmation: 'I am open to receiving divine healing and restoration.'
        },
        {
          name: 'Abundance Flow',
          message: 'The universe is ready to shower you with blessings.',
          guidance: 'Open your heart to receive the abundance that is your birthright.',
          affirmation: 'I am worthy of all the abundance the universe offers.'
        }
      ],
      goddess: [
        {
          name: 'Sacred Feminine',
          message: 'Embrace your divine feminine power and intuitive wisdom.',
          guidance: 'Honor your cycles, emotions, and creative expression.',
          affirmation: 'I embrace my sacred feminine power with grace and strength.'
        },
        {
          name: 'Moon Goddess',
          message: 'Like the moon, you have phases of growth and renewal.',
          guidance: 'Trust in your natural rhythms and cycles of transformation.',
          affirmation: 'I honor my natural cycles and trust in divine timing.'
        },
        {
          name: 'Earth Mother',
          message: 'Ground yourself in nature\'s nurturing embrace.',
          guidance: 'Connect with the earth to find stability and healing.',
          affirmation: 'I am grounded, stable, and connected to Mother Earth.'
        },
        {
          name: 'Warrior Queen',
          message: 'Stand in your power and defend what you hold sacred.',
          guidance: 'Be fierce in protecting your boundaries and values.',
          affirmation: 'I am a powerful warrior for love, truth, and justice.'
        },
        {
          name: 'Love Goddess',
          message: 'Open your heart to give and receive unconditional love.',
          guidance: 'Love yourself first, then extend that love to others.',
          affirmation: 'I am love, I give love, and I receive love abundantly.'
        }
      ],
      animals: [
        {
          name: 'Eagle - Vision',
          message: 'Soar above your challenges and see the bigger picture.',
          guidance: 'Gain perspective by rising above current circumstances.',
          affirmation: 'I see clearly from a higher perspective and trust my vision.'
        },
        {
          name: 'Wolf - Loyalty',
          message: 'Trust in your pack and the bonds that support you.',
          guidance: 'Strengthen your connections with those who truly matter.',
          affirmation: 'I am surrounded by loyal, loving relationships.'
        },
        {
          name: 'Butterfly - Transformation',
          message: 'You are in a beautiful process of metamorphosis.',
          guidance: 'Embrace change as a natural part of your spiritual evolution.',
          affirmation: 'I transform with grace and emerge more beautiful than before.'
        },
        {
          name: 'Owl - Wisdom',
          message: 'Ancient wisdom flows through you in quiet moments.',
          guidance: 'Seek solitude to connect with your inner knowing.',
          affirmation: 'I trust the ancient wisdom that lives within me.'
        },
        {
          name: 'Dolphin - Joy',
          message: 'Playfulness and joy are medicine for your soul.',
          guidance: 'Don\'t forget to play and find joy in simple pleasures.',
          affirmation: 'I choose joy and playfulness as my natural state.'
        }
      ],
      moon: [
        {
          name: 'New Moon - Intentions',
          message: 'Plant seeds of intention in the fertile darkness.',
          guidance: 'Set clear intentions and trust in their manifestation.',
          affirmation: 'My intentions are powerful and manifest with divine timing.'
        },
        {
          name: 'Waxing Moon - Growth',
          message: 'Your dreams are gaining momentum and growing stronger.',
          guidance: 'Take action toward your goals with confidence.',
          affirmation: 'I take inspired action and watch my dreams grow.'
        },
        {
          name: 'Full Moon - Manifestation',
          message: 'Your efforts are coming to fruition under the full moon.',
          guidance: 'Celebrate your achievements and express gratitude.',
          affirmation: 'I celebrate my manifestations with gratitude and joy.'
        },
        {
          name: 'Waning Moon - Release',
          message: 'Let go of what no longer serves your highest good.',
          guidance: 'Release old patterns, beliefs, or relationships with love.',
          affirmation: 'I release what no longer serves me with love and gratitude.'
        },
        {
          name: 'Dark Moon - Rest',
          message: 'Honor your need for rest and inner reflection.',
          guidance: 'Take time for solitude and spiritual renewal.',
          affirmation: 'I honor my need for rest and spiritual renewal.'
        }
      ],
      crystals: [
        {
          name: 'Amethyst - Spiritual Connection',
          message: 'Your spiritual gifts are awakening and strengthening.',
          guidance: 'Meditate and connect with your higher self regularly.',
          affirmation: 'I am deeply connected to my spiritual essence.'
        },
        {
          name: 'Rose Quartz - Self-Love',
          message: 'Treat yourself with the same love you give others.',
          guidance: 'Practice self-compassion and gentle self-care.',
          affirmation: 'I love and accept myself completely and unconditionally.'
        },
        {
          name: 'Clear Quartz - Clarity',
          message: 'Mental fog is clearing, revealing your true path.',
          guidance: 'Trust the clarity that comes from a peaceful mind.',
          affirmation: 'My mind is clear, and my path is illuminated.'
        },
        {
          name: 'Citrine - Abundance',
          message: 'Golden opportunities are flowing into your life.',
          guidance: 'Stay positive and open to unexpected blessings.',
          affirmation: 'I attract abundance and prosperity with ease.'
        },
        {
          name: 'Black Tourmaline - Protection',
          message: 'You are shielded from negative energies and influences.',
          guidance: 'Set strong boundaries and protect your energy.',
          affirmation: 'I am protected and my energy is sacred.'
        }
      ]
    };
  },

  getDeckName(deckType) {
    const names = {
      angels: 'Angel Guidance',
      goddess: 'Goddess Wisdom',
      animals: 'Spirit Animals',
      moon: 'Moon Phases',
      crystals: 'Crystal Energy'
    };
    return names[deckType] || 'Divine Oracle';
  },

  getDeckEmoji(deckType) {
    const emojis = {
      angels: '👼',
      goddess: '🌸',
      animals: '🦋',
      moon: '🌙',
      crystals: '💎'
    };
    return emojis[deckType] || '🔮';
  },

  getDeckColor(deckType) {
    const colors = {
      angels: 0xFFFFFF,
      goddess: 0xFF69B4,
      animals: 0x8B4513,
      moon: 0x4169E1,
      crystals: 0x9370DB
    };
    return colors[deckType] || 0x4B0082;
  }
};
