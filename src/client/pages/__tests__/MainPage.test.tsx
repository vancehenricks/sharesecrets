/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainPage from '../MainPage';
import * as encryptionUtils from '../../utils/encryption';

global.fetch = jest.fn();
jest.mock('../../utils/encryption');

const FAKE_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

beforeEach(() => {
  jest.clearAllMocks();
  (encryptionUtils.generateKey as jest.Mock).mockReturnValue(FAKE_KEY);
  (encryptionUtils.encryptSecret as jest.Mock).mockResolvedValue('encrypted-text');
  (encryptionUtils.encryptFile as jest.Mock).mockResolvedValue('encrypted-file');
});

describe('MainPage', () => {
  describe('text secret submission', () => {
    it('submits text secret and displays combined link', async () => {
      const mockResponse = {
        id: 'secret-123',
        shareUrl: 'https://example.com/share/secret-123',
        expiresAt: Date.now() + 300000,
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<MainPage />);

      const textarea = screen.getByPlaceholderText(/enter your secret/i);
      fireEvent.change(textarea, { target: { value: 'test secret' } });

      const submitBtn = screen.getByRole('button', { name: /generate share link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByDisplayValue(`${mockResponse.shareUrl}#k=${FAKE_KEY}`)).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/secrets',
        expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } })
      );
    });

    it('shows error alert when text is empty', () => {
      jest.spyOn(window, 'alert').mockImplementation();
      render(<MainPage />);

      const submitBtn = screen.getByRole('button', { name: /generate share link/i });
      fireEvent.click(submitBtn);

      expect(window.alert).toHaveBeenCalledWith('Please enter a secret');
      (window.alert as jest.Mock).mockRestore();
    });

    it('shows error when API call fails', async () => {
      jest.spyOn(window, 'alert').mockImplementation();
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

      render(<MainPage />);

      const textarea = screen.getByPlaceholderText(/enter your secret/i);
      fireEvent.change(textarea, { target: { value: 'test secret' } });

      const submitBtn = screen.getByRole('button', { name: /generate share link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to create secret. Please try again.');
      });

      (window.alert as jest.Mock).mockRestore();
    });

    it('handles network errors gracefully', async () => {
      jest.spyOn(window, 'alert').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<MainPage />);

      const textarea = screen.getByPlaceholderText(/enter your secret/i);
      fireEvent.change(textarea, { target: { value: 'test secret' } });

      const submitBtn = screen.getByRole('button', { name: /generate share link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to create secret. Please try again.');
      });

      (window.alert as jest.Mock).mockRestore();
    });
  });

  describe('file secret submission', () => {
    it('submits file and displays combined link', async () => {
      const mockResponse = {
        id: 'file-secret-123',
        shareUrl: 'https://example.com/share/file-secret-123',
        expiresAt: Date.now() + 300000,
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { container } = render(<MainPage />);

      const fileModeBtn = screen.getByRole('button', { name: /file/i });
      fireEvent.click(fileModeBtn);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = new File(['test file content'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });

      const submitBtn = screen.getByRole('button', { name: /generate share link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByDisplayValue(`${mockResponse.shareUrl}#k=${FAKE_KEY}`)).toBeInTheDocument();
      });
    });
  });

  describe('form state management', () => {
    it('shows "Generating..." when loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<MainPage />);

      const textarea = screen.getByPlaceholderText(/enter your secret/i);
      fireEvent.change(textarea, { target: { value: 'test secret' } });

      const submitBtn = screen.getByRole('button', { name: /generate share link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitBtn).toHaveTextContent(/Generating/);
      });
    });

    it('disables submit button during loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<MainPage />);

      const textarea = screen.getByPlaceholderText(/enter your secret/i);
      fireEvent.change(textarea, { target: { value: 'test secret' } });

      const submitBtn = screen.getByRole('button', { name: /generate share link/i }) as HTMLButtonElement;
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitBtn).toBeDisabled();
      });
    });
  });

  describe('ShareResult integration', () => {
    it('shows ShareForm initially', () => {
      render(<MainPage />);
      expect(screen.getByPlaceholderText(/enter your secret/i)).toBeInTheDocument();
    });

    it('switches to ShareResult after successful submission', async () => {
      const mockResponse = {
        id: 'secret-123',
        shareUrl: 'https://example.com/share/secret-123',
        expiresAt: Date.now() + 300000,
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<MainPage />);

      const textarea = screen.getByPlaceholderText(/enter your secret/i);
      fireEvent.change(textarea, { target: { value: 'test secret' } });

      const submitBtn = screen.getByRole('button', { name: /generate share link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByDisplayValue(`${mockResponse.shareUrl}#k=${FAKE_KEY}`)).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText(/enter your secret/i)).not.toBeInTheDocument();
    });

    it('returns to ShareForm when "Share Another" is clicked', async () => {
      const mockResponse = {
        id: 'secret-123',
        shareUrl: 'https://example.com/share/secret-123',
        expiresAt: Date.now() + 300000,
        expiresIn: 300,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<MainPage />);

      const textarea = screen.getByPlaceholderText(/enter your secret/i);
      fireEvent.change(textarea, { target: { value: 'test secret' } });

      const submitBtn = screen.getByRole('button', { name: /generate share link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByDisplayValue(`${mockResponse.shareUrl}#k=${FAKE_KEY}`)).toBeInTheDocument();
      });

      const shareAnotherBtn = screen.getByRole('button', { name: /share another secret/i });
      fireEvent.click(shareAnotherBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter your secret/i)).toBeInTheDocument();
      });
    });
  });
});
