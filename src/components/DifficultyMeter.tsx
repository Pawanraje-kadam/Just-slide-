import type { Difficulty } from '../types';

const rank: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };

export function DifficultyMeter({ difficulty }: { difficulty: Difficulty }) {
  const level = rank[difficulty];
  return (
    <span className={`difficulty difficulty--${difficulty.toLowerCase()}`}>
      <span className="difficulty__pips" aria-hidden="true">
        {[1, 2, 3].map((pip) => (
          <span key={pip} className={`difficulty__pip ${pip <= level ? 'is-on' : ''}`} />
        ))}
      </span>
      <span className="difficulty__label">{difficulty}</span>
    </span>
  );
}
