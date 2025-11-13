import stripe from "../app/config/stripe.config";
import AppError from "../app/error/AppError";
import httpStatus from 'http-status';

const CreateCustomerId = async (email: string): Promise<string> => {
    const customer = await stripe.customers.create({
        email
    })
    if (!customer || !customer.id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Something error happened, try again later")
    }
    return customer.id;
}

const checkCustomerId = async (customerId: string, email: string) => {
    if (customerId) {
        try {
            const customer = await stripe.customers.retrieve(customerId);
            if (!('deleted' in customer) || !customer.deleted) {
                console.log("✅ Existing customer found:", customer.id);
                return customer.id;
            }
            console.log("❌ Customer ID is deleted. Creating a new customer...");
        } catch (error: any) {
            if (error.code === 'resource_missing' || error.message.includes('No such customer')) {
                console.log("❌ Customer ID does not exist. Creating a new customer...");
            } else {
                // Re-throw unexpected errors
                throw error;
            }
        }
    }
    if (!email) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email is required to create a new Stripe customer");
    }

    const newCustomer = await CreateCustomerId(email);
    console.log("✅ New customer created:", newCustomer);
    return newCustomer;
}

const CreateStripeAccount = async (
    email: string,
    country: string = 'US',
    ip: string,
    brandName: string,
    businessUrl?: string
) => {
    if (!brandName) {
        throw new AppError(httpStatus.BAD_REQUEST, "Brand Name are required");
    }

    const account = await stripe.accounts.create({
        type: 'custom',
        country,
        email,
        business_type: 'individual',
        individual: {
            first_name: brandName.trim(),
            last_name: brandName.trim(),
            // Optional: Add DOB if you collect it later via update
        },
        business_profile: {
            url: businessUrl || `https://arkive.com/brands`,
            mcc: '5651',
        },
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
        tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip,
        },
        metadata: {
            created_from: 'https://arkive.com',
        },
    });

    console.log("Created Stripe account:", account.id);
    return account.id;
};

const CreatePayout = async (amount: number, currency = "usd", accountId: string) => {
    const payout = await stripe.payouts.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
    }, {
        stripeAccount: accountId,
    });

    console.log("payout:", payout)

    if (!payout) {
        throw new AppError(httpStatus.EXPECTATION_FAILED, "Failed withdraw")
    }

    return payout
}

const CreateExternalAccount = async (accountId: string, bankToken: string) => {
    const externalAccount = await stripe.accounts.createExternalAccount(
        accountId,
        {
            external_account: bankToken
        })

    if (!externalAccount) {
        throw new AppError(httpStatus.EXPECTATION_FAILED, "Wrong bank token/wrong token given")
    }
    return externalAccount
}

const IsAccountReady = async (accountId: string) => {
    const account = await stripe.accounts.retrieve(accountId)
    const ready =
        account.charges_enabled &&
        account.payouts_enabled &&
        account.capabilities?.transfers === "active" &&
        (!account.requirements?.currently_due || account.requirements.currently_due.length === 0);

    console.log("ready:", account)

    return {
        ready,
        status: {
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            transfers: account.capabilities?.transfers,
            requirements_due: account.requirements?.currently_due || [],
        },
    };
}

interface IBankAccount {
    country: string,
    currency: string,
    account_holder_name: string,
    account_holder_type: 'individual' | 'company',
    routing_number: string,
    account_number: string,
}

const CreateBankToken = async (data: IBankAccount) => {
    const token = await stripe.tokens.create({
        bank_account: {
            country: data.country,
            currency: data.currency,
            account_holder_name: data.account_holder_name,
            account_holder_type: data.account_holder_type,
            routing_number: data.routing_number,
            account_number: data.account_number,
        }
    });
    return token.id
}

// const createSubscription = async (payload: ICreateSubscription) => {
//     const { stripe_customer_id, trialEnd, userId } = payload;
//     const createStripeSubscription = await stripe.subscriptions.create({
//         customer: stripe_customer_id,
//         items: [{
//             price: Subscription

//         }],
//         metadata: { userId: userId.toString() },
//     })
// }

const StripeUtils = {
    CreateCustomerId,
    checkCustomerId,
    CreateStripeAccount,
    CreatePayout,
    CreateExternalAccount,
    IsAccountReady,
    CreateBankToken
    // createSubscription
}
export default StripeUtils;