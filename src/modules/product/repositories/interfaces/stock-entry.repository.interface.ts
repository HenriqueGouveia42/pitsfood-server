import { StockEntry } from "../../entities/stock-entry.js";

export interface IStockEntryRepository{
    save(stock_entry: StockEntry): Promise<void>;
    listStockEntries
    (
        store_id: string,
        page: number,
        items_per_page: number,
        product_id?: string

    ): Promise<{ entries: StockEntry[], total_count: number }>;
}
