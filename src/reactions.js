// Reaction handlers for Discord bot messages
const config = require('./config')
const supabaseService = require('./services/supabase')

/**
 * Extract problem details from embed
 * @param {Object} embed - The Discord embed object
 * @returns {Object|null} - Problem details or null if not found
 */
function extractProblemDetails(embed) {
  if (!embed || !embed.data || !embed.data.title || !embed.data.url) {
    console.log('Invalid embed structure:', embed)
    return null
  }

  // Extract problem ID number from title
  // "#9: Palindrome Number" -> "9"
  const idMatch = embed.data.title.match(/#(\d+):/)
  const problemId = idMatch ? idMatch[1] : null

  // Extract difficulty from description
  let difficulty = 'Unknown'
  if (embed.data.description) {
    const difficultyMatch = embed.data.description.match(
      /\*\*Difficulty:\*\* (Easy|Medium|Hard)/i
    )
    if (difficultyMatch) {
      difficulty = difficultyMatch[1]
    }
  }

  return {
    problemid: problemId,
    title: embed.data.title,
    difficulty,
    url: embed.data.url
  }
}

/**
 * Handles reaction additions
 * @param {Object} reaction - The message reaction object
 * @param {Object} user - The user who reacted
 */
async function handleReactionAdd(reaction, user) {
  console.log('Reaction added event triggered!')

  // Ignore non-'✅' reactions
  if (reaction.emoji.name !== '✅') {
    return
  }

  // Fetch partials if needed
  if (reaction.partial) {
    await reaction.fetch()
  }
  if (reaction.message.partial) {
    await reaction.message.fetch()
  }

  const message = reaction.message

  // Check if the message author is the leetcode_bot
  if (message.author.username !== config.BOT_NAME) {
    console.log('Reaction is not on a LeetCode bot message. Ignoring.')
    return
  }

  // Ignore reactions if the bot reacted to itself
  if (user.username === config.BOT_NAME) {
    console.log('Reaction is from the bot itself. Ignoring.')
    return
  }

  // Access the embeds
  const embeds = message.embeds
  if (embeds.length > 0) {
    const embed = embeds[0]
    console.log('Embed title:', embed.title)
    console.log('Embed URL:', embed.url)

    // Extract problem details
    const problemDetails = extractProblemDetails(embed)
    if (!problemDetails || !problemDetails.problemid) {
      console.log('Could not extract problem details from embed.')
      return
    }

    try {
      // Store user data
      await supabaseService.upsertUser(user.id, user.username)

      // Mark problem as solved
      const result = await supabaseService.markProblemSolved(
        user.id,
        problemDetails.problemid,
        problemDetails.difficulty
      )

      if (result) {
        console.log(
          `User ${user.username} (${user.id}) marked problem ${problemDetails.problemid} as solved`
        )

        // Optional: Send confirmation message or DM
        try {
          await message.channel.send(
            `Congratulations ${user.toString()} on solving **${problemDetails.title}** (${problemDetails.difficulty})! Your leaderboard has been updated.`
          )
        } catch (err) {
          console.error('Error sending confirmation message:', err)
        }
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error)
    }
  } else {
    console.log('No embeds found in this message.')
  }
}

/**
 * Handles reaction removals
 * @param {Object} reaction - The message reaction object
 * @param {Object} user - The user who removed the reaction
 */
async function handleReactionRemove(reaction, user) {
  console.log('Reaction removed event triggered!')

  // Ignore non-'✅' reactions
  if (reaction.emoji.name !== '✅') {
    return
  }

  // Fetch partials if needed
  if (reaction.partial) {
    await reaction.fetch()
  }
  if (reaction.message.partial) {
    await reaction.message.fetch()
  }

  const message = reaction.message

  // Check if the message author is the leetcode_bot
  if (message.author.username !== config.BOT_NAME) {
    console.log('Reaction is not on a LeetCode bot message. Ignoring.')
    return
  }

  // Ignore reactions if the bot reacted to itself
  if (user.username === config.BOT_NAME) {
    console.log('Reaction is from the bot itself. Ignoring.')
    return
  }

  // Access the embeds
  const embeds = message.embeds
  if (embeds.length > 0) {
    const embed = embeds[0]
    console.log('Embed title:', embed.title)
    console.log('Embed URL:', embed.url)

    // Extract problem details
    const problemDetails = extractProblemDetails(embed)
    if (!problemDetails) {
      console.log('Could not extract problem details from embed.')
      return
    }

    try {
      // Remove the problem from user's solved list
      const result = await supabaseService.markProblemUnsolved(
        user.id,
        problemDetails.problemid,
        problemDetails.difficulty
      )

      if (result) {
        console.log(
          `User ${user.username} (${user.id}) marked problem ${problemDetails.problemid} as unsolved`
        )

        // Optional: Send confirmation message
        try {
          await message.channel.send(
            `${user.toString()} has unmarked **${problemDetails.title}** as solved. Your leaderboard has been updated.`
          )
        } catch (err) {
          console.error('Error sending confirmation message:', err)
        }
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error)
    }
  } else {
    console.log('No embeds found in this message.')
  }
}

/**
 * Registers all reaction handlers with the client
 * @param {Object} client - Discord client
 */
function registerReactionHandlers(client) {
  client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore reactions from bots
    if (user.bot) return

    try {
      await handleReactionAdd(reaction, user)
    } catch (error) {
      console.error('Error handling reaction add:', error)
    }
  })

  client.on('messageReactionRemove', async (reaction, user) => {
    // Ignore reactions from bots
    if (user.bot) return

    try {
      await handleReactionRemove(reaction, user)
    } catch (error) {
      console.error('Error handling reaction remove:', error)
    }
  })
}

module.exports = {
  registerReactionHandlers
}
