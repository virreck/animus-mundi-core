// src/ui/components/ToastStack.tsx
// Transient notification toasts.
import { useSession } from '../session/SessionContext';
import { theme } from '../theme';

export function ToastStack() {
  const {
    toasts
  } = useSession();

  return (
    <div style={{ position: 'fixed', top: 'calc(var(--header-h, 46px) + 6px)', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 1000, pointerEvents: 'none' }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            animation: 'slideDownTop 0.22s ease-out forwards',
            backgroundColor: 'rgba(9, 13, 10, 0.96)',
            color: theme.textBright,
            border: `1px solid ${theme.borderTerminal}`,
            borderLeft: `4px solid ${toast.type === 'INTEL' ? theme.textBright : toast.type === 'ITEM' ? theme.accentAmber : theme.accentRed}`,
            padding: '8px 16px',
            fontFamily: theme.fontMono,
            fontSize: '0.76rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.9)',
            maxWidth: '420px',
            textAlign: 'center'
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
