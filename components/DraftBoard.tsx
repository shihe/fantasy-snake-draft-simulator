import React from 'react';
import type { Player, DraftBoardData } from '../types';

interface DraftBoardProps {
  boardData: DraftBoardData;
  numTeams: number;
  pickedPlayers: Set<number>;
  onTogglePlayerPicked: (rank: number) => void;
}

const getPositionColorClasses = (position: string): { border: string; text: string; } => {
  switch (position.slice(0, 2).toUpperCase()) {
    case 'WR':
      return { border: 'border-l-sky-400', text: 'text-sky-400' };
    case 'RB':
      return { border: 'border-l-emerald-400', text: 'text-emerald-400' };
    case 'TE':
      return { border: 'border-l-amber-400', text: 'text-amber-400' };
    case 'QB':
      return { border: 'border-l-rose-400', text: 'text-rose-400' };
    default:
      return { border: 'border-l-gray-500', text: 'text-gray-400' };
  }
};

interface PlayerCardProps {
    player: Player;
    overallPick: number;
    round: number;
    isPicked: boolean;
    onTogglePicked: (rank: number) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, overallPick, round, isPicked, onTogglePicked }) => {
  const roundColorClass = round % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/60';
  const positionColors = getPositionColorClasses(player.position);
  const pickedClasses = isPicked ? 'opacity-40 filter grayscale' : 'hover:bg-gray-700/80 hover:scale-[1.02]';
  
  return (
    <div 
        className={`p-2 rounded-md h-28 flex flex-col justify-between text-left shadow-lg border border-gray-700/50 border-l-4 ${roundColorClass} ${positionColors.border} cursor-pointer transform transition-all duration-300 ease-in-out ${pickedClasses}`}
        onClick={() => onTogglePicked(player.rank)}
        role="button"
        aria-pressed={isPicked}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTogglePicked(player.rank) }}
        aria-label={`Pick ${player.name}, Rank ${player.rank}, Position ${player.position}. Click to toggle drafted status.`}
    >
      <div>
        <div className="flex justify-between items-start gap-2">
          <p className={`font-bold text-sm text-white break-words ${isPicked ? 'line-through' : ''}`} title={player.name}>
            {player.name}
          </p>
          <p className={`text-xs font-mono font-bold flex-shrink-0 ${positionColors.text}`}>
            {player.position}
          </p>
        </div>
        <p className="text-xs text-gray-400">
          (Rank: {player.rank})
        </p>
      </div>
      <p className="text-xs text-gray-500 self-end font-mono">
        Pick {overallPick}
      </p>
    </div>
  );
};

const EmptyCard: React.FC<{ round: number }> = ({ round }) => {
  const roundColorClass = round % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/10';
  return <div className={`p-2 rounded-md h-28 ${roundColorClass} border border-dashed border-gray-700`}></div>;
};

const DraftBoard: React.FC<DraftBoardProps> = ({ boardData, numTeams, pickedPlayers, onTogglePlayerPicked }) => {
  const teamKeys = Object.keys(boardData);
  if (teamKeys.length === 0) {
    return (
        <div className="text-center py-10 bg-gray-800/30 rounded-lg">
            <p className="text-gray-400">Draft board will appear here once rankings are entered.</p>
        </div>
    );
  }

  const numRounds = boardData[teamKeys[0]]?.length || 0;
  
  const getStyle = (teams: number) => {
      // Use inline style for dynamic grid-template-columns
      return { gridTemplateColumns: `repeat(${teams}, minmax(0, 1fr))` };
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-block min-w-full">
        <div className="grid gap-1.5" style={getStyle(numTeams)}>
          {teamKeys.map((teamName, index) => (
            <div key={teamName} className="sticky top-0 z-10 bg-gray-900 pt-2">
              <h2 className="bg-gray-700 text-cyan-300 p-2 text-center font-bold text-sm md:text-base rounded-t-md shadow-md">
                {teamName}
              </h2>
            </div>
          ))}

          {Array.from({ length: numRounds }).map((_, roundIndex) => (
            <React.Fragment key={roundIndex}>
              {teamKeys.map((teamName, teamIndex) => {
                const player = boardData[teamName]?.[roundIndex] ?? null;
                const isForwardRound = roundIndex % 2 === 0;
                const pickInRound = isForwardRound ? teamIndex : numTeams - 1 - teamIndex;
                const overallPick = roundIndex * numTeams + pickInRound + 1;

                return (
                  <div key={`${teamName}-${roundIndex}`}>
                    {player ? (
                      <PlayerCard 
                        player={player} 
                        overallPick={overallPick} 
                        round={roundIndex}
                        isPicked={pickedPlayers.has(player.rank)}
                        onTogglePicked={onTogglePlayerPicked}
                      />
                    ) : (
                      <EmptyCard round={roundIndex} />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DraftBoard;