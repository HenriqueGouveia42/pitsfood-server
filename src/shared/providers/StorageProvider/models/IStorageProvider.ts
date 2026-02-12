export interface IStorageProvider {
    /**
     * @param file nome do arquivo (path) onde será salvo. Ex: "logos/loja-id.png"
     * @param content buffer do arquivo (conteúdo binário na memória)
     * @param contentType tipo do arquivo (ex: "image/png"). Essencial para o navegador abrir e não baixar.
     * @returns URL pública completa do arquivo salvo.
     */
    save(file: string, content: Buffer, contentType: string): Promise<string>;

    delete(file: string): Promise<void>;
}