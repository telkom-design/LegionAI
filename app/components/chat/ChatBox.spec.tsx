import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatBox } from './ChatBox';
import type { ProviderInfo } from '~/types/model';

vi.mock('remix-utils/client-only', () => ({
  ClientOnly: ({ children }: { children: any }) => (typeof children === 'function' ? children() : children),
}));

beforeEach(() => {
  (global as any).fetch = vi.fn().mockResolvedValue({ json: async () => ({ isSet: false }) });
});

/**
 * ChatBox unit tests
 * - Image attachments (drag-and-drop, clipboard paste, upload button)
 */

describe('ChatBox - Image attachments', () => {
  const midas: ProviderInfo = { name: 'Midas', staticModels: [] };

  const baseProps = {
    isModelSettingsCollapsed: true,
    setIsModelSettingsCollapsed: vi.fn(),
    provider: midas,
    providerList: [midas],
    modelList: [],
    apiKeys: {},
    isModelLoading: undefined as string | undefined,
    onApiKeysChange: vi.fn() as (providerName: string, apiKey: string) => void,
    uploadedFiles: [] as File[],
    imageDataList: [] as string[],
    textareaRef: { current: null } as React.RefObject<HTMLTextAreaElement>,
    input: '',
    handlePaste: vi.fn(),
    TEXTAREA_MIN_HEIGHT: 100,
    TEXTAREA_MAX_HEIGHT: 200,
    isStreaming: false,
    handleSendMessage: vi.fn(),
    isListening: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
    chatStarted: false,
    exportChat: vi.fn(),
    qrModalOpen: false,
    setQrModalOpen: vi.fn(),
    handleFileUpload: vi.fn(),
    setProvider: vi.fn(),
    model: 'sonnet-4',
    setModel: vi.fn(),
    setUploadedFiles: vi.fn(),
    setImageDataList: vi.fn(),
  };

  it('adds image attachment via drag-and-drop to the textarea', () => {
    const setUploadedFiles = vi.fn();
    const setImageDataList = vi.fn();

    // Mock FileReader to synchronously return a data URL
    const OriginalFileReader: any = (global as any).FileReader;
    class MockFileReader {
      onload: ((e: any) => void) | null = null;
      readAsDataURL(_file: File) {
        this.onload?.({ target: { result: 'data:image/png;base64,FAKE' } });
      }
    }
    (global as any).FileReader = MockFileReader as any;

    render(
      <ChatBox
        {...baseProps}
        setUploadedFiles={setUploadedFiles}
        setImageDataList={setImageDataList}
        uploadedFiles={[]}
        imageDataList={[]}
      />,
    );

    const textarea = screen.getByRole('textbox');
    const file = new File(['dummy'], 'image.png', { type: 'image/png' });

    fireEvent.drop(textarea, {
      dataTransfer: {
        files: [file],
      },
    } as unknown as DragEvent);

    expect(setUploadedFiles).toHaveBeenCalledWith([file]);
    expect(setImageDataList).toHaveBeenCalledWith(['data:image/png;base64,FAKE']);

    // Restore FileReader
    (global as any).FileReader = OriginalFileReader;
  });

  it('adds image attachment via clipboard paste to the textarea', () => {
    const setUploadedFiles = vi.fn();
    const setImageDataList = vi.fn();

    // Mock FileReader to synchronously return a data URL
    const OriginalFileReader: any = (global as any).FileReader;
    class MockFileReader {
      onload: ((e: any) => void) | null = null;
      readAsDataURL(_file: File) {
        this.onload?.({ target: { result: 'data:image/png;base64,FAKE_PASTE' } });
      }
    }
    (global as any).FileReader = MockFileReader as any;

    // Custom handlePaste replicating BaseChat.handlePaste behavior in test scope
    const handlePaste = (e: any) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault?.();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev: any) => {
              const base64Image = ev.target?.result as string;
              setUploadedFiles([file]);
              setImageDataList([base64Image]);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    render(
      <ChatBox
        isModelSettingsCollapsed={true}
        setIsModelSettingsCollapsed={vi.fn()}
        provider={midas}
        providerList={[midas]}
        modelList={[]}
        apiKeys={{}}
        isModelLoading={undefined}
        onApiKeysChange={vi.fn()}
        uploadedFiles={[]}
        imageDataList={[]}
        textareaRef={{ current: null }}
        input=""
        handlePaste={handlePaste as any}
        TEXTAREA_MIN_HEIGHT={100}
        TEXTAREA_MAX_HEIGHT={200}
        isStreaming={false}
        handleSendMessage={vi.fn()}
        isListening={false}
        startListening={vi.fn()}
        stopListening={vi.fn()}
        chatStarted={false}
        exportChat={vi.fn()}
        qrModalOpen={false}
        setQrModalOpen={vi.fn()}
        handleFileUpload={vi.fn()}
        setProvider={vi.fn()}
        model={'sonnet-4'}
        setModel={vi.fn()}
        setUploadedFiles={setUploadedFiles}
        setImageDataList={setImageDataList}
      />,
    );

    const textarea = screen.getByRole('textbox');
    const file = new File(['dummy'], 'pasted.png', { type: 'image/png' });

    // Fire paste event with clipboardData items containing an image
    fireEvent.paste(textarea, {
      clipboardData: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => file,
          },
        ],
      },
    } as unknown as ClipboardEvent);

    expect(setUploadedFiles).toHaveBeenCalledWith([file]);
    expect(setImageDataList).toHaveBeenCalledWith(['data:image/png;base64,FAKE_PASTE']);

    // Restore FileReader
    (global as any).FileReader = OriginalFileReader;
  });

  it('adds image attachment via upload file button by invoking handleFileUpload', () => {
    const handleFileUpload = vi.fn();

    render(<ChatBox {...baseProps} handleFileUpload={handleFileUpload} />);

    const uploadBtn = screen.getByTitle('Upload file');
    fireEvent.click(uploadBtn);

    expect(handleFileUpload).toHaveBeenCalledTimes(1);
  });
});
