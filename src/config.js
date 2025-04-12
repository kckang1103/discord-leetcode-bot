// Configuration settings for the bot
require('dotenv').config({ path: require('find-config')('.env') })

module.exports = {
  // Discord configuration
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CHANNEL_ID: process.env.CHANNEL_ID,
  ROLE_NAME: process.env.ROLE_NAME || 'LC Friday Enjoyer',

  // LeetCode API configuration
  LEETCODE_API: 'https://leetcode.com/graphql/',

  // Colors for different difficulty levels
  COLORS: {
    EASY: '#00b8a3', // Green
    MEDIUM: '#ffc01e', // Yellow
    HARD: '#ff375f', // Red
    DEFAULT: '#0088cc' // Blue
  },

  // Timezone for the scheduler
  TIMEZONE: 'America/Los_Angeles'
}
