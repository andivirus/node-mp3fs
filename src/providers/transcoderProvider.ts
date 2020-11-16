import {FlacTranscoder} from "../transcoders/flacTranscoder";
import ITranscoder from "../interfaces/transcoder.interface";
import {PassthoughTranscoder} from "../transcoders/passthoughTranscoder";

export class TranscoderProvider {
    private availableTranscoders: ITranscoder[] = [];
    private readonly config;

    constructor(config?: any) {
        this.availableTranscoders.push(new FlacTranscoder());
        this.config = config;
    }

    public returnTranscoder(path: string): ITranscoder {
        for (const transcoder of this.availableTranscoders) {
            if (transcoder.getSupportedFileTypes().some(ending => path.endsWith(ending))) {
                return transcoder.clone(this.config);
            }
        }
        return new PassthoughTranscoder();
    }
}
