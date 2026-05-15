import React, { useState, useMemo } from 'react';
import { X, ShieldPlus, RefreshCcw, Star, Wand2, Lightbulb, GitBranch, Copy, MoreHorizontal } from 'lucide-react';
import { getTierColor, getBoardTraitCounts, getSynergies, getSuggestions, getCostColor } from '../utils/helpers';

const BoardPanel = ({ board, isActive, isSingle, onFocus, onRemove, onBranch, onClose, canClose, onAddDirect, onStrategyChange, onAddEmblem, onRemoveEmblem, onTraitClick, onOpenFill, onExport, onUpdateUnitTrait, allChampions = [], allTraits = {} }) => {
  const [hoveredTrait, setHoveredTrait] = useState(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const synergies = useMemo(() => getSynergies(board.units, board.emblems, allTraits), [board.units, board.emblems, allTraits]);
  const suggestedChampions = useMemo(() => getSuggestions(board.units, board.emblems, board.strategy, allChampions, allTraits), [board.units, board.emblems, board.strategy, allChampions, allTraits]);
  
  const activeTraits = synergies.filter(s => s.activeLevel > 0);
  const uniqueCount = activeTraits.filter(s => s.levels.length === 1 && s.levels[0] === 1).length;
  const nonUniqueCount = activeTraits.length - uniqueCount;

  const costCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    board.units.forEach(u => {
      if (counts[u.cost] !== undefined) counts[u.cost]++;
    });
    return counts;
  }, [board.units]);

  const currentTraitCounts = useMemo(() => getBoardTraitCounts(board.units, board.emblems), [board.units, board.emblems]);

  const costOverview = (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(cost => (
        <div key={cost} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black border ${getCostColor(cost).replace('text-', 'border-').replace('border-', 'border-')} ${costCounts[cost] > 0 ? 'bg-slate-700 text-white shadow-sm' : 'bg-slate-900/40 text-slate-600 border-slate-800'}`}>
          <span className="opacity-70">$</span>{cost}: {costCounts[cost]}
        </div>
      ))}
    </div>
  );

  return (
    <div 
      onClick={() => onFocus(board.id)}
      className={`flex-1 min-w-[360px] bg-slate-800 rounded-lg shadow-xl p-4 flex flex-col border-2 transition-all ${
        isActive ? 'border-blue-500 shadow-blue-900/20' : 'border-slate-700 opacity-60 hover:opacity-100 cursor-pointer'
      }`}
    >
      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3 relative">
         <div className="flex flex-col gap-1.5 w-full overflow-hidden">
           <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full shrink-0 ${isActive ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`} />
             <span className="font-bold text-lg text-slate-200 truncate">{board.name}</span>
             <span className="bg-slate-700 px-2 py-0.5 rounded text-xs font-semibold text-slate-300 shrink-0">
               {board.units.length} / 10
             </span>
             <select 
               value={board.strategy || 'standard'} 
               onChange={(e) => onStrategyChange(board.id, e.target.value)}
               onClick={(e) => e.stopPropagation()}
               className="bg-slate-900 border border-slate-600 text-xs rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-700 shrink-0 ml-auto"
               title="Roll Strategy"
             >
               <option value="standard">Flex / Standard</option>
               <option value="fast9">Fast 9 (Legendaries)</option>
               <option value="reroll3">Slow Roll (3-Cost)</option>
               <option value="reroll2">Slow Roll (2-Cost)</option>
               <option value="hyper1">Hyper Roll (1-Cost)</option>
             </select>
           </div>
           
           <div className="text-xs text-slate-400 flex items-center flex-wrap gap-x-4 gap-y-2 pl-6">
             <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50">
               <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Traits:</span>
               <span className="text-slate-300"><strong className="text-white">{nonUniqueCount}</strong> Standard</span>
               <span className="w-[1px] h-3 bg-slate-700 mx-1" />
               <span className="text-slate-300"><strong className="text-white">{uniqueCount}</strong> Unique</span>
             </div>
             
             <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Pool:</span>
                {costOverview}
             </div>
           </div>

           <div className="flex flex-wrap items-center gap-1.5 pl-6 mt-1">
             <button onClick={(e) => { e.stopPropagation(); onAddEmblem(board.id); }} className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-yellow-600 bg-yellow-900/40 text-yellow-400 hover:bg-yellow-500 hover:text-slate-900 transition-colors flex items-center gap-1">
               <ShieldPlus size={12} /> Add Emblem
             </button>
             {(board.emblems || []).map((e, idx) => (
                <span 
                   key={`${e}-${idx}`} 
                   onClick={(evt) => { evt.stopPropagation(); onRemoveEmblem(board.id, idx); }}
                   className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border cursor-crosshair hover:bg-red-900 hover:text-red-400 hover:border-red-700 flex items-center gap-1 transition-all duration-300 ${hoveredTrait === e ? 'bg-yellow-400 text-slate-900 border-white scale-110 shadow-lg z-10' : 'bg-yellow-900/40 text-yellow-300 border-yellow-700'}`}
                   title={`Remove ${e} Emblem`}
                >
                   {e} <X size={10} strokeWidth={3} />
                </span>
             ))}
           </div>
         </div>
         
         <div className="flex items-center gap-2 ml-2 shrink-0">
           <div className="hidden md:flex items-center gap-2">
             <button onClick={(e) => { e.stopPropagation(); onExport(board.id); }} className="p-1.5 bg-green-900/60 border border-green-500/50 hover:bg-green-600 hover:border-green-400 rounded text-green-300 hover:text-white shrink-0 shadow-lg transition-all active:scale-95" title="Copy Board Code">
               <Copy size={16} />
             </button>
             <button onClick={(e) => { e.stopPropagation(); onOpenFill(board.id); }} className="p-1.5 bg-indigo-900/60 border border-indigo-500/50 hover:bg-indigo-600 hover:border-indigo-400 rounded text-indigo-300 hover:text-white shrink-0 flex items-center gap-1 shadow-lg transition-all active:scale-95" title="Engine Analysis Auto-Fill">
               <Wand2 size={16} />
             </button>
           </div>
           
           <div className="relative">
             <button 
               onClick={(e) => { e.stopPropagation(); setShowMoreActions(!showMoreActions); }}
               className={`p-1.5 rounded text-slate-300 hover:text-white shrink-0 transition-all shadow-lg active:scale-95 ${showMoreActions ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-700 hover:bg-slate-600'}`}
               title="More Actions"
             >
               <MoreHorizontal size={20} />
             </button>
             
             {showMoreActions && (
               <>
                 <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setShowMoreActions(false); }} />
                 <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="md:hidden">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onExport(board.id); setShowMoreActions(false); }}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-green-600 flex items-center gap-3 border-b border-slate-700 transition-colors"
                      >
                        <Copy size={16} className="text-green-400" /> Copy Team Code
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenFill(board.id); setShowMoreActions(false); }}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-indigo-600 flex items-center gap-3 border-b border-slate-700 transition-colors"
                      >
                        <Wand2 size={16} className="text-indigo-400" /> Engine Auto-Fill
                      </button>
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onBranch(board.id); setShowMoreActions(false); }}
                     className="w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-blue-600 flex items-center gap-3 border-b border-slate-700 transition-colors"
                   >
                     <GitBranch size={16} className="text-blue-400" /> Branch this Path
                   </button>
                   {canClose && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); onClose(board.id); setShowMoreActions(false); }}
                       className="w-full px-4 py-3 text-left text-sm font-bold text-red-400 hover:bg-red-600 hover:text-white flex items-center gap-3 transition-colors"
                     >
                       <X size={16} /> Close Path
                     </button>
                   )}
                 </div>
               </>
             )}
           </div>
         </div>
      </div>

      <div className="flex flex-col gap-3 mb-4 min-h-[40px]">
        {synergies.length === 0 && <span className="text-slate-500 text-sm italic">Add units to see traits...</span>}
        
        {/* Non-Unique Traits */}
        {synergies.filter(s => !(s.levels.length === 1 && s.levels[0] === 1)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {synergies.filter(s => !(s.levels.length === 1 && s.levels[0] === 1)).map(syn => {
              const progress = syn.nextLevel ? `${syn.count}/${syn.nextLevel}` : `${syn.count}/${syn.activeLevel}`;
              return (
                <div 
                  key={syn.name} 
                  onMouseEnter={() => setHoveredTrait(syn.name)}
                  onMouseLeave={() => setHoveredTrait(null)}
                  onClick={(e) => { e.stopPropagation(); onTraitClick(board.id, syn.name); }}
                  className={`px-2.5 py-1 rounded text-sm border flex items-center gap-2 transition-all cursor-pointer hover:brightness-125 ${getTierColor(syn.tier)} ${hoveredTrait === syn.name ? 'scale-110 shadow-lg z-10 ring-1 ring-white/50' : ''}`}
                >
                  <span className="font-bold">{syn.name}</span>
                  <span className="bg-black/20 px-1.5 rounded font-mono text-xs tracking-wider">{progress}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Unique Traits */}
        {synergies.filter(s => s.levels.length === 1 && s.levels[0] === 1).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/50">
            {synergies.filter(s => s.levels.length === 1 && s.levels[0] === 1).map(syn => (
              <div 
                key={syn.name} 
                onMouseEnter={() => setHoveredTrait(syn.name)}
                onMouseLeave={() => setHoveredTrait(null)}
                onClick={(e) => { e.stopPropagation(); onTraitClick(board.id, syn.name); }}
                className={`px-2 py-0.5 rounded text-[11px] border flex items-center gap-1.5 transition-all cursor-pointer hover:brightness-125 ${getTierColor(syn.tier)} ${hoveredTrait === syn.name ? 'scale-110 shadow-lg z-10 ring-1 ring-white/50' : ''}`}
              >
                <span className="font-bold">{syn.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        {Array.from({ length: 10 }).map((_, idx) => {
          const champ = board.units[idx];
          
          let isSwapout = false;
          let matchedCount = 0;
          let champMatchedTraits = {};
          let highlightClass = '';

          if (champ) {
            const otherUnits = board.units.filter(u => u.instanceId !== champ.instanceId);
            const withoutCounts = getBoardTraitCounts(otherUnits, board.emblems);
            const allUnitTraits = [...champ.traits];
            if (champ.selectedTrait) allUnitTraits.push(champ.selectedTrait);
            
            let providesThreshold = false;
            allUnitTraits.forEach(trait => {
                const countWith = currentTraitCounts[trait] || 0;
                const countWithout = withoutCounts[trait] || 0;
                const traitInfo = allTraits[trait];
                if (traitInfo) {
                    let levelWith = 0; traitInfo.levels.forEach(l => { if (countWith >= l) levelWith = l; });
                    let levelWithout = 0; traitInfo.levels.forEach(l => { if (countWithout >= l) levelWithout = l; });
                    if (levelWith > levelWithout) providesThreshold = true;
                }

                const isActive = traitInfo && traitInfo.levels.some(l => countWith >= l);
                const isProgressing = countWith > 1;
                if (isActive || isProgressing) {
                   matchedCount++;
                   champMatchedTraits[trait] = true;
                }
            });
            isSwapout = !providesThreshold;

            if (hoveredTrait) {
              if (champ.traits.includes(hoveredTrait) || champ.selectedTrait === hoveredTrait || (board.emblems && board.emblems.includes(hoveredTrait))) {
                highlightClass = 'ring-2 ring-white scale-110 z-10 shadow-[0_0_15px_rgba(255,255,255,0.3)] !opacity-100';
              } else {
                highlightClass = 'opacity-20 grayscale scale-95';
              }
            }
          }

          return (
            <div 
              key={idx} 
              onClick={(e) => {
                 if (champ) {
                   e.stopPropagation();
                   onRemove(board.id, champ.instanceId);
                 }
              }}
              className={`h-20 md:h-24 rounded-lg border-2 flex flex-col items-center justify-center p-1.5 relative transition-all duration-300 ${
                champ ? 
                   `bg-slate-800 ${getCostColor(champ.cost)} cursor-pointer hover:bg-red-900/40 hover:border-red-500 group ${highlightClass || 'hover:opacity-80'}` : 
                   'border-slate-700 border-dashed bg-slate-800/50 text-slate-600'
              }`}
            >
              {champ ? (
                <>
                  <div className="absolute -top-2.5 -right-2.5 flex items-center shadow-lg z-10 scale-100 origin-top-right">
                    {(isSwapout || matchedCount > 0) && (
                      <>
                        {matchedCount > 0 && (
                          <div title={isSwapout ? `${matchedCount} trait(s) matched but no thresholds reached.` : `${matchedCount} trait(s) matching and providing essential thresholds!`} className={`${isSwapout ? 'bg-amber-500 text-amber-950 border-amber-700' : 'bg-emerald-500 text-emerald-950 border-emerald-700'} px-2 py-[4px] text-xs font-black rounded-l-full border-2 border-r-0 flex items-center h-[26px]`}>
                            {matchedCount}
                          </div>
                        )}
                        <div title={isSwapout ? "Suggested Swap: This unit provides no active synergy thresholds." : "Core Unit: Provides active synergy thresholds."} className={`${isSwapout ? 'bg-amber-600 border-amber-800' : 'bg-emerald-600 border-emerald-800'} text-white p-1 border-2 flex items-center justify-center h-[26px] w-[26px] ${matchedCount > 0 ? 'rounded-r-full' : 'rounded-full'}`}>
                          {isSwapout ? <RefreshCcw size={14} strokeWidth={3} /> : <Star size={12} strokeWidth={3} fill="currentColor" />}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center w-full h-full text-center overflow-hidden">
                    <span className="font-bold text-xs md:text-sm leading-tight truncate w-full px-0.5 text-white mb-0.5">{champ.name}</span>
                    <div className="flex flex-wrap justify-center gap-1 w-full px-0.5">
                       {champ.traits.map(t => {
                         let traitColor = 'text-slate-400';
                         if (hoveredTrait === t) traitColor = 'text-white font-bold';
                         else if (champMatchedTraits[t]) traitColor = isSwapout ? 'text-amber-300' : 'text-emerald-400';
                         
                         return (
                           <span key={t} className={`text-[9px] md:text-[10px] leading-none truncate max-w-full transition-colors duration-300 ${traitColor}`}>
                             {t}
                           </span>
                         );
                       })}
                       {champ.selectedTrait && (
                         <span className={`text-[9px] md:text-[10px] leading-none truncate max-w-full font-bold ${hoveredTrait === champ.selectedTrait ? 'text-white' : 'text-indigo-400'}`}>
                           {champ.selectedTrait}
                         </span>
                       )}
                    </div>
                  </div>

                  {champ.selectableTraits && (
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                      {champ.selectableTraits.map(t => (
                        <button
                          key={t}
                          onClick={(e) => { e.stopPropagation(); onUpdateUnitTrait(board.id, champ.instanceId, t); }}
                          className={`w-6 h-6 rounded-full border-2 border-white/40 text-[10px] flex items-center justify-center font-black shadow-xl transition-all hover:scale-125 ${champ.selectedTrait === t ? 'bg-indigo-600 text-white border-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                          title={`Select ${t}`}
                        >
                          {t[0]}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-sm opacity-50 font-mono">{idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {board.units.length > 0 && board.units.length < 10 && suggestedChampions.length > 0 && (
        <div className="mt-auto bg-slate-900/50 rounded p-3 border border-blue-900/30">
          <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 mb-2 uppercase tracking-wider">
            <Lightbulb size={12} /> Optimal Additions
          </h3>
          <div className={`grid gap-2 ${isSingle ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2'}`}>
            {suggestedChampions.slice(0, isSingle ? 6 : 4).map(champ => (
              <button
                key={`suggest-${champ.id}`}
                onClick={(e) => { e.stopPropagation(); onAddDirect(board.id, champ); }}
                className={`p-1.5 rounded border border-blue-800/40 bg-slate-800 hover:bg-blue-900 hover:border-blue-500 transition-all text-left flex flex-col gap-0.5`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-xs truncate">{champ.name}</span>
                  <span className={`text-[9px] font-bold px-1 rounded ${getCostColor(champ.cost).replace('text-', 'bg-').replace('border-', 'bg-').replace('-400', '-900')} text-white`}>
                    ${champ.cost}
                  </span>
                </div>
                <div className="text-[8px] text-slate-400 truncate w-full mb-0.5">
                  {champ.traits.join(' • ')}{champ.recommendedTrait && ` • ${champ.recommendedTrait}`}
                </div>
                <div className="flex flex-col gap-[1px]">
                  {champ.reasons.slice(0, 2).map((r, i) => (
                    <span key={i} className={`text-[8px] px-1 py-[1px] rounded truncate ${
                      r.type === 'complete' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'
                    }`}>
                      {r.text}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPanel;
