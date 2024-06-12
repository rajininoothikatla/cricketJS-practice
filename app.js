const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Runncing at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//Get the players list API 1

app.get(`/players/`, async (request, response) => {
  const getPlayersQuery = `
  SELECT * FROM player_details`
  const playersList = await db.all(getPlayersQuery)
  const ans = playersList => {
    return {
      playerId: playersList.player_id,
      playerName: playersList.player_name,
    }
  }
  response.send(playersList.map(eachPlayer => ans(eachPlayer)))
})

//Get the specific player based on the player ID API 2

app.get(`/players/:playerId/`, async (request, response) => {
  const {playerId} = request.params
  const getPlayerIdQuery = `
  SELECT * FROM player_details
  WHERE player_id = ${playerId};`
  const playerDetails = await db.get(getPlayerIdQuery)
  const {player_id, player_name} = playerDetails
  const dbResponse = {
    playerId: player_id,
    playerName: player_name,
  }
  response.send(dbResponse)
})

//(PUT) Updates the details of a specific player based on the player IDAPI 3

app.put(`/players/:playerId/`, async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerQuery = `
  UPDATE 
    player_details
  SET 
    player_name ='${playerName}'
  WHERE 
    player_id = ${playerId};`
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

//Get the match details of a specific match API 4

app.get(`/matches/:matchId/`, async (request, response) => {
  const {matchId} = request.params
  const getMatchIdQuery = `
  SELECT * FROM match_details
  WHERE match_id = ${matchId};`
  const matchDetails = await db.get(getMatchIdQuery)
  const {match_id, match, year} = matchDetails
  const dbResponse = {
    matchId: match_id,
    match: match,
    year: year,
  }
  response.send(dbResponse)
})

//Get the list of all the matches of a player API 5

app.get(`/players/:playerId/matches`, async (request, response) => {
  const {playerId} = request.params
  const getAllMatchesQuery = `
  SELECT 
    match_details.match_id AS matchId,
    match_details.match As match,
    match_details.year AS year,
  FROM player_match_score NATURAL JOIN match_details
  WHERE player_match_score.player_id = ${playerId};`
  const playerMatches = await db.all(getAllMatchesQuery)
  const ans = playerMatches => {
    return {
      matchId: playerMatches.match_id,
      match: playerMatches.match,
      year: playerMatches.year,
    }
  }
  response.send(playerMatches.map(eachMatch => ans(eachMatch)))
})

//Get the list of players of a specific match API 6

app.get(`/matches/:matchId/players`, async (request, response) => {
  const {matchId} = request.params
  const getAllPlayersQuery = `
  SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
  FROM player_match_score NATURAL JOIN player_details
  WHERE match_id = ${matchId};`
  const playersArray = await db.all(getAllPlayersQuery)
  response.send(playersArray)
})

//Get the statistics of the total score, fours, sixes of a specific player based on the player ID API 7

app.get(`/players/:playerId/playerScores`, async (request, response) => {
  const {playerId} = request.params
  const getAllPlayerScoreQuery = `
  SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes 
  FROM player_details INNER JOIN player_match_score ON
  player_details.player_id = player_match_score.player_id
  WHERE player_details.player_id = ${playerId};`
  const getAllPlayerScoreQueryResponse = await db.get(getAllPlayerScoreQuery)
  response.send(getAllPlayerScoreQueryResponse)
})

module.exports = app
