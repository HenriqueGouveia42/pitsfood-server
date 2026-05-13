import { Decimal } from "decimal.js"
import { Product } from "../entities/product.js";
import { StockEntry } from "../entities/stock-entry.js";

export interface IProductRepository {
    saveProduct(product: Product, store_id: string): Promise<void>;
    findSavedProductById(product_id: string, store_id: string): Promise<Product | null>;
    findSavedProductByGtinCode(gtin_code: string, store_id: string): Promise<Product | null>;
    findManySavedProductsByGtinCodes(gtin_codes: string[], store_id: string): Promise<Product[] | []>
    updateSavedProduct(product: Product, store_id: string): Promise<Product | null>;
    listSavedProducts(store_id: string): Promise<Product[] | []>;
    deactivateSavedProductById(product_id: string, store_id: string): Promise<void>;
    activateSavedProductById(product_id: string, store_id: string): Promise<void>;
    makeEntryStock(product_id: string, store_id: string, user_id: string, user_name: string, stock_quantity_to_add: number, unit_cost: Decimal, total_cost: Decimal): Promise<void>;
    listStockEntries(
        store_id: string, 
        page: number, 
        items_per_page: number, 
        product_id?: string
    ): Promise<{ entries: StockEntry[], total_count: number }>;
}