import { Product, type ProductProps } from '../../../entities/product.js';
import type { IProductRepository } from '../../product.repository.interface.js';
import { StockEntry } from '../../../entities/stock-entry.js';

import { prisma } from "../../../../../shared/infra/prisma.js"
import { AppError } from '../../../../../shared/errors/AppError.js';
import { Decimal } from 'decimal.js';

export class PrismaProductRepository implements IProductRepository {

    //mappers
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
        }

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

            store: {
                connect: { store_id: product.store_id}
            },

            track_stock: product.track_stock,
            stock_quantity: product.stock_quantity,
            requires_preparation: product.requires_preparation
        }
    }

    private static prismaEntryToDomainMapper(prismaEntry: any): StockEntry {
        return StockEntry.restore({
            entry_id: prismaEntry.entry_id,
            product_id: prismaEntry.product_id,
            store_id: prismaEntry.store_id,
            quantity: prismaEntry.quantity,
            
            //garantimos que seja Decimal
            unit_cost: new Decimal(prismaEntry.unit_cost), 
            total_cost: new Decimal(prismaEntry.total_cost),
            
            created_at: prismaEntry.created_at.toISOString(), //normaliza data
            
            //achatamos os relacionamentos para facilitar a vida do Frontend
            user_name: prismaEntry.user ? prismaEntry.user.username : 'Desconhecido',
            product_name: prismaEntry.product ? prismaEntry.product.name : 'Produto Removido'
        });
    }

    //methods
    async saveProduct(product: Product, store_id: string): Promise<void> {

        if (product.store_id !== store_id){
            throw new AppError("Tentativa de violação de segurança: O produto não pertence a essa loja", 403, "STORE_MISMATCH");
        }

        const entityToPrismaDataMapped = PrismaProductRepository.entityToPrismaDataMapper(product);

        await prisma.product.create({
            data: entityToPrismaDataMapped
        })
    }

    async findSavedProductById(product_id: string, store_id: string): Promise<Product | null> {

        const prismaProduct = await prisma.product.findUnique({
            where:{
                store_id_product_id:{
                    store_id,
                    product_id,
                }
            }
        })

        if(!prismaProduct){
            return null;
        }

        const productMapped: Product = PrismaProductRepository.prismaToEntityDataMapper(prismaProduct);

        return productMapped;
    }

    async findSavedProductByGtinCode(gtin_code: string, store_id: string): Promise<Product | null>{

        const prismaProduct = await prisma.product.findUnique({
            where:{
                store_id_gtin_code:{
                    store_id,
                    gtin_code
                }
               
            }
        })

        if (!prismaProduct){
            return null;
        }

        const product: Product = PrismaProductRepository.prismaToEntityDataMapper(prismaProduct);

        return product;
    }

    async findManySavedProductsByGtinCodes(gtin_codes: string[], store_id: string): Promise<Product[] | []>{

        if (gtin_codes.length == 0){
            return [];
        }
        
        const prisma_products: any[] = await prisma.product.findMany({
            where:{
                store_id: store_id,
                gtin_code: {
                    in: gtin_codes 
                },
            }
        })

        return prisma_products.map(p => PrismaProductRepository.prismaToEntityDataMapper(p));
    }

    async updateSavedProduct(product: Product, store_id: string): Promise<Product> {

        if (product.store_id != store_id){
            throw new AppError("Tentativa de violação de segurança: O produto não pertence a essa loja", 403, "STORE_MISMATCH");
        }

        const mappedToPrisma = PrismaProductRepository.entityToPrismaDataMapper(product);

        //remover id e created_at do objeto que será enviado para o 'data'
        const { 
            product_id,
            created_at,
            store,
            stock_quantity,
            ...dataToUpdate } = mappedToPrisma;

        const updatedProduct = await prisma.product.update({
            where:{
                store_id_product_id:{
                    store_id: store_id,
                    product_id: product.id
                }
            },
            data:{
                ...dataToUpdate,
            }
        })

        const mappedToEntity: Product = PrismaProductRepository.prismaToEntityDataMapper(updatedProduct);

        return mappedToEntity;
    }

    async listSavedProducts(store_id: string): Promise<Product[]> {

        const prismaSavedProducts = await prisma.product.findMany({
            where:{
                store_id: store_id,
            },
            orderBy: {
                name: "asc" //ordem alfabetica
            }
        });

        return prismaSavedProducts.map(prismaProduct => 
            PrismaProductRepository.prismaToEntityDataMapper(prismaProduct)
        );
    }

    async deactivateSavedProductById(product_id: string, store_id: string): Promise<void> {

        await prisma.product.update({
            where:{
                store_id_product_id:{
                    store_id: store_id,
                    product_id: product_id
                }
            },
            data:{
                active: false,
            }
        })
    }

    async activateSavedProductById(product_id: string, store_id: string): Promise<void> {

        await prisma.product.update({
            where:{
                store_id_product_id:{
                    store_id: store_id,
                    product_id: product_id
                }
            },
            data:{
                active: true,
            }
        })
    }

    async makeEntryStock(product_id: string, store_id: string, user_id: string, user_name: string, stock_quantity_to_add: number, unit_cost: Decimal, total_cost: Decimal): Promise<void>{
        
        await prisma.$transaction(async (tx) =>{

            await tx.stockEntry.create({
                data:{
                    quantity: stock_quantity_to_add,
                    unit_cost: unit_cost,
                    total_cost: total_cost,
                    store_id: store_id,
                    product_id: product_id,
                    user_id: user_id
                }
            })

            await tx.product.update({
                where:{
                    store_id_product_id:{
                        store_id,
                        product_id,
                    }
                },
                data:{
                    stock_quantity:{
                        increment: stock_quantity_to_add
                    }
                }
            })

        })
    }

    async listStockEntries(store_id: string, page: number, items_per_page: number, product_id?: string): Promise<{ entries: StockEntry[], total_count: number }> {
    
        const skip = (page - 1) * items_per_page;

        //constoi o objeto Where dinamicamente ou deixamos o undefined agir
        const whereClause = {
            store_id: store_id,
            ...(product_id && { product_id: product_id }) 
        };

        const [total_count, prismaEntries] = await Promise.all([
            
            //query 1: contaem (IMPORTANTE: Usar o mesmo whereClause)
            prisma.stockEntry.count({
                where: whereClause 
            }),

            //query 2: dados paginados
            prisma.stockEntry.findMany({
                where: whereClause, // <--- Usa o filtro aqui também
                skip: skip,
                take: items_per_page,
                orderBy: { created_at: 'desc' },
                include: {
                    product: { select: { name: true, gtin_code: true } },
                    user: { select: { username: true } }
                }
            })
        ]);

        const entries: StockEntry[] = prismaEntries.map(entry => PrismaProductRepository.prismaEntryToDomainMapper(entry));

        return {
            entries,
            total_count
        };
    }
    
        
}
