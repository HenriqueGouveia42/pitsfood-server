// scripts/block-prisma.js
console.error("\n---USO PROIBIDO DO COMANDO DIRETO---\n");
console.error("Por motivos de segurança e para evitar corrupção de dados entre ambientes,");
console.error("o uso direto de 'prisma' via npm/yarn foi desativado neste projeto.\n");
console.error("---COMO PROCEDER AGORA---:");
console.error("Sempre utilize o prefixo 'npm run db -- ' antes do seu comando.");
console.error("Ele fará a verificação de segurança, detectará a branch e injetará as variáveis corretas.\n");
console.error("Exemplos corretos:");
console.error("npm run db -- migrate dev             [CORRETO!]");
console.error("npm run db -- migrate reset           [CORRETO!]");
console.error("npm run db -- studio                  [CORRETO!]\n");
process.exit(1);