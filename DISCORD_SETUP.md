# 🔮 Discord Bot Token Setup Guide

## 📋 **Step-by-Step Token Setup**

### **Step 1: Create Discord Application**

1. **Go to Discord Developer Portal**
   - Visit: https://discord.com/developers/applications
   - Log in with your Discord account

2. **Create New Application**
   - Click "New Application" button
   - Name your bot (e.g., "Mystic Tarot Reader")
   - Click "Create"

### **Step 2: Create Bot User**

1. **Navigate to Bot Section**
   - In your application, click "Bot" in the left sidebar
   - Click "Add Bot" button
   - Confirm by clicking "Yes, do it!"

2. **Configure Bot Settings**
   - **Username**: Choose a mystical name
   - **Avatar**: Upload a tarot-themed image
   - **Public Bot**: Turn OFF (recommended for personal use)
   - **Requires OAuth2 Code Grant**: Leave OFF
   - **Privileged Gateway Intents**: Leave all OFF (not needed)

### **Step 3: Get Your Bot Token** 🔑

1. **Copy the Token**
   - In the "Bot" section, find the "Token" area
   - Click "Reset Token" (if this is your first time)
   - Click "Copy" to copy your bot token
   - **⚠️ IMPORTANT: Keep this token SECRET! Never share it publicly!**

2. **Get Your Application ID**
   - Go to "General Information" section
   - Copy the "Application ID"

### **Step 4: Set Up Environment File** 📁

1. **Copy the Example File**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env File**
   Open the `.env` file in your text editor and replace the placeholder values:

   ```env
   # Replace with your actual bot token
   DISCORD_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OTA.GhIjKl.MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWx

   # Replace with your application ID
   CLIENT_ID=1234567890123456789

   # Optional: Replace with your test server ID for faster development
   GUILD_ID=9876543210987654321
   ```

   **Example of what your token looks like:**
   - Tokens are long strings with dots (.)
   - Format: `MTIzNDU2Nzg5MDEyMzQ1Njc4OTA.GhIjKl.MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWx`
   - They contain letters, numbers, and special characters

### **Step 5: Invite Bot to Your Server** 🏠

1. **Generate Invite Link**
   - In Discord Developer Portal, go to "OAuth2" > "URL Generator"
   - **Scopes**: Check `bot` and `applications.commands`
   - **Bot Permissions**: Check these permissions:
     - ✅ Send Messages
     - ✅ Use Slash Commands
     - ✅ Embed Links
     - ✅ Read Message History
     - ✅ Add Reactions (optional)

2. **Copy and Use Invite Link**
   - Copy the generated URL at the bottom
   - Open the URL in your browser
   - Select your Discord server
   - Click "Authorize"

### **Step 6: Test Your Setup** ✅

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Test Configuration**
   ```bash
   npm run test
   ```

3. **Deploy Commands**
   ```bash
   npm run deploy-commands
   ```

4. **Start the Bot**
   ```bash
   npm start
   ```

## 🔒 **Security Best Practices**

### **Keep Your Token Safe**
- ✅ Never commit `.env` file to Git
- ✅ Never share your token in Discord, forums, or code
- ✅ Use environment variables in production
- ✅ Regenerate token if accidentally exposed

### **File Structure**
```
your-project/
├── .env                 ← Your actual tokens (NEVER commit this!)
├── .env.example         ← Template file (safe to commit)
├── .gitignore          ← Should include .env
└── ...
```

### **What NOT to Do** ❌
```javascript
// DON'T hardcode tokens in your code!
const token = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTA.GhIjKl.MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWx";

// DON'T commit .env files
git add .env  // ❌ NEVER DO THIS!
```

### **What TO Do** ✅
```javascript
// DO use environment variables
const token = process.env.DISCORD_TOKEN;

// DO use .env files locally
require('dotenv').config();
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Invalid Token" Error**
   - Double-check your token in `.env`
   - Make sure there are no extra spaces
   - Try regenerating the token

2. **"Missing Permissions" Error**
   - Re-invite bot with correct permissions
   - Check server permissions for the bot

3. **Commands Not Appearing**
   - Run `npm run deploy-commands`
   - Wait a few minutes for Discord to update
   - Try removing and re-adding the bot

4. **Bot Offline**
   - Check your token is correct
   - Ensure bot is running (`npm start`)
   - Check console for error messages

### **Getting Help**

If you're still having issues:

1. **Check the Console**
   - Look for error messages when starting the bot
   - Common errors will have helpful messages

2. **Verify Your Setup**
   ```bash
   npm run test-all
   ```

3. **Check Discord Developer Portal**
   - Ensure your bot is created correctly
   - Verify permissions are set

## 🎉 **Success!**

Once everything is working, you should see:
- ✅ Bot shows as "Online" in Discord
- ✅ Slash commands appear when typing `/tarot`
- ✅ Bot responds to commands with beautiful tarot readings

**Your Discord Tarot Bot is now ready to provide mystical guidance!** 🔮✨

---

**Remember**: Keep your token secret and enjoy your mystical Discord bot! 🌟
