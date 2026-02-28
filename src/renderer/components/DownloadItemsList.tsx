import { DownloadItem } from '../types/download';

interface DownloadItemsListProps {
  items: DownloadItem[];
  playlistName?: string;
}

function DownloadItemsList({ items, playlistName }: DownloadItemsListProps) {
  if (items.length === 0) return null;

  const getStatusIcon = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'downloading': return '⬇️';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusText = (status: DownloadItem['status']) => {
    switch (status) {
      case 'pending': return 'Waiting...';
      case 'downloading': return 'Downloading';
      case 'processing': return 'Converting';
      case 'completed': return 'Complete';
      case 'error': return 'Failed';
    }
  };

  return (
    <div className="download-items">
      {playlistName && (
        <div className="playlist-header">
          <h3>📋 {playlistName}</h3>
          <span className="item-count">{items.length} items</span>
        </div>
      )}
      
      <div className="items-list">
        {items.map((item, index) => (
          <div key={item.id} className={`download-item ${item.status}`}>
            <div className="item-header">
              <span className="item-icon">{getStatusIcon(item.status)}</span>
              <span className="item-title">{item.title}</span>
              <span className="item-status">{getStatusText(item.status)}</span>
            </div>
            
            {(item.status === 'downloading' || item.status === 'processing') && (
              <div className="item-progress-bar">
                <div 
                  className="item-progress-fill" 
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}
            
            {item.error && (
              <div className="item-error">
                {item.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DownloadItemsList;
