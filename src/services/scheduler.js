// Scheduler service for cron jobs
const cron = require('node-cron')
const { getRandomUnsolvedProblem } = require('./leetcode')
const {
  sendProblemToChannel,
  sendErrorMessage,
  sendLeaderboardToChannel
} = require('./message')
const { addProblem } = require('./supabase')
const { CHANNEL_ID, TIMEZONE } = require('../config')

/**
 * Sets up the cron job to run every Friday at 5PM
 */
function setupCronJob() {
  // Format: second minute hour day-of-month month day-of-week
  // Friday job at 5PM for sending problems
  cron.schedule(
    '0 0 17 * * 5',
    async () => {
      console.log("It's Friday at 5PM! Sending a LeetCode problem...")

      try {
        const problem = await getRandomUnsolvedProblem()

        // Store problem data
        await addProblem(
          problem.frontendQuestionId,
          problem.title,
          problem.difficulty,
          `https://leetcode.com/problems/${problem.titleSlug}`
        )

        await sendProblemToChannel(CHANNEL_ID, problem, true)
      } catch (error) {
        console.error('Error sending weekly problem:', error)
        await sendErrorMessage(CHANNEL_ID)
      }
    },
    {
      timezone: TIMEZONE
    }
  )

  // Sunday job at 12PM for sending leaderboard
  cron.schedule(
    '0 0 12 * * 0',
    async () => {
      console.log("It's Sunday at 12PM! Sending the leaderboard...")

      try {
        // Send !leaderboard to Discord channel
        await sendLeaderboardToChannel(CHANNEL_ID)
      } catch (error) {
        console.error('Error sending leaderboard:', error)
        await sendErrorMessage(CHANNEL_ID)
      }
    },
    {
      timezone: TIMEZONE
    }
  )

  console.log('Scheduled weekly LeetCode problem for Fridays at 5PM')
  console.log('Scheduled weekly leaderboard update for Sundays at 12PM')
}

module.exports = {
  setupCronJob
}
