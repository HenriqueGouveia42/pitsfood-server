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
    },
    Sale: {
        SUMMARY_BY_PERIOD: (store_id: string, start_day_month_year: string, end_day_month_year: string) => 
            `summary-sales-${store_id}-${start_day_month_year}-${end_day_month_year}`
    }
} as const;