import { MOCK_TRAITS, MOCK_CHAMPIONS } from '../data/tftData.js';

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

export const getSynergies = (units, emblems = [], allTraits = MOCK_TRAITS) => {
  const counts = getBoardTraitCounts(units, emblems);
  const activeSynergies = [];

  for (const [trait, count] of Object.entries(counts)) {
    const traitInfo = allTraits[trait];
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

export const getSuggestions = (units, emblems = [], strategy = 'standard', allChampions = MOCK_CHAMPIONS, allTraits = MOCK_TRAITS) => {
  if (units.length === 0 || units.length >= 10) return [];
  const counts = getBoardTraitCounts(units, emblems);
  const uniqueChampions = new Set(units.map(u => u.name));

  const scored = allChampions
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
          const traitInfo = allTraits[trait];
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

          // Special logic for Redeemer (Rhaast)
          if (trait === 'Redeemer') {
            let activeNonUniqueLevels = 0;
            for (const [t, count] of Object.entries(counts)) {
              const info = allTraits[t];
              if (info && !(info.levels.length === 1 && info.levels[0] === 1)) {
                let activeLvl = 0;
                info.levels.forEach(l => { if (count >= l) activeLvl = l; });
                if (activeLvl > 0) activeNonUniqueLevels++;
              }
            }
            if (activeNonUniqueLevels >= 5) {
              score += activeNonUniqueLevels * 40;
              reasons.push({ trait, type: 'complete', text: `Enhances ${activeNonUniqueLevels} active traits` });
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

export const getSortedChampionList = (champions = MOCK_CHAMPIONS) => {
  return [...champions]; // Champions are now expected to be pre-sorted from the API
};

export const exportBoardToCode = (board, allChampions = MOCK_CHAMPIONS) => {
  const sortedChamps = allChampions; // Champions are already sorted alphabetically by character_id

  const prefix = "01"; // Always export in the latest official '01' format
  const suffix = "TFTSet17";

  let hexBody = "";
  // Iterate up to 10 board slots
  for (let i = 0; i < 10; i++) {
    const unit = board.units[i]; // Get unit at this board position

    if (unit) {
      // Find the 1-based index of the champion in the alphabetically sorted list
      const champIndex = sortedChamps.findIndex(c => c.id === unit.id);
      if (champIndex !== -1) {
        // Convert to 1-based index to 2-char hex
        const champHexId = (champIndex + 1).toString(16).padStart(2, '0').toLowerCase();
        hexBody += champHexId;
      } else {
        hexBody += "00"; // Champion not found or empty slot
      }
    } else {
      hexBody += "00"; // Empty slot
    }
  }

  return `${prefix}${hexBody}${suffix}`;
};

export const importBoardFromCode = (code, allChampions = MOCK_CHAMPIONS) => {
  try {
    const cleanCode = (code || "").trim();
    const isOfficial = cleanCode.startsWith("01");
    const isV2 = cleanCode.startsWith("02");
    
    // Fallback to old Base64 format if no known prefix
    if (!isOfficial && !isV2 && !/tftset/i.test(cleanCode)) {
      try {
        const data = JSON.parse(atob(cleanCode));
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: data.n || 'Imported Board',
          strategy: data.s || 'standard',
          emblems: data.e || [],
          units: (data.u || []).map(u => {
            const base = allChampions.find(c => c.id === u.id);
            if (!base) return null;
            return {
              ...base,
              instanceId: Math.random().toString(36).substr(2, 9),
              selectedTrait: u.t,
              position: 0 // Default position for old format
            };
          }).filter(u => u !== null).slice(0, 10)
        };
      } catch (e) {
        return null;
      }
    }

    if (isV2) {
      console.error('Import of 02-prefixed team codes is not supported due to ambiguity in champion ID mapping.');
      return null;
    }

    const sortedChamps = getSortedChampionList(allChampions); // Alphabetically sorted by character_id

    // For '01' format, each unit is 2 hex chars for champion ID.
    const charsPerUnit = 2; // Always 2 for '01' format now
    const unitCount = 10;
    const hexBodyLength = unitCount * charsPerUnit;
    
    // Determine the end of the hex part, considering a potential suffix like "TFTSet17"
    let hexPartEndIndex = 2 + hexBodyLength;
    const suffixMatch = cleanCode.substring(2 + hexBodyLength).match(/TFTSet\d+/i);
    if (suffixMatch) {
      hexPartEndIndex = cleanCode.indexOf(suffixMatch[0]);
    }

    const hexPart = cleanCode.substring(2, hexPartEndIndex);
    const units = [];
    
    for (let i = 0; i < unitCount; i++) {
      const unitHex = hexPart.substring(i * charsPerUnit, i * charsPerUnit + charsPerUnit);
      if (!unitHex || unitHex.match(/^0+$/)) continue; // Continue if all zeros (empty slot)

      let champ = null; // Declare champ here
      let position = 0; // Default position for '01' or if not explicitly set for '02'

      if (isV2) {
        // Version 02: 3 hex chars = [Champion TPCode (2 chars)][Position (1 char)]
        const champTpCodeHex = unitHex.substring(0, 2);
        const positionHex = unitHex.substring(2, 3);
        const teamPlannerCode = parseInt(champTpCodeHex, 16);
        position = parseInt(positionHex, 16);
        champ = allChampions.find(c => c.teamPlannerCode === teamPlannerCode);
      } else {
        // Version 01: 2 hex chars = [Champion 1-based alphabetical index (2 chars)]
        const championIndex = parseInt(unitHex, 16);
        if (championIndex >= 1 && championIndex <= sortedChamps.length) {
          champ = sortedChamps[championIndex - 1];
        }
      }

      if (champ) {
        // Avoid duplicates in imported list based on champion ID
        if (!units.some(u => u.id === champ.id)) {
          units.push({
            ...champ,
            instanceId: Math.random().toString(36).substr(2, 9),
            selectedTrait: champ.selectableTraits ? champ.selectableTraits[0] : undefined,
            position: position // Store the parsed position
          });
        }
      }
    }

    if (units.length === 0) return null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Imported Team',
      strategy: 'standard',
      emblems: [],
      units
    };
  } catch (e) {
    console.error('Failed to import board', e);
    return null;
  }
};
