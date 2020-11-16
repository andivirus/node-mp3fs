import {IAudioMetadata} from "music-metadata";

export default interface ITranscoder {
    getSupportedFileTypes(): string[],
    clone(config?: any): ITranscoder,
    transcodeBuffer(inputBuffer: Buffer): Promise<Buffer>;
    initialize(): Promise<void>
    //getMetadata(inputBuffer: Buffer): IAudioMetadata
}
