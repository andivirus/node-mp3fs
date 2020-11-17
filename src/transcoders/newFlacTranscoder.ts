import * as NodeID3 from 'node-id3';
import {Id3Image} from '../interfaces/id3_image';
import * as Flac from 'libflacjs/dist/libflac.wasm';
import * as mm from 'music-metadata';
import {IAudioMetadata, ICommonTagsResult, IPicture} from 'music-metadata';
import {Decoder} from 'libflacjs/lib/decoder';
import * as fs from 'fs';
import {Lame} from "node-lame";
import {basename} from "path";
import ITranscoder, {ITranscoderConfig} from "../interfaces/transcoder.interface";

export class NewFlacTranscoder implements ITranscoder {
    private readonly config: ITranscoderConfig;
    private realFilePath: string;
    private mappedFilePath: string;
    private size: number;
    private metadata: IAudioMetadata;
    private id3Metadata: NodeID3.Tags;
    private initialized: Promise<void>;
    private libFlac;
    private outputBitrate: number;
    private outputQuality: number;
    private fileContent: Buffer;
    private transcoded;

    constructor(config?: ITranscoderConfig) {
        if(config === undefined) throw new Error('Invalid Argument');
        this.config = config;
    }

    public initialize(): Promise<void> {
        this.realFilePath = this.config.realPath;
        this.mappedFilePath = this.config.realPath.replace(/\.flac$/, '.mp3');
        this.outputBitrate = this.config.outputBitrate;
        this.outputQuality = this.config.outputQuality;
        this.initialized = new Promise(resolve => {
            Flac.on('ready', async event => {
                await this.readMetadata();
                this.id3Metadata = this.transformMetadata();
                this.libFlac = event.target;
                resolve();
            })
        })

        return this.initialized;
    }

    private async readMetadata() {
        this.metadata = await mm.parseFile(this.realFilePath, {duration: true});
    }

    private transformMetadata(): NodeID3.Tags {
        const input = this.metadata;
        const picture = input.common.picture;
        return {
            title: input.common.title,
            artist: input.common.artist,
            album: input.common.album,
            genre: input?.common?.genre?.join(),
            date: input.common.date,
            length: input.format.duration * 1000 + '',
            trackNumber: this.generateTrackNumber(input.common),
            performerInfo: input.common.albumartist === null ? input.common.artist : input.common.albumartist,
            image: this.imageExists(picture) ? this.mapImageObject(picture[0]) : undefined,
            unsynchronisedLyrics: {language: '', text: input.common.lyrics?.join('\n')}
        };
    }

    private generateTrackNumber(commonTags: ICommonTagsResult): string {
        let returnString = '';
        if (commonTags !== null && commonTags !== undefined) {
            if (commonTags.track !== null && commonTags.track !== undefined) {
                if (commonTags.track.no !== null && commonTags.track.no !== undefined) {
                    returnString += `${commonTags.track.no}`;
                    if (commonTags.track.of !== null && commonTags.track.of !== undefined) {
                        returnString += `/${commonTags.track.of}`
                    }
                }
            }
        }

        return returnString;
    }

    private imageExists(picture: IPicture[] | undefined): boolean {
        return picture !== undefined && picture.length !== 0;
    }

    private mapImageObject(picture: IPicture): Id3Image {
        return {
            type: {id: 0, name: picture.type},
            mime: picture.format,
            description: picture.description,
            imageBuffer: picture.data
        }
    }

    public async transcode(): Promise<Buffer> {
        await this.decodeFlac();
        await this.encodeMp3();
        this.transcoded = true;
        return this.fileContent;
    }

    private async decodeFlac() {
        if (!this.initialized) {
            throw new Error('FlacTranscoder not initialized!');
        }

        const decoder = new Decoder(this.libFlac, {verify: true, enableRawMetadata: false});
        this.fileContent = await fs.promises.readFile(this.realFilePath)
        decoder.decode(new Uint8Array(this.fileContent))
        this.fileContent = Buffer.from(decoder.getSamples(true));
        this.size = this.fileContent.length;
    }

    private async encodeMp3() {
        const encoder = new Lame({
            'output': 'buffer',
            // @ts-ignore
            bitrate: this.outputBitrate,
            // @ts-ignore
            quality: this.outputQuality,
            raw: true,
            // @ts-ignore
            sfreq: this.metadata.format.sampleRate / 1000,
            // @ts-ignore
            bitwidth: this.metadata.format.bitsPerSample,
            'little-endian': true,
            'crc-error-protection': true,
            "no-replaygain": true,
        }).setBuffer(this.fileContent);

        await encoder.encode();
        this.fileContent = NodeID3.update(this.id3Metadata, encoder.getBuffer())
        this.size = this.fileContent.length;
    }

    public getRealFilePath(): string {
        return this.realFilePath;
    }

    public getMappedFilePath(): string {
        return this.mappedFilePath;
    }

    public getRealFileName(): string {
        return basename(this.realFilePath);
    }

    public getMappedFileName(): string {
        return basename(this.mappedFilePath);
    }

    public getSize(): number {
        return this.size;
    }

    public getMetadata(): IAudioMetadata {
        return this.metadata;
    }

    public getId3Metadata(): NodeID3.Tags {
        return this.id3Metadata;
    }

    public estimateMp3Size(): number {
        const musicSizeInBytes = (this.metadata.format.duration * this.outputBitrate) / 8 * 1000;
        const tagSizeInBytes = NodeID3.create(this.id3Metadata).byteLength;
        return musicSizeInBytes + tagSizeInBytes;
    }

    public getInitialized(): Promise<void> {
        return  this.initialized;
    }

    public getSupportedFileTypes(): string[] {
        return ['.flac'];
    }

    public clone(config: ITranscoderConfig): ITranscoder {
        return new NewFlacTranscoder(config);
    }
}
