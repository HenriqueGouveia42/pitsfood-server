// src/modules/product/repositories/interfaces/product.repository.interface.js
import { Decimal } from "decimal.js"
import { Product } from "../../entities/product.js";

export type BulkDecrementItem = {
    product_id: string;
    quantity: number;
}

export interface IProductRepository {
    saveProduct(product: Product, store_id: string): Promise<void>;
    findSavedProductById(product_id: string, store_id: string): Promise<Product | null>;
    findSavedProductByGtinCode(gtin_code: string, store_id: string): Promise<Product | null>;
    findManySavedProductsByGtinCodes(gtin_codes: string[], store_id: string): Promise<Product[] | []>
    updateSavedProduct(product: Product, store_id: string): Promise<Product | null>;
    listSavedProducts(store_id: string): Promise<Product[] | []>;
    deactivateSavedProductById(product_id: string, store_id: string): Promise<void>;
    activateSavedProductById(product_id: string, store_id: string): Promise<void>;
    incrementProductStock(product_id: string, store_id: string, quantity_to_add: number): Promise<void>;
    decrementProductStock(store_id: string, product_id: string, quantity_to_decrement: number): Promise<void>;
    bulkDecrementProductStock(store_id: string, decrements: BulkDecrementItem[]): Promise<void>;
}