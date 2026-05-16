import React, { useState, useMemo, useEffect } from 'react';
import { Search, Users, X, ShieldPlus, Wand2, Loader2, Copy, MoreHorizontal, Download, ChevronUp, ChevronDown, Sparkles, Target, Flame, Zap, TrendingUp } from 'lucide-react';
import BoardPanel from './components/BoardPanel';
import { MOCK_TRAITS, MOCK_CHAMPIONS, SHOP_ODDS } from './data/tftData';
import { getBoardTraitCounts, getCostColor, exportBoardToCode, importBoardFromCode, getSuggestions } from './utils/helpers';
import { fetchLatestTftData } from './utils/riotApi';

export default function App() {
  const [allChampions, setAllChampions] = useState(MOCK_CHAMPIONS);
  const [allTraits, setAllTraits] = useState(MOCK_TRAITS);
  const [isLoading, setIsLoading] = useState(true);

  const [boards, setBoards] = useState([
    { id: 'base', name: 'Board', units: [], strategy: 'standard', emblems: [] }
  ]);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchLatestTftData();
      if (data) {
        setAllChampions(data.champions && data.champions.length > 0 ? data.champions : MOCK_CHAMPIONS);
        if (data.traits && Object.keys(data.traits).length > 0) {
          setAllTraits(data.traits);
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const [activeBoardId, setActiveBoardId] = useState('base');
  const [searchTerm, setSearchTerm] = useState('');
  const [emblemConfig, setEmblemConfig] = useState(null); 
  const [traitPopup, setTraitPopup] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedCost, setSelectedCost] = useState('all');
  const [playerLevel, setPlayerLevel] = useState(1);
  const [quickFillMenu, setQuickFillMenu] = useState(null); // { boardId }
  const [aggressionLevel, setAggressionLevel] = useState('vertical'); // 'balanced', 'vertical', 'max'

  const handleAddToBoard = (boardId, champion) => {
    setBoards(prev => prev.map(b => {
      if (b.id === boardId && b.units.length < 10) {
        const newUnit = { 
          ...champion, 
          instanceId: Math.random().toString(36).substr(2, 9),
          selectedTrait: champion.selectableTraits ? champion.selectableTraits[0] : undefined,
          isCore: false
        };
        return { ...b, units: [...b.units, newUnit] };
      }
      return b;
    }));
  };

  const handleUpdateUnitStatus = (boardId, instanceId, isCore) => {
    setBoards(prev => prev.map(b => {
      if (b.id === boardId) {
        return {
          ...b,
          units: b.units.map(u => u.instanceId === instanceId ? { ...u, isCore } : u)
        };
      }
      return b;
    }));
  };

  const handleQuickShift = (boardId, targetLevel) => {
    const sourceBoard = boards.find(b => b.id === boardId);
    const newId = Math.random().toString(36).substr(2, 9);
    
    const newBoard = {
      id: newId,
      name: `Lvl ${targetLevel} Transition`,
      units: [...sourceBoard.units.map(u => ({ ...u, instanceId: Math.random().toString(36).substr(2, 9) }))],
      strategy: sourceBoard.strategy,
      emblems: [...(sourceBoard.emblems || [])]
    };
    
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardId(newId);
    setPlayerLevel(targetLevel);
    
    setTimeout(() => {
       setQuickFillMenu({ boardId: newId });
    }, 100);
  };

  const handleUpdateUnitTrait = (boardId, instanceId, trait) => {
    setBoards(prev => prev.map(b => {
      if (b.id === boardId) {
        return {
          ...b,
          units: b.units.map(u => u.instanceId === instanceId ? { ...u, selectedTrait: trait } : u)
        };
      }
      return b;
    }));
  };

  const handleRemoveFromBoard = (boardId, instanceId) => {
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, units: b.units.filter(u => u.instanceId !== instanceId) } : b));
  };

  const handleBranchBoard = (boardId) => {
    const sourceBoard = boards.find(b => b.id === boardId);
    const newId = Math.random().toString(36).substr(2, 9);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const newBoard = {
      id: newId,
      name: `Path ${alphabet[boards.length % 26]}`,
      units: [...sourceBoard.units.map(u => ({ ...u, instanceId: Math.random().toString(36).substr(2, 9) }))],
      strategy: sourceBoard.strategy,
      emblems: [...(sourceBoard.emblems || [])]
    };
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardId(newId);
  };

  const handleStrategyChange = (boardId, newStrategy) => {
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, strategy: newStrategy } : b));
  };

  const handleCloseBoard = (boardId) => {
    if (boards.length <= 1) return;
    setBoards(prev => {
      const filtered = prev.filter(b => b.id !== boardId);
      if (activeBoardId === boardId) setActiveBoardId(filtered[0].id);
      return filtered;
    });
  };

  const handleAddEmblem = (traitName) => {
    if (!emblemConfig) return;
    setBoards(prev => prev.map(b => {
      if (b.id === emblemConfig) {
        return { ...b, emblems: [...(b.emblems || []), traitName] };
      }
      return b;
    }));
    setEmblemConfig(null);
  };

  const handleRemoveEmblem = (boardId, indexToRemove) => {
    setBoards(prev => prev.map(b => {
      if (b.id === boardId) {
        return { ...b, emblems: (b.emblems || []).filter((_, idx) => idx !== indexToRemove) };
      }
      return b;
    }));
  };

  const handleExportBoard = (boardId) => {
    const board = boards.find(b => b.id === boardId);
    const code = exportBoardToCode(board, allChampions);
    navigator.clipboard.writeText(code);
    alert('Board code copied to clipboard!');
  };

  const filteredChampions = useMemo(() => {
    const odds = SHOP_ODDS[playerLevel] || [100, 0, 0, 0, 0];
    return allChampions
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.traits.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (c.selectableTraits && c.selectableTraits.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
        const matchesCost = selectedCost === 'all' || c.cost === parseInt(selectedCost);
        const isAvailable = odds[c.cost - 1] > 0;
        return matchesSearch && matchesCost && isAvailable;
      })
      .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  }, [searchTerm, selectedCost, allChampions, playerLevel]);

  const ghostedChampIds = useMemo(() => {
    const activeBoard = boards.find(b => b.id === activeBoardId);
    if (!activeBoard) return new Set();
    const coreTraits = new Set();
    activeBoard.units.filter(u => u.isCore).forEach(u => {
      u.traits.forEach(t => coreTraits.add(t));
      if (u.selectedTrait) coreTraits.add(u.selectedTrait);
    });
    
    if (coreTraits.size === 0) return new Set();
    
    const ghosted = new Set();
    allChampions.forEach(c => {
      if (c.traits.some(t => coreTraits.has(t))) {
        ghosted.add(c.id);
      }
    });
    return ghosted;
  }, [activeBoardId, boards, allChampions]);

  const craftableTraits = Object.entries(allTraits)
    .filter(([_, info]) => !(info.levels.length === 1 && info.levels[0] === 1))
    .map(([name]) => name)
    .sort();

  const quickFillOptions = useMemo(() => {
    if (!quickFillMenu) return [];
    const board = boards.find(b => b.id === quickFillMenu.boardId);
    if (!board) return [];
    const counts = getBoardTraitCounts(board.units, board.emblems);
    
    return Object.entries(counts)
      .filter(([name]) => {
         const info = allTraits[name];
         return info && info.levels.length > 1; 
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);
  }, [quickFillMenu, boards, allTraits]);

  const handleAutoFill = (boardId, focusTrait, targetSize, shouldOptimize, aggression = 'vertical') => {
    setIsCalculating(true);
    setQuickFillMenu(null);
    
    setTimeout(() => {
      const sourceBoard = boards.find(b => b.id === boardId);
      const targetLvlOdds = SHOP_ODDS[targetSize] || SHOP_ODDS[playerLevel] || [100, 0, 0, 0, 0];
      
      let startUnits = sourceBoard.units;
      if (shouldOptimize || targetSize < sourceBoard.units.length) {
         startUnits = sourceBoard.units.filter(u => u.isCore);
      }
      
      let beam = [{ units: startUnits, score: 0 }];
      const beamWidth = aggression === 'max' ? 40 : 25; 

      for (let step = startUnits.length; step < targetSize; step++) {
        let nextCandidates = new Map();

        for (let state of beam) {
          const existingNames = new Set(state.units.map(u => u.name));
          const pool = allChampions.filter(c => !existingNames.has(c.name) && targetLvlOdds[c.cost - 1] > 0);

          for (let champ of pool) {
            const traits = [...champ.traits];
            const newUnits = [...state.units, { ...champ, instanceId: Math.random().toString(36).substr(2, 9), selectedTrait: undefined, isCore: false }];
            const hash = newUnits.map(u => u.name).sort().join(',');

            if (!nextCandidates.has(hash)) {
              let score = 0;
              const counts = getBoardTraitCounts(newUnits, sourceBoard.emblems);

              let activeNonUniqueLevels = 0;
              for (const [trait, count] of Object.entries(counts)) {
                const info = allTraits[trait];
                if (info) {
                  const isUnique = info.levels.length === 1 && info.levels[0] === 1;
                  let activeLvl = 0;
                  info.levels.forEach(l => { if (count >= l) activeLvl = l; });
                  
                  if (activeLvl > 0) {
                     const maxLvl = info.levels[info.levels.length - 1];
                     
                     if (trait === focusTrait) {
                        if (aggression === 'max') {
                            score += count * 5000;
                            if (activeLvl === maxLvl) score += 20000;
                        } else {
                            score += 5000;
                        }
                     }

                     if (!isUnique) {
                        if (activeLvl === maxLvl) score += 2000; 
                        else if (info.levels.length > 1 && activeLvl >= info.levels[info.levels.length - 2]) score += 600; 
                        else score += 100;
                        activeNonUniqueLevels++;
                     } else {
                        score += 10; 
                     }
                  }
                  score += count * (isUnique ? 1 : 10); 
                }
              }

              if (counts['Redeemer'] > 0 && activeNonUniqueLevels >= 6) score += 200;
              const hitChance = targetLvlOdds[champ.cost - 1];
              score += hitChance * 2;

              nextCandidates.set(hash, { units: newUnits, score });
            }
          }
        }

        if (nextCandidates.size === 0) break;
        beam = Array.from(nextCandidates.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, beamWidth);
      }

      const bestComp = beam[0]?.units || sourceBoard.units;
      setBoards(prev => prev.map(b => b.id === boardId ? { ...b, units: bestComp } : b));
      setIsCalculating(false);
    }, 100); 
  };

  const handleImportBoard = () => {
    const code = prompt('Paste your TFT Team Code here:');
    if (!code) return;
    const newBoard = importBoardFromCode(code, allChampions);
    if (newBoard) {
      setBoards(prev => [...prev, newBoard]);
      setActiveBoardId(newBoard.id);
    } else {
      alert('Invalid team code!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest">Initializing Engine...</p>
      </div>
    );
  }

  const activeBoard = boards.find(b => b.id === activeBoardId);

  return (
    <div className="h-screen bg-slate-900 text-slate-100 font-sans flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0 z-50">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-black italic tracking-tighter text-white uppercase">
            TFT <span className="text-blue-500">Engine</span>
          </h1>
          <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-1 py-0.5 rounded border border-slate-700 tracking-widest uppercase">v0.4.7</span>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleImportBoard}
             className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-bold flex items-center gap-2 transition-all"
           >
             <Download size={14} /> Import
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6 relative">
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar shrink-0">
          {boards.map(board => (
            <BoardPanel 
              key={board.id}
              board={board}
              isActive={activeBoardId === board.id}
              isSingle={boards.length === 1}
              canClose={boards.length > 1}
              onFocus={setActiveBoardId}
              onRemove={handleRemoveFromBoard}
              onBranch={handleBranchBoard}
              onClose={handleCloseBoard}
              onAddDirect={handleAddToBoard}
              onStrategyChange={handleStrategyChange}
              onAddEmblem={(bid) => setEmblemConfig(bid)}
              onRemoveEmblem={handleRemoveEmblem}
              onTraitClick={(boardId, traitName) => setTraitPopup({ boardId, traitName })}
              onOpenFill={(boardId) => setQuickFillMenu({ boardId })}
              onExport={handleExportBoard}
              onUpdateUnitTrait={handleUpdateUnitTrait}
              onUpdateUnitStatus={handleUpdateUnitStatus}
              onQuickShift={handleQuickShift}
              playerLevel={playerLevel}
              allChampions={allChampions}
              allTraits={allTraits}
            />
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg shadow-xl p-3 border border-slate-700 flex flex-col min-h-[400px] shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-slate-900 p-1 rounded border border-slate-700">
                {['all', 1, 2, 3, 4, 5].map(cost => (
                  <button
                    key={cost}
                    onClick={() => setSelectedCost(cost)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all flex flex-col items-center min-w-[40px] ${
                      selectedCost === cost 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{cost === 'all' ? 'All' : `$${cost}`}</span>
                    {cost !== 'all' && (
                      <span className={`text-[8px] font-black ${selectedCost === cost ? 'text-blue-100' : 'text-slate-500'}`}>
                        {SHOP_ODDS[playerLevel][cost - 1]}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Quick search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-full py-1.5 pl-8 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1">
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
               {filteredChampions.map(champ => {
                 const isGhosted = ghostedChampIds.has(champ.id);
                 return (
                   <button
                     key={champ.id}
                     onClick={() => handleAddToBoard(activeBoardId, champ)}
                     className={`p-2 rounded border-2 transition-all text-left flex flex-col gap-1.5 group relative overflow-hidden ${
                       getCostColor(champ.cost).replace('text-', 'border-').replace('border-', 'border-')
                     } bg-slate-900 hover:bg-slate-800 hover:scale-[1.02] hover:shadow-lg ${isGhosted ? 'ring-2 ring-blue-500/40 brightness-110 shadow-blue-500/20' : ''}`}
                   >
                     <div className="flex justify-between items-center w-full relative z-10">
                       <span className="font-bold text-xs truncate pr-1 text-slate-100 flex items-center gap-1">
                          {isGhosted && <Sparkles size={10} className="text-blue-400 animate-pulse" />}
                          {champ.name}
                       </span>
                       <span className={`text-[10px] font-black px-1.5 rounded ${getCostColor(champ.cost).replace('text-', 'bg-').replace('border-', 'bg-').replace('-400', '-900')} text-white`}>
                         ${champ.cost}
                       </span>
                     </div>
                     <div className="text-[9px] text-slate-400 truncate w-full uppercase tracking-tighter relative z-10 font-medium">
                       {champ.traits.join(' • ')}
                     </div>
                     <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${getCostColor(champ.cost).replace('text-', 'bg-').replace('border-', 'bg-')}`} />
                     {isGhosted && <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-bl-lg flex items-center justify-center"><Sparkles size={6} className="text-white" /></div>}
                   </button>
                 );
               })}
             </div>
          </div>
          <div className="h-24 shrink-0" />
        </div>
      </div>

      <div className="bg-slate-800/95 backdrop-blur border-t border-indigo-500/30 px-6 py-3 flex items-center gap-6 shrink-0 z-[70] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setPlayerLevel(Math.max(1, playerLevel - 1))}
            className="h-12 w-20 bg-slate-700 hover:bg-slate-600 rounded-lg flex flex-col items-center justify-center transition-all active:scale-95 group"
          >
            <ChevronDown size={18} className="text-slate-400 group-hover:text-white" />
            <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-slate-200">Level</span>
          </button>

          <div className="flex-1 flex flex-col items-center justify-center">
             <div className="text-xl font-black italic text-white leading-none tracking-tight">PLAYER LEVEL {playerLevel}</div>
             <div className="flex gap-4 mt-1.5">
                {SHOP_ODDS[playerLevel].map((o, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                     <div className={`w-2 h-2 rounded-full ${getCostColor(i+1).replace('border-', 'bg-').replace('text-', 'bg-')}`} />
                     <span className={`text-[9px] md:text-xs font-black ${o > 0 ? 'text-slate-200' : 'text-slate-600'}`}>{o}%</span>
                  </div>
                ))}
             </div>
          </div>

          <button 
            onClick={() => setPlayerLevel(Math.min(10, playerLevel + 1))}
            className="h-12 w-20 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex flex-col items-center justify-center transition-all active:scale-95 group shadow-lg shadow-indigo-900/40 border border-indigo-400/50"
          >
            <ChevronUp size={20} className="text-white animate-bounce group-hover:animate-none" />
            <span className="text-[9px] font-black uppercase text-white">Lvl Up</span>
          </button>
          
          <div className="w-[1px] h-8 bg-slate-700" />

          <button 
            onClick={() => setQuickFillMenu({ boardId: activeBoardId })}
            disabled={isCalculating}
            className={`h-12 px-8 rounded-lg flex flex-col items-center justify-center transition-all active:scale-95 group shadow-lg border border-emerald-400/50 ${isCalculating ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'}`}
          >
            {isCalculating ? (
              <Loader2 size={20} className="text-white animate-spin" />
            ) : (
              <Wand2 size={20} className="text-white group-hover:rotate-12 transition-transform" />
            )}
            <span className="text-xs font-black uppercase text-white">Quick Fill</span>
          </button>
      </div>

      {quickFillMenu && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={() => setQuickFillMenu(null)}>
           <div className="bg-slate-800 border-2 border-indigo-500 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black italic text-white flex items-center gap-2">
                    <Target className="text-indigo-400" size={20} /> ASSISTANT PATHS
                 </h3>
                 <button onClick={() => setQuickFillMenu(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="flex flex-col gap-4">
                 <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                    {[
                      { id: 'balanced', label: 'Balanced', icon: Wand2, color: 'text-indigo-400' },
                      { id: 'vertical', label: 'Aggressive', icon: TrendingUp, color: 'text-orange-400' },
                      { id: 'max', label: 'Forced Max', icon: Flame, color: 'text-red-500' }
                    ].map(opt => (
                       <button 
                          key={opt.id}
                          onClick={() => setAggressionLevel(opt.id)}
                          className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-all ${aggressionLevel === opt.id ? 'bg-slate-700 shadow-lg border border-slate-500' : 'opacity-40 hover:opacity-100'}`}
                       >
                          <opt.icon size={16} className={aggressionLevel === opt.id ? opt.color : 'text-slate-400'} />
                          <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">{opt.label}</span>
                       </button>
                    ))}
                 </div>

                 <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => handleAutoFill(quickFillMenu.boardId, '', playerLevel, false, aggressionLevel)}
                        className="w-full p-4 bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl text-left transition-all group flex items-center justify-between"
                    >
                        <div>
                            <div className="font-bold text-white group-hover:text-indigo-300 flex items-center gap-2 text-sm uppercase italic">
                               <Zap size={14} className="text-indigo-400" /> General Fit
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Highest raw synergy peak</div>
                        </div>
                    </button>

                    {quickFillOptions.length > 0 && (
                        <div className="mt-2 flex flex-col gap-2">
                           <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Vertical Priorities</div>
                           <div className="grid grid-cols-1 gap-2">
                              {quickFillOptions.map(trait => (
                                 <button 
                                    key={trait}
                                    onClick={() => handleAutoFill(quickFillMenu.boardId, trait, playerLevel, false, aggressionLevel)}
                                    className="w-full p-3 bg-indigo-900/20 border border-indigo-900/40 hover:bg-indigo-900/40 hover:border-indigo-500 rounded-xl text-left transition-all flex items-center justify-between group"
                                 >
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-200 group-hover:text-white uppercase italic text-xs">Vertical {trait}</span>
                                        <span className="text-[9px] text-slate-500 font-bold">Focusing on {aggressionLevel} breakpoints</span>
                                    </div>
                                    <Wand2 size={14} className="text-indigo-500 group-hover:scale-125 transition-transform" />
                                 </button>
                              ))}
                           </div>
                        </div>
                    )}
                 </div>

                 <button 
                    onClick={() => handleAutoFill(quickFillMenu.boardId, '', playerLevel, true, aggressionLevel)}
                    className="w-full p-3 bg-red-900/10 border border-red-900/30 hover:bg-red-900/20 hover:border-red-500 rounded-xl text-left transition-all mt-2"
                 >
                    <div className="font-bold text-red-400 text-xs flex items-center gap-2 uppercase">
                        <Flame size={14} /> Full Re-Optimize (Core Only)
                    </div>
                 </button>
              </div>
           </div>
        </div>
      )}

      {emblemConfig && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={() => setEmblemConfig(null)}>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ShieldPlus className="text-yellow-400" /> Select an Emblem
              </h3>
              <button onClick={() => setEmblemConfig(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto custom-scrollbar p-1">
              {craftableTraits.map(trait => (
                <button 
                  key={trait} 
                  onClick={() => handleAddEmblem(trait)}
                  className="p-2 border border-slate-600 rounded bg-slate-700 hover:bg-yellow-600 hover:border-yellow-300 hover:text-yellow-950 transition-colors text-sm font-semibold text-center"
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {traitPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={() => setTraitPopup(null)}>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  {traitPopup.traitName} Champions
                </h3>
                <p className="text-sm text-slate-400 mt-1">Click a champion to add them to your board.</p>
              </div>
              <button onClick={() => setTraitPopup(null)} className="text-slate-400 hover:text-white p-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {allChampions
                  .filter(c => c.traits.includes(traitPopup.traitName))
                  .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name))
                  .map(champ => (
                    <button
                      key={`popup-${champ.id}`}
                      onClick={() => handleAddToBoard(traitPopup.boardId, champ)}
                      className={`p-2 rounded border border-slate-700 bg-slate-900 hover:bg-slate-700 hover:border-slate-500 transition-all text-left flex flex-col gap-1`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-semibold text-xs truncate pr-1">{champ.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 rounded ${getCostColor(champ.cost).replace('text-', 'bg-').replace('border-', 'bg-').replace('-400', '-900')} text-white`}>
                          ${champ.cost}
                        </span>
                      </div>
                      <div className="text-[8px] text-slate-400 truncate w-full uppercase tracking-wider">
                        {champ.traits.join(' • ')}
                      </div>
                    </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
