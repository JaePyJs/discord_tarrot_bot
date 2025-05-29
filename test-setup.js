// Simple test to verify the bot setup without connecting to Discord
const cardUtils = require("./src/utils/cardUtils");
const { initializeDatabase } = require("./src/database/init");

async function testSetup() {
  console.log("🔮 Testing Discord Tarot Bot Setup...\n");

  try {
    // Test 1: Card utilities
    console.log("📚 Testing card utilities...");
    const singleCard = cardUtils.singleCardReading();
    console.log(
      `✅ Single card reading: ${singleCard[0].name} (${
        singleCard[0].isReversed ? "Reversed" : "Upright"
      })`
    );

    const threeCards = cardUtils.threeCardReading();
    console.log(
      `✅ Three card reading: ${threeCards.map((c) => c.name).join(", ")}`
    );

    // Test 2: Database initialization
    console.log("\n💾 Testing database initialization...");
    await initializeDatabase();
    console.log("✅ Database initialized successfully");

    // Test 3: Card formatting
    console.log("\n🎨 Testing card formatting...");
    const formattedCard = cardUtils.formatCard(singleCard[0]);
    console.log(`✅ Card formatted: ${formattedCard.title}`); // Test 4: Load command structure
    console.log("\n⚡ Testing command structure...");
    const tarotCommand = require("./src/commands/tarot/tarot");
    console.log(`✅ Tarot command loaded: ${tarotCommand.data.name}`);

    console.log("\n🎉 All tests passed! The bot is ready for deployment.");
    console.log("\n📋 Next steps:");
    console.log("1. Set up your Discord bot token in .env");
    console.log('2. Run "npm run deploy-commands" to register slash commands');
    console.log('3. Run "npm start" to start the bot');
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testSetup();
