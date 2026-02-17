// services/fcm.service.ts
import { MulticastMessage, BatchResponse } from 'firebase-admin/messaging';
import httpStatus from 'http-status';
import { getFirebaseMessaging } from '../../app/config/firebase.config';
import AppError from '../../app/error/AppError';

export class FCMService {
    private static messaging = getFirebaseMessaging();

    /**
     * Send notification to single device
     */
    static async sendToDevice(
        token: string,
        notification: { title: string; body: string },
        data?: Record<string, string>
    ): Promise<string> {
        try {
            const message = {
                token,
                notification,
                data: data || {},
                android: {
                    priority: 'high' as const,
                    notification: {
                        sound: 'default',
                        channelId: 'default',
                        priority: 'high' as const
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                            contentAvailable: true
                        }
                    }
                }
            };

            const response = await this.messaging.send(message);
            console.log('✅ FCM sent to device:', response);
            return response;
        } catch (error: any) {
            console.error('❌ FCM send error:', error);

            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                throw new AppError(httpStatus.BAD_REQUEST, 'Invalid or expired FCM token');
            }

            throw error;
        }
    }

    /**
     * Send notification to multiple devices (batch)
     */
    static async sendToMultipleDevices(
        tokens: string[],
        notification: { title: string; body: string },
        data?: Record<string, string>
    ): Promise<BatchResponse> {
        try {
            if (tokens.length === 0) {
                throw new AppError(httpStatus.BAD_REQUEST, 'No FCM tokens provided');
            }

            // FCM allows max 500 tokens per batch
            const batchSize = 500;
            const batches: string[][] = [];

            for (let i = 0; i < tokens.length; i += batchSize) {
                batches.push(tokens.slice(i, i + batchSize));
            }

            const allResults: BatchResponse[] = [];

            for (const batch of batches) {
                const message: MulticastMessage = {
                    tokens: batch,
                    notification,
                    data: data || {},
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            channelId: 'default',
                            priority: 'high' as const
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1,
                                contentAvailable: true
                            }
                        }
                    }
                };

                const response = await this.messaging.sendEachForMulticast(message);
                allResults.push(response);

                console.log(`✅ Batch sent: ${response.successCount}/${batch.length} successful`);

                if (response.failureCount > 0) {
                    response.responses.forEach((resp, idx) => {
                        if (!resp.success) {
                            console.error(`❌ Failed: ${batch[idx]} - ${resp.error?.message}`);
                        }
                    });
                }
            }

            // Combine all batch results
            const combinedResult: BatchResponse = {
                successCount: allResults.reduce((sum, r) => sum + r.successCount, 0),
                failureCount: allResults.reduce((sum, r) => sum + r.failureCount, 0),
                responses: allResults.flatMap(r => r.responses)
            };

            return combinedResult;
        } catch (error: any) {
            console.error('❌ FCM multicast error:', error);
            throw error;
        }
    }

    /**
     * Send notification to topic
     */
    static async sendToTopic(
        topic: string,
        notification: { title: string; body: string },
        data?: Record<string, string>
    ): Promise<string> {
        try {
            const message = {
                topic,
                notification,
                data: data || {},
                android: { priority: 'high' as const },
                apns: {
                    payload: {
                        aps: { sound: 'default', badge: 1 }
                    }
                }
            };

            const response = await this.messaging.send(message);
            console.log(`✅ FCM sent to topic ${topic}:`, response);
            return response;
        } catch (error: any) {
            console.error('❌ FCM topic error:', error);
            throw error;
        }
    }
}