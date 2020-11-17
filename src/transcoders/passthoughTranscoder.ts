import ITranscoder, {ITranscoderConfig} from "../interfaces/transcoder.interface";
import * as fs from "fs";
import {basename} from "path";



export class PassthoughTranscoder implements ITranscoder {
    private readonly config: ITranscoderConfig;
    private realFilePath: string;
    private initialized: Promise<void>;
    private fileContent: Buffer;

    constructor(config?: ITranscoderConfig) {
        if(config === undefined) throw new Error('Invalid Argument');
        this.config = config;
    }

    async transcode(): Promise<Buffer> {
        this.fileContent = await fs.promises.readFile(this.realFilePath);
        return this.fileContent;
    }
    getRealFilePath(): string {
        return this.realFilePath;
    }
    getMappedFilePath(): string {
        return this.getRealFilePath();
    }
    getRealFileName(): string {
        return basename(this.realFilePath);
    }
    getMappedFileName(): string {
        return this.getRealFileName();
    }
    getSize(): number {
        return fs.statSync(this.getRealFilePath()).size;
    }
    estimateMp3Size(): number {
        throw new Error("Method not implemented.");
    }
    getInitialized(): Promise<void> {
        return this.initialized;
    }
    getSupportedFileTypes(): string[] {
        throw new Error("Method not implemented.");
    }

    public initialize(): Promise<void> {
        this.realFilePath = this.config.realPath;
        this.initialized = Promise.resolve();

        return this.initialized;
    }

    public clone(config: ITranscoderConfig): ITranscoder {
        return new PassthoughTranscoder(config);
    }
}
