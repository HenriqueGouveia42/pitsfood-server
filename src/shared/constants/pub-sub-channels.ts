export const PubSubChannels = {
    Store: {
        BILL_UPDATES: (storeId: string) => `comandas:loja:${storeId}`,
    }
} as const;