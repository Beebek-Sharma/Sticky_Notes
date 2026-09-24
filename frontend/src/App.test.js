import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import * as api from './api';

jest.mock('./api');

describe('Sticky Notes Tactile Canvas Application', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders application title, live status, and loaded notes', async () => {
    api.getNotes.mockResolvedValueOnce([
      { id: 1, title: 'Architectural Specs', text: 'First note body', color: '#ffdd67', x: 50, y: 80 },
    ]);

    render(<App />);

    // Brand title
    expect(screen.getByRole('heading', { level: 1, name: /StickyNotes/i })).toBeInTheDocument();
    // Live DB pill
    expect(screen.getByText(/Live DB Connected/i)).toBeInTheDocument();
    // Add note button
    expect(screen.getByRole('button', { name: /Add Note/i })).toBeInTheDocument();

    // Notes appear after loading
    await waitFor(() => {
      expect(screen.getByDisplayValue('First note body')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Architectural Specs')).toBeInTheDocument();
  });

  test('renders empty state when no notes exist', async () => {
    api.getNotes.mockResolvedValueOnce([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/No notes on the board/i)).toBeInTheDocument();
    });
  });

  test('displays error banner when loading notes fails and allows retry', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    api.getNotes.mockRejectedValueOnce(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Unable to reach Django backend/i)).toBeInTheDocument();
    });

    // Mock successful retry
    api.getNotes.mockResolvedValueOnce([
      { id: 2, title: 'Recovered', text: 'Recovered content', color: '#88d6af', x: 100, y: 100 },
    ]);

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Recovered content')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  test('creates a new note when Add Note button is clicked', async () => {
    api.getNotes.mockResolvedValueOnce([]);
    api.createNote.mockResolvedValueOnce({
      id: 10,
      title: 'New Note',
      text: '',
      color: '#ffdd67',
      x: 70,
      y: 120,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/No notes on the board/i)).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Add Note/i });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    await waitFor(() => {
      expect(api.createNote).toHaveBeenCalledTimes(1);
      expect(screen.getByDisplayValue('New Note')).toBeInTheDocument();
    });
  });

  test('edits note text and title with debounce and blur save', async () => {
    api.getNotes.mockResolvedValueOnce([
      { id: 1, title: 'Sprint Title', text: 'Hello', color: '#ffdd67', x: 50, y: 80 },
    ]);
    api.patchNote.mockResolvedValueOnce({
      id: 1,
      title: 'Sprint Title',
      text: 'Hello World',
      color: '#ffdd67',
      x: 50,
      y: 80,
    });

    render(<App />);

    const textarea = await screen.findByDisplayValue('Hello');
    fireEvent.change(textarea, { target: { value: 'Hello World' } });
    expect(textarea.value).toBe('Hello World');

    await act(async () => {
      fireEvent.blur(textarea);
    });

    await waitFor(() => {
      expect(api.patchNote).toHaveBeenCalledWith(1, { title: 'Sprint Title', text: 'Hello World' });
    });
  });

  test('changes note color when a Stitch color swatch is clicked', async () => {
    api.getNotes.mockResolvedValueOnce([
      { id: 1, title: 'Color test', text: 'Body', color: '#ffdd67', x: 50, y: 80 },
    ]);
    api.patchNote.mockResolvedValueOnce({
      id: 1,
      title: 'Color test',
      text: 'Body',
      color: '#dde3ec',
      x: 50,
      y: 80,
    });

    render(<App />);

    await screen.findByDisplayValue('Color test');
    const skySwatch = screen.getByRole('button', { name: /Set color to Sky Azure/i });
    await act(async () => {
      fireEvent.click(skySwatch);
    });

    await waitFor(() => {
      expect(api.patchNote).toHaveBeenCalledWith(1, { color: '#dde3ec' });
    });
  });

  test('repositions note with keyboard navigation', async () => {
    api.getNotes.mockResolvedValueOnce([
      { id: 1, title: 'Keyboard test', text: 'Body', color: '#ffdd67', x: 50, y: 80 },
    ]);
    api.patchNote.mockResolvedValueOnce({
      id: 1,
      title: 'Keyboard test',
      text: 'Body',
      color: '#ffdd67',
      x: 66,
      y: 80,
    });

    render(<App />);

    await screen.findByDisplayValue('Keyboard test');
    const dragHandle = screen.getByRole('button', {
      name: /Drag note or use arrow keys to reposition/i,
    });

    await act(async () => {
      fireEvent.keyDown(dragHandle, { key: 'ArrowRight', code: 'ArrowRight' });
    });

    await waitFor(() => {
      expect(api.patchNote).toHaveBeenCalledWith(1, { x: 66, y: 80 });
    });
  });

  test('duplicates a note when duplicate button is clicked', async () => {
    api.getNotes.mockResolvedValueOnce([
      { id: 1, title: 'Design System', text: 'Stitch Specs', color: '#88d6af', x: 100, y: 100 },
    ]);
    api.createNote.mockResolvedValueOnce({
      id: 2,
      title: 'Design System (Copy)',
      text: 'Stitch Specs',
      color: '#88d6af',
      x: 140,
      y: 140,
    });

    render(<App />);

    await screen.findByDisplayValue('Design System');
    const duplicateBtn = screen.getByRole('button', { name: /Duplicate note 1/i });

    await act(async () => {
      fireEvent.click(duplicateBtn);
    });

    await waitFor(() => {
      expect(api.createNote).toHaveBeenCalledTimes(1);
      expect(screen.getByDisplayValue('Design System (Copy)')).toBeInTheDocument();
    });
  });

  test('deletes note after successful API call', async () => {
    api.getNotes.mockResolvedValueOnce([
      { id: 1, title: 'Note to delete', text: 'Delete me', color: '#ffdd67', x: 50, y: 80 },
    ]);
    api.deleteNote.mockResolvedValueOnce({ status: 204 });

    render(<App />);

    await screen.findByDisplayValue('Note to delete');
    const deleteBtn = screen.getByRole('button', { name: /Delete note 1/i });
    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    await waitFor(() => {
      expect(api.deleteNote).toHaveBeenCalledWith(1);
      expect(screen.queryByDisplayValue('Note to delete')).not.toBeInTheDocument();
    });
  });
});
