import { MOCK_TRAITS, MOCK_CHAMPIONS } from '../data/tftData';

export const getTierColor = (tier) => {
  switch(tier) {
    case 'gold': return 'bg-yellow-900/40 text-yellow-300 border-yellow-400';
    case 'silver': return 'bg-slate-700/80 text-slate-200 border-slate-300';
    case 'bronze': return 'bg-amber-900/40 text-amber-500 border-amber-700';
    default: return 'bg-slate-800 text-slate-400 border-slate-600';
  }
};

export const getCostColor = (cost) => {
  switch(cost) {
    case 1: return 'border-gray-400 text-gray-400';
    case 2: return 'border-green-400 text-green-400';
    case 3: return 'border-blue-400 text-blue-400';
    case 4: return 'border-purple-400 text-purple-400';
    case 5: return 'border-yellow-400 text-yellow-400';
    default: return 'border-slate-500 text-slate-500';
  }
};

export const getBoardTraitCounts = (units, emblems = []) => {
  const counts = {};
  const champTraitMap = {};
  
  units.forEach(u => {
    if (!champTraitMap[u.name]) champTraitMap[u.name] = new Set();
    const traits = [...u.traits];
    if (u.selectedTrait) traits.push(u.selectedTrait);
    traits.forEach(t => champTraitMap[u.name].add(t));
  });

  Object.values(champTraitMap).forEach(traitSet => {
    traitSet.forEach(t => {
      counts[t] = (counts[t] || 0) + 1;
    });
  });
  
  emblems.forEach(e => {
    counts[e] = (counts[e] || 0) + 1;
  });

  return counts;
};

export const getSynergies = (units, emblems = []) => {
  const counts = getBoardTraitCounts(units, emblems);
  const activeSynergies = [];

  for (const [trait, count] of Object.entries(counts)) {
    const traitInfo = MOCK_TRAITS[trait];
    if (!traitInfo) continue;

    let activeLevel = 0;
    let nextLevel = traitInfo.levels.find(l => l > count) || null;
    let tier = 'inactive';

    for (let i = 0; i < traitInfo.levels.length; i++) {
      if (count >= traitInfo.levels[i]) {
        activeLevel = traitInfo.levels[i];
        const maxLevelIndex = traitInfo.levels.length - 1;
        if (i === maxLevelIndex) tier = 'gold';
        else if (i >= maxLevelIndex - 1) tier = 'silver';
        else tier = 'bronze';
      }
    }

    if (count > 0) {
      activeSynergies.push({
        name: trait,
        count,
        activeLevel,
        nextLevel,
        tier,
        levels: traitInfo.levels
      });
    }
  }

  return activeSynergies.sort((a, b) => {
    if (a.activeLevel > 0 && b.activeLevel === 0) return -1;
    if (a.activeLevel === 0 && b.activeLevel > 0) return 1;
    return b.count - a.count;
  });
};

export const getSuggestions = (units, emblems = [], strategy = 'standard') => {
  if (units.length === 0 || units.length >= 10) return [];
  const counts = getBoardTraitCounts(units, emblems);
  const uniqueChampions = new Set(units.map(u => u.name));

  const scored = MOCK_CHAMPIONS
    .filter(champ => !uniqueChampions.has(champ.name))
    .map(champ => {
      let bestScore = 0;
      let bestReasons = [];
      let bestTrait = null;

      const traitOptions = champ.selectableTraits ? champ.selectableTraits.map(st => [...champ.traits, st]) : [champ.traits];

      traitOptions.forEach(traits => {
        let score = 0;
        const reasons = [];
        let optionTrait = null;
        if (champ.selectableTraits) {
            optionTrait = traits.find(t => champ.selectableTraits.includes(t));
        }

        traits.forEach(trait => {
          const traitInfo = MOCK_TRAITS[trait];
          if (!traitInfo) return;

          const currentCount = counts[trait] || 0;
          const nextLevel = traitInfo.levels.find(l => l > currentCount);

          if (nextLevel) {
            const distance = nextLevel - currentCount;
            if (currentCount > 0) {
              if (distance === 1) {
                score += 100;
                reasons.push({ trait, type: 'complete', text: `Completes ${nextLevel} ${trait}` });
              } else {
                score += 30;
                reasons.push({ trait, type: 'progress', text: `+1 ${trait}` });
              }
            } else {
               if (traitInfo.levels[0] === 1) score += 15; 
               else score += 2; 
            }
          }
        });

        if (score > bestScore) {
          bestScore = score;
          bestReasons = reasons;
          bestTrait = optionTrait;
        }
      });

      let finalScore = bestScore;
      if (strategy === 'standard') finalScore += (champ.cost * 2); 
      else if (strategy === 'fast9' && champ.cost >= 4) finalScore += (champ.cost === 5 ? 60 : 30);
      else if (strategy === 'reroll3' && champ.cost === 3) finalScore += 60;
      else if (strategy === 'reroll2' && champ.cost === 2) finalScore += 60;
      else if (strategy === 'hyper1' && champ.cost === 1) finalScore += 60;
      
      return { ...champ, score: finalScore, reasons: bestReasons, recommendedTrait: bestTrait };
    })
    .filter(champ => champ.score >= 30 || (champ.score >= 15 && champ.cost === 5) || (strategy !== 'standard' && champ.score >= 50))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 6);
};

export const exportBoardToCode = (board) => {
  const data = {
    n: board.name,
    s: board.strategy,
    e: board.emblems,
    u: board.units.map(u => ({ id: u.id, t: u.selectedTrait }))
  };
  return btoa(JSON.stringify(data));
};

export const importBoardFromCode = (code) => {
  try {
    const data = JSON.parse(atob(code));
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: data.n || 'Imported Board',
      strategy: data.s || 'standard',
      emblems: data.e || [],
      units: (data.u || []).map(u => {
        const base = MOCK_CHAMPIONS.find(c => c.id === u.id);
        if (!base) return null;
        return {
          ...base,
          instanceId: Math.random().toString(36).substr(2, 9),
          selectedTrait: u.t
        };
      }).filter(u => u !== null)
    };
  } catch (e) {
    console.error('Failed to import board', e);
    return null;
  }
};

