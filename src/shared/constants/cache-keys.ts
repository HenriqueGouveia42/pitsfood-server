export const CacheKeys = {
    Store: {
        SUMMARY: (storeId: string) => `store-summary:${storeId}`,
        PHYSICAL_BILLS_CODES: (storeId: string) => `store-physical-bills-codes:${storeId}`
    },
    User: {
        TOKEN_VERSION: (userId: string) => `user-token-version:${userId}`,
    },
    Product: {
        LIST: (storeId: string) => `store-products:${storeId}`
    }
} as const;