import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const uploadManagerMock = vi.hoisted(() => {
  let listener: ((items: unknown[]) => void) | undefined;

  return {
    init: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn((nextListener: (items: unknown[]) => void) => {
      listener = nextListener;
      nextListener([]);
      return vi.fn(() => {
        if (listener === nextListener) listener = undefined;
      });
    }),
    emit(items: unknown[]) {
      listener?.(items);
    },
    addFiles: vi.fn(),
    retryUpload: vi.fn(),
    retryAllFailed: vi.fn(),
    clearCompleted: vi.fn(),
    cancelUpload: vi.fn(),
    cancelAll: vi.fn(),
  };
});

vi.mock('../services/uploadManager', () => ({
  uploadManager: uploadManagerMock,
}));

import { UploadProvider, useUploadContext } from '../contexts/UploadContext';

function QueueCount() {
  const { queueItems } = useUploadContext();
  return <span>{queueItems.length}</span>;
}

describe('UploadProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('remains subscribed after React StrictMode replays effects', () => {
    render(
      <React.StrictMode>
        <UploadProvider>
          <QueueCount />
        </UploadProvider>
      </React.StrictMode>
    );

    act(() => {
      uploadManagerMock.emit([
        {
          id: 'upload-1',
          eventSlug: 'event',
          file: new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }),
          status: 'uploading',
          progress: 50,
        },
      ]);
    });

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(uploadManagerMock.subscribe).toHaveBeenCalledTimes(2);
  });
});
