const cfService = require('./services/codeforces');
const db = require('./db');

class MatchManager {
  constructor(io) {
    this.io = io;
    this.activeMatches = new Map();
    // Poll active matches for Codeforces submissions every 5 seconds
    setInterval(() => this.pollActiveMatches(), 5000);
  }

  async createMatch(creatorId, timeLimit = 45, ratingMin = 800, ratingMax = 1200, isSolo = false) {
    const res = await db.query(
      `INSERT INTO matches (player1, status, start_time)
       VALUES ($1, 'WAITING', NOW()) RETURNING *`,
      [creatorId || null]
    );
    const match = res.rows[0];

    const roomState = {
      roomId: match.id,
      player1: creatorId ? await this.getUserData(creatorId) : null,
      player2: null,
      isSolo: !!isSolo,
      timeLimit: parseInt(timeLimit) || 45,
      ratingMin: parseInt(ratingMin) || 800,
      ratingMax: parseInt(ratingMax) || 1200,
      status: 'WAITING',
      startTime: null,
      endTime: null,
      problem: null,
      winner: null,
      timerId: null
    };

    this.activeMatches.set(match.id, roomState);
    return roomState;
  }

  async getUserData(userId) {
    if (!userId) return null;
    const res = await db.query('SELECT id, username, cf_handle, wins, losses, COALESCE(draws, 0) AS draws FROM users WHERE id = $1', [userId]);
    return res.rows[0] || null;
  }

  async joinMatch(roomId, userId) {
    let room = this.activeMatches.get(roomId);
    if (!room) {
      const res = await db.query('SELECT * FROM matches WHERE id = $1', [roomId]);
      if (res.rows.length === 0) throw new Error('Room not found');
      const m = res.rows[0];

      room = {
        roomId: m.id,
        player1: await this.getUserData(m.player1),
        player2: await this.getUserData(m.player2),
        isSolo: false,
        timeLimit: 45,
        ratingMin: 800,
        ratingMax: 1200,
        status: m.status,
        startTime: m.start_time ? new Date(m.start_time).getTime() : null,
        endTime: m.end_time ? new Date(m.end_time).getTime() : null,
        problem: m.problem_id ? { id: m.problem_id } : null,
        winner: m.winner,
        timerId: null
      };
      this.activeMatches.set(roomId, room);
    }

    if (userId) {
      const userData = await this.getUserData(userId);
      if (!userData) throw new Error('User not found');

      if (!room.player1 || room.player1.id === userId) {
        room.player1 = userData;
        await db.query('UPDATE matches SET player1 = $1 WHERE id = $2', [userId, roomId]);
      } else if (!room.player2 || room.player2.id === userId) {
        room.player2 = userData;
        await db.query('UPDATE matches SET player2 = $1 WHERE id = $2', [userId, roomId]);
      } else {
        throw new Error('Room is full');
      }
    }

    return room;
  }

  async startMatch(roomId) {
    const room = this.activeMatches.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.status === 'ACTIVE') return room;

    room.status = 'ACTIVE';
    room.startTime = Date.now();
    await db.query(`UPDATE matches SET status = 'ACTIVE', start_time = NOW() WHERE id = $1`, [roomId]);

    // Select random problem from Codeforces
    const problem = cfService.getRandomProblem(room.ratingMin, room.ratingMax, new Set());
    if (problem) {
      const probId = `${problem.contestId}-${problem.index}`;
      room.problem = {
        id: probId,
        contestId: problem.contestId,
        index: problem.index,
        name: problem.name,
        rating: problem.rating
      };
      await db.query('UPDATE matches SET problem_id = $1 WHERE id = $2', [probId, roomId]);
    }

    // Emit socket events
    this.io.to(roomId).emit('start-match', this.sanitizeRoom(room));
    if (room.problem) {
      this.io.to(roomId).emit('problem-selected', room.problem);
    }

    // Set duration timer
    const durationMs = room.timeLimit * 60 * 1000;
    room.timerId = setTimeout(() => {
      this.endMatch(roomId, null);
    }, durationMs);

    return room;
  }

  async pollActiveMatches() {
    for (const [roomId, room] of this.activeMatches.entries()) {
      if (room.status !== 'ACTIVE' || !room.problem || !room.problem.contestId) continue;

      const players = [room.player1, room.player2].filter(Boolean);
      for (const player of players) {
        if (!player.cf_handle) continue;

        try {
          const subs = await cfService.getRecentSubmissions(player.cf_handle, 5);
          for (const sub of subs) {
            if (
              sub.problem &&
              sub.problem.contestId === room.problem.contestId &&
              sub.problem.index === room.problem.index &&
              sub.verdict === 'OK' &&
              sub.creationTimeSeconds * 1000 >= room.startTime - 10000
            ) {
              // Found solved submission!
              this.io.to(roomId).emit('submission-found', {
                player: player.username,
                cfHandle: player.cf_handle,
                problem: room.problem
              });
              await this.endMatch(roomId, player.id);
              return;
            }
          }
        } catch (err) {
          console.error(`Polling error for ${player.cf_handle}:`, err.message);
        }
      }
    }
  }

  async endMatch(roomId, winnerId = null) {
    const room = this.activeMatches.get(roomId);
    if (!room || room.status === 'FINISHED') return;

    if (room.timerId) clearTimeout(room.timerId);
    room.status = 'FINISHED';
    room.endTime = Date.now();
    room.winner = winnerId;

    await db.query(
      `UPDATE matches SET status = 'FINISHED', winner = $1, end_time = NOW() WHERE id = $2`,
      [winnerId, roomId]
    );

    if (winnerId) {
      // Update winner wins
      await db.query('UPDATE users SET wins = wins + 1 WHERE id = $1', [winnerId]);
      // Update loser losses
      const loserId = room.player1?.id === winnerId ? room.player2?.id : room.player1?.id;
      if (loserId) {
        await db.query('UPDATE users SET losses = losses + 1 WHERE id = $1', [loserId]);
      }
    } else {
      // Match was drawn / timed out: update draws count for participants
      if (room.player1?.id) {
        await db.query('UPDATE users SET draws = COALESCE(draws, 0) + 1 WHERE id = $1', [room.player1.id]);
      }
      if (room.player2?.id && room.player2.id !== room.player1?.id) {
        await db.query('UPDATE users SET draws = COALESCE(draws, 0) + 1 WHERE id = $1', [room.player2.id]);
      }
    }

    const winnerUser = winnerId ? await this.getUserData(winnerId) : null;
    this.io.to(roomId).emit('match-ended', {
      roomId,
      winner: winnerUser ? winnerUser.username : null,
      winnerId: winnerId
    });
  }

  sanitizeRoom(room) {
    return {
      roomId: room.roomId,
      player1: room.player1,
      player2: room.player2,
      isSolo: room.isSolo,
      timeLimit: room.timeLimit,
      ratingMin: room.ratingMin,
      ratingMax: room.ratingMax,
      status: room.status,
      startTime: room.startTime,
      endTime: room.endTime,
      problem: room.problem,
      winner: room.winner
    };
  }
}

module.exports = MatchManager;
