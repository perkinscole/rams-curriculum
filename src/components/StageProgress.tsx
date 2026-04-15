interface StageProgressProps {
  stage1: boolean;
  stage2: boolean;
  stage3: boolean;
  size?: 'sm' | 'md';
}

const stageLabels = ['Stage 1: Desired Results', 'Stage 2: Evidence', 'Stage 3: Learning Plan'];

export default function StageProgress({ stage1, stage2, stage3, size = 'md' }: StageProgressProps) {
  const stages = [stage1, stage2, stage3];
  const completed = stages.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {stages.map((done, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className={`${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${done ? 'bg-green-500' : 'bg-gray-300'}`}
              title={stageLabels[i]}
            />
            {size === 'md' && (
              <span className={`text-xs ${done ? 'text-green-700' : 'text-gray-400'}`}>
                S{i + 1}
              </span>
            )}
          </div>
        ))}
      </div>
      {size === 'md' && (
        <span className="text-xs text-gray-500">{completed}/3 stages complete</span>
      )}
    </div>
  );
}
