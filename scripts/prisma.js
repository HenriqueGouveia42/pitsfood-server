import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

// 1. Descobre a branch atual com tratamento de erro
let branch;
try {
    branch = execSync('git branch --show-current', { stdio: 'pipe' }).toString().trim();
} catch (e) {
    console.error("❌ Erro: Não foi possível determinar a branch do git.");
    process.exit(1);
}

// 2. Proteção Estrita de Branch
if (branch !== 'main' && branch !== 'dev') {
    console.error(`\n❌ ERRO FATAL DE SEGURANÇA ❌`);
    console.error(`Tentativa de execução na branch '${branch}'.`);
    console.error(`Comandos do Prisma SÓ são permitidos nas branches 'main' ou 'dev'.\n`);
    process.exit(1);
}

// 3. Define o arquivo de ambiente e captura a URL do banco
const envFile = branch === 'main' ? '.env' : '.env.dev';
const envPath = path.resolve(process.cwd(), envFile);

if (!fs.existsSync(envPath)) {
    console.error(`\n❌ Erro: O arquivo ${envFile} não foi encontrado na raiz do projeto!\n`);
    process.exit(1);
}

// Extrai o banco de dados para exibir no aviso (buscando MULTI_TENANT_DATABASE_URL ou DATABASE_URL)
const envContent = fs.readFileSync(envPath, 'utf8');
const dbMatch = envContent.match(/^(?:MULTI_TENANT_DATABASE_URL|DATABASE_URL)=(.*)$/m);
let dbInfo = "Desconhecido (variável não encontrada)";

if (dbMatch && dbMatch[1]) {
    try {
        const rawUrl = dbMatch[1].replace(/['"]/g, '').trim();
        const parsedUrl = new URL(rawUrl);
        // Exibe o host e o nome do banco, escondendo o usuário e a senha
        dbInfo = `${parsedUrl.hostname}${parsedUrl.pathname}`;
    } catch(e) {
        dbInfo = "URL com formato irreconhecível";
    }
}

// 4. Captura os argumentos (ex: "migrate dev", "studio")
const args = process.argv.slice(2).join(' ');

if (!args) {
    console.error("❌ Erro: Nenhum comando do Prisma foi fornecido.");
    process.exit(1);
}

// 5. O ALERTA INTERATIVO NO TERMINAL
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`\n====================================================`);
console.log(`⚠️  ATENÇÃO: COMANDO PRISMA INTERCEPTADO`);
console.log(`====================================================`);
console.log(`📍 Branch Atual:    \x1b[33m${branch}\x1b[0m`);
console.log(`📄 Arquivo Env:     \x1b[33m${envFile}\x1b[0m`);
console.log(`🗄️  Banco de Alvo:   \x1b[31m${dbInfo}\x1b[0m`);
console.log(`⚙️  Comando:         \x1b[36mprisma ${args}\x1b[0m`);
console.log(`====================================================\n`);

rl.question(`Você tem CERTEZA que deseja executar este comando no banco acima? (s/N): `, (answer) => {
    rl.close();
    
    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'sim') {
        console.log(`\n🛑 Operação abortada com segurança.\n`);
        process.exit(0);
    }

    console.log(`\n🚀 Iniciando execução...\n`);

    try {
        // Bypass de Binário: Resolvemos o caminho direto do motor do Prisma.
        const prismaBin = path.resolve(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
        
        // Executa injetando o env-file correto
        const command = `node --env-file=${envFile} "${prismaBin}" ${args}`;
        
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        process.exit(1);
    }
});