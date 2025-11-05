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

const CreateStripeAccount = async (email: string, country = 'US', ip: string) => {
    const account = await stripe.accounts.create({
        type: 'custom',
        email: email,
        country: country,
        capabilities: {
            transfers: { requested: true },
            card_issuing: { requested: true, },
        },
        business_type: 'individual',
        tos_acceptance: {
            date: Math.floor(Date.now() / 1000)!,
            ip: ip!
        },
    })

    console.log("stripe account:", account);
    return account.id
}

const CreatePayout = async (amount: number, currency = "USD", destination: string) => {
    const payout = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: currency,
        destination: destination
    })

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
    IsAccountReady
    // createSubscription
}
export default StripeUtils;