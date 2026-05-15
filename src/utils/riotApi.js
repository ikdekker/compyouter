const BASE_CD_URL = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftchampions-teamplanner.json';
const BASE_TRAITS_URL = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tfttraits.json';

export const fetchLatestTftData = async () => {
  try {
    // Fetch champion data from Community Dragon
    const championsResponse = await fetch(BASE_CD_URL);
    const championsData = await championsResponse.json();

    // Fetch trait data
    const traitsResponse = await fetch(BASE_TRAITS_URL);
    const traitsData = await traitsResponse.json();

    // Determine the latest set by finding the highest number in TFTSetXX
    let latestSetKey = null;
    let maxSetNum = 0;
    for (const key in championsData) {
      if (key.startsWith("TFTSet")) {
        const setNum = parseInt(key.replace("TFTSet", ""), 10);
        if (setNum > maxSetNum) {
          maxSetNum = setNum;
          latestSetKey = key;
        }
      }
    }

    if (!latestSetKey) {
      console.error('Could not determine latest TFT set from Community Dragon data.');
      return null;
    }

    const rawChampions = championsData[latestSetKey];

    // Transform Community Dragon champion data to our app's format
    // And ensure they are sorted alphabetically by character_id as per Riot's team code spec
    const champions = rawChampions
      .map(champ => ({
        id: champ.character_id, // Keep character_id as our internal ID
        name: champ.display_name,
        cost: champ.tier,
        traits: champ.traits.map(t => t.name),
        teamPlannerCode: champ.team_planner_code, // Store the team_planner_code
      }))
      .sort((a, b) => a.id.localeCompare(b.id)); // Sort by character_id alphabetically for indexing
    // Transform Community Dragon trait data to our app's format (object keyed by trait name)
    const traits = {};
    if (Array.isArray(traitsData)) {
      traitsData.forEach(rawTrait => {
        if (!rawTrait.name) return;
        
        // Find thresholds in conditional_trait_sets
        let levels = [];
        if (rawTrait.effects && Array.isArray(rawTrait.effects)) {
           // Some versions use perk_ids/thresholds
           levels = rawTrait.effects.map(e => e.min_units).filter(v => v !== undefined);
        } else if (rawTrait.conditional_trait_sets && Array.isArray(rawTrait.conditional_trait_sets)) {
           levels = rawTrait.conditional_trait_sets.map(s => s.min_units).filter(v => v !== undefined);
        }

        traits[rawTrait.name] = {
          name: rawTrait.name,
          description: rawTrait.description || '',
          levels: levels.sort((a, b) => a - b)
        };
      });
    }
    
    return {
      version: latestSetKey,
      champions: champions,
      traits: traits
    };
  } catch (error) {
    console.error('Error fetching TFT data from Community Dragon:', error);
    return null;
  }
};
