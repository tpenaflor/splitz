import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { firestore } from './db';

describe('Database Functional Tests', () => {
  const testRoomId = 'test-room-' + Date.now();

  beforeAll(() => {
    // Ensure we have a project ID set for testing, otherwise skip or use a dummy
    if (!process.env.GCP_PROJECT_ID) {
      console.warn('GCP_PROJECT_ID not set. Functional tests might fail if not authenticated.');
    }
  });

  afterAll(async () => {
    // Cleanup
    try {
      await firestore.collection('rooms').doc(testRoomId).delete();
    } catch (e) {
      console.error('Failed to cleanup test room', e);
    }
  });

  // Skip this test in CI or if GCP credentials aren't provided
  const shouldSkip = process.env.CI || !process.env.GCP_PROJECT_ID;

  it.skipIf(shouldSkip)('should successfully write and read a room document from Firestore', async () => {
    const roomRef = firestore.collection('rooms').doc(testRoomId);
    
    // Write
    const testData = {
      host_id: 'test-host',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    
    await roomRef.set(testData);

    // Read
    const doc = await roomRef.get();
    expect(doc.exists).toBe(true);
    
    const data = doc.data();
    expect(data?.host_id).toBe('test-host');
    expect(data?.status).toBe('active');
  });
});
