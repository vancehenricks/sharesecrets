/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ShareResult from '../ShareResult';

beforeEach(() => {
  (navigator as any).clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

const COMBINED_URL = 'https://example.com/share/1#k=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

it('displays combined link and copies it', async () => {
  const data = {
    combinedUrl: COMBINED_URL,
    expiresAt: Date.now() + 5000,
  };

  render(<ShareResult data={data} onCreateNew={jest.fn()} />);

  expect(screen.getByDisplayValue(COMBINED_URL)).toBeInTheDocument();

  const copyBtn = screen.getByRole('button', { name: /copy link/i });
  await act(async () => { fireEvent.click(copyBtn); });

  expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith(COMBINED_URL);
  expect(copyBtn).toHaveTextContent(/copied/i);

  act(() => { jest.advanceTimersByTime(2000); });
  expect(screen.getByText(/seconds|Expired/)).toBeInTheDocument();
});

it('calls onCreateNew when "Share Another Secret" is clicked', () => {
  const onCreateNew = jest.fn();
  render(<ShareResult data={{ combinedUrl: COMBINED_URL, expiresAt: Date.now() + 300000 }} onCreateNew={onCreateNew} />);

  fireEvent.click(screen.getByRole('button', { name: /share another secret/i }));
  expect(onCreateNew).toHaveBeenCalled();
});

describe('expiry display', () => {
  it('shows "Expired" when expiry time has passed', () => {
    render(<ShareResult data={{ combinedUrl: COMBINED_URL, expiresAt: Date.now() - 1000 }} onCreateNew={jest.fn()} />);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(screen.getByText(/Expired/)).toBeInTheDocument();
  });

  it('counts down expiry seconds', () => {
    render(<ShareResult data={{ combinedUrl: COMBINED_URL, expiresAt: Date.now() + 10000 }} onCreateNew={jest.fn()} />);
    act(() => { jest.advanceTimersByTime(1000); });
    expect(screen.getByText(/seconds/)).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(9000); });
    expect(screen.getByText(/Expired/)).toBeInTheDocument();
  });
});

describe('copy button reset', () => {
  it('copy link label resets back after timeout', async () => {
    render(<ShareResult data={{ combinedUrl: COMBINED_URL, expiresAt: Date.now() + 300000 }} onCreateNew={jest.fn()} />);

    const copyBtn = screen.getByRole('button', { name: /copy link/i });
    await act(async () => { fireEvent.click(copyBtn); });
    expect(copyBtn).toHaveTextContent(/copied/i);

    act(() => { jest.advanceTimersByTime(2001); });
    expect(copyBtn).toHaveTextContent(/copy link/i);
  });
});
