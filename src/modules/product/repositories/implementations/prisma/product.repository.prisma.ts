
import { Product, type ProductProps } from '../../../entities/product.js';
import type { IProductRepository } from '../../interfaces/product.repository.interface.js';

import { prisma as globalPrisma } from "../../../../../shared/infra/prisma.js";
import { AppError } from '../../../../../shared/errors/AppError.js';
import { Prisma, PrismaClient } from '@prisma/client';

import type { BulkDecrementItem } from '../../interfaces/product.repository.interface.js';

export class PrismaProductRepository implements IProductRepository {

    private db: PrismaClient | Prisma.TransactionClient;

    constructor(transactionClient?: Prisma.TransactionClient){
        this.db = transactionClient ? transactionClient : globalPrisma;
    }

    private static prismaToEntityDataMapper(prismaProduct: any): Product {
        const productProps: ProductProps = {
            product_id: prismaProduct.product_id,
            name: prismaProduct.name,
            unit_price_in_reais: prismaProduct.unit_price_in_reais,
            gtin_code: prismaProduct.gtin_code,
            is_internal: prismaProduct.is_internal,
            created_at: prismaProduct.created_at.toISOString(),
            updated_at: prismaProduct.updated_at.toISOString(),
            active: prismaProduct.active,
            store_id: prismaProduct.store_id,
            track_stock: prismaProduct.track_stock,
            stock_quantity: prismaProduct.stock_quantity,
            requires_preparation: prismaProduct.requires_preparation
        };
        return Product.restoreProduct(productProps);
    }

    private static entityToPrismaDataMapper(product: Product): any {
        return {
            product_id: product.id,
            name: product.name,
            unit_price_in_reais: product.price,
            gtin_code: product.gtin,
            is_internal: product.isInternal,
            created_at: new Date(product.createdAt),
            updated_at: new Date(product.updatedAt),
            active: product.active,
            store: { connect: { store_id: product.store_id} },
            track_stock: product.track_stock,
            stock_quantity: product.stock_quantity,
            requires_preparation: product.requires_preparation
        };
    }

    async saveProduct(product: Product, store_id: string): Promise<void> {
        if (product.store_id !== store_id){
            throw new AppError("Tentativa de violação de segurança: O produto não pertence a essa loja", 403, "STORE_MISMATCH");
        }
        const entityToPrismaDataMapped = PrismaProductRepository.entityToPrismaDataMapper(product);
        await this.db.product.create({ data: entityToPrismaDataMapped });
    }

    async findSavedProductById(product_id: string, store_id: string): Promise<Product | null> {
        const prismaProduct = await this.db.product.findUnique({
            where: { store_id_product_id: { store_id, product_id } }
        });
        if(!prismaProduct) return null;
        return PrismaProductRepository.prismaToEntityDataMapper(prismaProduct);
    }

    async findSavedProductByGtinCode(gtin_code: string, store_id: string): Promise<Product | null>{
        const prismaProduct = await this.db.product.findUnique({
            where: { store_id_gtin_code: { store_id, gtin_code } }
        });
        if (!prismaProduct) return null;
        return PrismaProductRepository.prismaToEntityDataMapper(prismaProduct);
    }

    async findManySavedProductsByGtinCodes(gtin_codes: string[], store_id: string): Promise<Product[] | []>{
        if (gtin_codes.length == 0) return [];
        const prisma_products: any[] = await this.db.product.findMany({
            where: {
                store_id: store_id,
                gtin_code: { in: gtin_codes },
            }
        });
        return prisma_products.map(p => PrismaProductRepository.prismaToEntityDataMapper(p));
    }

    async updateSavedProduct(product: Product, store_id: string): Promise<Product> {
        if (product.store_id != store_id){
            throw new AppError("Tentativa de violação de segurança: O produto não pertence a essa loja", 403, "STORE_MISMATCH");
        }
        const mappedToPrisma = PrismaProductRepository.entityToPrismaDataMapper(product);
        const { product_id, created_at, store, stock_quantity, ...dataToUpdate } = mappedToPrisma;

        const updatedProduct = await this.db.product.update({
            where: { store_id_product_id: { store_id: store_id, product_id: product.id } },
            data: { ...dataToUpdate }
        });
        return PrismaProductRepository.prismaToEntityDataMapper(updatedProduct);
    }

    async listSavedProducts(store_id: string): Promise<Product[]> {
        const prismaSavedProducts = await this.db.product.findMany({
            where: { store_id: store_id },
            orderBy: { name: "asc" }
        });
        return prismaSavedProducts.map(prismaProduct => PrismaProductRepository.prismaToEntityDataMapper(prismaProduct));
    }

    async deactivateSavedProductById(product_id: string, store_id: string): Promise<void> {
        await this.db.product.update({
            where: { store_id_product_id: { store_id, product_id } },
            data: { active: false }
        });
    }

    async activateSavedProductById(product_id: string, store_id: string): Promise<void> {
        await this.db.product.update({
            where: { store_id_product_id: { store_id, product_id } },
            data: { active: true }
        });
    }

    // NOVO: Cumpre a responsabilidade de alterar o estoque usando o túnel herdado (this.db)
    async incrementProductStock(product_id: string, store_id: string, quantity_to_add: number): Promise<void> {
        await this.db.product.update({
            where: {
                store_id_product_id: { store_id, product_id }
            },
            data: {
                stock_quantity: { increment: quantity_to_add }
            }
        });
    }

    async decrementProductStock(store_id: string, product_id: string, quantity_to_decrement: number): Promise<void> {
        await this.db.product.updateMany({
            where:{
                store_id: store_id,
                product_id: product_id,
                track_stock: true
            },
            data:{
                stock_quantity: {
                    decrement: quantity_to_decrement
                }
            }
        })
    }

    async bulkDecrementProductStock(store_id: string, decrements: BulkDecrementItem[]): Promise<void> {
        if (decrements.length === 0) return;

        // Monta a instrução CASE dinamicamente
        const caseStatements = decrements
            .map(d => `WHEN product_id = '${d.product_id}' THEN ${d.quantity}`)
            .join(' ');
        
        // Isola os IDs para a cláusula IN
        const idsList = decrements
            .map(d => `'${d.product_id}'`)
            .join(', ');

        // Constrói a Query SQL crua, delegando o processamento em lote para o motor em C/C++ do PostgreSQL
        const query = `
            UPDATE products 
            SET stock_quantity = stock_quantity - (
                CASE 
                    ${caseStatements}
                    ELSE 0 
                END
            )
            WHERE store_id = '${store_id}' 
            AND track_stock = true 
            AND product_id IN (${idsList});
        `;

        // Executa usando o túnel transacional injetado (this.db)
        await this.db.$executeRawUnsafe(query);
    }
}