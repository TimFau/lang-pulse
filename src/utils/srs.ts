export interface Sm2Input {
  interval: number; // current interval in days
  easeFactor: number; // current ease factor
  repetition: number; // current repetition count
  rating: 0 | 1 | 2 | 3 | 4 | 5; // quality rating, we will use 0,3,5 for Hard/Okay/Easy
}

export interface Sm2Result {
  interval: number; // new interval in days
  easeFactor: number;
  repetition: number;
  dueDate: string; // ISO date string for next review
}

/**
 * Applies the SM-2 algorithm to compute new spaced-repetition scheduling values.
 *
 * Docs: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */
export function applySm2({ interval, easeFactor, repetition, rating }: Sm2Input): Sm2Result {
  // Provide sensible defaults when values are undefined / 0.
  let EF = easeFactor || 2.5;
  let rep = repetition || 0;
  let I = interval || 1;

  // Update ease factor – regardless of success.
  // Formula: EF':= EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  EF = EF + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  if (EF < 1.3) EF = 1.3; // minimal EF

  if (rating < 3) {
    // Failed recall – reset repetition
    rep = 0;
    I = 1;
  } else {
    rep += 1;
    if (rep === 1) {
      I = 1;
    } else if (rep === 2) {
      I = 6;
    } else {
      I = Math.round(I * EF);
    }
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + I);

  return {
    interval: I,
    easeFactor: parseFloat(EF.toFixed(2)),
    repetition: rep,
    dueDate: nextDate.toISOString().split('T')[0], // keep date component only
  };
} 