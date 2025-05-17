// Message formatting service for Discord messages
const { EmbedBuilder } = require('discord.js')
const { COLORS, ROLE_NAME } = require('../config')
const { client } = require('../bot')

/**
 * Find role ID by name in a guild
 * @param {Object} guild - Discord guild object
 * @param {String} roleName - Name of the role to find
 * @returns {String|null} Role ID or null if not found
 */
function findRoleId(guild, roleName) {
  const role = guild.roles.cache.find((r) => r.name === roleName)
  return role ? role.id : null
}

/**
 * Creates a rich embed for a LeetCode problem
 * @param {Object} problem - LeetCode problem object
 * @returns {EmbedBuilder} Formatted embed for Discord
 */
function createProblemEmbed(problem) {
  // Determine color based on difficulty
  let difficultyColor
  switch (problem.difficulty) {
    case 'Easy':
      difficultyColor = COLORS.EASY
      break
    case 'Medium':
      difficultyColor = COLORS.MEDIUM
      break
    case 'Hard':
      difficultyColor = COLORS.HARD
      break
    default:
      difficultyColor = COLORS.DEFAULT
  }

  // Create embed
  const embed = new EmbedBuilder()
    .setTitle(`#${problem.frontendQuestionId}: ${problem.title}`)
    .setURL(`https://leetcode.com/problems/${problem.titleSlug}`)
    .setColor(difficultyColor)
    .setDescription(
      `**Difficulty:** ${problem.difficulty}\n**Acceptance Rate:** ${Math.round(problem.acRate * 10) / 10}%`
    )
    .setFooter({ text: '🧠 Weekly LeetCode Challenge! 🧠' })
    .setTimestamp()

  // Add topics if available
  if (problem.topicTags && problem.topicTags.length > 0) {
    const topics = problem.topicTags
      .map((tag) => tag.name)
      .slice(0, 5)
      .join(', ')
    embed.addFields({ name: 'Topics', value: topics })
  }

  return embed
}

/**
 * Sends a LeetCode problem to a specified channel
 * @param {String} channelId - Discord channel ID
 * @param {Object} problem - LeetCode problem object
 * @param {Boolean} weekly - If true, includes weekly message
 */
async function sendProblemToChannel(channelId, problem, weekly = false) {
  try {
    const channel = client.channels.cache.get(channelId)
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found`)
      return
    }

    // Find role to ping
    const roleId = findRoleId(channel.guild, ROLE_NAME)
    const roleMention = roleId ? `<@&${roleId}> ` : ''

    // Create embed
    const embed = createProblemEmbed(problem)

    // Generate message content based on whether it's the weekly scheduled message
    const content = weekly
      ? `${roleMention}📝 **It's LeetCode Friday!** Here's your problem for this week:`
      : `Here's a random LeetCode problem:`

    // Send message
    message = await channel.send({ content, embeds: [embed] })
    await message.react('✅')
    console.log(`Sent problem "${problem.title}" to channel ${channelId}`)
  } catch (error) {
    console.error('Error sending problem to channel:', error)
    throw error
  }
}

/**
 * Sends an error message to a channel
 * @param {String} channelId - Discord channel ID
 */
async function sendErrorMessage(channelId) {
  try {
    const channel = client.channels.cache.get(channelId)
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found`)
      return
    }
    await channel.send(
      '❌ There was an error with the leetcode bot. Please try again later or contact Kichul.'
    )
  } catch (error) {
    console.error('Failed to send error message:', error)
  }
}

/**
 * Sends leaderboard command to a channel
 * @param {String} channelId - Discord channel ID
 */
async function sendLeaderboardToChannel(channelId) {
  try {
    const channel = client.channels.cache.get(channelId)
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found`)
      return
    }
    // Find role to ping
    const roleId = findRoleId(channel.guild, ROLE_NAME)
    const roleMention = roleId ? `<@&${roleId}> ` : ''

    await channel.send(`${roleMention}📊 This Week's Progress:`)
    // Wait a short moment and then send the leaderboard command
    setTimeout(async () => {
      await channel.send('!leaderboard')
    }, 500)
  } catch (error) {
    console.error('Failed to send error message:', error)
  }
}

module.exports = {
  sendProblemToChannel,
  sendErrorMessage,
  sendLeaderboardToChannel
}
