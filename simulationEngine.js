function simulateTireEffect(tire, stintLength) {
    let effect = 0;
    // Define base effects for each tire type.
    if (tire === 'Soft') {
        effect = -0.6;
    } else if (tire === 'Medium') {
        effect = 0;
    } else if (tire === 'Hard') {
        effect = 0.6;
    } else if (tire === 'Intermediates') {
        effect = 0.3;
    } else if (tire === 'Wets') {
        effect = 0.5;
    } else {
        effect = 0;
    }
    // Adjust effect based on how long the stint is relative to a base length (25 laps)
    let adjustedEffect = effect * (stintLength / 25);
    return adjustedEffect;
}

function simulatePitStopPenalty(pitStops) {
    // Each pit stop is assumed to add a fixed penalty (e.g., 1.2 units).
    return pitStops * 1.2;
}

function simulateWeatherEffect(weather) {
    // Returns an effect value based on weather.
    if (weather === 'Rainy') {
        return 1.5;
    } else if (weather === 'Cloudy') {
        return 0.5;
    } else if (weather === 'Overcast') {
        return 1.0;
    }
    return 0;
}

function simulateTrackEffect(track) {
    // Some tracks are considered more favorable; these tracks lower the effective score.
    const favorableTracks = ['Monza', 'Silverstone', 'Spa-Francorchamps'];
    if (favorableTracks.indexOf(track) !== -1) {
        return -0.7;
    }
    return 0.2;
}

function simulateTimeOfDayEffect(timeOfDay) {
    // Adjust simulation based on the time of day.
    if (timeOfDay === 'Evening') {
        return 0.5;
    } else if (timeOfDay === 'Morning') {
        return -0.2;
    }
    return 0;
}

function calculateStrategyScore(grid, pitStops, stints, weather, track, timeOfDay) {
    // Start with the grid position as a base score.
    let score = grid;
    
    // Add the pit stop penalty.
    let pitStopPenalty = simulatePitStopPenalty(pitStops);
    score += pitStopPenalty;
    
    // Incorporate the effect of each stint’s tire choice and stint length.
    stints.forEach((stint) => {
        score += simulateTireEffect(stint.tire, stint.stint_length);
    });
    
    // Add weather, track, and time-of-day adjustments.
    score += simulateWeatherEffect(weather);
    score += simulateTrackEffect(track);
    score += simulateTimeOfDayEffect(timeOfDay);
    
    return score;
}

function simulateRaceOutcome(params) {
    const { grid, pitStops, stints, weather, track, timeOfDay } = params;
    
    // Build a detailed breakdown for transparency.
    let breakdown = {};
    breakdown.grid = grid;
    breakdown.pitStopPenalty = simulatePitStopPenalty(pitStops);
    
    breakdown.tireEffects = [];
    stints.forEach((stint, index) => {
        let tireEffect = simulateTireEffect(stint.tire, stint.stint_length);
        breakdown.tireEffects.push({
            stint: index + 1,
            tire: stint.tire,
            stint_length: stint.stint_length,
            effect: tireEffect
        });
    });
    
    breakdown.weatherEffect = simulateWeatherEffect(weather);
    breakdown.trackEffect = simulateTrackEffect(track);
    breakdown.timeOfDayEffect = simulateTimeOfDayEffect(timeOfDay);
    
    breakdown.totalScore = grid +
        breakdown.pitStopPenalty +
        breakdown.tireEffects.reduce((sum, curr) => sum + curr.effect, 0) +
        breakdown.weatherEffect +
        breakdown.trackEffect +
        breakdown.timeOfDayEffect;
    
    // Calculate the predicted finishing position from the total score.
    let predictedPosition = Math.round(breakdown.totalScore);
    let top10 = predictedPosition <= 10;
    
    return { predictedPosition, top10, breakdown };
}

module.exports = {
    simulateTireEffect,
    simulatePitStopPenalty,
    simulateWeatherEffect,
    simulateTrackEffect,
    simulateTimeOfDayEffect,
    calculateStrategyScore,
    simulateRaceOutcome
};