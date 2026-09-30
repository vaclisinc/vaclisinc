import { createHash } from 'node:crypto';

export function preserveSnapshot(previous, metadata, now) {
  const { fetchedAt, ...oldMetadata } = previous ?? {};
  return JSON.stringify(oldMetadata) === JSON.stringify(metadata)
    ? previous
    : { ...metadata, fetchedAt: now };
}

export function renderFingerprint(snapshot, theme, rendererInputs) {
  const { fetchedAt, ...metadata } = snapshot;
  return createHash('sha256')
    .update(JSON.stringify({ metadata, theme, rendererInputs }))
    .digest('hex');
}
