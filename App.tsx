import React, { useState, useMemo, useEffect } from 'react';
import type { Player, DraftBoardData, DataSource } from './types';
import Controls from './components/Controls';
import DraftBoard from './components/DraftBoard';
import { SLEEPER_PLAYER_LIST, YAHOO_PLAYER_LIST, ESPN_PLAYER_LIST } from './constants';

const parsePlayerText = (text: string): { players: Player[]; error: string | null } => {
  const players: Player[] = [];
  const lines = text.trim().split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.trim().split(/\s+/);
    
    if (parts.length < 3) {
      return { players: [], error: `Malformed line detected. Each line must have rank, name, and position. Problem line: "${line}"` };
    }
    
    const rank = parseInt(parts[0], 10);
    const position = parts[parts.length - 1];
    const name = parts.slice(1, -1).join(' ');

    if (isNaN(rank) || !name || !position) {
      return { players: [], error: `Could not parse line. Check format. Problem line: "${line}"` };
    }

    players.push({ rank, name, position });
  }

  return { players, error: null };
};

const generateSnakeDraft = (players: Player[], numTeams: number): DraftBoardData => {
  if (!players.length || numTeams <= 0) {
    return {};
  }

  const rounds: (Player | null)[][] = [];
  const numPicks = players.length;
  const numRounds = Math.ceil(numPicks / numTeams);
  
  for(let r = 0; r < numRounds; r++) {
    rounds.push(new Array(numTeams).fill(null));
  }
  
  players.forEach((player, index) => {
    const round = Math.floor(index / numTeams);
    const pickInRound = index % numTeams;
    const isForwardRound = round % 2 === 0;

    const teamIndex = isForwardRound ? pickInRound : numTeams - 1 - pickInRound;
    
    if (rounds[round] && teamIndex < numTeams) {
      rounds[round][teamIndex] = player;
    }
  });

  const board: DraftBoardData = {};
  for (let t = 0; t < numTeams; t++) {
    const teamKey = `Team ${t + 1}`;
    board[teamKey] = [];
    for (let r = 0; r < numRounds; r++) {
        board[teamKey].push(rounds[r][t]);
    }
  }

  return board;
};


const App: React.FC = () => {
  const [numTeams, setNumTeams] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [pickedPlayers, setPickedPlayers] = useState<Set<number>>(new Set());
  
  const [rawText, setRawText] = useState<string>(() => {
    return localStorage.getItem('customPlayerRankings') || SLEEPER_PLAYER_LIST;
  });

  const [dataSource, setDataSource] = useState<DataSource>(() => {
    return localStorage.getItem('customPlayerRankings') ? 'Custom' : 'Sleeper';
  });

  useEffect(() => {
    if (dataSource === 'Custom') {
      localStorage.setItem('customPlayerRankings', rawText);
    }
  }, [rawText, dataSource]);
  
  // Memoize the parsed players and any parsing error
  const { players, error: parseError } = useMemo(() => parsePlayerText(rawText), [rawText]);

  // Update the error state when the parsing result changes
  useEffect(() => {
    setError(parseError);
  }, [parseError]);
  
  // When player list changes, reset the picked players
  useEffect(() => {
    setPickedPlayers(new Set());
  }, [rawText]);

  // Memoize the draft board generation
  const draftData = useMemo(() => {
    if (players && players.length > 0) {
      return generateSnakeDraft(players, numTeams);
    }
    return {};
  }, [players, numTeams]);


  const handleDataSourceChange = (source: DataSource) => {
    setDataSource(source);
    switch (source) {
      case 'Sleeper':
        setRawText(SLEEPER_PLAYER_LIST);
        break;
      case 'Yahoo':
        setRawText(YAHOO_PLAYER_LIST);
        break;
      case 'ESPN':
        setRawText(ESPN_PLAYER_LIST);
        break;
      case 'Custom':
        setRawText(localStorage.getItem('customPlayerRankings') || '');
        break;
    }
  };
  
  const handleRawTextChange = (text: string) => {
    setRawText(text);
    if (dataSource !== 'Custom') {
      setDataSource('Custom');
    }
  };

  const handleTogglePlayerPicked = (playerRank: number) => {
    setPickedPlayers(prevPicked => {
      const newPicked = new Set(prevPicked);
      if (newPicked.has(playerRank)) {
        newPicked.delete(playerRank);
      } else {
        newPicked.add(playerRank);
      }
      return newPicked;
    });
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans p-4 sm:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-tight">
            Fantasy Snake Draft Simulator
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Paste your favorite player rankings and see the draft unfold.
          </p>
        </header>

        <main>
          <Controls
            rawText={rawText}
            setRawText={handleRawTextChange}
            numTeams={numTeams}
            setNumTeams={setNumTeams}
            dataSource={dataSource}
            onDataSourceChange={handleDataSourceChange}
          />

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative my-4" role="alert">
              <strong className="font-bold">Parsing Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <DraftBoard 
            boardData={draftData} 
            numTeams={numTeams} 
            pickedPlayers={pickedPlayers}
            onTogglePlayerPicked={handleTogglePlayerPicked}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
