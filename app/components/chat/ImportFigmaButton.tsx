import React, { useState } from 'react';

// import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { ImportFigmaDialog } from './ImportFigmaDialog';

interface ImportFigmaButtonProps {
  className?: string;
  handleSendMessage?: (event: React.UIEvent, messageInput?: string) => void;
}

type FigmaGenerateResponse = {
  message: string;
  status: string;
  processId: string;
  code: number;
};

type FigmaScreenCode = {
  code: string;
  fileName: string;
  type: string;
  screenName: string;
};

type FigmaScreen = {
  screenName: string;
  codes: FigmaScreenCode[];
};

const getFormattedMessage = (allCodes: FigmaScreenCode[]): string => {
  const codeBlocks = allCodes
    .map((code) => `### ${code.fileName}\n\`\`\`${code.type}\n${code.code}\n\`\`\``)
    .join('\n\n');

  return [
    'You are a UI converter. Take this JSX/TSX file and recreate the exact same UI into a new Vite-based React application.',
    'Keep all layout structure, paddings, spacing, colors (including hex values), font sizes, weights, and all text content *exactly* as in the original.',
    '',
    'Ensure:',
    '- No visual differences',
    '- Use original image',
    '- Keep exact button variants and styles',
    '- Optimize the code to enhance performance and maintainability',
    '- Ensure responsive design is supported',
    '',
    'Here’s the original TSX file:',
    '',
    codeBlocks,
  ].join('\n');
};

export const ImportFigmaButton: React.FC<ImportFigmaButtonProps> = ({ className, handleSendMessage }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState('');

  const handleFigmaImport = async () => {
    setIsLoading(true);

    try {
      if (!figmaUrl) {
        toast.error('Please enter a Figma URL');
        return;
      }

      const response = await fetch('https://generator.digitaltelkom.id/api/react/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: figmaUrl,
          legionVersion: '3.0.2',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start Figma import');
      }

      const data: FigmaGenerateResponse = await response.json();
      const processId = data.processId;

      if (!processId) {
        throw new Error('No processId returned from API');
      }

      await listenForGeneratorSSE(processId);

      setIsDialogOpen(false);
      setFigmaUrl('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to import from Figma');
    } finally {
      setIsLoading(false);
    }
  };

  const listenForGeneratorSSE = (processId: string) => {
    return new Promise<void>((resolve, reject) => {
      const eventSource = new EventSource(`https://generator.digitaltelkom.id/api-sse?id=${processId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.status === 'SUCCESS') {
            const screens: FigmaScreen[] = data.result?.screens ?? [];
            const allCodes: FigmaScreenCode[] = screens.flatMap((screen: FigmaScreen) =>
              (screen.codes ?? []).map((codeObj) => ({
                screenName: screen.screenName,
                fileName: codeObj.fileName,
                code: codeObj.code,
                type: codeObj.type,
              })),
            );

            if (handleSendMessage) {
              const formattedMessage = getFormattedMessage(allCodes);
              handleSendMessage(undefined as unknown as React.UIEvent, formattedMessage);
            }

            if (allCodes.length > 0) {
              toast.success(`Figma import successful! First file: ${allCodes[0].fileName}`);
            } else {
              toast.success('Figma import successful, but no code found.');
            }

            eventSource.close();
            resolve();
          } else if (data.status === 'FAILURE') {
            toast.error('Figma import failed.');
            eventSource.close();
            reject(new Error('Figma import failed'));
          }
        } catch (err) {
          eventSource.close();
          reject(err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        reject(new Error('Error receiving status updates'));
      };
    });
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        title="Import Figma"
        variant="default"
        size="lg"
        className={classNames(
          'gap-2 bg-bolt-elements-background-depth-1',
          'text-bolt-elements-textPrimary',
          'hover:bg-bolt-elements-background-depth-2',
          'border border-bolt-elements-borderColor',
          'h-10 px-4 py-2 min-w-[120px] justify-center',
          'transition-all duration-200 ease-in-out',
          className,
        )}
        disabled={isLoading}
      >
        <span className="i-ph:figma-logo w-4 h-4" />
        {isLoading ? 'Importing...' : 'Import Figma'}
      </Button>

      <ImportFigmaDialog
        open={isDialogOpen}
        isLoading={isLoading}
        figmaUrl={figmaUrl}
        onUrlChange={setFigmaUrl}
        onClose={() => setIsDialogOpen(false)}
        onImport={handleFigmaImport}
      />
    </>
  );
};
