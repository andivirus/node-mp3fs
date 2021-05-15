import * as fs from 'fs';
import * as NodeCache from "node-cache";
import {join} from "path";
import {Stats} from "fs";
import {TranscoderProvider} from "./transcoderProvider";
import * as mm from 'music-metadata';

export class DataProvider {

    private sizeLimit = 400 * 1000 * 1000;
    private sizeMap: Map<string, number> = new Map<string, number>();

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
        let stats = await fs.promises.stat(fullPath);
        if(fullPath.endsWith('.flac')) {
            const meta = await mm.parseFile(fullPath)
            const estimate = (meta.format.duration * 320) / 8 * 1000 + meta.common.picture.reduce(
                (previousValue , currentValue) =>  previousValue + currentValue.data.length, 0)
            console.log(`estimate = ${estimate}`);
            stats.size = estimate;
        }
        return stats
    }

    public async open(path: string): Promise<Buffer> {
        const fullPath = this.constructPath(path);
        const cacheKey = this.constructCacheKey(fullPath);
        let buffer: Buffer;
        buffer = this.cache.get(cacheKey);

        if (await buffer === undefined) {

            const size = fs.statSync(fullPath).size;
            let mapSize = 0;
            (() => {
                this.sizeMap.forEach((value, key) => {
                    mapSize += value;
                })
            })();
            if(size + mapSize > this.sizeLimit) {
                console.log(`SIZE TOO LARGE!!! ${size + mapSize}`);
                throw new Error('too large')
            }

            this.sizeMap.set(cacheKey, size);
            console.log(`Reading from FS: ${fullPath}`);
            buffer = await fs.promises.readFile(fullPath);
            const transcoder = this.transcoderProvider.returnTranscoder(fullPath);
            await transcoder.initialize();
            buffer = await transcoder.transcodeBuffer(buffer);
            this.sizeMap.set(cacheKey, buffer.byteLength);
            console.log(buffer.byteLength)
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
        this.sizeMap.delete(cacheKey);
    }

}

