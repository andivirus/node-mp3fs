import {IAudioMetadata} from "music-metadata";
import * as NodeID3 from "node-id3";

export type ITranscoderConfig = {
    realPath?: string,
    outputBitrate: number,
    outputQuality: number
}

export default interface ITranscoder {
    initialize();
    clone(config: ITranscoderConfig): ITranscoder;
    transcode(): Promise<Buffer>;
    getRealFilePath(): string;
    getMappedFilePath(): string;
    getRealFileName(): string;
    getMappedFileName(): string;
    getSize(): number;
    /*
    getMetadata(): IAudioMetadata;
    getId3Metadata(): NodeID3.Tags;
     */
    estimateMp3Size(): number;
    getInitialized(): Promise<void>;
    getSupportedFileTypes(): string[];
}
