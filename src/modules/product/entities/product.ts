import { Decimal } from 'decimal.js';

export type ProductProps = {
    readonly product_id: string;
    readonly name: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly unit_price_in_reais: Decimal;
    readonly gtin_code: string;
    readonly is_internal: boolean;
    readonly active: boolean;
}

export class Product {
    //constructor e propriedade props são estritamente readonly
    private constructor(private readonly props: ProductProps) {}

    //remove zeros à esquerda
    private static normalizeGtin(gtin: string): string{
        return gtin.replace(/^0+/, '');
    }

    private static generateGtin13CodeForInternalProduct(): string {
        let result: string = '22';

        for (let i = 0; i < 10; i++){
            result += Math.floor(Math.random() * 10).toString()
        }

        const verifierDigit: string = Product.calculateGtinChecksum(result);
        return result + verifierDigit
    }

    private static calculateGtinChecksum(codeWithoutDigit: string): string {
        // Inverte a string para facilitar o cálculo da direita para a esquerda
        const reversed = codeWithoutDigit.split('').reverse().join('');
        
        let sum = 0;

        for (let i = 0; i < reversed.length; i++) {
            const digit = Number(reversed[i]);
            //posições pares (0, 2, 4...) multiplicam por 3
            //posições ímpares (1, 3, 5...) multiplicam por 1
            //obs: Como invertemos a string, a lógica se alinha com a regra GS1
            sum += (i % 2 === 0) ? digit * 3 : digit;
        }

        const nearestTen = Math.ceil(sum / 10) * 10;
        return (nearestTen - sum).toString();
    }


    private static validateGtin(gtin: string, is_internal: boolean){

        //validação de Caracteres
        if (!/^\d+$/.test(gtin)) {
            throw new Error("O código GTIN deve conter apenas números");
        }

        //validação de Tamanho (Família GS1)
        //aceitam 8 (EAN-8), 12 (UPC-A), 13 (EAN-13), 14 (DUN-14)
        const validLengths = [8, 12, 13, 14];

        if (!validLengths.includes(gtin.length)) {
            throw new Error(`GTIN inválido. Tamanho recebido: ${gtin.length}. Esperado: 8, 12, 13 ou 14.`);
        }

        const expectedDigit = Product.calculateGtinChecksum(gtin.slice(0, -1));
        const actualDigit = gtin.slice(-1);

        if (expectedDigit !== actualDigit) {
            throw new Error(`GTIN inválido. Dígito Verificador incorreto. Esperado: ${expectedDigit}, Recebido: ${actualDigit}`);
        }

        if (gtin.length === 13) {
            const startsWith22 = gtin.startsWith('22');

            if (startsWith22 && !is_internal) {
                throw new Error("Erro! Produto externo não pode começar com '22' (prefixo reservado a produtos internos).");
            }
    
            if (!startsWith22 && is_internal) {
                throw new Error("Erro! Produto interno deve começar com o prefixo '22'.");
            }
        }

    }

    private static validateName(name: string) {
        if (name.length > 100) throw new Error("Nome muito longo");
    }

    private static validatePrice(price: Decimal) {
        if (price.isNegative() || price.gt(1000000)) throw new Error("Preço fora da faixa permitida");
    }

    //produtos internos vao ter gtin13 code sempre comecando com 202
    public static buildProduct(
        name: string, 
        unit_price_in_reais: Decimal, 
        gtin_code?: string | null | undefined, 
        is_internal: boolean = true,
        active: boolean = true
    ): Product {

        const finalName: string = name.toUpperCase();

        let finalGtin: string;

        const sanitizedInputGtin = gtin_code ? Product.normalizeGtin(gtin_code) : undefined;

        //REGRA 1: Produto externo OBRIGATORIAMENTE precisa de GTIN
        if (!is_internal && !sanitizedInputGtin) {
            throw new Error("Um produto externo deve possuir um GTIN-13 informado.");
        }

        //REGRA 2: Se for interno e NÃO tiver GTIN, gera um.
        if (is_internal && !sanitizedInputGtin) {
            finalGtin = Product.generateGtin13CodeForInternalProduct();
        } 

        //REGRA 3: Se o GTIN foi passado (seja interno manual ou externo), usa ele.
        else {
            //o compilador TS sabe que gtin_code existe aqui por causa da Regra 1
            finalGtin = sanitizedInputGtin!; 
        }
       
       
        Product.validateGtin(finalGtin, is_internal);
        Product.validateName(name);
        Product.validatePrice(unit_price_in_reais);


        const now = new Date().toISOString();

        return new Product({
            product_id: crypto.randomUUID(),
            name: finalName,
            created_at: now,
            updated_at: now,
            unit_price_in_reais,
            gtin_code: finalGtin,
            is_internal,
            active
        });
    }

    public static restoreProduct(props: ProductProps): Product {

        Product.validateGtin(props.gtin_code, props.is_internal);
        Product.validateName(props.name);
        Product.validatePrice(props.unit_price_in_reais);
        return new Product(props);
    }

    //getters para acesso seguro aos dados -- readonly permite apenas ler
    get id() { return this.props.product_id; }
    get name() { return this.props.name; }
    get price() { return this.props.unit_price_in_reais; }
    get gtin() { return this.props.gtin_code; }
    get isInternal() { return this.props.is_internal; }
    get createdAt() {return this.props.created_at; }
    get updatedAt() { return this.props.updated_at; }
    get active() { return this.props.active; }

    //setter que retorna novo objeto, mantendo a imutabilidade de um objeto criado
    public withUpdatedData(newName:string, newPrice: Decimal): Product{

        Product.validateName(newName);
        Product.validatePrice(newPrice);

        return new Product({
            ...this.props,
            name: newName,
            unit_price_in_reais: newPrice,
            updated_at: new Date().toISOString()
        })
    }
}