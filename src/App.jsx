import React, { useState, useEffect } from 'react';

// ድምፅ እንዳይቋረጥ AudioContext አንድ ጊዜ ብቻ እዚህ ይፈጠራል
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function App() {
  const [board, setBoard] = useState(Array(12).fill(4));
  const [scores, setScores] = useState([0, 0]);
  const [turn, setTurn] = useState(0); 
  const [gameMode, setGameMode] = useState(null); 
  const [isAnimating, setIsAnimating] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // ስክሪኑን ወደ ጎን (Landscape) ለመቆለፍ
  const lockOrientation = async () => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (error) {
      console.log("Orientation lock is not supported");
    }
  };

  const selectMode = (mode) => {
    setGameMode(mode);
    lockOrientation();
  };

  // AdMob script
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, [gameMode]);

  // CPU Move Logic -
  useEffect(() => {
    if (gameMode === 'PvE' && turn === 1 && !winner && !isAnimating) {
      setTimeout(() => {
        const validMoves = [6, 7, 8, 9, 10, 11].filter(i => board[i] > 0);
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          handleMove(randomMove);
        }
      }, 1200);
    }
  }, [turn, gameMode, isAnimating, winner, board]);

  const playPop = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
  };

  const handleMove = async (index) => {
    if (isAnimating || winner || (turn === 0 && index > 5) || (turn === 1 && index <= 5) || board[index] === 0) return;

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
      newScores[0] += p1Total;
      newScores[1] += p2Total;
      setScores(newScores);
      
      const msg = newScores[0] > newScores[1] 
        ? `ተጫዋች 1 አሸነፈ! (${newScores[0]}-${newScores[1]})` 
        : newScores[1] > newScores[0] 
        ? `ተጫዋች 2 አሸነፈ! (${newScores[1]}-${newScores[0]})`
        : `አቻ ተለያዩ! (${newScores[0]}-${newScores[1]})`;
      setWinner(msg);
    } else {
      setTurn(turn === 0 ? 1 : 0);
    }
    setIsAnimating(false);
  };

  if (!gameMode) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-5xl font-black mb-12 tracking-tighter italic">
          <span className="text-green-600">ETHIO</span>
          <span className="text-yellow-400"> GEBETA</span>
        </h1>
        <div className="flex flex-col gap-5 w-full max-w-xs">
          <button onClick={() => selectMode('PvP')} className="bg-green-700 py-4 rounded-2xl font-bold shadow-lg hover:bg-green-600 transition-all">ከሰው ጋር (2 Players)</button>
          <button onClick={() => selectMode('PvE')} className="bg-blue-700 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-600 transition-all">ከኮምፒውተር ጋር (CPU)</button>
          <button onClick={() => setShowHelp(true)} className="mt-4 text-gray-400 border border-gray-600 py-2 rounded-xl text-sm">የጨዋታው ህግ (Help)</button>
        </div>
        {showHelp && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50">
            <div className="bg-neutral-800 p-8 rounded-3xl border-t-8 border-yellow-500 max-w-sm text-left">
              <h2 className="text-2xl font-bold mb-4 text-yellow-500 text-center">እንዴት ይጫወታል?</h2>
              <ul className="text-sm space-y-3 text-gray-300">
                <li>• የራስህ መስመር ላይ ያለን ጉድጓድ መርጠህ መበተን ትጀምራለህ።</li>
                <li>• በማንኛውም ጉድጓድ ውስጥ 4 ዘር ሲሞላ ወዲያውኑ ይበላል።</li>
                <li>• በአንድ በኩል ዘር ሲያልቅ ጨዋታው ያበቃል።</li>
                <li>• ከፍተኛ ነጥብ ያለው ያሸንፋል።</li>
              </ul>
              <button onClick={() => setShowHelp(false)} className="w-full mt-6 bg-white text-black py-3 rounded-xl font-bold">ተረዳሁ</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-2 text-white overflow-hidden">
      <style>{`
        @media screen and (orientation: portrait) { .portrait-warning { display: flex !important; } }
      `}</style>
      <div className="portrait-warning hidden fixed inset-0 bg-black z-[100] flex-col items-center justify-center text-center p-10">
        <div className="text-5xl mb-4">🔄</div>
        <h2 className="text-xl font-bold">እባክዎ ለተሻለ አጫዋች ስልክዎን ወደ ጎን (Landscape) ያዙሩት</h2>
      </div>

      {/* የገበጣ ቦርድ */}
      <div className="bg-[#5d4037] p-4 sm:p-5 rounded-[2.5rem] border-[10px] border-[#3e2723] shadow-2xl mb-4 scale-[0.85] sm:scale-100">
        <div className="grid gap-4 sm:gap-6">
          <div className="flex gap-2 sm:gap-4">
            {board.slice(6, 12).reverse().map((s, i) => (
              <div key={11-i} onClick={() => handleMove(11-i)} className="w-14 h-14 sm:w-16 sm:h-16 bg-[#2b1b17] rounded-full flex flex-wrap justify-center items-center p-1 relative shadow-inner cursor-pointer">
                {Array(s).fill(0).map((_, idx) => <div key={idx} className="w-1.5 h-1.5 bg-gray-200 rounded-full m-0.5"></div>)}
                <span className="absolute -top-2 bg-red-600 text-[10px] px-1.5 rounded-full font-bold">{s}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 sm:gap-4">
            {board.slice(0, 6).map((s, i) => (
              <div key={i} onClick={() => handleMove(i)} className="w-14 h-14 sm:w-16 sm:h-16 bg-[#2b1b17] rounded-full flex flex-wrap justify-center items-center p-1 relative shadow-inner cursor-pointer">
                {Array(s).fill(0).map((_, idx) => <div key={idx} className="w-1.5 h-1.5 bg-gray-200 rounded-full m-0.5"></div>)}
                <span className="absolute -bottom-2 bg-green-600 text-[10px] px-1.5 rounded-full font-bold">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ነጥቦች እና ማስታወቂያ */}
      <div className="flex flex-row items-center justify-center gap-4 w-full max-w-4xl px-2">
        <div className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all w-20 sm:w-24 ${turn === 0 ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5'}`}>
          <p className="text-[8px] text-gray-400 font-bold uppercase">P1 Score</p>
          <h2 className="text-xl sm:text-2xl font-black text-green-500">{scores[0]}</h2>
        </div>

        <div className="flex flex-col items-center">
          <div className="h-[50px] w-[320px] bg-white/5 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
            <ins className="adsbygoogle"
                 style={{ display: 'inline-block', width: '320px', height: '50px' }}
                 data-ad-client="ca-app-pub-8665668810095574"
                 data-ad-slot="1112254381"></ins>
          </div>
          <button onClick={() => window.location.reload()} className="text-[8px] text-gray-600 mt-1 uppercase tracking-widest">ዝጋና ውጣ</button>
        </div>

        <div className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all w-20 sm:w-24 ${turn === 1 ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5'}`}>
          <p className="text-[8px] text-gray-400 font-bold uppercase">P2 Score</p>
          <h2 className="text-xl sm:text-2xl font-black text-red-500">{scores[1]}</h2>
        </div>
      </div>

      {winner && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[110] p-6 text-center">
          <h2 className="text-4xl sm:text-6xl font-black text-yellow-400 mb-8 animate-pulse">{winner}</h2>
          <button onClick={() => window.location.reload()} className="bg-white text-black px-12 py-4 rounded-full font-black text-xl shadow-2xl">ድጋሚ ጀምር</button>
        </div>
      )}
    </div>
  );
}

export default App;