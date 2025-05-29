const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cardUtils = require("../../utils/cardUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("card")
    .setDescription("Look up information about a specific tarot card")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the tarot card to look up")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const cardName = interaction.options.getString("name");

    try {
      // Find the card
      const card = this.findCard(cardName);

      if (!card) {
        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setTitle("🔍 Card Not Found")
          .setDescription(`I couldn't find a card named "${cardName}".`)
          .addFields(
            {
              name: "💡 Suggestions",
              value:
                "• Use the **autocomplete** feature while typing\n• Try partial names (e.g., 'Fool' instead of 'The Fool')\n• Check spelling carefully\n• Browse popular cards below",
              inline: false,
            },
            {
              name: "🌟 Popular Cards to Try",
              value:
                "• The Fool\n• The Magician\n• Death\n• The Star\n• Ace of Cups\n• Queen of Wands",
              inline: true,
            },
            {
              name: "🔮 Card Categories",
              value:
                "• **Major Arcana** (22 cards)\n• **Minor Arcana** (56 cards)\n• **Court Cards** (16 cards)",
              inline: true,
            }
          )
          .setFooter({
            text: "Use /card and start typing to see all available cards ✨",
          });

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Create detailed card information
      const uprightEmbed = new EmbedBuilder()
        .setColor(0x4b0082)
        .setTitle(`🔮 ${card.name}`)
        .setDescription("**Upright Meaning**")
        .addFields(
          {
            name: "Keywords",
            value: card.upright.keywords.join(", "),
            inline: false,
          },
          {
            name: "Meaning",
            value: card.upright.meaning,
            inline: false,
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
          }
        )
        .setThumbnail(card.image_url || null)
        .setFooter({ text: "Swipe for reversed meaning →" });

      const reversedEmbed = new EmbedBuilder()
        .setColor(0x8b0000)
        .setTitle(`🔮 ${card.name} (Reversed)`)
        .setDescription("**Reversed Meaning**")
        .addFields(
          {
            name: "Keywords",
            value: card.reversed.keywords.join(", "),
            inline: false,
          },
          {
            name: "Meaning",
            value: card.reversed.meaning,
            inline: false,
          }
        )
        .setThumbnail(card.image_url || null)
        .setFooter({ text: "← Swipe for upright meaning" });

      await interaction.reply({ embeds: [uprightEmbed, reversedEmbed] });
    } catch (error) {
      console.error("Error in card command:", error);

      const isNetworkError =
        error.message?.includes("network") ||
        error.message?.includes("timeout");

      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(
          isNetworkError
            ? "📡 Connection to mystical library lost"
            : "🚫 Card Lookup Failed"
        )
        .setDescription(
          isNetworkError
            ? "Unable to access the spiritual card database at this moment."
            : "Something went wrong while searching for the card."
        )
        .addFields({
          name: "🔧 What you can try",
          value: isNetworkError
            ? "• Wait 30-60 seconds and try again\n• Check your internet connection\n• Try a different card name"
            : "• Check the card name spelling\n• Use the autocomplete feature\n• Try again in a moment",
          inline: false,
        })
        .setFooter({
          text: "The mystical library will be available again soon ✨",
        });

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();

    // Get all card names
    const allCards = cardUtils.allCards;

    // Filter cards based on input
    const filtered = allCards
      .filter((card) => card.name.toLowerCase().includes(focusedValue))
      .slice(0, 25) // Discord limit
      .map((card) => ({
        name: card.name,
        value: card.name,
      }));

    await interaction.respond(filtered);
  },

  findCard(cardName) {
    const normalizedName = cardName.toLowerCase().trim();

    return cardUtils.allCards.find(
      (card) =>
        card.name.toLowerCase() === normalizedName ||
        card.name.toLowerCase().includes(normalizedName)
    );
  },
};
