import React, { useState, useMemo } from 'react';
import { Search, Users, X, ShieldPlus, Wand2, Loader2, Share2 } from 'lucide-react';
import BoardPanel from './components/BoardPanel';
import { MOCK_TRAITS, MOCK_CHAMPIONS } from './data/tftData';
import { getBoardTraitCounts, getCostColor, exportBoardToCode } from './utils/helpers';

export default function App() {
  const [boards, setBoards] = useState([
    { id: 'base', name: 'Main Path', units: [], strategy: 'standard', emblems: [] }
  ]);
  const [activeBoardId, setActiveBoardId] = useState('base');
  const [searchTerm, setSearchTerm] = useState('');
  const [emblemConfig, setEmblemConfig] = useState(null); 
  const [traitPopup, setTraitPopup] = useState(null);
  const [fillModal, setFillModal] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleAddToBoard = (boardId, champion) => {
    setBoards(prev => prev.map(b => {
      if (b.id === boardId && b.units.length < 10) {
        const newUnit = { 
          ...champion, 
          instanceId: Math.random().toString(36).substr(2, 9),
          selectedTrait: champion.selectableTraits ? champion.selectableTraits[0] : undefined
        };
        return { ...b, units: [...b.units, newUnit] };
      }
      return b;
    }));
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
    const code = exportBoardToCode(board);
    navigator.clipboard.writeText(code);
    alert('Board code copied to clipboard!');
  };

  const filteredChampions = useMemo(() => {
    return MOCK_CHAMPIONS
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   c.traits.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
                   (c.selectableTraits && c.selectableTraits.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))))
      .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  }, [searchTerm]);

  const craftableTraits = Object.entries(MOCK_TRAITS)
    .filter(([_, info]) => !(info.levels.length === 1 && info.levels[0] === 1))
    .map(([name]) => name)
    .sort();

  const handleAutoFill = (boardId, focusTrait, targetSize) => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const sourceBoard = boards.find(b => b.id === boardId);
      let beam = [{ units: [...sourceBoard.units], score: 0 }];
      const beamWidth = 25; 

      for (let step = sourceBoard.units.length; step < targetSize; step++) {
        let nextCandidates = new Map();

        for (let state of beam) {
          const existingNames = new Set(state.units.map(u => u.name));
          const pool = MOCK_CHAMPIONS.filter(c => !existingNames.has(c.name));

          for (let champ of pool) {
            const traits = [...champ.traits];
            let selectedTrait = undefined;
            
            // For auto-fill, we'd ideally pick the best trait, but for simplicity we'll just evaluate based on traits
            // In helpers.getBoardTraitCounts, we'll need it to handle this.
            
            const newUnits = [...state.units, { ...champ, instanceId: Math.random().toString(36).substr(2, 9), selectedTrait }];
            const hash = newUnits.map(u => u.name).sort().join(',');

            if (!nextCandidates.has(hash)) {
              let score = 0;
              const counts = getBoardTraitCounts(newUnits, sourceBoard.emblems);

              if (focusTrait) {
                const focusCount = counts[focusTrait] || 0;
                let focusActiveLvl = 0;
                const focusInfo = MOCK_TRAITS[focusTrait];
                if (focusInfo) {
                  focusInfo.levels.forEach(l => { if (focusCount >= l) focusActiveLvl = l; });
                  score += focusCount * 1000;
                  score += focusActiveLvl * 5000; 
                }
              }

              for (const [trait, count] of Object.entries(counts)) {
                if (trait === focusTrait) continue; 
                const info = MOCK_TRAITS[trait];
                if (info) {
                  let activeLvl = 0;
                  info.levels.forEach(l => { if (count >= l) activeLvl = l; });
                  if (activeLvl > 0) score += (activeLvl * 200); 
                  score += count * 15; 
                }
              }

              const costSum = newUnits.reduce((acc, u) => acc + u.cost, 0);
              score += costSum * 2;

              nextCandidates.set(hash, { units: newUnits, score });
            }
          }
        }

        beam = Array.from(nextCandidates.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, beamWidth);
      }

      const bestComp = beam[0].units;
      
      const newId = Math.random().toString(36).substr(2, 9);
      const newBoard = {
        id: newId,
        name: `Auto-Fill ${focusTrait || 'Balanced'}`,
        units: bestComp,
        strategy: sourceBoard.strategy,
        emblems: [...(sourceBoard.emblems || [])]
      };
      
      setBoards(prev => [...prev, newBoard]);
      setActiveBoardId(newId);
      setFillModal(null);
      setIsCalculating(false);
    }, 100); 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 font-sans flex flex-col gap-6">
      <div className="flex-1 overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex gap-4 h-full">
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
              onOpenFill={(boardId) => setFillModal({ boardId, focusTrait: '', targetSize: 8 })}
              onExport={handleExportBoard}
              onUpdateUnitTrait={handleUpdateUnitTrait}
            />
          ))}
        </div>
      </div>


      <div className="bg-slate-800 rounded-lg shadow-xl p-4 border border-slate-700 flex flex-col h-72 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="text-green-400" size={20} /> Champion Pool
            </h2>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search champions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-full py-1.5 pl-8 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
           <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
             {filteredChampions.map(champ => (
               <button
                 key={champ.id}
                 onClick={() => handleAddToBoard(activeBoardId, champ)}
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

      {emblemConfig && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEmblemConfig(null)}>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setTraitPopup(null)}>
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
                {MOCK_CHAMPIONS
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

      {fillModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => !isCalculating && setFillModal(null)}>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Wand2 className="text-indigo-400" /> Engine Fill Mode
              </h3>
              {!isCalculating && <button onClick={() => setFillModal(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>}
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Team Size</label>
                <input 
                  type="range" 
                  min={boards.find(b => b.id === fillModal.boardId).units.length + 1} 
                  max="10" 
                  value={fillModal.targetSize}
                  onChange={e => setFillModal(prev => ({ ...prev, targetSize: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-500"
                  disabled={isCalculating}
                />
                <div className="text-right text-sm font-bold text-indigo-300 mt-1">{fillModal.targetSize} Units</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Focus Trait (Optional)</label>
                <select 
                  value={fillModal.focusTrait}
                  onChange={e => setFillModal(prev => ({ ...prev, focusTrait: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                  disabled={isCalculating}
                >
                  <option value="">🔮 Balanced (Best Fit)</option>
                  {Object.keys(MOCK_TRAITS).sort().map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">The engine will heavily prioritize this trait, while optimizing the rest of the board around it.</p>
              </div>
            </div>

            <button 
              onClick={() => handleAutoFill(fillModal.boardId, fillModal.focusTrait, fillModal.targetSize)}
              disabled={isCalculating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <><Loader2 size={18} className="animate-spin" /> Analyzing 100,000+ paths...</>
              ) : (
                <><Wand2 size={18} /> Generate Optimal Comp</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
