/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ShareForm from '../ShareForm';

it('renders and toggles show/hide and submits', () => {
  const onShare = jest.fn();
  render(<ShareForm onShare={onShare} loading={false} />);

  const textarea = screen.getByPlaceholderText(/enter your secret/i) as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value: 'my secret' } });

  // masked overlay should show bullet characters
  expect(screen.getByText(/•/)).toBeInTheDocument();

  const showBtn = screen.getByRole('button', { name: /show/i });
  fireEvent.click(showBtn);
  expect(showBtn).toHaveTextContent(/hide/i);

  const genBtn = screen.getByRole('button', { name: /generate share link/i });
  fireEvent.click(genBtn);

  expect(onShare).toHaveBeenCalledWith({ kind: 'text', content: 'my secret' });
  expect(textarea).toHaveValue('');
});

it('allows file upload, enforces size limit, and submits file', () => {
  const onShare = jest.fn();
  const { container } = render(<ShareForm onShare={onShare} loading={false} />);

  // Switch to file mode
  const fileModeBtn = screen.getByRole('button', { name: /file/i });
  fireEvent.click(fileModeBtn);

  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  expect(fileInput).toBeTruthy();

  // Create an oversized file (~2MB)
  const bigBuffer = new ArrayBuffer(2 * 1024 * 1024);
  const bigFile = new File([bigBuffer], 'big.dat', { type: 'application/octet-stream' });

  fireEvent.change(fileInput, { target: { files: [bigFile] } });

  // Should show file size error
  expect(screen.getByText(/file is too large/i)).toBeInTheDocument();

  // Now create a small file and submit
  const smallFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });
  fireEvent.change(fileInput, { target: { files: [smallFile] } });

  // Selected file name should be displayed
  expect(screen.getByText(/hello.txt/i)).toBeInTheDocument();

  const genBtn = screen.getByRole('button', { name: /generate share link/i });
  fireEvent.click(genBtn);

  expect(onShare).toHaveBeenCalledWith({ kind: 'file', file: smallFile });
});