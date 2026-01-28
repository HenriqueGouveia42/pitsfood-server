import type { Product } from "../entities/product.js";

export interface IProductRepository {
    saveProduct(product: Product, store_id: string): Promise<void>;
    findSavedProductById(product_id: string, store_id: string): Promise<Product | null>;
    findSavedProductByGtinCode(gtin_code: string, store_id: string): Promise<Product | null>;
    findManySavedProductsByGtinCodes(gtin_codes: string[], store_id: string): Promise<Product[] | []>
    updateSavedProduct(product: Product, store_id: string): Promise<Product | null>;
    listSavedProducts(active: boolean, store_id: string): Promise<Product[] | []>;
    deactivateSavedProductById(product_id: string, store_id: string): Promise<void>;
    activateSavedProductById(product_id: string, store_id: string): Promise<void>;
}