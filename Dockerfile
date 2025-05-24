FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tarotbot -u 1001

# Create necessary directories
RUN mkdir -p database && \
    chown -R tarotbot:nodejs /app

# Copy application code
COPY --chown=tarotbot:nodejs . .

# Switch to non-root user
USER tarotbot

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Bot is healthy')" || exit 1

# Expose port (if needed for health checks)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
