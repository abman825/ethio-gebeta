import React, { useState, useEffect, useCallback } from 'react';

function App() {
  const [board, setBoard] = useState(Array(12).fill(4));
  const [scores, setScores] = useState([0, 0]);
  const [turn, setTurn] = useState(0); 
  const [gameMode, setGameMode] = useState(null); 
  const [isAnimating, setIsAnimating] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // AdMob script
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, [gameMode]);

  // CPU Move Logic
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
    // ደንቦችን ማረጋገጥ
    if (isAnimating || winner) return;
    if (turn === 0 && index > 5) return;
    if (turn === 1 && index <= 5) return;
    if (board[index] === 0) return;

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
      
      // ለሞባይል "State" አዘማመን ፍጥነት እንዲኖረው
      setBoard([...newBoard]);
      playPop();
      await new Promise(r => setTimeout(r, 250)); 

      if (newBoard[curr] === 4) {
        newScores[turn] += 4;
        newBoard[curr] = 0;
        setBoard([...newBoard]);
        setScores([...newScores]);
      }
    }

    const p1Total = newBoard.slice(0, 6).reduce((a, b) => a + b, 0);
    const p2Total = newBoard.slice(6, 12).reduce((a, b) => a + b, 0);

    if (p1Total === 0 || p2Total === 0) {
      setWinner(newScores[0] > newScores[1] ? "ተጫዋች 1 አሸነፈ!" : "ተጫዋች 2 አሸነፈ!");
    } else {
      setTurn(turn === 0 ? 1 : 0);
    }
    setIsAnimating(false);
  };

  // የHome Screen በተኖችን ለሞባይል አስተማማኝ ማድረግ
  if (!gameMode) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white p-6 overflow-hidden">
        <h1 className="text-5xl font-black mb-12 tracking-tighter italic">
          <span className="text-green-600">ETHIO</span>
          <span className="text-yellow-400"> GEBETA</span>
        </h1>
        
        <div className="flex flex-col gap-5 w-full max-w-xs z-10">
          <button 
            onTouchEnd={(e) => { e.preventDefault(); setGameMode('PvP'); }}
            onClick={() => setGameMode('PvP')} 
            className="active:scale-95 bg-green-700 py-4 rounded-2xl font-bold shadow-lg transition-all touch-manipulation">
            ከሰው ጋር (2 Players)
          </button>
          
          <button 
            onTouchEnd={(e) => { e.preventDefault(); setGameMode('PvE'); }}
            onClick={() => setGameMode('PvE')} 
            className="active:scale-95 bg-blue-700 py-4 rounded-2xl font-bold shadow-lg transition-all touch-manipulation">
            ከኮምፒውተር ጋር (CPU)
          </button>
          
          <button 
            onTouchEnd={(e) => { e.preventDefault(); setShowHelp(true); }}
            onClick={() => setShowHelp(true)} 
            className="mt-4 text-gray-400 border border-gray-600 py-2 rounded-xl text-sm touch-manipulation">
            የጨዋታው ህግ (Help)
          </button>
        </div>

        {showHelp && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[60]">
            <div className="bg-neutral-800 p-8 rounded-3xl border-t-8 border-yellow-500 max-w-sm">
              <h2 className="text-2xl font-bold mb-4 text-yellow-500">እንዴት ይጫወታል?</h2>
              <ul className="text-sm space-y-3 text-gray-300">
                <li>• የራስህ መስመር ላይ ያለን ጉድጓድ መርጠህ መበተን ትጀምራለህ።</li>
                <li>• በማንኛውም ጉድጓድ ውስጥ 4 ዘር ሲሞላ ወዲያውኑ ይበላል።</li>
                <li>• በአንድ በኩል ዘር ሲያልቅ ጨዋታው ያበቃል።</li>
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

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center p-4 text-white overflow-hidden touch-none">
      <div className="flex justify-between w-full max-w-md my-6">
        <div className={`p-4 rounded-2xl border-2 transition-all ${turn === 0 ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5'}`}>
          <p className="text-[10px] uppercase text-gray-500">P1 SCORE</p>
          <h2 className="text-3xl font-black">{scores[0]}</h2>
        </div>
        <div className={`p-4 rounded-2xl border-2 transition-all ${turn === 1 ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5'}`}>
          <p className="text-[10px] uppercase text-gray-500">P2 SCORE</p>
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
                className="w-14 h-14 sm:w-20 sm:h-20 bg-[#2b1b17] rounded-full flex flex-wrap justify-center items-center p-1 relative shadow-inner touch-manipulation">
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
                className="w-14 h-14 sm:w-20 sm:h-20 bg-[#2b1b17] rounded-full flex flex-wrap justify-center items-center p-1 relative shadow-inner touch-manipulation">
                {Array(s).fill(0).map((_, idx) => <div key={idx} className="w-1.5 h-1.5 bg-gray-200 rounded-full m-0.5"></div>)}
                <span className="absolute -bottom-2 bg-green-600 text-[9px] px-1.5 rounded-full font-bold">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={() => window.location.reload()} 
        className="mt-8 text-xs text-gray-500 hover:text-white uppercase tracking-widest p-4">
        ዘግተህ ውጣ
      </button>

      {/* AdMob - Positioned better for mobile */}
      <div className="mt-auto mb-2 z-0">
        <ins className="adsbygoogle"
             style={{ display: 'inline-block', width: '320px', height: '50px' }}
             data-ad-client="ca-app-pub-8665668810095574"
             data-ad-slot="1112254381"></ins>
      </div>

      {winner && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[100]">
          <h2 className="text-5xl font-black text-yellow-400 mb-8 text-center px-4">{winner}</h2>
          <button onClick={() => window.location.reload()} className="bg-white text-black px-12 py-4 rounded-full font-black text-xl shadow-2xl active:scale-90 transition-transform">ድጋሚ ጀምር</button>
        </div>
      )}
    </div>
  );
}

export default App;
