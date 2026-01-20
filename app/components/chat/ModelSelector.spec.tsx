import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ModelSelector } from './ModelSelector';
import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/lib/modules/llm/types';

/**
 * ModelSelector unit tests
 *
 * Focused on:
 * - Provider selection (click and keyboard)
 * - Model selection (click)
 * - Search filtering for providers and models
 * - Loading state rendering
 * - Fallback behavior when current provider is invalid
 *
 */

beforeAll(() => {
  if (typeof (HTMLElement.prototype as any).scrollIntoView !== 'function') {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });
  } else {
    (HTMLElement.prototype as any).scrollIntoView = vi.fn();
  }
});

describe('ModelSelector - Provider and Model selection', () => {
  const midas: ProviderInfo = { name: 'Midas', staticModels: [] };
  const openAILike: ProviderInfo = { name: 'OpenAILike', staticModels: [] };

  const providers: ProviderInfo[] = [midas, openAILike];

  const models: ModelInfo[] = [
    { name: 'sonnet-4', label: 'sonnet-4', provider: 'Midas', maxTokenAllowed: 8000 },
    { name: 'or-free-1', label: 'Cool OR Free in:$0.00 out:$0.00', provider: 'OpenAILike', maxTokenAllowed: 8000 },
    { name: 'or-paid-1', label: 'Cool OR Paid in:$0.03 out:$0.05', provider: 'OpenAILike', maxTokenAllowed: 8000 },
  ];

  it('renders guidance when no providers are enabled', () => {
    render(
      <ModelSelector
        model={undefined}
        setModel={vi.fn()}
        provider={midas}
        setProvider={vi.fn()}
        modelList={models}
        providerList={[]}
        apiKeys={{}}
      />,
    );

    expect(
      screen.getByText(/No providers are currently enabled\. Please enable at least one provider in the settings to start using the chat\./i),
    ).toBeInTheDocument();
  });

  it('selects provider via click and sets first model of that provider', async () => {
    const setProvider = vi.fn();
    const setModel = vi.fn();

    render(
      <ModelSelector
        model={undefined}
        setModel={setModel}
        provider={midas}
        setProvider={setProvider}
        modelList={models}
        providerList={providers}
        apiKeys={{}}
      />,
    );

    // Open provider dropdown (first combobox)
    const providerCombobox = screen.getAllByRole('combobox')[0];
    fireEvent.click(providerCombobox);

    // Click OpenAILike option
    const openAILikeOption = await screen.findByText('OpenAILike');
    fireEvent.click(openAILikeOption);

    await waitFor(() => {
      expect(setProvider).toHaveBeenCalledWith(openAILike);
      // First model for OpenAILike is or-free-1
      expect(setModel).toHaveBeenCalledWith('or-free-1');
    });
  });

  it('navigates provider list via keyboard and selects with Enter', async () => {
    const setProvider = vi.fn();
    const setModel = vi.fn();

    render(
      <ModelSelector
        model={undefined}
        setModel={setModel}
        provider={midas}
        setProvider={setProvider}
        modelList={models}
        providerList={providers}
        apiKeys={{}}
      />,
    );

    // Open provider dropdown
    const providerCombobox = screen.getAllByRole('combobox')[0];
    fireEvent.click(providerCombobox);

    // Keydown events handled on the wrapper (div with onKeyDown)
    const providerWrapper = providerCombobox.parentElement as HTMLElement;
    fireEvent.keyDown(providerWrapper, { key: 'ArrowDown' }); // focus Midas (index 0)
    fireEvent.keyDown(providerWrapper, { key: 'ArrowDown' }); // focus OpenAILike (index 1)
    fireEvent.keyDown(providerWrapper, { key: 'Enter' });

    await waitFor(() => {
      expect(setProvider).toHaveBeenCalledWith(openAILike);
      expect(setModel).toHaveBeenCalledWith('or-free-1');
    });
  });

  it('filters providers using search input and allows selecting the filtered option', async () => {
    const setProvider = vi.fn();
    const setModel = vi.fn();

    render(
      <ModelSelector
        model={undefined}
        setModel={setModel}
        provider={midas}
        setProvider={setProvider}
        modelList={models}
        providerList={providers}
        apiKeys={{}}
      />,
    );

    // Open provider dropdown
    const providerCombobox = screen.getAllByRole('combobox')[0];
    fireEvent.click(providerCombobox);

    // Type into provider search to filter
    const providerSearch = await screen.findByPlaceholderText('Search providers...');
    fireEvent.change(providerSearch, { target: { value: 'openai' } });

    // In the provider listbox, Midas should not be present; only OpenAILike should be listed
    const providerListbox = screen.getByRole('listbox');
    expect(within(providerListbox).queryByText('Midas')).not.toBeInTheDocument();
    const openAILikeOption = within(providerListbox).getByText('OpenAILike');
    fireEvent.click(openAILikeOption);

    await waitFor(() => {
      expect(setProvider).toHaveBeenCalledWith(openAILike);
      expect(setModel).toHaveBeenCalledWith('or-free-1');
    });
  });

  it('selects model via click and closes model dropdown', async () => {
    const setModel = vi.fn();

    render(
      <ModelSelector
        model={undefined}
        setModel={setModel}
        provider={openAILike}
        setProvider={vi.fn()}
        modelList={models}
        providerList={providers}
        apiKeys={{}}
      />,
    );

    // Open model dropdown (second combobox)
    const modelCombobox = screen.getAllByRole('combobox')[1];
    fireEvent.click(modelCombobox);

    // Filter to paid model via search
    const modelSearch = await screen.findByPlaceholderText('Search models...');
    fireEvent.change(modelSearch, { target: { value: 'paid' } });

    // Click the paid model option
    const paidOption = await screen.findByText(/Cool OR Paid/i);
    fireEvent.click(paidOption);

    await waitFor(() => expect(setModel).toHaveBeenCalledWith('or-paid-1'));

    // Dropdown should close (search input should disappear)
    expect(screen.queryByPlaceholderText('Search models...')).not.toBeInTheDocument();
  });

  it('shows Loading... when modelLoading is active for current provider', async () => {
    render(
      <ModelSelector
        model={undefined}
        setModel={vi.fn()}
        provider={openAILike}
        setProvider={vi.fn()}
        modelList={models}
        providerList={providers}
        apiKeys={{}}
        modelLoading={'OpenAILike'}
      />,
    );

    const modelCombobox = screen.getAllByRole('combobox')[1];
    fireEvent.click(modelCombobox);

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
  });

  it('falls back to first enabled provider and sets its first model when current provider is invalid', async () => {
    const invalidProvider: ProviderInfo = { name: 'Unknown', staticModels: [] };
    const setProvider = vi.fn();
    const setModel = vi.fn();

    render(
      <ModelSelector
        model={undefined}
        setModel={setModel}
        provider={invalidProvider}
        setProvider={setProvider}
        modelList={models}
        providerList={providers}
        apiKeys={{}}
      />,
    );

    await waitFor(() => {
      // First enabled provider is Midas; first model is sonnet-4
      expect(setProvider).toHaveBeenCalledWith(midas);
      expect(setModel).toHaveBeenCalledWith('sonnet-4');
    });
  });

  it('filters models using search input', async () => {
    render(
      <ModelSelector
        model={undefined}
        setModel={vi.fn()}
        provider={openAILike}
        setProvider={vi.fn()}
        modelList={models}
        providerList={providers}
        apiKeys={{}}
      />,
    );

    const modelCombobox = screen.getAllByRole('combobox')[1];
    fireEvent.click(modelCombobox);

    const modelSearch = await screen.findByPlaceholderText('Search models...');
    fireEvent.change(modelSearch, { target: { value: 'free' } });

    // Only the free model should be visible after search
    expect(screen.getByText(/Cool OR Free/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cool OR Paid/i)).not.toBeInTheDocument();
  });
});
