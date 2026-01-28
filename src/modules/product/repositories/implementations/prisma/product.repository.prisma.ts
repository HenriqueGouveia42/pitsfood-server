import { Product, type ProductProps } from '../../../entities/product.js';
import type { IProductRepository } from '../../product.repository.interface.js';

import { prisma } from "../../../../../shared/infra/prisma.js"
import { AppError } from '../../../../../shared/errors/AppError.js';

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
            stock_quantity: prismaProduct.stock_quantity
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
            stock_quantity: product.stock_quantity
        }
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
                product_id_store_id:{
                    product_id,
                    store_id
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
                gtin_code_store_id:{
                    gtin_code,
                    store_id
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
                product_id_store_id:{
                    product_id: product.id,
                    store_id: store_id
                }
            },
            data:{
                ...dataToUpdate,
            }
        })

        const mappedToEntity: Product = PrismaProductRepository.prismaToEntityDataMapper(updatedProduct);

        return mappedToEntity;
    }

    async listSavedProducts(active: boolean, store_id: string): Promise<Product[]> {

        const prismaSavedProducts = await prisma.product.findMany({
            where:{
                store_id: store_id,
                active: active
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
                product_id_store_id:{
                    product_id: product_id,
                    store_id: store_id
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
                product_id_store_id:{
                    product_id: product_id,
                    store_id: store_id
                }
            },
            data:{
                active: true,
            }
        })
    }
}
