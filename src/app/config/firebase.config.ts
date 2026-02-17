// app/config/firebase.config.ts
import * as admin from 'firebase-admin';
import config from './index';

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }

    try {
        // Option 1: Using service account JSON file
        if (config.firebase.serviceAccountPath) {
            const serviceAccount = config.firebase.serviceAccountPath

            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: config.firebase.projectId,
            });
        }
        // Option 2: Using environment variables (recommended for production)
        else if (config.firebase.clientEmail && config.firebase.privateKey) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: config.firebase.projectId,
                    clientEmail: config.firebase.clientEmail,
                    privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
                }),
            });
        } else {
            throw new Error('Firebase credentials not configured');
        }

        console.log('✅ Firebase Admin initialized successfully');
        return firebaseApp;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        throw error;
    }
};

export const getFirebaseMessaging = () => {
    if (!firebaseApp) {
        initializeFirebase();
    }
    return admin.messaging();
};

export default firebaseApp;