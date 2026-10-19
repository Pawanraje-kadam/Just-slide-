import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '../lib/clipboard';
import { useToast } from '../providers/ToastProvider';
import { Icon } from './Icons';

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  toastMessage?: string;
  iconSize?: number;
  iconOnly?: boolean;
}

export function CopyButton({
  text,
  label = 'Copy topic',
  copiedLabel = 'Copied!',
  className = 'btn btn--soft btn--sm',
  toastMessage = 'Topic copied to your clipboard.',
  iconSize = 16,
  iconOnly = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  const { notify } = useToast();

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(text);
    if (!success) {
      notify('Could not access the clipboard. Select and copy the title manually.', 'error');
      return;
    }
    setCopied(true);
    notify(toastMessage, 'success');
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1900);
  }, [text, notify, toastMessage]);

  return (
    <button
      type="button"
      className={`${className} copy-button${iconOnly ? ' copy-button--icon' : ''}`}
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
    >
      <Icon name={copied ? 'check' : 'copy'} size={iconSize} />
      <span className={iconOnly ? 'sr-only' : undefined} aria-live="polite">
        {copied ? copiedLabel : label}
      </span>
    </button>
  );
}
