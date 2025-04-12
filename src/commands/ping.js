/**
 * Handle ping command
 * @param {Object} message - Discord message
 */
async function handlePingCommand(message) {
  const startTime = Date.now()
  const pingMessage = await message.channel.send('🏓 Pong!')
  const latency = Date.now() - startTime
  pingMessage.edit(`🏓 Pong! (took ${latency}ms)`)
}

module.exports = {
  handlePingCommand
}
