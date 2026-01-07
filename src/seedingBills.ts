import { Bill } from "./modules/bill/entities/bill.js"
import { PrismaBillRepository } from "./modules/bill/repositories/implementations/prisma/bill.repository.prisma.js"

const TARGET_VALUE = 100;

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomBillCodeGtin(): string {

    let code: string = "";
    let sum: number = 0;
    let impar: boolean = true;

    for (let i = 0; i < 3; i++){

        const n_number: number = getRandomInt(1, 9);
        const n_string: string = n_number.toString();

        code += n_string;
        impar ? sum += n_number : sum += (3*n_number);

        impar = !impar
    }
    
    const verifierDigit: string = ((10 - (sum % 10)) % 10).toString();

    code += verifierDigit;

    return code;
}

let bills: Bill[] = [];

for (let j = 0; j < TARGET_VALUE; j++){

    let alreadyExists: boolean = true;

    
    let candidateRandomBillGtin: string;
    do {
        candidateRandomBillGtin = generateRandomBillCodeGtin();
        alreadyExists = bills.some(bill => bill.bill_code === candidateRandomBillGtin)
    } while (alreadyExists)
    
    const bill: Bill = Bill.buildBill(candidateRandomBillGtin);

    bills.push(bill)
    
}

const billRep: PrismaBillRepository = new PrismaBillRepository;

await billRep.createOpenBillBulk(bills);

console.log("Sucesso!")



