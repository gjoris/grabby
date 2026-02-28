interface ProgressLogProps {
  progress: string[];
}

function ProgressLog({ progress }: ProgressLogProps) {
  if (progress.length === 0) return null;

  return (
    <div className="progress">
      <pre>{progress.join('\n')}</pre>
    </div>
  );
}

export default ProgressLog;
