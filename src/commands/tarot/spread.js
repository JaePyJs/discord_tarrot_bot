const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const DatabaseManager = require('../../database/DatabaseManager');
const cardUtils = require('../../utils/cardUtils');
const logger = require('../../utils/logger');
const moment = require('moment-timezone');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spread')
    .setDescription('Create and manage custom tarot spreads')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new custom spread')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Name for your custom spread')
            .setRequired(true)
            .setMaxLength(50)
        )
        .addIntegerOption(option =>
          option
            .setName('cards')
            .setDescription('Number of cards in the spread (1-15)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(15)
        )
        .addStringOption(option =>
          option
            .setName('description')
            .setDescription('Brief description of the spread purpose')
            .setRequired(true)
            .setMaxLength(200)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('View your custom spreads')
        .addStringOption(option =>
          option
            .setName('filter')
            .setDescription('Filter spreads')
            .addChoices(
              { name: 'My Spreads', value: 'mine' },
              { name: 'Public Spreads', value: 'public' },
              { name: 'All Spreads', value: 'all' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('use')
        .setDescription('Use a custom spread for a reading')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Name of the spread to use')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Edit one of your custom spreads')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Name of the spread to edit')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete one of your custom spreads')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Name of the spread to delete')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('share')
        .setDescription('Share your spread publicly')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Name of the spread to share')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const db = new DatabaseManager();

    try {
      switch (subcommand) {
        case 'create':
          await this.handleCreate(interaction, db, userId);
          break;
        case 'list':
          await this.handleList(interaction, db, userId);
          break;
        case 'use':
          await this.handleUse(interaction, db, userId);
          break;
        case 'edit':
          await this.handleEdit(interaction, db, userId);
          break;
        case 'delete':
          await this.handleDelete(interaction, db, userId);
          break;
        case 'share':
          await this.handleShare(interaction, db, userId);
          break;
      }
    } catch (error) {
      logger.error('Error in spread command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🎨 Spread Error')
        .setDescription('There was an error with the spread system. Please try again later.')
        .setFooter({ text: 'The mystical patterns seem disrupted' });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },

  async handleCreate(interaction, db, userId) {
    const name = interaction.options.getString('name');
    const cardCount = interaction.options.getInteger('cards');
    const description = interaction.options.getString('description');

    // Check if spread name already exists for this user
    const existingSpread = await db.getUserSpread(userId, name);
    if (existingSpread) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🎨 Spread Already Exists')
        .setDescription(`You already have a spread named "${name}". Please choose a different name or edit the existing one.`)
        .setFooter({ text: 'Each spread name must be unique' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Show modal for position definitions
    const modal = new ModalBuilder()
      .setCustomId(`spread_positions_${userId}_${Date.now()}`)
      .setTitle(`Define Positions for "${name}"`);

    // Add text inputs for each position
    const maxInputs = Math.min(cardCount, 5); // Discord modal limit
    for (let i = 1; i <= maxInputs; i++) {
      const input = new TextInputBuilder()
        .setCustomId(`position_${i}`)
        .setLabel(`Position ${i} Name`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(`e.g., "Past", "Present", "Future"`)
        .setRequired(true)
        .setMaxLength(50);

      const actionRow = new ActionRowBuilder().addComponents(input);
      modal.addComponents(actionRow);
    }

    // Store spread data temporarily
    const spreadData = {
      name,
      cardCount,
      description,
      userId,
      timestamp: Date.now()
    };

    // Store in memory temporarily (in production, use Redis or database)
    global.tempSpreadData = global.tempSpreadData || {};
    global.tempSpreadData[`${userId}_${Date.now()}`] = spreadData;

    await interaction.showModal(modal);
  },

  async handleList(interaction, db, userId) {
    await interaction.deferReply();
    
    const filter = interaction.options.getString('filter') || 'mine';
    let spreads = [];

    switch (filter) {
      case 'mine':
        spreads = await db.getUserSpreads(userId);
        break;
      case 'public':
        spreads = await db.getPublicSpreads();
        break;
      case 'all':
        spreads = await db.getAllSpreads();
        break;
    }

    if (spreads.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0x4B0082)
        .setTitle('🎨 Custom Spreads')
        .setDescription(`No ${filter === 'mine' ? 'personal' : filter} spreads found.`)
        .setFooter({ text: 'Use /spread create to make your first custom spread' });

      return await interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle(`🎨 ${filter === 'mine' ? 'Your' : 'Available'} Custom Spreads`)
      .setDescription(`Found ${spreads.length} spread(s)`)
      .setFooter({ text: 'Use /spread use <name> to perform a reading' });

    for (const spread of spreads.slice(0, 10)) { // Limit to 10 for display
      const creator = spread.user_id === userId ? 'You' : `<@${spread.user_id}>`;
      const visibility = spread.is_public ? '🌍 Public' : '🔒 Private';
      
      embed.addFields({
        name: `🎴 ${spread.name} (${spread.card_count} cards)`,
        value: `**Description:** ${spread.description}\n**Creator:** ${creator}\n**Visibility:** ${visibility}`,
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },

  async handleUse(interaction, db, userId) {
    const spreadName = interaction.options.getString('name');
    
    // Get the spread
    const spread = await db.getSpreadByName(spreadName, userId);
    if (!spread) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🎨 Spread Not Found')
        .setDescription(`Could not find a spread named "${spreadName}".`)
        .setFooter({ text: 'Use /spread list to see available spreads' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check cooldown
    if (cardUtils.isOnCooldown(userId)) {
      const remainingTime = cardUtils.getCooldownTime(userId);
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🕐 The cards need time to recharge...')
        .setDescription(`Please wait ${remainingTime} seconds before requesting another reading.`)
        .setFooter({ text: 'Patience brings clarity to the mystical arts' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await interaction.deferReply();

    // Draw cards for the spread
    const cards = cardUtils.drawCards(spread.card_count);
    const positions = JSON.parse(spread.positions);

    // Assign positions to cards
    for (let i = 0; i < cards.length; i++) {
      cards[i].position = positions[i] || `Position ${i + 1}`;
    }

    // Create reading embeds
    const embeds = await this.createCustomSpreadEmbeds(cards, spread, interaction.user);

    // Save reading to database
    const db2 = new DatabaseManager();
    await db2.saveReading(userId, interaction.guild?.id, `custom:${spread.name}`, cards);

    // Set cooldown and update analytics
    cardUtils.setCooldown(userId);
    
    await interaction.editReply({ embeds });
  },

  async handleEdit(interaction, db, userId) {
    const spreadName = interaction.options.getString('name');
    
    // Get the spread
    const spread = await db.getUserSpread(userId, spreadName);
    if (!spread) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🎨 Spread Not Found')
        .setDescription(`Could not find your spread named "${spreadName}".`)
        .setFooter({ text: 'Use /spread list mine to see your spreads' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Create edit buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`edit_description_${spread.id}`)
          .setLabel('Edit Description')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId(`edit_positions_${spread.id}`)
          .setLabel('Edit Positions')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🎯'),
        new ButtonBuilder()
          .setCustomId(`toggle_visibility_${spread.id}`)
          .setLabel(spread.is_public ? 'Make Private' : 'Make Public')
          .setStyle(spread.is_public ? ButtonStyle.Danger : ButtonStyle.Success)
          .setEmoji(spread.is_public ? '🔒' : '🌍')
      );

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle(`🎨 Edit Spread: ${spread.name}`)
      .setDescription(spread.description)
      .addFields(
        {
          name: '🎴 Card Count',
          value: spread.card_count.toString(),
          inline: true
        },
        {
          name: '👁️ Visibility',
          value: spread.is_public ? '🌍 Public' : '🔒 Private',
          inline: true
        },
        {
          name: '🎯 Positions',
          value: JSON.parse(spread.positions).join(', '),
          inline: false
        }
      )
      .setFooter({ text: 'Choose what you want to edit' });

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },

  async handleDelete(interaction, db, userId) {
    const spreadName = interaction.options.getString('name');
    
    // Get the spread
    const spread = await db.getUserSpread(userId, spreadName);
    if (!spread) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🎨 Spread Not Found')
        .setDescription(`Could not find your spread named "${spreadName}".`)
        .setFooter({ text: 'Use /spread list mine to see your spreads' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Create confirmation buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_delete_${spread.id}`)
          .setLabel('Yes, Delete')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId(`cancel_delete_${spread.id}`)
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌')
      );

    const embed = new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle('🗑️ Delete Spread')
      .setDescription(`Are you sure you want to delete the spread "${spread.name}"?`)
      .addFields({
        name: '⚠️ Warning',
        value: 'This action cannot be undone. All readings using this spread will remain, but the spread definition will be lost.',
        inline: false
      })
      .setFooter({ text: 'Choose carefully' });

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },

  async handleShare(interaction, db, userId) {
    const spreadName = interaction.options.getString('name');
    
    // Get the spread
    const spread = await db.getUserSpread(userId, spreadName);
    if (!spread) {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('🎨 Spread Not Found')
        .setDescription(`Could not find your spread named "${spreadName}".`)
        .setFooter({ text: 'Use /spread list mine to see your spreads' });

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Toggle public status
    const newStatus = !spread.is_public;
    await db.updateSpreadVisibility(spread.id, newStatus);

    const embed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle('🌍 Spread Visibility Updated')
      .setDescription(`Your spread "${spread.name}" is now ${newStatus ? 'public' : 'private'}.`)
      .addFields({
        name: newStatus ? '🌍 Public Spread' : '🔒 Private Spread',
        value: newStatus 
          ? 'Other users can now discover and use your spread!'
          : 'Your spread is now private and only you can use it.',
        inline: false
      })
      .setFooter({ text: 'You can change this anytime' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async createCustomSpreadEmbeds(cards, spread, user) {
    const embeds = [];

    // Main spread embed
    const mainEmbed = new EmbedBuilder()
      .setColor(0x4B0082)
      .setTitle(`🎨 ${spread.name} Reading`)
      .setDescription(spread.description)
      .setAuthor({
        name: `${user.displayName}'s Custom Spread Reading`,
        iconURL: user.displayAvatarURL(),
      })
      .setTimestamp()
      .setFooter({
        text: `Custom spread by ${spread.creator_name || 'Unknown'} • For entertainment purposes only`,
      });

    embeds.push(mainEmbed);

    // Card embeds
    for (const card of cards) {
      const cardEmbed = cardUtils.formatCard(card, true);
      cardEmbed.color = card.isReversed ? 0x8B0000 : 0x4B0082;
      embeds.push(new EmbedBuilder(cardEmbed));
    }

    return embeds;
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const db = new DatabaseManager();

    try {
      let spreads = [];
      
      if (['edit', 'delete'].includes(subcommand)) {
        // Only show user's own spreads
        spreads = await db.getUserSpreads(userId);
      } else {
        // Show all available spreads (user's + public)
        spreads = await db.getAvailableSpreads(userId);
      }

      const filtered = spreads
        .filter(spread => spread.name.toLowerCase().includes(focusedValue))
        .slice(0, 25)
        .map(spread => ({
          name: `${spread.name} (${spread.card_count} cards)`,
          value: spread.name
        }));

      await interaction.respond(filtered);
    } catch (error) {
      logger.error('Autocomplete error:', error);
      await interaction.respond([]);
    }
  }
};
