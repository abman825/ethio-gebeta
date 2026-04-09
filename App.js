import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, Modal } from 'react-native';
// AdMob
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
// Tailwind (NativeWind)
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);

const { width } = Dimensions.get('window');
const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-8665668810095574/8773523491';


export default function App() {
  const [board, setBoard] = useState(Array(12).fill(4));
  const [scores, setScores] = useState([0, 0]);
  const [turn, setTurn] = useState(0); 
  const [gameMode, setGameMode] = useState(null); 
  const [isAnimating, setIsAnimating] = useState(false);
  const [winner, setWinner] = useState(null);

  // AI Logic 
  useEffect(() => {
    if (gameMode === 'PvE' && turn === 1 && !winner && !isAnimating) {
      const timer = setTimeout(() => {
        const validMoves = [6, 7, 8, 9, 10, 11].filter(i => board[i] > 0);
        if (validMoves.length > 0) {
          handleMove(validMoves[Math.floor(Math.random() * validMoves.length)]);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, isAnimating, winner, board]);

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
      await new Promise(r => setTimeout(r, 250)); 

      if (newBoard[curr] === 4) {
        newScores[turn] += 4;
        newBoard[curr] = 0;
        setBoard([...newBoard]);
        setScores([...newScores]);
      }
    }

    if (newBoard.slice(0, 6).every(s => s === 0) || newBoard.slice(6, 12).every(s => s === 0)) {
      setWinner(newScores[0] > newScores[1] ? "ተጫዋች 1 አሸነፈ!" : "ተጫዋች 2 አሸነፈ!");
    } else {
      setTurn(turn === 0 ? 1 : 0);
    }
    setIsAnimating(false);
  };

  if (!gameMode) {
    return (
      <StyledView className="flex-1 bg-[#121212] justify-center items-center">
        <StyledText className="text-4xl font-black text-green-600 mb-10">ETHIO GEBETA</StyledText>
        <StyledTouchableOpacity 
          className="bg-green-700 p-5 rounded-2xl w-64 items-center mb-4" 
          onPress={() => setGameMode('PvP')}
        >
          <StyledText className="text-white font-bold text-lg">ከሰው ጋር</StyledText>
        </StyledTouchableOpacity>
        <StyledTouchableOpacity 
          className="bg-blue-800 p-5 rounded-2xl w-64 items-center" 
          onPress={() => setGameMode('PvE')}
        >
          <StyledText className="text-white font-bold text-lg">ከኮምፒውተር ጋር</StyledText>
        </StyledTouchableOpacity>
        <StyledView className="absolute bottom-5">
           <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
        </StyledView>
      </StyledView>
    );
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-[#121212] items-center justify-center">
      <StyledView className="bg-[#5d4037] p-4 rounded-[30px] border-4 border-[#3e2723]">
        <StyledView className="flex-row">
          {board.slice(6, 12).reverse().map((s, i) => (
            <StyledTouchableOpacity key={11-i} onPress={() => handleMove(11-i)} className="w-12 h-12 bg-[#2b1b17] rounded-full m-1 justify-center items-center">
              <StyledText className="text-white text-xs">{s}</StyledText>
            </StyledTouchableOpacity>
          ))}
        </StyledView>
        <StyledView className="flex-row mt-2">
          {board.slice(0, 6).map((s, i) => (
            <StyledTouchableOpacity key={i} onPress={() => handleMove(i)} className="w-12 h-12 bg-[#2b1b17] rounded-full m-1 justify-center items-center">
              <StyledText className="text-white text-xs">{s}</StyledText>
            </StyledTouchableOpacity>
          ))}
        </StyledView>
      </StyledView>

      <StyledView className="flex-row mt-10 gap-10">
        <StyledText className="text-white font-bold text-xl">P1: {scores[0]}</StyledText>
        <StyledTouchableOpacity onPress={() => setGameMode(null)} className="bg-gray-700 px-4 py-1 rounded">
          <StyledText className="text-white">ውጣ</StyledText>
        </StyledTouchableOpacity>
        <StyledText className="text-white font-bold text-xl">P2: {scores[1]}</StyledText>
      </StyledView>

      <StyledView className="absolute bottom-5">
        <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </StyledView>

      {winner && (
        <Modal transparent={true}>
          <StyledView className="flex-1 bg-black/80 justify-center items-center">
            <StyledText className="text-yellow-400 text-3xl font-bold mb-5">{winner}</StyledText>
            <StyledTouchableOpacity className="bg-white p-4 rounded-xl" onPress={() => setGameMode(null)}>
              <StyledText className="text-black font-bold">ድጋሚ ጀምር</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </Modal>
      )}
    </StyledSafeAreaView>
  );
}