// Spaced Repetition System - SM-2 Algorithm
export function calculateSRS(quality, prevInterval, prevRepetition, prevEFactor) {
  let nextInterval;
  let nextRepetition;
  let nextEFactor;

  if (quality >= 3) {
    if (prevRepetition === 0) nextInterval = 1;
    else if (prevRepetition === 1) nextInterval = 6;
    else nextInterval = Math.round(prevInterval * prevEFactor);
    nextRepetition = prevRepetition + 1;
  } else {
    nextInterval = 1;
    nextRepetition = 0;
  }

  nextEFactor =
    prevEFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (nextEFactor < 1.3) nextEFactor = 1.3;

  return {
    interval: nextInterval,
    repetition: nextRepetition,
    efactor: nextEFactor,
  };
}
