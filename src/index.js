// Main entry point for the LeetCode Discord bot
const { client } = require('./bot')
const { setupCronJob } = require('./services/scheduler')
const { registerCommandHandlers } = require('./commands/commands')
const { registerReactionHandlers } = require('./reactions')
require('dotenv').config({ path: require('find-config')('.env') })

// When the client is ready, run this code
client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`)

  // Set up the scheduled job for Friday at 5PM
  setupCronJob()
})

// Register message command handlers
registerCommandHandlers(client)

// Register message reaction handlers
registerReactionHandlers(client)

// Log in to Discord with token
client.login(process.env.DISCORD_TOKEN)
