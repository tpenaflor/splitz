import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';

// In Next.js, these will use Application Default Credentials automatically in Cloud Run.
// Locally, if you have gcloud auth application-default login run, it works too.

export const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID,
});

export const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
});

export const FIT_FILES_BUCKET = process.env.FIT_FILES_BUCKET || '';
