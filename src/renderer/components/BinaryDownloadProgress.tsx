import { BinaryProgress } from '../types';

interface BinaryDownloadProgressProps {
  binaryProgress: Record<string, BinaryProgress>;
}

function BinaryDownloadProgress({ binaryProgress }: BinaryDownloadProgressProps) {
  return (
    <div className="binary-download">
      <h2>Setting up dependencies...</h2>
      <p>Downloading required components (one-time setup)</p>
      {Object.values(binaryProgress).map((item) => (
        <div key={item.binary} className="binary-item">
          <div className="binary-header">
            <span className="binary-name">{item.binary}</span>
            <span className="binary-status">{item.status}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${item.progress}%` }}
            />
          </div>
          <div className="progress-text">{item.progress}%</div>
        </div>
      ))}
    </div>
  );
}

export default BinaryDownloadProgress;
