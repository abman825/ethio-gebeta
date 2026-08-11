import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import AdBanner from './AdBanner';

const API_URL = "https://ethio-gebeta-backend.onrender.com";
const socket = io(API_URL, { autoConnect: false });

function App() {
  const [board, setBoard] = useState(Array(12).fill(4));
  const [scores, setScores] = useState([0, 0]);
  const [turn, setTurn] = useState(0); 
  const [gameMode, setGameMode] = useState(null); // 'PvP', 'PvE', 'Online'
  const [difficulty, setDifficulty] = useState(null); // 'easy', 'medium', 'hard'
  const [isAnimating, setIsAnimating] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // Online Multiplayer States
  const [roomId, setRoomId] = useState('');
  const [joinedRoom, setJoinedRoom] = useState('');
  const [myPlayerIndex, setMyPlayerIndex] = useState(null); 
  const [gameStarted, setGameStarted] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState('');



  // AdMob script
  useEffect(() => {
    try { 
      (window.adsbygoogle = window.adsbygoogle || []).push({}); 
    } catch (e) {}
  }, [gameMode]);

  // CPU (AI) Smart Move Logic
  const getCpuMove = (currentBoard, diff) => {
    const validMoves = [6, 7, 8, 9, 10, 11].filter(i => currentBoard[i] > 0);
    if (validMoves.length === 0) return null;

    // 1. EASY: በዘፈቀደ (Random) መምረጥ
    if (diff === 'easy') {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // 2. MEDIUM: የሚበላ ጠጠር (የመጨረሻው ጠጠር ሲያርፍ 4 የሚሞላበት) ካለ ያንን መምረጥ
    if (diff === 'medium') {
      for (let move of validMoves) {
        let seeds = currentBoard[move];
        let targetIndex = (move + seeds) % 12;
        if (currentBoard[targetIndex] === 3) return move; // 3 የነበረው 4 ስለሚሆን ይበላል
      }
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    // 3. HARD: ብዙ ጠጠር የሚበላውን ወይም ብዙ ጠጠር የያዘውን አብልጦ መምረጥ
    if (diff === 'hard') {
      let bestMove = validMoves[0];
      let maxScore = -1;

      for (let move of validMoves) {
        let seeds = currentBoard[move];
        let targetIndex = (move + seeds) % 12;
        let score = (currentBoard[targetIndex] === 3) ? 100 + seeds : seeds;

        if (score > maxScore) {
          maxScore = score;
          bestMove = move;
        }
      }
      return bestMove;
    }

    return validMoves[0];
  };

  // CPU Move Trigger (PvE Mode)
  useEffect(() => {
    if (gameMode === 'PvE' && difficulty && turn === 1 && !winner && !isAnimating) {
      const timer = setTimeout(() => {
        const cpuMove = getCpuMove(board, difficulty);
        if (cpuMove !== null) {
          handleMove(cpuMove);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, difficulty, isAnimating, winner, board]);


  // Socket.io Listener
  useEffect(() => {
    if (gameMode === 'Online' && joinedRoom) {
      socket.connect();

      socket.on('playerAssignment', ({ player }) => {
        setMyPlayerIndex(player);
        setOnlineStatus(player === 0 ? 'ተጫዋች 2 እስኪቀላቀል በመጠበቅ ላይ...' : 'ከክፍሉ ጋር ተገናኝተዋል!');
      });

      socket.on('gameStart', () => {
        setGameStarted(true);
        setOnlineStatus('ጨዋታው ተጀምሯል!');
      });

      socket.on('gameStateUpdate', ({ newBoard, newScores, nextTurn, winnerMsg }) => {
        setBoard(newBoard);
        setScores(newScores);
        setTurn(nextTurn);
        if (winnerMsg) setWinner(winnerMsg);
      });

      socket.on('playerLeft', () => {
        setWinner('ተቃዋሚው ከጨዋታው ወጥቷል!');
      });

      return () => {
        socket.off('playerAssignment');
        socket.off('gameStart');
        socket.off('gameStateUpdate');
        socket.off('playerLeft');
        socket.disconnect();
      };
    }
  }, [gameMode, joinedRoom]);

  const playPop = () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
      osc.connect(gain); 
      gain.connect(context.destination);
      osc.start(); 
      osc.stop(context.currentTime + 0.1);
    } catch (e) { 
      console.log("Audio play failed"); 
    }
  };

  const handleMove = async (index) => {
    if (isAnimating || winner) return;

    if (gameMode === 'Online') {
      if (!gameStarted) return;
      if (turn !== myPlayerIndex) return;
      if (myPlayerIndex === 0 && index > 5) return;
      if (myPlayerIndex === 1 && index <= 5) return;
      if (board[index] === 0) return;
    } else {
      if (turn === 0 && index > 5) return;
      if (turn === 1 && index <= 5) return;
      if (board[index] === 0) return;
    }

    setIsAnimating(true);
    let newBoard = [...board];
    let newScores = [...scores];
    let seeds = newBoard[index];
    newBoard[index] = 0;
    setBoard([...newBoard]);

    let curr = index;
    for (let i = 0; i < seeds; i++) {
      curr = (curr + 1) % 12;
      newBoard[curr]++;
      
      setBoard([...newBoard]);
      playPop();
      await new Promise(r => setTimeout(r, 200)); 

      // 4 ሲሞላ የመበላት ህግ
      if (newBoard[curr] === 4) {
        newScores[turn] += 4;
        newBoard[curr] = 0;
        setBoard([...newBoard]);
        setScores([...newScores]);
      }
    }

    // የሁለቱ ወገኖች አጠቃላይ የጠጠር ብዛት
    const p1Total = newBoard.slice(0, 6).reduce((a, b) => a + b, 0);
    const p2Total = newBoard.slice(6, 12).reduce((a, b) => a + b, 0);

    let nextTurn = turn === 0 ? 1 : 0;
    let winnerMsg = null;

    // ከሁለቱ ወገን የአንዱ ጠጠር ካለቀ (END GAME SWEEP LOGIC)
    if (p1Total === 0 || p2Total === 0) {
      // በየጉድጓዱ የቀሩትን ጠጠሮች ወደየስኮራቸው መደመር
      newScores[0] += p1Total;
      newScores[1] += p2Total;
      newBoard = Array(12).fill(0);

      setBoard([...newBoard]);
      setScores([...newScores]);

      if (newScores[0] > newScores[1]) {
        winnerMsg = `ተጫዋች 1 በ ${newScores[0]} ለ ${newScores[1]} አሸነፈ! 🎉`;
      } else if (newScores[1] > newScores[0]) {
        winnerMsg = `ተጫዋች 2 በ ${newScores[1]} ለ ${newScores[0]} አሸነፈ! 🎉`;
      } else {
        winnerMsg = `አቻ ተለያዩ! (${newScores[0]} - ${newScores[1]}) 🤝`;
      }
      setWinner(winnerMsg);
    } else {
      setTurn(nextTurn);
    }

    if (gameMode === 'Online') {
      socket.emit('sendGameState', {
        roomId: joinedRoom,
        newBoard,
        newScores,
        nextTurn,
        winnerMsg
      });
    }

    setIsAnimating(false);
  };

  const joinOnlineRoom = () => {
    if (roomId.trim()) {
      setJoinedRoom(roomId.trim().toUpperCase());
      socket.connect();
      socket.emit('joinRoom', roomId.trim().toUpperCase());
    }
  };

  // የጨዋታ ሞድ መምረጫ ገጽ
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white p-6 overflow-hidden">
        <h1 className="text-5xl font-black mb-12 tracking-tighter italic">
          <span className="text-green-600">ETHIO</span>
          <span className="text-yellow-400"> GEBETA</span>
        </h1>
        
        <div className="flex flex-col gap-4 w-full max-w-xs z-10">
          <button 
            onClick={() => setGameMode('PvP')} 
            className="active:scale-95 bg-green-700 py-4 rounded-2xl font-bold shadow-lg transition-all touch-manipulation">
            ከሰው ጋር (Local 2 Players)
          </button>
          
          <button 
            onClick={() => setGameMode('PvE')} 
            className="active:scale-95 bg-blue-700 py-4 rounded-2xl font-bold shadow-lg transition-all touch-manipulation">
            ከኮምፒውተር ጋር (CPU)
          </button>

          <button 
            onClick={() => setGameMode('Online')} 
            className="active:scale-95 bg-purple-700 py-4 rounded-2xl font-bold shadow-lg transition-all touch-manipulation">
            በኢንተርኔት (Online Room)
          </button>
          
          <button 
            onClick={() => setShowHelp(true)} 
            className="mt-2 text-gray-400 border border-gray-600 py-2 rounded-xl text-sm touch-manipulation">
            የጨዋታው ህግ (Help)
          </button>
        </div>

        {showHelp && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[60]">
            <div className="bg-neutral-800 p-8 rounded-3xl border-t-8 border-yellow-500 max-w-sm text-white">
              <h2 className="text-2xl font-bold mb-4 text-yellow-500">እንዴት ይጫወታል?</h2>
              <ul className="text-sm space-y-3 text-gray-300">
                <li>• የራስህ መስመር ላይ ያለን ጉድጓድ መርጠህ መበተን ትጀምራለህ።</li>
                <li>• በማንኛውም ጉድጓድ ውስጥ 4 ጠጠር ሲሞላ ወዲያውኑ ይበላል።</li>
                <li>• በአንድ በኩል ጠጠር ሲያልቅ የቀሩት ጠጠሮች ተሰብስበው ጨዋታው ያበቃል።</li>
              </ul>
              <button 
                onClick={() => setShowHelp(false)} 
                className="w-full mt-6 bg-white text-black py-3 rounded-xl font-bold">ተረድቻለሁ</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // የ CPU (PvE) የችግር ደረጃ መምረጫ
  if (gameMode === 'PvE' && !difficulty) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white p-6">
        <h2 className="text-3xl font-bold text-blue-400 mb-8">የኮምፒውተር ደረጃ ይምረጡ</h2>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={() => setDifficulty('easy')} 
            className="bg-green-600 py-4 rounded-2xl font-bold text-lg active:scale-95 transition">
            🟢 ቀላል (Easy)
          </button>

          <button 
            onClick={() => setDifficulty('medium')} 
            className="bg-yellow-600 py-4 rounded-2xl font-bold text-lg active:scale-95 transition">
            🟡 መካከለኛ (Medium)
          </button>

          <button 
            onClick={() => setDifficulty('hard')} 
            className="bg-red-600 py-4 rounded-2xl font-bold text-lg active:scale-95 transition">
            🔴 ከባድ (Hard)
          </button>

          <button 
            onClick={() => setGameMode(null)} 
            className="text-xs text-gray-400 mt-4 hover:underline text-center">
            ተመለስ
          </button>
        </div>
      </div>
    );
  }

  // Online Room መግቢያ ገጽ
  if (gameMode === 'Online' && !joinedRoom) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white p-6">
        <h2 className="text-3xl font-bold text-purple-400 mb-6">ኦንላይን ገበጣ</h2>
        
        <div className="bg-neutral-800 p-6 rounded-3xl border border-neutral-700 flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-sm text-gray-300 text-center">የክፍል ኮድ (Room Code) ያስገቡ ወይም ይፍጠሩ</p>
          
          <input 
            type="text" 
            placeholder="ምሳሌ፦ 1234" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-600 text-center text-xl font-bold uppercase text-white"
          />

          <button 
            onClick={joinOnlineRoom}
            className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold transition shadow-lg"
          >
            ተቀላቀል / ጨዋታ ጀምር
          </button>

          <button 
            onClick={() => setGameMode(null)}
            className="text-xs text-gray-400 mt-2 hover:underline"
          >
            ተመለስ
          </button>
        </div>
      </div>
    );
  }
// ዋናው የመጫወቻ ገጽ
  return (
    <div className="min-h-screen h-auto w-full bg-[#121212] flex flex-col items-center justify-start pt-2 pb-8 px-4 text-white overflow-y-auto touch-pan-y grow">
      
      {gameMode === 'Online' && (
        <div className="bg-purple-900/50 border border-purple-500/30 px-4 py-2 rounded-xl text-center text-sm font-semibold my-2 w-full max-w-md">
          ክፍልዎ <span className="text-yellow-400 font-bold">{joinedRoom}</span> | 
          እርስዎ <span className="text-green-400">{myPlayerIndex === 0 ? 'P1' : 'P2'}</span>
          <p className="text-xs text-purple-300 mt-1 animate-pulse">{onlineStatus}</p>
        </div>
      )}

      {/* የነጥብ ማሳያ ሰሌዳዎች */}
      <div className="flex justify-between w-full max-w-md my-2">
        <div className={`p-3 sm:p-4 rounded-2xl border-2 transition-all ${turn === 0 ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5'}`}>
          <p className="text-[10px] uppercase text-gray-500">
            {gameMode === 'Online' ? (myPlayerIndex === 0 ? 'P1 (እርስዎ)' : 'P1 (ተቃዋሚ)') : 'P1 SCORE'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black">{scores[0]}</h2>
        </div>
        
        <div className={`p-3 sm:p-4 rounded-2xl border-2 transition-all ${turn === 1 ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5'}`}>
          <p className="text-[10px] uppercase text-gray-500">
            {gameMode === 'Online' ? (myPlayerIndex === 1 ? 'P2 (እርስዎ)' : 'P2 (ተቃዋሚ)') : (gameMode === 'PvE' ? `P2 (CPU - ${difficulty})` : 'P2 SCORE')}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black">{scores[1]}</h2>
        </div>
      </div>

      {/* የገበጣ ቦርድ */}
      <div className="bg-[#5d4037] p-3 sm:p-4 rounded-[2.5rem] border-[8px] sm:border-[10px] border-[#3e2723] shadow-2xl scale-95 sm:scale-100 my-2">
        <div className="grid gap-3 sm:gap-4">
          
          {/* የላይኛው መስመር (የተጫዋች 2 / CPU ጉድጓዶች 6-11) */}
          <div className="flex gap-2 sm:gap-4">
            {board.slice(6, 12).reverse().map((s, i) => (
              <div 
                key={11-i} 
                onClick={() => handleMove(11-i)} 
                className="w-12 h-12 sm:w-20 sm:h-20 bg-[#2b1b17] rounded-full flex flex-wrap justify-center items-center p-1 relative shadow-inner touch-manipulation cursor-pointer">
                {Array(s).fill(0).map((_, idx) => <div key={idx} className="w-1.5 h-1.5 bg-gray-200 rounded-full m-0.5"></div>)}
                <span className="absolute -top-2 bg-red-600 text-[9px] px-1.5 rounded-full font-bold">{s}</span>
              </div>
            ))}
          </div>

          {/* የታችኛው መስመር (የተጫዋች 1 ጉድጓዶች 0-5) */}
          <div className="flex gap-2 sm:gap-4">
            {board.slice(0, 6).map((s, i) => (
              <div 
                key={i} 
                onClick={() => handleMove(i)} 
                className="w-12 h-12 sm:w-20 sm:h-20 bg-[#2b1b17] rounded-full flex flex-wrap justify-center items-center p-1 relative shadow-inner touch-manipulation cursor-pointer">
                {Array(s).fill(0).map((_, idx) => <div key={idx} className="w-1.5 h-1.5 bg-gray-200 rounded-full m-0.5"></div>)}
                <span className="absolute -bottom-2 bg-green-600 text-[9px] px-1.5 rounded-full font-bold">{s}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="mt-2 text-xs text-gray-500 hover:text-white uppercase tracking-widest p-2">
        ወጣ / አዲስ ጀምር
      </button>

      {/* የማስታወቂያ ቦታ */}
      <AdBanner />

      {/* የውጤት ማሳወቂያ Modal */}
      {winner && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[100] p-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-yellow-400 mb-4 animate-bounce">
            {winner}
          </h2>
          <p className="text-gray-400 text-sm mb-8">ጥሩ ጨዋታ ነበር!</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-full font-black text-xl shadow-2xl active:scale-90 transition-transform">
            ደጋሚ ጀምር
          </button>
        </div>
      )}
    </div>
  );
}

export default App;