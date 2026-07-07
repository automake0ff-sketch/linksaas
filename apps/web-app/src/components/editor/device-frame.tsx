import clsx from 'clsx';
import type { DeviceMode } from '@/store/editor-store';

const FRAME_WIDTH: Record<DeviceMode, string> = {
  mobile: '360px',
  tablet: '600px',
  desktop: '100%',
};

/**
 * El marco flotante de dispositivo es el elemento de firma del editor (ver
 * docs/07-Diseno-UI.md): no es un simple cambio de ancho de contenedor, se
 * dibuja como un dispositivo real con marco y muesca superior en móvil/tablet,
 * para que el cambio de vista se sienta como "sostener el teléfono", no como
 * redimensionar una ventana.
 */
export function DeviceFrame({ device, children }: { device: DeviceMode; children: React.ReactNode }) {
  const isFramed = device !== 'desktop';

  return (
    <div className="flex flex-1 items-start justify-center overflow-auto bg-surface-2 p-8">
      <div
        className={clsx(
          'transition-all duration-300',
          isFramed && 'rounded-[2rem] border-8 border-text-primary/10 bg-surface p-1 shadow-xl',
        )}
        style={{ width: FRAME_WIDTH[device], maxWidth: '100%' }}
      >
        {isFramed && (
          <div className="mx-auto mb-1 h-1.5 w-16 rounded-full bg-text-primary/10" aria-hidden />
        )}
        <div
          className={clsx(
            'min-h-[500px] overflow-y-auto bg-surface',
            isFramed ? 'rounded-[1.5rem] border border-border' : 'rounded-xl border border-border',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
