/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import ViewPage from '../ViewPage';
import * as encryptionUtils from '../../utils/encryption';

global.fetch = jest.fn();
jest.mock('../../utils/encryption');

const FAKE_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const mockEncryptedContent = 'mockEncryptedData123';

beforeEach(() => {
  jest.clearAllMocks();
  window.location.hash = '';
});

afterEach(() => {
  window.location.hash = '';
});

describe('ViewPage', () => {
  describe('loading and fetching', () => {
    it('shows loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
      render(<ViewPage secretId="test-id" />);
      expect(screen.getByText(/loading secret/i)).toBeInTheDocument();
    });

    it('fetches secret on mount', async () => {
      window.location.hash = `#k=${FAKE_KEY}`;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ encryptedContent: mockEncryptedContent }),
      });
      (encryptionUtils.decryptSecret as jest.Mock).mockResolvedValueOnce('secret');
      (encryptionUtils.isFilePayload as jest.Mock).mockReturnValueOnce(false);

      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/secrets/test-id');
      });
    });

    it('shows error when secret is not found (404)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 404, ok: false });

      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText(/secret not found or has expired/i)).toBeInTheDocument();
      });
    });

    it('shows error for failed API calls', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 500, ok: false });

      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText(/failed to retrieve secret/i)).toBeInTheDocument();
      });
    });

    it('shows error for network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('shows error when no key in URL fragment', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ encryptedContent: mockEncryptedContent }),
      });

      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText(/no decryption key in url/i)).toBeInTheDocument();
      });
    });
  });

  describe('auto-decryption from URL fragment', () => {
    it('auto-decrypts when key is present in fragment', async () => {
      window.location.hash = `#k=${FAKE_KEY}`;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ encryptedContent: mockEncryptedContent }),
      });
      (encryptionUtils.decryptSecret as jest.Mock).mockResolvedValueOnce('auto secret');
      (encryptionUtils.isFilePayload as jest.Mock).mockReturnValueOnce(false);

      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(encryptionUtils.decryptSecret).toHaveBeenCalledWith(mockEncryptedContent, FAKE_KEY);
      });

      await waitFor(() => {
        expect(screen.getByText(/has been viewed and can no longer be accessed/i)).toBeInTheDocument();
      });
    });

    it('shows error when decryption fails', async () => {
      window.location.hash = `#k=${FAKE_KEY}`;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ encryptedContent: mockEncryptedContent }),
      });
      (encryptionUtils.decryptSecret as jest.Mock).mockRejectedValueOnce(new Error('Decryption failed'));

      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText(/decryption failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('text secret display', () => {
    beforeEach(() => {
      window.location.hash = `#k=${FAKE_KEY}`;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ encryptedContent: mockEncryptedContent }),
      });
      (encryptionUtils.decryptSecret as jest.Mock).mockResolvedValueOnce('test secret');
      (encryptionUtils.isFilePayload as jest.Mock).mockReturnValueOnce(false);
    });

    it('shows Show/Hide toggle after decryption', async () => {
      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/has been viewed and can no longer be accessed/i)).toBeInTheDocument();
    });

    it('shows/hides secret text when toggling visibility', async () => {
      const { fireEvent: fe } = await import('@testing-library/react');
      render(<ViewPage secretId="test-id" />);

      const toggleBtn = await screen.findByRole('button', { name: /show/i });
      fe.click(toggleBtn);
      expect(toggleBtn).toHaveTextContent(/hide/i);
      fe.click(toggleBtn);
      expect(toggleBtn).toHaveTextContent(/show/i);
    });

    it('copies secret to clipboard', async () => {
      (navigator as any).clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
      const { fireEvent: fe } = await import('@testing-library/react');

      render(<ViewPage secretId="test-id" />);

      const copyBtn = await screen.findByRole('button', { name: /copy/i });
      fe.click(copyBtn);

      expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith('test secret');
    });
  });

  describe('file secret handling', () => {
    const filePayload = {
      type: 'file',
      name: 'test.txt',
      mimeType: 'text/plain',
      data: btoa('file content'),
    };

    beforeEach(() => {
      window.location.hash = `#k=${FAKE_KEY}`;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ encryptedContent: mockEncryptedContent }),
      });
      (encryptionUtils.decryptSecret as jest.Mock).mockResolvedValueOnce(JSON.stringify(filePayload));
      (encryptionUtils.isFilePayload as jest.Mock).mockReturnValueOnce(true);
      (encryptionUtils.parseFilePayload as jest.Mock).mockReturnValueOnce(filePayload);
    });

    it('displays file payload instead of text', async () => {
      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText(/test.txt/)).toBeInTheDocument();
        expect(screen.getByText(/text\/plain/)).toBeInTheDocument();
      });
    });

    it('shows download button for files', async () => {
      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download file/i })).toBeInTheDocument();
      });
    });

    it('downloads file when download button is clicked', async () => {
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      const { fireEvent: fe } = await import('@testing-library/react');

      render(<ViewPage secretId="test-id" />);

      const downloadBtn = await screen.findByRole('button', { name: /download file/i });
      fe.click(downloadBtn);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('shows "Create a New Secret" link on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 404, ok: false });

      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /create a new secret/i })).toBeInTheDocument();
      });
    });

    it('shows "Share Another Secret" link after success', async () => {
      window.location.hash = `#k=${FAKE_KEY}`;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ encryptedContent: mockEncryptedContent }),
      });
      (encryptionUtils.decryptSecret as jest.Mock).mockResolvedValueOnce('test secret');
      (encryptionUtils.isFilePayload as jest.Mock).mockReturnValueOnce(false);

      render(<ViewPage secretId="test-id" />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /share another secret/i })).toBeInTheDocument();
      });
    });
  });
});
