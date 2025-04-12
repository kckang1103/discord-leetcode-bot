// Scheduler service for cron jobs
const cron = require('node-cron')
const { getRandomUnsolvedProblem } = require('./leetcode')
const { sendProblemToChannel, sendErrorMessage } = require('./message')
const { addProblem } = require('./supabase')
const { CHANNEL_ID, TIMEZONE } = require('../config')

/**
 * Sets up the cron job to run every Friday at 5PM
 */
function setupCronJob() {
  // Format: second minute hour day-of-month month day-of-week
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
        console.error('Error in scheduled job:', error)
        await sendErrorMessage(CHANNEL_ID)
      }
    },
    {
      timezone: TIMEZONE
    }
  )

  console.log('Scheduled weekly LeetCode problem for Fridays at 5PM')
}

module.exports = {
  setupCronJob
}
