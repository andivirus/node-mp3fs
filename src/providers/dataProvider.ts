import * as fs from 'fs';
import * as NodeCache from "node-cache";
import {join} from "path";
import {Stats} from "fs";
import {TranscoderProvider} from "./transcoderProvider";

export class DataProvider {

    private readonly cache;
    private readonly SOURCE_PATH;
    private readonly transcoderProvider;

    constructor(sourcePath: string, transcoderProvider: TranscoderProvider) {
        this.SOURCE_PATH = sourcePath;
        const cacheOptions: NodeCache.Options = {
            stdTTL: 60,
            useClones: false
        }
        this.cache = new NodeCache(cacheOptions);
        this.transcoderProvider = transcoderProvider;
    }

    public async readdir(path: string): Promise<string[]> {
        const fullPath = this.constructPath(path);
        return fs.promises.readdir(fullPath);
    }

    private constructPath(path: string): string {
        if (path.endsWith('.flac.mp3')) {
            path = path.replace('.flac.mp3', '.flac')
        }
        return join(this.SOURCE_PATH, path);
    }

    public async stat(path: string): Promise<Stats> {
        const fullPath = this.constructPath(path);
        return fs.promises.stat(fullPath);
    }

    public async open(path: string): Promise<Buffer> {
        const fullPath = this.constructPath(path);
        const cacheKey = this.constructCacheKey(fullPath);
        let buffer: Buffer;
        buffer = this.cache.get(cacheKey);

        if (await buffer === undefined) {
            console.log(`Reading from FS: ${fullPath}`);
            buffer = await fs.promises.readFile(fullPath);
            const transcoder = this.transcoderProvider.returnTranscoder(fullPath);
            await transcoder.initialize();
            buffer = await transcoder.transcodeBuffer(buffer);
            this.cache.set(cacheKey, buffer);
        } else {
            console.log(`Reading from Cache: ${fullPath}`);
        }

        return buffer;
    }

    private constructCacheKey(path: string): string {
        return join(this.SOURCE_PATH, path);
    }

    public async releaseFile(path: string): Promise<void> {
        const cacheKey = this.constructCacheKey(path);
        this.cache.del(cacheKey);
    }
}

