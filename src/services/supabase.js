// Supabase service for Supabase connection
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('find-config')('.env') })

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

/**
 * Initialize the database with required tables
 * Note: You should create these tables in Supabase dashboard first
 */
async function initDatabase() {
  // This function is mostly for documentation as tables
  // are typically created via Supabase dashboard
  console.log('Supabase connection initialized')
}

/**
 * Adds or updates a user in the database
 * @param {string} userid - Discord user ID
 * @param {string} username - Discord username
 */
async function upsertUser(userid, username) {
  const { data, error } = await supabase.from('users').upsert(
    [
      {
        userid,
        username,
        lastactive: new Date().toISOString()
      }
    ],
    { onConflict: 'userid', ignoreDuplicates: false }
  )

  if (error) console.error('Error upserting user:', error)
  return data
}

/**
 * Adds a problem to the database
 * @param {string} problemid - LeetCode problem ID
 * @param {string} title - Problem title
 * @param {string} difficulty - Problem difficulty (Easy, Medium, Hard)
 * @param {string} url - Problem URL
 */
async function addProblem(problemid, title, difficulty, url) {
  const { data, error } = await supabase.from('problems').upsert(
    [
      {
        problemid,
        title,
        difficulty,
        url,
        postedat: new Date().toISOString()
      }
    ],
    { onConflict: 'problemid', ignoreDuplicates: false }
  )

  if (error) console.error('Error adding problem:', error)
  return data
}

/**
 * Get all problems from the database
 */
async function getAllProblems() {
  const { data: solvedProblems, error } = await supabase
    .from('problems')
    .select('problemid')

  if (error) {
    console.error('Error fetching solved problems:', error)
    throw error
  }

  return solvedProblems
}

/**
 * Marks a problem as solved by a user
 * @param {string} userid - Discord user ID
 * @param {string} problemid - LeetCode problem ID
 * @param {string} difficulty - Problem difficulty
 */
async function markProblemSolved(userid, problemid, difficulty) {
  // First check if already solved to avoid duplicates
  const { data: existing } = await supabase
    .from('solved')
    .select('*')
    .eq('userid', userid)
    .eq('problemid', problemid)
    .single()

  if (existing) {
    console.log(`User ${userid} already solved problem ${problemid}`)
    return existing
  }

  // Add to solved table
  const { error: solvedError } = await supabase.from('solved').insert([
    {
      userid,
      problemid,
      solvedat: new Date().toISOString()
    }
  ])

  if (solvedError) {
    console.error('Error marking problem as solved:', solvedError)
    return null
  }

  // Update user stats based on difficulty
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('userid', userid)
    .single()

  if (!user) {
    console.error(`User ${userid} not found`)
    return null
  }

  // Create update object
  const updates = {
    totalsolved: (user.totalsolved || 0) + 1,
    lastactive: new Date().toISOString()
  }

  // Update difficulty-specific counter
  if (difficulty.toLowerCase() === 'easy') {
    updates.easysolved = (user.easysolved || 0) + 1
  } else if (difficulty.toLowerCase() === 'medium') {
    updates.mediumsolved = (user.mediumsolved || 0) + 1
  } else if (difficulty.toLowerCase() === 'hard') {
    updates.hardsolved = (user.hardsolved || 0) + 1
  }

  // Update user stats
  const { error: userError } = await supabase
    .from('users')
    .update(updates)
    .eq('userid', userid)

  if (userError) console.error('Error updating user stats:', userError)

  return { success: !userError }
}

/**
 * Get the server leaderboard
 * @param {number} limit - Number of users to return
 * @returns {Array} - Array of users sorted by problems solved
 */
async function getLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('totalsolved', { ascending: false })
    .order('hardsolved', { ascending: false })
    .order('mediumsolved', { ascending: false })
    .limit(limit)

  if (error) console.error('Error fetching leaderboard:', error)
  return data || []
}

/**
 * Get stats for a specific user
 * @param {string} userid - Discord user ID
 * @returns {Object} - User stats
 */
async function getUserStats(userid) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('userid', userid)
    .single()

  if (error && error.code !== 'PGRST116') {
    // Not found error
    console.error('Error fetching user stats:', error)
  }

  return data || null
}

/**
 * Get recently solved problems
 * @param {number} limit - Number of problems to return
 * @returns {Array} - Array of recently solved problems with user info
 */
async function getRecentlySolved(limit = 5) {
  const { data, error } = await supabase
    .from('solved')
    .select(
      `
      solvedat,
      users (userid, username),
      problems (problemid, title, difficulty, url)
    `
    )
    .order('solvedat', { ascending: false })
    .limit(limit)

  if (error) console.error('Error fetching recent solutions:', error)
  return data || []
}

/**
 * Marks a problem as unsolved by a user
 * @param {string} userid - Discord user ID
 * @param {string} problemid - LeetCode problem ID
 * @param {string} difficulty - Problem difficulty
 */
async function markProblemUnsolved(userid, problemid, difficulty) {
  // First check if the problem was actually solved by this user
  const { data: existing, error: checkError } = await supabase
    .from('solved')
    .select('*')
    .eq('userid', userid)
    .eq('problemid', problemid)
    .single()

  if (checkError || !existing) {
    console.log(
      `Problem ${problemid} was not solved by user ${userid} or other error:`,
      checkError
    )
    return null
  }

  // Delete from solved table
  const { error: deleteError } = await supabase
    .from('solved')
    .delete()
    .eq('userid', userid)
    .eq('problemid', problemid)

  if (deleteError) {
    console.error('Error removing solved status:', deleteError)
    return null
  }

  // Update user stats based on difficulty
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('userid', userid)
    .single()

  if (!user) {
    console.error(`User ${userid} not found`)
    return null
  }

  // Create update object
  const updates = {
    totalsolved: Math.max((user.totalsolved || 0) - 1, 0), // Prevent negative numbers
    lastactive: new Date().toISOString()
  }

  // Update difficulty-specific counter
  if (difficulty.toLowerCase() === 'easy') {
    updates.easysolved = Math.max((user.easysolved || 0) - 1, 0)
  } else if (difficulty.toLowerCase() === 'medium') {
    updates.mediumsolved = Math.max((user.mediumsolved || 0) - 1, 0)
  } else if (difficulty.toLowerCase() === 'hard') {
    updates.hardsolved = Math.max((user.hardsolved || 0) - 1, 0)
  }

  // Update user stats
  const { error: userError } = await supabase
    .from('users')
    .update(updates)
    .eq('userid', userid)

  if (userError) console.error('Error updating user stats:', userError)

  return { success: !userError }
}

module.exports = {
  initDatabase,
  upsertUser,
  addProblem,
  markProblemSolved,
  markProblemUnsolved,
  getAllProblems,
  getLeaderboard,
  getUserStats,
  getRecentlySolved
}
