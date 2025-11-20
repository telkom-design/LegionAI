import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '~/components/ui/Button';

interface ImportFigmaDialogProps {
  open: boolean;
  isLoading: boolean;
  figmaUrl: string;
  onUrlChange: (url: string) => void;
  onClose: () => void;
  onImport: () => void;
}

function isValidFigmaUrl(url: string) {
  try {
    const u = new URL(url);
    const isFigma = u.hostname === 'www.figma.com';
    const hasNodeId = u.searchParams.has('node-id');

    return isFigma && hasNodeId;
  } catch {
    return false;
  }
}

export const ImportFigmaDialog: React.FC<ImportFigmaDialogProps> = ({
  open,
  isLoading,
  figmaUrl,
  onUrlChange,
  onClose,
  onImport,
}) => {
  const isUrlValid = isValidFigmaUrl(figmaUrl);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 bg-white rounded shadow-lg max-w-md w-full z-50 border border-bolt-elements-borderColor">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Import Figma Project</Dialog.Title>
            <Dialog.Close
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <span className="i-ph:x block w-5 h-5" aria-hidden="true" />
              <span className="sr-only">Close dialog</span>
            </Dialog.Close>
          </div>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Paste your Figma URL here"
            value={figmaUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            disabled={isLoading}
          />
          {!isUrlValid && figmaUrl && (
            <div className="text-red-500 text-sm mb-2">
              Please enter a valid Figma file URL that includes <code>node-id</code>.
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={onImport} disabled={isLoading || !isUrlValid}>
              {isLoading ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
