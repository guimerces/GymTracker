/**
 * Weight Recommendation Engine
 * 
 * Rule: If total reps across all sets of the same exercise >= 35,
 * recommend increasing weight by 2kg for the next session.
 */

/**
 * Calculate weight recommendation based on previous session data
 * @param {Array} previousSets - Array of { set_number, weight_kg, reps } from last session
 * @param {number} targetSets - Target number of sets for this exercise
 * @param {number} targetReps - Target number of reps per set
 * @returns {Object} recommendation object
 */
function getWeightRecommendation(previousSets, targetSets, targetReps) {
    if (!previousSets || previousSets.length === 0) {
        return {
            hasHistory: false,
            recommendedWeight: 0,
            message: 'Primeiro treino! Escolha um peso confortável.',
            previousSets: [],
            totalReps: 0,
            shouldIncrease: false
        };
    }

    const totalReps = previousSets.reduce((sum, set) => sum + set.reps, 0);
    const lastWeight = previousSets[0].weight_kg;
    const shouldIncrease = totalReps >= 35;

    if (shouldIncrease) {
        const newWeight = lastWeight + 2;
        return {
            hasHistory: true,
            recommendedWeight: newWeight,
            message: `🔥 Aumente para ${newWeight}kg! (+2kg) — Você fez ${totalReps} reps na última vez!`,
            previousSets: previousSets.map(s => ({ set: s.set_number, reps: s.reps, weight: s.weight_kg })),
            totalReps,
            shouldIncrease: true
        };
    } else {
        return {
            hasHistory: true,
            recommendedWeight: lastWeight,
            message: `Mantenha ${lastWeight}kg — Última vez: ${totalReps} reps total (meta: 35)`,
            previousSets: previousSets.map(s => ({ set: s.set_number, reps: s.reps, weight: s.weight_kg })),
            totalReps,
            shouldIncrease: false
        };
    }
}

module.exports = { getWeightRecommendation };
