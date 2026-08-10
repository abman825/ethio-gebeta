import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const API_URL = "https://ethio-gebeta-backend.onrender.com";

const socket = io(API_URL, { autoConnect: false });
function App() {
  const [board, setBoard] = useState(Array(12).fill(4));
  const [scores, setScores] = useState([0, 0]);
  const [turn, setTurn] = useState(0); 
  const [gameMode, setGameMode] = useState(null); 
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
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, [gameMode]);

  // CPU Move Logic (PvE Mode)
  useEffect(() => {
    if (gameMode === 'PvE' && turn === 1 && !winner && !isAnimating) {
      const timer = setTimeout(() => {
        const validMoves = [6, 7, 8, 9, 10, 11].filter(i => board[i] > 0);
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          handleMove(randomMove);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, isAnimating, winner, board]);

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
        setWinner('ተቃዋሚዎ ከጨዋታው ወጥቷል!');
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
      osc.connect(gain); gain.connect(context.destination);
      osc.start(); osc.stop(context.currentTime + 0.1);
    } catch (e) { console.log("Audio play failed"); }
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

      if (newBoard[curr] === 4) {
        newScores[turn] += 4;
        newBoard[curr] = 0;
        setBoard([...newBoard]);
        setScores([...newScores]);
      }
    }

    const p1Total = newBoard.slice(0, 6).reduce((a, b) => a + b, 0);
    const p2Total = newBoard.slice(6, 12).reduce((a, b) => a + b, 0);

    let nextTurn = turn === 0 ? 1 : 0;
    let winnerMsg = null;

    if (p1Total === 0 || p2Total === 0) {
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

  if (!gameMode) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white p-6 overflow-hidden">
        <h1 className="text-5xl font-black mb-12 tracking-tighter italic">
          <span className="text-green-600">ETHIO</span>
          <span className="text-yellow-400"> GEBETA</span>
        </h1>
        
        <div className="flex flex-col gap-4 w-full max-w-xs z-10">
          <button 
            onTouchEnd={(e) => { e.preventDefault(); setGameMode('PvP'); }}
            onClick={() => setGameMode('PvP')} 
            className="active:scale-95 bg-green-700 py-4 rounded-2xl font-bold shadow-lg transition-all touch-manipulation">
            ከሰው ጋር (Local 2 Players)
          </button>
          
          <button 
            onTouchEnd={(e) => { e.preventDefault(); setGameMode('PvE'); }}
            onClick={() => setGameMode('PvE')} 
            className="active:scale-95 bg-blue-700 py-4 rounded-2xl font-bold shadow-lg transition-all touch-manipulation">
            ከኮምፒውተር ጋር (CPU)
          </button>

          <button 
            onTouchEnd={(e) => { e.preventDefault(); setGameMode('Online'); }}
            onClick={() => setGameMode('Online')} 
            className="active:scale-95 bg-purple-700 py-4 rounded-2xl font-bold shadow-lg transition-all touch-manipulation">
            በኢንተርኔት (Online Room)
          </button>
          
          <button 
            onTouchEnd={(e) => { e.preventDefault(); setShowHelp(true); }}
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
                <li>• በአንድ በኩል ጠጠር ሲያልቅ ጨዋታው ያበቃል።</li>
              </ul>
              <button 
                onTouchEnd={() => setShowHelp(false)}
                onClick={() => setShowHelp(false)} 
                className="w-full mt-6 bg-white text-black py-3 rounded-xl font-bold">ተረዳሁ</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameMode === 'Online' && !joinedRoom) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white p-6">
        <h2 className="text-3xl font-bold text-purple-400 mb-6">ኦንላይን ገበጣ</h2>
        
        <div className="bg-neutral-800 p-6 rounded-3xl border border-neutral-700 flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-sm text-gray-300 text-center">የክፍል ኮድ (Room Code) ያስገቡ ወይም ይፍጠሩ፡</p>
          
          <input 
            type="text" 
            placeholder="ምሳሌ፡ 1234" 
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

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center p-4 text-white overflow-hidden touch-none">
      
      {gameMode === 'Online' && (
        <div className="bg-purple-900/50 border border-purple-500/30 px-4 py-2 rounded-xl text-center text-sm font-semibold mb-2">
          ክፍል፡ <span className="text-yellow-400 font-bold">{joinedRoom}</span> | 
          እርስዎ፡ <span className="text-green-400">{myPlayerIndex === 0 ? 'P1' : 'P2'}</span>
          <p className="text-xs text-purple-300 mt-1 animate-pulse">{onlineStatus}</p>
        </div>
      )}

      <div className="flex justify-between w-full max-w-md my-4">
        <div className={`p-4 rounded-2xl border-2 transition-all ${turn === 0 ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5'}`}>
          <p className="text-[10px] uppercase text-gray-500">
            {gameMode === 'Online' ? (myPlayerIndex === 0 ? 'P1 (እርስዎ)' : 'P1 (ተቃዋሚ)') : 'P1 SCORE'}
          </p>
          <h2 className="text-3xl font-black">{scores[0]}</h2>
        </div>
        
        <div className={`p-4 rounded-2xl border-2 transition-all ${turn === 1 ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5'}`}>
          <p className="text-[10px] uppercase text-gray-500">
            {gameMode === 'Online' ? (myPlayerIndex === 1 ? 'P2 (እርስዎ)' : 'P2 (ተቃዋሚ)') : (gameMode === 'PvE' ? 'P2 (CPU)' : 'P2 SCORE')}
          </p>
          <h2 className="text-3xl font-black">{scores[1]}</h2>
        </div>
      </div>

      <div className="bg-[#5d4037] p-4 rounded-[2.5rem] border-[10px] border-[#3e2723] shadow-2xl scale-95 sm:scale-100">
        <div className="grid gap-4">
          
          <div className="flex gap-2 sm:gap-4">
            {board.slice(6, 12).reverse().map((s, i) => (
              <div 
                key={11-i} 
                onTouchEnd={(e) => { e.preventDefault(); handleMove(11-i); }}
                onClick={() => handleMove(11-i)} 
                className="w-14 h-14 sm:w-20 sm:h-20 bg-[#2b1b17] rounded-full flex flex-wrap justify-center items-center p-1 relative shadow-inner touch-manipulation cursor-pointer">
                {Array(s).fill(0).map((_, idx) => <div key={idx} className="w-1.5 h-1.5 bg-gray-200 rounded-full m-0.5"></div>)}
                <span className="absolute -top-2 bg-red-600 text-[9px] px-1.5 rounded-full font-bold">{s}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 sm:gap-4">
            {board.slice(0, 6).map((s, i) => (
              <div 
                key={i} 
                onTouchEnd={(e) => { e.preventDefault(); handleMove(i); }}
                onClick={() => handleMove(i)} 
                className="w-14 h-14 sm:w-20 sm:h-20 bg-[#2b1b17] rounded-full flex flex-wrap justify-center items-center p-1 relative shadow-inner touch-manipulation cursor-pointer">
                {Array(s).fill(0).map((_, idx) => <div key={idx} className="w-1.5 h-1.5 bg-gray-200 rounded-full m-0.5"></div>)}
                <span className="absolute -bottom-2 bg-green-600 text-[9px] px-1.5 rounded-full font-bold">{s}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="mt-6 text-xs text-gray-500 hover:text-white uppercase tracking-widest p-4">
        ወጣቱህ ውጣ
      </button>

      <div className="mt-auto mb-2 z-0">
        <ins className="adsbygoogle"
             style={{ display: 'inline-block', width: '320px', height: '50px' }}
             data-ad-client="ca-app-pub-8665668810095574"
             data-ad-slot="1112254381"></ins>
      </div>

      {winner && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[100] p-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-yellow-400 mb-4 animate-bounce">
            {winner}
          </h2>
          <p className="text-gray-400 text-sm mb-8">ጥሩ ጨዋታ ነበር!</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-full font-black text-xl shadow-2xl active:scale-90 transition-transform">
            ድጋሚ ጀምር
          </button>
        </div>
      )}
    </div>
  );
}

export default App;