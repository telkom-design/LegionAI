import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { APIKeyManager } from './APIKeyManager';
import type { ProviderInfo } from '~/types/model';
import Cookies from 'js-cookie';

// Mock js-cookie with in-mock store and spy-able methods
vi.mock('js-cookie', () => {
  const store: Record<string, string> = {};
  return {
    default: {
      get: vi.fn((k: string) => store[k]),
      set: vi.fn((k: string, v: string) => {
        store[k] = v;
      }),
      remove: vi.fn((k: string) => {
        delete store[k];
      }),
    },
  };
});

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ isSet: false }) });
});

/**
 * APIKeyManager unit tests focused on API key input behavior.
 * Uses provider "Midas" example and validates save + cookie persistence.
 */

describe('APIKeyManager - API key input', () => {
  const midasProvider: ProviderInfo = { name: 'Midas', staticModels: [] };

  it('renders provider label and edit/save flow sets API key and persists in cookies', async () => {
    const setApiKey = vi.fn();

    render(<APIKeyManager provider={midasProvider} apiKey="" setApiKey={setApiKey} />);

    await waitFor(() => expect(screen.getByText(/Midas API Key:/i)).toBeInTheDocument());

    const editBtn = screen.getByTitle('Edit API Key');
    fireEvent.click(editBtn);

    const input = screen.getByPlaceholderText('Enter API Key');
    fireEvent.change(input, { target: { value: 'secret-key-123' } });

    const saveBtn = screen.getByTitle('Save API Key');
    fireEvent.click(saveBtn);

    await waitFor(() => expect(setApiKey).toHaveBeenCalledWith('secret-key-123'));

    expect((Cookies as any).set).toHaveBeenCalled();
    const setCalls = (Cookies as any).set.mock.calls;
    const lastSet = setCalls[setCalls.length - 1];
    expect(lastSet[0]).toBe('apiKeys');
    const payload = JSON.parse(lastSet[1]);
    expect(payload['Midas']).toBe('secret-key-123');
  });

  it('loads saved key from cookies on mount and calls setApiKey with it', async () => {
    const setApiKey = vi.fn();

    (Cookies as any).set('apiKeys', JSON.stringify({ Midas: 'pre-saved-key' }));

    render(<APIKeyManager provider={midasProvider} apiKey="" setApiKey={setApiKey} />);

    await waitFor(() => expect(setApiKey).toHaveBeenCalledWith('pre-saved-key'));
  });
});
