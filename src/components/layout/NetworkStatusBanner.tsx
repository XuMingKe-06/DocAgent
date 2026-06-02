import { useEffect, useState } from 'react';
import { Icon } from '../common/Icon';
import { useNetworkStore } from '../../stores/useNetworkStore';
import { onSystemNetworkChange } from '../../services/event';

export function NetworkStatusBanner() {
  const { status, setStatus } = useNetworkStore();
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    const unlisten = onSystemNetworkChange((payload) => {
      setStatus(payload.status as 'online' | 'offline');

      if (payload.status === 'online' && payload.previousStatus === 'offline') {
        setShowRecovery(true);
        setTimeout(() => setShowRecovery(false), 3000);
      }
    });

    return () => {
      unlisten.then(fn => fn()).catch(() => {});
    };
  }, [setStatus]);

  if (status === 'online' && !showRecovery) {
    return null;
  }

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50
        px-4 py-2 text-sm font-medium text-center
        transition-all duration-300
        ${status === 'offline'
          ? 'bg-amber-500 text-white'
          : 'bg-green-500 text-white'
        }
      `}
    >
      {status === 'offline' ? (
        <div className="flex items-center justify-center gap-2">
          <Icon name="warning" size={16} />
          <span>网络已断开，部分功能可能不可用</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <Icon name="check-circle" size={16} />
          <span>网络已恢复</span>
        </div>
      )}
    </div>
  );
}
