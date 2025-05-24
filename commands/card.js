const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cardUtils = require('../utils/cardUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('card')
        .setDescription('Look up information about a specific tarot card')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the tarot card to look up')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async execute(interaction) {
        const cardName = interaction.options.getString('name');
        
        try {
            // Find the card
            const card = this.findCard(cardName);
            
            if (!card) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF6B6B)
                    .setTitle('🔍 Card Not Found')
                    .setDescription(`I couldn't find a card named "${cardName}". Try using the autocomplete feature or check your spelling.`)
                    .setFooter({ text: 'Use /card and start typing to see available cards' });

                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Create detailed card information
            const uprightEmbed = new EmbedBuilder()
                .setColor(0x4B0082)
                .setTitle(`🔮 ${card.name}`)
                .setDescription('**Upright Meaning**')
                .addFields(
                    {
                        name: 'Keywords',
                        value: card.upright.keywords.join(', '),
                        inline: false
                    },
                    {
                        name: 'Meaning',
                        value: card.upright.meaning,
                        inline: false
                    },
                    {
                        name: 'Arcana',
                        value: card.arcana === 'major' ? 'Major Arcana' : `Minor Arcana - ${card.suit ? card.suit.charAt(0).toUpperCase() + card.suit.slice(1) : ''}`,
                        inline: true
                    }
                )
                .setThumbnail(card.image_url || null)
                .setFooter({ text: 'Swipe for reversed meaning →' });

            const reversedEmbed = new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle(`🔮 ${card.name} (Reversed)`)
                .setDescription('**Reversed Meaning**')
                .addFields(
                    {
                        name: 'Keywords',
                        value: card.reversed.keywords.join(', '),
                        inline: false
                    },
                    {
                        name: 'Meaning',
                        value: card.reversed.meaning,
                        inline: false
                    }
                )
                .setThumbnail(card.image_url || null)
                .setFooter({ text: '← Swipe for upright meaning' });

            await interaction.reply({ embeds: [uprightEmbed, reversedEmbed] });

        } catch (error) {
            console.error('Error in card command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚫 Card Lookup Failed')
                .setDescription('Something went wrong while looking up the card. Please try again.')
                .setFooter({ text: 'The mystical library is temporarily unavailable' });

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        
        // Get all card names
        const allCards = cardUtils.allCards;
        
        // Filter cards based on input
        const filtered = allCards
            .filter(card => card.name.toLowerCase().includes(focusedValue))
            .slice(0, 25) // Discord limit
            .map(card => ({
                name: card.name,
                value: card.name
            }));

        await interaction.respond(filtered);
    },

    findCard(cardName) {
        const normalizedName = cardName.toLowerCase().trim();
        
        return cardUtils.allCards.find(card => 
            card.name.toLowerCase() === normalizedName ||
            card.name.toLowerCase().includes(normalizedName)
        );
    }
};
