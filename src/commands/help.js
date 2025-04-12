/**
 * Handle help command
 * @param {Object} message - Discord message
 */
async function handleHelpCommand(message) {
  const helpEmbed = {
    title: 'LeetCode Bot Help',
    color: 0x0099ff,
    description: 'Here are the available commands:',
    fields: [
      {
        name: '!problem',
        value: 'Get a random LeetCode problem'
      },
      {
        name: '!leaderboard',
        value: "Show the server's leaderboard"
      },
      {
        name: '!leaderboard me',
        value: 'Show your personal stats'
      },
      {
        name: '!ping',
        value: 'Pings the server and shows latency'
      },
      {
        name: '!help',
        value: 'Display this help information'
      }
    ],
    footer: {
      text: 'React with ✅ to mark problems as solved!'
    }
  }

  message.channel.send({ embeds: [helpEmbed] })
}

module.exports = {
  handleHelpCommand
}
