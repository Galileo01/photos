import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addToQueue: vi.fn(),
  checkExistingUploadHashes: vi.fn(),
  computeFileHash: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}));

vi.mock('../uploadQueue', () => ({
  addToQueue: mocks.addToQueue,
  updateQueueItem: vi.fn(),
  getQueueItem: vi.fn(),
  getQueueItems: vi.fn().mockResolvedValue([]),
  getPendingUploads: vi.fn().mockResolvedValue([]),
  removeFromQueue: vi.fn(),
  clearCompletedUploads: vi.fn(),
}));

vi.mock('../api', () => ({
  startUpload: vi.fn(),
  checkExistingUploadHashes: mocks.checkExistingUploadHashes,
  uploadPart: vi.fn(),
  completeUpload: vi.fn(),
  cancelUpload: vi.fn(),
  uploadVideoPoster: vi.fn(),
}));

vi.mock('../imageUtils', () => ({
  createPreview: vi.fn(),
  computeFileHash: mocks.computeFileHash,
}));

import { uploadManager } from '../services/uploadManager';

describe('uploadManager duplicate pre-check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.computeFileHash.mockResolvedValue('a'.repeat(64));
    mocks.checkExistingUploadHashes.mockResolvedValue(['a'.repeat(64)]);
  });

  it('skips a file that already exists in the selected event before creating an upload', async () => {
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

    const result = await uploadManager.addFiles('event', [file]);

    expect(mocks.checkExistingUploadHashes).toHaveBeenCalledWith('event', ['a'.repeat(64)]);
    expect(mocks.addToQueue).not.toHaveBeenCalled();
    expect(result).toEqual({ rejected: [], duplicates: [{ name: 'photo.jpg' }] });
    expect(uploadManager.getItems()).toEqual([]);
  });
});
