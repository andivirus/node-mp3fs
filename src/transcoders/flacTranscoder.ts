import ITranscoder from '../interfaces/transcoder.interface';
import * as Flac from 'libflacjs/dist/libflac.wasm';
import {Decoder} from 'libflacjs/lib/decoder';
import * as mm from 'music-metadata';
import * as NodeId3 from 'node-id3';
import {Lame} from "node-lame";
import {IAudioMetadata, IPicture} from "music-metadata";
import {Id3Image} from "../interfaces/id3_image";

export class FlacTranscoder implements ITranscoder {

    private initialized: boolean = false;
    private libFlac;

    private readonly outputBitrate: number;
    private readonly outputQuality: number;

    constructor(config?: any) {
        if (config !== undefined && config !== null) {
            this.outputBitrate = config.bitrate;
            this.outputQuality = config.quality;
        }
    }

    async initialize(): Promise<void> {
        return new Promise(resolve => {
            Flac.on('ready', event => {
                this.initialized = true;
                this.libFlac = event.target;
                resolve();
            })
        })
    }

    clone(config?: any): ITranscoder {
        return new FlacTranscoder(config);
    }

    getSupportedFileTypes(): string[] {
        return ['.flac'];
    }

    async transcodeBuffer(flacBuffer: Buffer): Promise<Buffer> {
        if (!this.initialized) {
            throw new Error('FlacTranscoder not initialized!');
        }

        const decoder = new Decoder(this.libFlac, {verify: true, enableRawMetadata: false})
        const metadata = await mm.parseBuffer(flacBuffer, {mimeType: 'audio/x-flac'})

        decoder.decode(new Uint8Array(flacBuffer));
        const resultArray = decoder.getSamples(true);
        const pcmBuffer = Buffer.from(resultArray);

        const encoder = new Lame({
            'output': 'buffer',
            // @ts-ignore
            bitrate: this.outputBitrate,
            // @ts-ignore
            quality: this.outputQuality,
            raw: true,
            // @ts-ignore
            sfreq: metadata.format.sampleRate / 1000,
            // @ts-ignore
            bitwidth: metadata.format.bitsPerSample,
            'little-endian': true,
            'crc-error-protection': true,
            "no-replaygain": true,
        }).setBuffer(pcmBuffer);

        let outputBuffer = Buffer.alloc(0);
        try {
            await encoder.encode();
            outputBuffer = encoder.getBuffer();
            const tags = this.transformMetadata(metadata);
            outputBuffer = NodeId3.update(tags, outputBuffer);
        } catch (e) {
            throw e;
        }
        return outputBuffer;
    }

    private transformMetadata(input: IAudioMetadata): NodeId3.Tags {
        const picture = input.common.picture;
        return {
            title: input.common.title,
            artist: input.common.artist,
            album: input.common.album,
            genre: input?.common?.genre?.join(),
            date: input.common.date,
            length: input.format.duration * 1000 + '',
            trackNumber: `${input.common.track.no.toString()}/${input.common.track.of}`,
            performerInfo: input.common.albumartist === null ? input.common.artist : input.common.albumartist,
            image: this.imageExists(picture) ? this.mapImageObject(picture[0]) : undefined,
            unsynchronisedLyrics: {language: '', text: input.common.lyrics?.join('\n')}
        };
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
}
