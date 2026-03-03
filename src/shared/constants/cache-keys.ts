export const CacheKeys = {
    Store: {
        SUMMARY: (storeId: string) => `store-summary:${storeId}`,
        PHYSICAL_BILLS_CODES: (storeId: string) => `store-physical-bills-codes:${storeId}`,
        SUBSCRIPTION_STATUS: (storeId: string) => `store-subscription-status:${storeId}`
    },
    User: {
        TOKEN_VERSION: (userId: string) => `user-token-version:${userId}`,
        USERS_DATA: (storeId: string) => `users-data:${storeId}`
    },
    Product: {
        LIST: (storeId: string) => `store-products:${storeId}`
    }
} as const;