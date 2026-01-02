
import React, { useState, useEffect } from 'react';
import { GameMode, GameState, Player, WINNING_LINES, LeaderboardEntry } from './types';
import { findBestMove } from './logic/minimax';
import Square from './components/Square';
import Leaderboard from './components/Leaderboard';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const [state, setState] = useState<GameState>({
    board: Array(9).fill(null),
    xIsNext: true,
    winner: null,
    winningLine: null,
    mode: GameMode.PVAI,
    scores: { X: 0, O: 0, draws: 0 },
    isGameOver: false,
    aiThinking: false
  });

  // Load leaderboard on mount
  useEffect(() => {
    const saved = localStorage.getItem('ttt_leaderboard');
    if (saved) {
      try {
        setLeaderboard(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      }
    }
  }, []);

  // Update leaderboard when game ends
  useEffect(() => {
    if (state.isGameOver && gameStarted) {
      const pName = playerName.trim() || 'Player X';
      const winner = state.winner;
      const isDraw = !winner && state.board.every(s => s !== null);
      
      setLeaderboard(prev => {
        const newLeaderboard = [...prev];
        const entryIndex = newLeaderboard.findIndex(e => e.name.toLowerCase() === pName.toLowerCase());
        
        const wins = (winner === 'X') ? 1 : 0;
        const draws = isDraw ? 1 : 0;
        const losses = (winner === 'O') ? 1 : 0;

        if (entryIndex >= 0) {
          newLeaderboard[entryIndex] = {
            ...newLeaderboard[entryIndex],
            wins: newLeaderboard[entryIndex].wins + wins,
            draws: newLeaderboard[entryIndex].draws + draws,
            losses: newLeaderboard[entryIndex].losses + losses
          };
        } else {
          newLeaderboard.push({ name: pName, wins, draws, losses });
        }

        localStorage.setItem('ttt_leaderboard', JSON.stringify(newLeaderboard));
        return newLeaderboard;
      });
    }
  }, [state.isGameOver, state.winner, gameStarted]);

  const checkWinner = (board: Player[]): { winner: Player; line: number[] | null } => {
    for (const [a, b, c] of WINNING_LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: [a, b, c] };
      }
    }
    return { winner: null, line: null };
  };

  const handleSquareClick = (index: number) => {
    if (state.board[index] || state.winner || state.aiThinking) return;

    const newBoard = [...state.board];
    newBoard[index] = state.xIsNext ? 'X' : 'O';

    const { winner, line } = checkWinner(newBoard);
    const isDraw = !winner && newBoard.every(s => s !== null);

    setState(prev => {
      const updatedScores = { ...prev.scores };
      if (winner === 'X') updatedScores.X += 1;
      else if (winner === 'O') updatedScores.O += 1;
      else if (isDraw) updatedScores.draws += 1;

      return {
        ...prev,
        board: newBoard,
        xIsNext: !prev.xIsNext,
        winner,
        winningLine: line,
        isGameOver: !!winner || isDraw,
        scores: updatedScores
      };
    });
  };

  // AI Move logic
  useEffect(() => {
    if (
      gameStarted &&
      state.mode === GameMode.PVAI && 
      !state.xIsNext && 
      !state.isGameOver
    ) {
      setState(prev => ({ ...prev, aiThinking: true }));
      
      const timer = setTimeout(() => {
        const bestMove = findBestMove(state.board, 'O', 'X');
        if (bestMove !== -1) {
          handleSquareClick(bestMove);
        }
        setState(prev => ({ ...prev, aiThinking: false }));
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [state.xIsNext, state.mode, state.isGameOver, gameStarted]);

  const resetGame = () => {
    setState(prev => ({
      ...prev,
      board: Array(9).fill(null),
      xIsNext: true,
      winner: null,
      winningLine: null,
      isGameOver: false,
      aiThinking: false
    }));
  };

  const toggleMode = () => {
    setState(prev => ({
      ...prev,
      mode: prev.mode === GameMode.PVP ? GameMode.PVAI : GameMode.PVP,
      scores: { X: 0, O: 0, draws: 0 },
      board: Array(9).fill(null),
      xIsNext: true,
      winner: null,
      winningLine: null,
      isGameOver: false,
      aiThinking: false
    }));
  };

  const isDraw = !state.winner && state.board.every(s => s !== null);
  const displayPlayerName = playerName.trim() || 'Player X';

  if (!gameStarted) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 animate-fade-in relative">
        <div className="w-full max-w-md glass p-10 rounded-[2.5rem] shadow-2xl text-center space-y-8">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent uppercase tracking-tighter mb-2">
              Tic Tac Toe
            </h1>
          </div>
          
          <div className="space-y-4">
            <div className="text-left space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest ml-1">Identify Yourself</label>
              <input
                type="text"
                placeholder="Enter your name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => setGameStarted(true)}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-600 rounded-2xl font-black text-white uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
              >
                Start Game
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full py-3 glass rounded-xl font-bold text-slate-400 uppercase tracking-widest text-xs hover:text-white transition-colors"
              >
                View Leaderboard
              </button>
            </div>
          </div>
        </div>
        {showLeaderboard && <Leaderboard entries={leaderboard} onClose={() => setShowLeaderboard(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in relative">
      {/* Header & Stats */}
      <div className="w-full max-w-md mb-8 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button
              onClick={() => setGameStarted(false)}
              className="p-2 glass rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"
              title="Back to Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent uppercase tracking-tight">
              Tic Tac Toe
            </h1>
          </div>
          <button 
            onClick={toggleMode}
            className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider glass hover:bg-white/10 transition-colors"
          >
            {state.mode === GameMode.PVP ? 'PVP' : 'VS CPU'}
          </button>
        </div>

        {/* Score Board */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass p-3 rounded-2xl text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1 overflow-hidden text-ellipsis whitespace-nowrap">{displayPlayerName}</div>
            <div className="text-2xl font-black text-cyan-400">{state.scores.X}</div>
          </div>
          <div className="glass p-3 rounded-2xl text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Draws</div>
            <div className="text-2xl font-black text-slate-200">{state.scores.draws}</div>
          </div>
          <div className="glass p-3 rounded-2xl text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {state.mode === GameMode.PVP ? 'Player O' : 'CPU (O)'}
            </div>
            <div className="text-2xl font-black text-fuchsia-400">{state.scores.O}</div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center items-center h-8">
          {state.winner ? (
            <p className="text-lg font-bold animate-bounce text-white">
              🎉 <span className={state.winner === 'X' ? 'text-cyan-400' : 'text-fuchsia-400'}>{state.winner === 'X' ? displayPlayerName : 'Player O'}</span> Wins!
            </p>
          ) : isDraw ? (
            <p className="text-lg font-bold text-slate-300">It's a Draw! 🤝</p>
          ) : (
            <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
              {state.aiThinking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
                  AI is thinking...
                </>
              ) : (
                <>
                  <span className={`w-2 h-2 rounded-full ${state.xIsNext ? 'bg-cyan-400' : 'bg-fuchsia-400'}`}></span>
                  {state.xIsNext ? `${displayPlayerName}'s Turn` : (state.mode === GameMode.PVP ? "Player O's Turn" : "CPU's Turn")}
                </>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div className="w-full max-w-[340px] sm:max-w-md aspect-square glass p-4 rounded-[2rem] shadow-2xl relative">
        <div className="grid grid-cols-3 gap-3 h-full">
          {state.board.map((square, i) => (
            <Square
              key={i}
              value={square}
              onClick={() => handleSquareClick(i)}
              isWinningSquare={state.winningLine?.includes(i) || false}
              disabled={state.isGameOver || (state.mode === GameMode.PVAI && !state.xIsNext)}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-12 flex gap-4 w-full max-w-md">
        <button
          onClick={resetGame}
          className="flex-1 py-4 glass rounded-2xl font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all active:scale-95"
        >
          {state.isGameOver ? 'Play Again' : 'Reset Grid'}
        </button>
        <button
          onClick={() => setShowLeaderboard(true)}
          className="px-6 py-4 glass rounded-2xl font-bold text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all active:scale-95"
          title="View Leaderboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>

      <footer className="mt-auto pb-8 text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">
        Tic Tac Toe v1.0.4
      </footer>
      {showLeaderboard && <Leaderboard entries={leaderboard} onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
};

export default App;
