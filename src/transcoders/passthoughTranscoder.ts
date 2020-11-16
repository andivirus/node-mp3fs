import ITranscoder from "../interfaces/transcoder.interface";

export class PassthoughTranscoder implements ITranscoder {

    clone(): ITranscoder {
        return new PassthoughTranscoder();
    }

    getSupportedFileTypes(): string[] {
        return [];
    }

    initialize(): Promise<void> {
        return Promise.resolve();
    }

    transcodeBuffer(inputBuffer: Buffer): Promise<Buffer> {
        return Promise.resolve(inputBuffer);
    }

}
