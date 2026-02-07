// services/stripeConnect.service.ts
import httpStatus from 'http-status';
import stripe from '../../app/config/stripe.config';
import AppError from '../../app/error/AppError';

export class StripeConnectService {
    // Create Stripe Connect account
    static async createConnectedAccount(params: {
        email: string;
        businessName: string;
        country?: string;
    }) {
        try {
            const account = await stripe.accounts.create({
                type: 'express',
                country: params.country || 'US',
                email: params.email,
                capabilities: {
                    transfers: { requested: true },
                },
                business_type: 'company',
                company: {
                    name: params.businessName,
                },
            });

            return account;
        } catch (error: any) {
            console.error('Error creating connected account:', error);
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Failed to create Stripe account: ${error.message}`
            );
        }
    }

    // Generate onboarding link
    static async createAccountLink(params: {
        accountId: string;
        refreshUrl: string;
        returnUrl: string;
    }) {
        try {
            const accountLink = await stripe.accountLinks.create({
                account: params.accountId,
                refresh_url: params.refreshUrl,
                return_url: params.returnUrl,
                type: 'account_onboarding',
            });

            return accountLink;
        } catch (error: any) {
            console.error('Error creating account link:', error);
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Failed to create onboarding link: ${error.message}`
            );
        }
    }

    // Check account status
    static async getAccountStatus(accountId: string) {
        try {
            const account = await stripe.accounts.retrieve(accountId);

            return {
                detailsSubmitted: account.details_submitted,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                requirements: account.requirements,
                isReady: account.details_submitted && account.payouts_enabled,
            };
        } catch (error: any) {
            console.error('Error retrieving account:', error);
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Failed to get account status: ${error.message}`
            );
        }
    }

    // Transfer funds to brand
    static async transferToBrand(params: {
        amount: number;
        currency: string;
        destinationAccountId: string;
        metadata?: Record<string, string>;
    }) {
        try {
            const transfer = await stripe.transfers.create({
                amount: Math.round(params.amount * 100),
                currency: params.currency,
                destination: params.destinationAccountId,
                metadata: params.metadata || {},
            });

            return transfer;
        } catch (error: any) {
            console.error('Transfer error:', error);
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Transfer failed: ${error.message}`
            );
        }
    }

    // Get brand balance
    static async getBrandBalance(accountId: string) {
        try {
            const balance = await stripe.balance.retrieve({
                stripeAccount: accountId,
            });

            return {
                available: balance.available,
                pending: balance.pending,
            };
        } catch (error: any) {
            console.error('Error retrieving balance:', error);
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Failed to get balance: ${error.message}`
            );
        }
    }
}