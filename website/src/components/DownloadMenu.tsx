import { Apple, ChevronDown, Cpu, Download, MonitorDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { type Copy, releaseUrl } from '../content/siteCopy';

type DownloadMenuProps = {
  align?: 'start' | 'end';
  buttonClassName: 'header-cta' | 'primary-button' | 'secondary-button';
  copy: Copy['downloadMenu'];
  label: string;
};

const downloadUrls = {
  appleSilicon: '/api/download?arch=arm64',
  intel: '/api/download?arch=x64',
  windows: '/api/download?platform=windows&arch=x64',
} as const;

export function DownloadMenu({ align = 'start', buttonClassName, copy, label }: DownloadMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div
      className={`download-menu download-menu--${align} download-menu--${buttonClassName}`}
      ref={menuRef}
    >
      <button
        className={buttonClassName}
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen(current => !current)}
      >
        <Download size={buttonClassName === 'header-cta' ? 16 : 18} />
        <span>{label}</span>
        <ChevronDown className="download-menu-chevron" size={15} />
      </button>
      {isOpen && (
        <div className="download-menu-panel" id={menuId} role="menu">
          <div className="download-menu-heading">
            <strong>{copy.title}</strong>
            <span>{copy.description}</span>
          </div>
          <a href={downloadUrls.appleSilicon} role="menuitem" onClick={() => setIsOpen(false)}>
            <Apple size={20} />
            <span>
              <strong>{copy.appleSilicon}</strong>
              <small>{copy.appleSiliconHint}</small>
            </span>
            <Download size={17} />
          </a>
          <a href={downloadUrls.intel} role="menuitem" onClick={() => setIsOpen(false)}>
            <Cpu size={20} />
            <span>
              <strong>{copy.intel}</strong>
              <small>{copy.intelHint}</small>
            </span>
            <Download size={17} />
          </a>
          <a href={downloadUrls.windows} role="menuitem" onClick={() => setIsOpen(false)}>
            <MonitorDown size={20} />
            <span>
              <strong>{copy.windows}</strong>
              <small>{copy.windowsHint}</small>
            </span>
            <Download size={17} />
          </a>
          <a className="download-menu-releases" href={releaseUrl} role="menuitem">
            {copy.allReleases}
          </a>
        </div>
      )}
    </div>
  );
}
