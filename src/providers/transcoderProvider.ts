import ITranscoder, {ITranscoderConfig} from "../interfaces/transcoder.interface";
import {PassthoughTranscoder} from "../transcoders/passthoughTranscoder";
import {NewFlacTranscoder} from "../transcoders/newFlacTranscoder";

export class TranscoderProvider {
    private availableTranscoders: ITranscoder[] = [];
    private readonly config: ITranscoderConfig;

    constructor(config?: ITranscoderConfig) {
        this.availableTranscoders.push(new NewFlacTranscoder());
        this.config = config;
    }

    public returnTranscoder(path: string): ITranscoder {
        this.config.realPath = path;

        for (const transcoder of this.availableTranscoders) {
            if (transcoder.getSupportedFileTypes().some(ending => path.endsWith(ending))) {
                return transcoder.clone(this.config);
            }
        }
        return new PassthoughTranscoder(this.config);
    }
}
