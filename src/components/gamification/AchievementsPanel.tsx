import { Lock, Trophy } from 'lucide-react';
import { useGamificationStore } from '../../stores/gamificationStore';

export default function AchievementsPanel() {
  const { state, achievementsDef } = useGamificationStore();
  const unlocked = state.achievements;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" /> Logros
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {achievementsDef.map((def) => {
          const achievement = unlocked.find((a) => a.id === def.id);
          const isUnlocked = !!achievement;

          return (
            <div
              key={def.id}
              className={`glass-card relative flex flex-col items-center text-center p-5 transition-all ${
                isUnlocked
                  ? 'ring-1 ring-yellow-400/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]'
                  : 'grayscale opacity-60'
              }`}
            >
              {/* Lock overlay for locked */}
              {!isUnlocked && (
                <div className="absolute top-2.5 right-2.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
              )}

              <span className="text-4xl mb-2">{def.icon}</span>
              <p className="text-white text-sm font-semibold">{def.label}</p>
              <p className="text-slate-400 text-xs mt-1">{def.desc}</p>

              {isUnlocked && achievement.unlockedAt && (
                <p className="text-yellow-400/70 text-[10px] mt-2">
                  {(typeof achievement.unlockedAt.toDate === 'function'
                    ? achievement.unlockedAt.toDate()
                    : new Date((achievement.unlockedAt as unknown as { seconds: number }).seconds * 1000)
                  ).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
