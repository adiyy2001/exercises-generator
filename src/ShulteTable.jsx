import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SchulteTableGame = () => {
  // Game states
  const [gameState, setGameState] = useState('menu'); // menu, config, game, result
  const [tableSize, setTableSize] = useState(5); // 3x3, 4x4, 5x5, 6x6, 7x7
  const [gameMode, setGameMode] = useState('classic'); // classic, reverse, color, alternating, timed
  const [theme, setTheme] = useState('modern'); // modern, classic, dark, colorful
  const [difficulty, setDifficulty] = useState('normal'); // easy, normal, hard
  const [currentNumber, setCurrentNumber] = useState(1);
  const [numbers, setNumbers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [bestTimes, setBestTimes] = useState({});
  const [mistakes, setMistakes] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60); // For timed mode
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [cellHighlight, setCellHighlight] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);
  const timerRef = useRef(null);
  const tableCenterRef = useRef(null);

  // Tutorial state
  const [tutorialSteps] = useState([
    {
      title: "Welcome to Schulte Table",
      content: "This game helps improve your peripheral vision and cognitive speed. Let's learn how to play!"
    },
    {
      title: "The Objective",
      content: "Find and click on numbers in sequence as quickly as possible. The current number to find is always shown at the top."
    },
    {
      title: "Focus Technique",
      content: "For best results, try to keep your eyes fixed on the center of the table and use your peripheral vision to find numbers."
    },
    {
      title: "Game Modes",
      content: "Try different modes: Classic (ascending), Reverse (descending), Color (find by color), and Timed challenges."
    },
    {
      title: "Track Your Progress",
      content: "Your best times are saved. Challenge yourself to beat your records and improve your cognitive speed!"
    }
  ]);
  
  // Only show tutorial when explicitly requested by button click
  const openTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(0);
  };

  useEffect(() => {
    // When currentNumber changes, we don't want to do anything special to highlight it
    // This is commented out to avoid any highlighting of the target number
    // No-op
  }, [currentNumber]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('schulteDarkMode', (!darkMode).toString());
  };
  
  // Load saved best times from localStorage when component mounts
  useEffect(() => {
    const savedBestTimes = localStorage.getItem('schulteBestTimes');
    if (savedBestTimes) {
      setBestTimes(JSON.parse(savedBestTimes));
    }
    
    const savedDarkMode = localStorage.getItem('schulteDarkMode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  // Save best times to localStorage when they change
  useEffect(() => {
    localStorage.setItem('schulteBestTimes', JSON.stringify(bestTimes));
  }, [bestTimes]);
  
  // Generate random numbers for the table
  const generateNumbers = useCallback(() => {
    let nums = [];
    const totalCells = tableSize * tableSize;
    
    if (gameMode === 'classic' || gameMode === 'timed') {
      nums = Array.from({ length: totalCells }, (_, i) => i + 1);
    } else if (gameMode === 'reverse') {
      nums = Array.from({ length: totalCells }, (_, i) => totalCells - i);
    } else if (gameMode === 'color') {
      // For color mode, we'll use 5 different numbers repeated
      nums = Array.from({ length: totalCells }, (_, i) => (i % 5) + 1);
    } else if (gameMode === 'alternating') {
      // First half ascending, second half descending
      const halfLength = Math.floor(totalCells / 2);
      const firstHalf = Array.from({ length: halfLength }, (_, i) => i + 1);
      const secondHalf = Array.from({ length: totalCells - halfLength }, (_, i) => totalCells - halfLength - i);
      nums = [...firstHalf, ...secondHalf];
    }
    
    // Shuffle the array
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    
    return nums;
  }, [tableSize, gameMode]);
  
  // Start a new game
  const startGame = () => {
    setNumbers(generateNumbers());
    setCurrentNumber(gameMode === 'reverse' ? tableSize * tableSize : 1);
    setMistakes(0);
    setTimeLeft(timeLimit);
    setCellHighlight(null);
    
    // Show countdown before starting
    setShowCountdown(true);
    setCountdown(3);
    
    let countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
          
          // Actually start the game after countdown
          setStartTime(Date.now());
          setEndTime(null);
          
          // Start timer for timed mode
          if (gameMode === 'timed') {
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  clearInterval(timerRef.current);
                  endGame(false);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Set game state immediately to show the countdown
    setGameState('game');
  };
  
  // Handle cell click
  const handleCellClick = (number) => {
    // If tutorial is showing, don't process clicks on cells
    if (showTutorial) return;
    
    const isCorrect = number === currentNumber;
    
    if (isCorrect) {
      // No special animations for correct numbers
      
      let nextNumber;
      if (gameMode === 'reverse') {
        nextNumber = currentNumber - 1;
      } else if (gameMode === 'alternating') {
        // Logic for alternating mode
        const totalCells = tableSize * tableSize;
        const halfLength = Math.floor(totalCells / 2);
        if (currentNumber < halfLength) {
          nextNumber = currentNumber + 1;
        } else {
          nextNumber = currentNumber - 1;
        }
      } else {
        // Classic, timed, color modes
        nextNumber = currentNumber + 1;
      }
      
      setCurrentNumber(nextNumber);
      
      // Check if game is complete
      const isGameComplete = (
        (gameMode === 'reverse' && nextNumber === 0) ||
        (gameMode !== 'reverse' && nextNumber > tableSize * tableSize) ||
        (gameMode === 'color' && nextNumber > 5)
      );
      
      if (isGameComplete) {
        endGame(true);
      }
    } else {
      // Only highlight incorrect selections
      setCellHighlight(number);
      setTimeout(() => setCellHighlight(null), 500);
      
      // Add shaking effect to the whole grid
      const grid = document.querySelector('.shake-grid');
      if (grid) {
        grid.classList.add('shake-animation');
        setTimeout(() => grid.classList.remove('shake-animation'), 500);
      }
      
      setMistakes(prev => prev + 1);
    }
  };
  
  // End the game
  const endGame = (success) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const endTimeStamp = Date.now();
    setEndTime(endTimeStamp);
    
    if (success) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      
      // Save best time if it's better than previous
      const timeElapsed = (endTimeStamp - startTime) / 1000;
      const timeKey = `${gameMode}-${tableSize}-${difficulty}`;
      
      setBestTimes(prev => {
        const currentBest = prev[timeKey];
        if (!currentBest || timeElapsed < currentBest) {
          return { ...prev, [timeKey]: timeElapsed };
        }
        return prev;
      });
    }
    
    setGameState('result');
  };
  
  // Get cell color based on theme and game mode - WITH NO HIGHLIGHTING WHATSOEVER
  const getCellColor = (number, isHighlighted) => {
    // Only highlight cells that were clicked incorrectly
    if (isHighlighted) return 'bg-red-500 dark:bg-red-600';
    
    // Basic theme-based styling with absolutely no target highlighting
    if (theme === 'modern') {
      return 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700';
    } else if (theme === 'classic') {
      return 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600';
    } else if (theme === 'dark') {
      return 'bg-gray-800 hover:bg-gray-700 text-white';
    } else if (theme === 'colorful') {
      if (gameMode === 'color') {
        const colorMap = {
          1: 'bg-red-500 hover:bg-red-600',
          2: 'bg-green-500 hover:bg-green-600',
          3: 'bg-blue-500 hover:bg-blue-600',
          4: 'bg-yellow-500 hover:bg-yellow-600',
          5: 'bg-purple-500 hover:bg-purple-600'
        };
        return colorMap[number] || 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600';
      }
      
      const colorVariants = [
        'bg-red-400 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-700',
        'bg-green-400 hover:bg-green-500 dark:bg-green-600 dark:hover:bg-green-700',
        'bg-blue-400 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700',
        'bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-700',
        'bg-purple-400 hover:bg-purple-500 dark:bg-purple-600 dark:hover:bg-purple-700',
        'bg-pink-400 hover:bg-pink-500 dark:bg-pink-600 dark:hover:bg-pink-700',
        'bg-indigo-400 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-700',
      ];
      
      // Use a consistent color pattern for all numbers
      return colorVariants[Math.floor(Math.abs(Math.sin(number * 1234) * colorVariants.length))];
    }
    
    return 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700';
  };
  
  // Game timer
  const formatTime = (timeInMs) => {
    if (!timeInMs) return '00:00:00';
    const totalSeconds = Math.floor(timeInMs / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };
  
  // Timer display for game in progress
  const GameTimer = () => {
    const [time, setTime] = useState(0);
    
    useEffect(() => {
      if (gameState !== 'game' || !startTime) return;
      
      const interval = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 100);
      
      return () => clearInterval(interval);
    }, [startTime, gameState]);
    
    return (
      <div className="text-xl font-bold dark:text-white">
        {gameMode === 'timed' 
          ? (
            <motion.div
              key={timeLeft}
              transition={{ duration: 0.5 }}
              className={timeLeft <= 10 ? "text-red-600 dark:text-red-400" : ""}
            >
              Time left: {timeLeft}s
            </motion.div>
          ) 
          : `Time: ${formatTime(time)}`}
      </div>
    );
  };
  
  // Tutorial component
  const Tutorial = () => {
    const currentStep = tutorialSteps[tutorialStep];
    
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70" style={{pointerEvents: "auto"}}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl max-w-md relative"
          style={{border: "3px solid #4CAF50"}}
        >
          <div className="absolute -top-2 -right-2">
            <span className="inline-flex items-center justify-center h-6 w-6 bg-red-500 text-white text-xs rounded-full">
              {tutorialStep + 1}/{tutorialSteps.length}
            </span>
          </div>
          
          <motion.h3 
            className="text-2xl font-bold mb-2 dark:text-white"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            key={`title-${tutorialStep}`}
            transition={{ duration: 0.3 }}
          >
            {currentStep.title}
          </motion.h3>
          
          <motion.p 
            className="text-gray-700 dark:text-gray-300 mb-6"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            key={`content-${tutorialStep}`}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {currentStep.content}
          </motion.p>
          
          <div className="flex justify-between">
            <motion.button
              onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
              disabled={tutorialStep === 0}
              className={`px-4 py-2 rounded ${
                tutorialStep === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
              whileHover={tutorialStep !== 0 ? { scale: 1.05 } : {}}
              whileTap={tutorialStep !== 0 ? { scale: 0.95 } : {}}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </span>
            </motion.button>
            
            {tutorialStep < tutorialSteps.length - 1 ? (
              <motion.button
                onClick={() => setTutorialStep(prev => prev + 1)}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center">
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </motion.button>
            ) : (
              <motion.button
                onClick={() => {
                  setShowTutorial(false);
                  setTutorialComplete(true);
                }}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1], boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 15px rgba(34,197,94,0.5)", "0px 0px 0px rgba(0,0,0,0)"] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span className="flex items-center">
                  Got it!
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };
  
  // Render menu screen
  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center space-y-6 p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-xl text-white relative overflow-hidden"
    >
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 focus:outline-none"
          aria-label={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
      
      <motion.h1 
        className="text-4xl font-bold mb-6"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
      >
        Schulte Table
      </motion.h1>
      
      <div className="flex flex-col space-y-4 w-full max-w-md">
        <motion.button 
          onClick={() => setGameState('config')} 
          className="bg-white text-blue-600 py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transform hover:scale-105 transition-all font-bold relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          New Game
        </motion.button>
        
        <motion.button 
          onClick={() => setGameState('highscores')} 
          className="bg-blue-700 text-white py-3 px-6 rounded-lg shadow-md hover:bg-blue-800 transform hover:scale-105 transition-all font-bold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          High Scores
        </motion.button>
        
        <motion.button 
          onClick={() => setGameState('instructions')} 
          className="bg-purple-700 text-white py-3 px-6 rounded-lg shadow-md hover:bg-purple-800 transform hover:scale-105 transition-all font-bold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          How to Play
        </motion.button>
        
        {tutorialComplete && (
          <motion.button 
            onClick={() => {
              setTutorialComplete(false);
              setShowTutorial(true);
              setTutorialStep(0);
            }} 
            className="bg-green-700 text-white py-3 px-6 rounded-lg shadow-md hover:bg-green-800 transform hover:scale-105 transition-all font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Show Tutorial Again
          </motion.button>
        )}
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => {
          const size = Math.random() * 50 + 10;
          const posX = Math.random() * 100;
          const posY = Math.random() * 100;
          const duration = Math.random() * 20 + 10;
          const delay = Math.random() * 10;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white bg-opacity-10"
              style={{
                width: size,
                height: size,
                left: `${posX}%`,
                top: `${posY}%`,
              }}
              animate={{
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50,
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
  
  // Render configuration screen
  const renderConfig = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
    >
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Game Settings</h2>
      
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Table Size</label>
          <div className="flex justify-between">
            {[3, 4, 5, 6, 7].map(size => (
              <motion.button
                key={size}
                onClick={() => setTableSize(size)}
                className={`px-4 py-2 rounded ${tableSize === size 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {size}×{size}
              </motion.button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Game Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'classic', name: 'Classic', tooltip: 'Find numbers in ascending order (1, 2, 3...)' },
              { id: 'reverse', name: 'Reverse', tooltip: 'Find numbers in descending order' },
              { id: 'color', name: 'Color', tooltip: 'Find colored numbers in sequence' },
              { id: 'alternating', name: 'Alternating', tooltip: 'First half ascending, second half descending' },
              { id: 'timed', name: 'Timed Challenge', tooltip: 'Find as many numbers as possible within the time limit' }
            ].map(mode => (
              <div key={mode.id} className="relative group">
                <motion.button
                  onClick={() => setGameMode(mode.id)}
                  className={`w-full px-4 py-2 rounded ${gameMode === mode.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {mode.name}
                </motion.button>
                <div className="absolute z-10 hidden group-hover:block bg-gray-900 text-white p-2 rounded shadow-lg text-xs mt-1 min-w-max">
                  {mode.tooltip}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'modern', name: 'Modern' },
              { id: 'classic', name: 'Classic' },
              { id: 'dark', name: 'Dark' },
              { id: 'colorful', name: 'Colorful' }
            ].map(t => (
              <motion.button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`px-4 py-2 rounded ${theme === t.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t.name}
              </motion.button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
          <div className="flex justify-between">
            {[
              { id: 'easy', name: 'Easy', tooltip: 'Numbers are displayed normally' },
              { id: 'normal', name: 'Normal', tooltip: 'Numbers are displayed normally' },
              { id: 'hard', name: 'Hard', tooltip: 'Numbers are represented as letters (A=1, B=2, etc.)' }
            ].map(d => (
              <div key={d.id} className="relative group">
                <motion.button
                  onClick={() => setDifficulty(d.id)}
                  className={`px-4 py-2 rounded ${difficulty === d.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {d.name}
                </motion.button>
                <div className="absolute z-10 hidden group-hover:block bg-gray-900 text-white p-2 rounded shadow-lg text-xs mt-1 min-w-max">
                  {d.tooltip}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {gameMode === 'timed' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Limit (seconds)</label>
            <div className="flex justify-between">
              {[30, 60, 90, 120].map(time => (
                <motion.button
                  key={time}
                  onClick={() => setTimeLimit(time)}
                  className={`px-4 py-2 rounded ${timeLimit === time 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {time}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex space-x-4 mt-6">
        <motion.button
          onClick={() => setGameState('menu')}
          className="px-6 py-3 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back
        </motion.button>
        
        <motion.button
          onClick={startGame}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Game
        </motion.button>
      </div>
    </motion.div>
  );
  
  // Render game board
  const renderGameBoard = () => {
    const gridTemplateColumns = `repeat(${tableSize}, minmax(0, 1fr))`;
    
    // Calculate cell size based on table size
    const getCellSize = () => {
      switch(tableSize) {
        case 3: return 'h-24 w-24';
        case 4: return 'h-20 w-20';
        case 5: return 'h-16 w-16';
        case 6: return 'h-12 w-12';
        case 7: return 'h-10 w-10';
        default: return 'h-16 w-16';
      }
    };
    
    const getFontSize = () => {
      switch(tableSize) {
        case 3: return 'text-4xl';
        case 4: return 'text-3xl';
        case 5: return 'text-2xl';
        case 6: return 'text-xl';
        case 7: return 'text-lg';
        default: return 'text-2xl';
      }
    };
    
    // Center dot reference
    const centerDot = tableSize % 2 === 1 ? 
      Math.floor(tableSize * tableSize / 2) : 
      -1; // No center dot for even sizes
    
    // NOTE: We deliberately do NOT highlight the target number in any way
    // This is the essence of the Schulte table challenge
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-center space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl relative"
      >
        {/* Countdown overlay */}
        {showCountdown && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 rounded-lg">
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 3, opacity: 0 }}
              className="text-6xl font-bold text-white"
            >
              {countdown === 0 ? "GO!" : countdown}
            </motion.div>
          </div>
        )}
        
        <div className="flex justify-between w-full mb-4">
          <motion.div 
            className="text-xl font-bold dark:text-white flex items-center"
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            Find: <span className="ml-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-800 dark:text-blue-200">{
              difficulty === 'hard' ? String.fromCharCode(64 + currentNumber) : currentNumber
            }</span>
          </motion.div>
          <GameTimer />
        </div>
        
        <motion.div 
          className="grid gap-2 mx-auto shake-grid relative" 
          style={{ gridTemplateColumns }}
          ref={tableCenterRef}
        >
          {numbers.map((number, index) => {
            // No isTarget var at all
            const isHighlighted = number === cellHighlight;
            const isCenterCell = index === centerDot;
            
            return (
              <motion.button
                key={index}
                onClick={() => handleCellClick(number)}
                className={`${getCellSize()} ${getFontSize()} font-bold flex items-center justify-center rounded-lg shadow-md transition-all duration-200 relative overflow-hidden ${
                  getCellColor(number, isHighlighted)
                } ${isCenterCell ? 'ring-2 ring-gray-400 ring-opacity-50 dark:ring-gray-600' : ''}`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                {difficulty === 'easy' || gameMode === 'color' ? number : 
                 difficulty === 'normal' ? number : 
                 String.fromCharCode(64 + number)}
              </motion.button>
            );
          })}
        </motion.div>
        
        <div className="flex justify-between w-full">
          <div className="text-lg dark:text-white flex items-center">
            <span className="mr-2">Mistakes:</span>
            <motion.span 
              key={mistakes}
              animate={mistakes > 0 ? { scale: [1, 1.3, 1] } : {}}
              className={`px-2 py-1 rounded-md ${mistakes > 5 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 dark:bg-gray-700'}`}
            >
              {mistakes}
            </motion.span>
          </div>
          
          <motion.button
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              setGameState('menu');
            }}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Quit
          </motion.button>
        </div>
        
        {/* CSS for ripple and shake effects */}
        <style>
          {`
            @keyframes ripple {
              0% {
                transform: scale(0);
                opacity: 0.6;
              }
              100% {
                transform: scale(1);
                opacity: 0;
              }
            }
            
            .shake-animation {
              animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
            }
            
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
              20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            
            .cell-highlight {
              box-shadow: 0 0 15px 5px rgba(59, 130, 246, 0.7);
              animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
              0% { box-shadow: 0 0 15px 5px rgba(59, 130, 246, 0.7); }
              50% { box-shadow: 0 0 25px 10px rgba(59, 130, 246, 0.9); }
              100% { box-shadow: 0 0 15px 5px rgba(59, 130, 246, 0.7); }
            }
          `}
        </style>
      </motion.div>
    );
  };
  
  // Render result screen
  const renderResultScreen = () => {
    const timeElapsed = endTime && startTime ? (endTime - startTime) / 1000 : 0;
    const timeKey = `${gameMode}-${tableSize}-${difficulty}`;
    const isBestTime = bestTimes[timeKey] === timeElapsed;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex flex-col items-center justify-center space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
      >
        <motion.h2 
          className="text-2xl font-bold mb-2 dark:text-white"
          animate={endTime ? { scale: [1, 1.1, 1] } : {}}
        >
          {endTime ? 'Game Finished!' : 'Time\'s Up!'}
        </motion.h2>
        
        {endTime && (
          <div className="flex flex-col items-center space-y-2">
            <motion.div 
              className="text-4xl font-bold text-blue-600 dark:text-blue-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {formatTime(timeElapsed * 1000)}
            </motion.div>
            
            <motion.div 
              className="text-lg text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {isBestTime ? (
                <span className="flex items-center">
                  <span className="text-2xl mr-2">🏆</span>
                  New Best Time!
                  <span className="text-2xl ml-2">🏆</span>
                </span>
              ) : 'Your Time'}
            </motion.div>
            
            <motion.div 
              className="text-md mt-2 dark:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Mistakes: {mistakes}
            </motion.div>
            
            <motion.div 
              className="mt-4 text-sm text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {bestTimes[timeKey] ? `Best time: ${formatTime(bestTimes[timeKey] * 1000)}` : 'First completion with these settings!'}
            </motion.div>
          </div>
        )}
        
        <div className="flex space-x-4 mt-6">
          <motion.button
            onClick={() => setGameState('menu')}
            className="px-6 py-3 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Menu
          </motion.button>
          
          <motion.button
            onClick={startGame}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Play Again
          </motion.button>
        </div>
        
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {Array.from({ length: 150 }).map((_, i) => {
              const size = Math.random() * 12 + 5;
              const left = Math.random() * 100;
              const animDuration = Math.random() * 3 + 2;
              const delay = Math.random() * 2;
              const rotation = Math.random() * 360;
              const type = Math.floor(Math.random() * 3); // 0 = circle, 1 = square, 2 = triangle
              
              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${left}%`,
                    top: '-20px',
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: ['#FF5252', '#FFEB3B', '#2196F3', '#4CAF50', '#9C27B0', '#FF9800'][Math.floor(Math.random() * 6)],
                    borderRadius: type === 0 ? '50%' : type === 1 ? '0' : '50% 50% 0 50%',
                    transform: `rotate(${rotation}deg)`,
                  }}
                  animate={{
                    y: ['0vh', '100vh'],
                    x: [`${left}%`, `${left + (Math.random() * 20 - 10)}%`],
                    rotate: [rotation, rotation + 360],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: animDuration,
                    delay,
                    ease: "easeIn"
                  }}
                />
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };
  
  // Render high scores screen
  const renderHighScores = () => {
    const sortedTimes = Object.entries(bestTimes)
      .map(([key, time]) => {
        const [mode, size, diff] = key.split('-');
        return { mode, size, difficulty: diff, time };
      })
      .sort((a, b) => a.time - b.time);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center justify-center space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-4 dark:text-white">High Scores</h2>
        
        {sortedTimes.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 mb-4">No high scores yet. Start playing to record your times!</div>
        ) : (
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="px-4 py-2 text-left dark:text-white">Mode</th>
                  <th className="px-4 py-2 text-left dark:text-white">Size</th>
                  <th className="px-4 py-2 text-left dark:text-white">Difficulty</th>
                  <th className="px-4 py-2 text-right dark:text-white">Time</th>
                </tr>
              </thead>
              <tbody>
                {sortedTimes.map((score, index) => (
                  <motion.tr 
                    key={index} 
                    className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-4 py-2 capitalize dark:text-white">{score.mode}</td>
                    <td className="px-4 py-2 dark:text-white">{score.size}×{score.size}</td>
                    <td className="px-4 py-2 capitalize dark:text-white">{score.difficulty}</td>
                    <td className="px-4 py-2 text-right font-mono dark:text-white">{formatTime(score.time * 1000)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <motion.button
          onClick={() => setGameState('menu')}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors mt-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Menu
        </motion.button>
      </motion.div>
    );
  };
  
  // Render instructions screen
  const renderInstructions = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl"
    >
      <h2 className="text-2xl font-bold mb-4 dark:text-white">How to Play</h2>
      
      <div className="text-gray-700 dark:text-gray-300 space-y-4">
        <p>The Schulte Table is a tool used to improve peripheral vision and reading speed. The task is to find and click on numbers in sequence as quickly as possible without moving your eyes from the center of the grid.</p>
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border-l-4 border-blue-500 dark:border-blue-400">
          <p className="text-blue-800 dark:text-blue-200 font-semibold">Pro tip: Focus your eyes on the center dot and use your peripheral vision to find the numbers!</p>
        </div>
        
        <h3 className="text-xl font-bold mt-4 dark:text-white">Game Modes:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Classic:</strong> Find numbers in ascending order (1, 2, 3...)</li>
          <li><strong>Reverse:</strong> Find numbers in descending order</li>
          <li><strong>Color:</strong> Find colored numbers in sequence</li>
          <li><strong>Alternating:</strong> Find first half of numbers in ascending order, then second half in descending order</li>
          <li><strong>Timed:</strong> Find as many numbers as possible within the time limit</li>
        </ul>
        
        <h3 className="text-xl font-bold mt-4 dark:text-white">Difficulty Levels:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Easy:</strong> Numbers are displayed normally</li>
          <li><strong>Normal:</strong> Numbers are displayed normally</li>
          <li><strong>Hard:</strong> Numbers are represented as letters (A=1, B=2, etc.)</li>
        </ul>
        
        <p className="mt-4">For the best results, try to focus your gaze at the center of the table and use your peripheral vision to find the numbers. Practice regularly to improve your performance!</p>
      </div>
      
      <motion.button
        onClick={() => {
          if (!tutorialComplete) {
            openTutorial();
          } else {
            setGameState('menu');
          }
        }}
        className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors mt-4"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {!tutorialComplete ? "Show Tutorial" : "Back to Menu"}
      </motion.button>
    </motion.div>
  );
  
  // Main render function
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {gameState === 'menu' && renderMenu()}
          {gameState === 'config' && renderConfig()}
          {gameState === 'game' && renderGameBoard()}
          {gameState === 'result' && renderResultScreen()}
          {gameState === 'highscores' && renderHighScores()}
          {gameState === 'instructions' && renderInstructions()}
        </AnimatePresence>
      </div>
      
      {/* Always render tutorial outside of main game states to ensure it's visible */}
      {showTutorial && <Tutorial />}
    </div>
  );
};

export default SchulteTableGame;