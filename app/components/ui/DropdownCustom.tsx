'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';

// import { ImportButtons } from '../chat/chatExportAndImport/ImportButtons';

import { ImportFolderButton } from '~/components/chat/ImportFolderButton';

interface DropdownMenuProps {
  [key: string]: any;
}

type ChatData = {
  messages?: Message[]; // Standard Bolt format
  description?: string; // Optional description
};

export default function DropdownMenu(props: DropdownMenuProps) {
  const { handleFileUpload, importChat } = props;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative mr-[5px]" ref={dropdownRef}>
      {/* Dropdown trigger button positioned inside textarea */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className=" w-8 h-8 bg-white hover:bg-gray-50 text-gray-600 rounded-full flex items-center justify-center border border-gray-300 shadow-sm transition-colors duration-200 z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      <input
        type="file"
        id="chat-import"
        className="hidden"
        accept=".json"
        onChange={async (e) => {
          const file = e.target.files?.[0];

          if (file && importChat) {
            try {
              const reader = new FileReader();

              reader.onload = async (e) => {
                try {
                  const content = e.target?.result as string;
                  const data = JSON.parse(content) as ChatData;

                  // Standard format
                  if (Array.isArray(data.messages)) {
                    await importChat(data.description || 'Imported Chat', data.messages);
                    toast.success('Chat imported successfully');

                    return;
                  }

                  toast.error('Invalid chat file format');
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    toast.error('Failed to parse chat file: ' + error.message);
                  } else {
                    toast.error('Failed to parse chat file');
                  }
                }
              };
              reader.onerror = () => toast.error('Failed to read chat file');
              reader.readAsText(file);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Failed to import chat');
            }
            e.target.value = ''; // Reset file input
          } else {
            toast.error('Something went wrong');
          }
        }}
      />

      {/* Dropdown menu positioned to extend outside textarea */}
      {isOpen && (
        <div className="absolute bottom-10 left-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
          <div
            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
            onClick={() => handleFileUpload()}
          >
            <div className="text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-gray-700 text-sm">Upload Image</span>
          </div>

          <div
            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
            onClick={() => {
              const input = document.getElementById('chat-import');
              input?.click();
            }}
          >
            <div className="text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span className="text-gray-700 text-sm">Import Chat History</span>
          </div>

          <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3">
            <div className="text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            {/* <span className="text-gray-700 text-sm">Import Folder</span> */}
            <ImportFolderButton
              importChat={importChat}
              className={classNames(
                'gap-2 bg-bolt-elements-background-depth-1',
                'text-bolt-elements-textPrimary',
                'hover:bg-bolt-elements-background-depth-2',
                'border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]',
                'h-10 px-4 py-2 min-w-[120px] justify-center',
                'transition-all duration-200 ease-in-out rounded-lg',
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
