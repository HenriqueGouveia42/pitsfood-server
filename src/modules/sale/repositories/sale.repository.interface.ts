import { Sale } from "../entities/sale.js";
import { PaymentMethod } from "../entities/sale.js";
import { Decimal } from "decimal.js"

export type PaymentBreakdownDTO = {
    method: PaymentMethod,
    total: Decimal
}

export type ProductBreakdownDTO = {
    product_id: string,
    product_name: string,
    quantity_sold: number,
    total_sold: Decimal
}

export interface SalesReportDTO {
    period: {
        start: Date;
        end: Date;
    };
    metrics: {
        total_revenue: Decimal;
        sales_count: number;
        average_ticket: number;
    };
    payment_breakdown: {
        method: string;
        total: Decimal;
        percentage?: string; // Opcional: já mandar a % pronta
    }[];
    product_breakdown: {
        product_name: string;
        quantity_sold: number;
        total_sold: Decimal;
    }[];
}

export interface ISaleRepository {
    makeSale(sale: Sale): Promise<void>;
    findSavedSaleById(sale_id: string): Promise<Sale>;
    listSavedSales(): Promise<Sale[]>;
    deleteSavedSaleById(sale_id: string): Promise<void>;
    createSaleAndCloseBills(sale: Sale, billCodesToClose: string[]): Promise<void>;
    findByPeriod(startDate: Date, endDate: Date): Promise<Sale[]>;
    getSalesSummaryByPeriod(startDate: Date, endDate: Date): Promise<SalesReportDTO>;
}
