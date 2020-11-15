import * as commander from "commander";

export default class OptionsProvider {

    private readonly options;

    constructor() {
        this.options = commander.program;

        this.options
            .option('-b, --bitrate <value>', 'Set bitrate of transcoded mp3 files', '320')
            .option('-q, --quality <value>', 'Set quality factor for LAME', '2')
            .requiredOption('-s, --sourcepath <path>', 'Set music directory')
            .requiredOption('-m, --mountpoint <path>', 'Set mountpoint of mp3fs');

        this.options.parse(process.argv);
    }

    get bitrate(): number {
        return parseInt(this.options.bitrate);
    }

    get quality(): number {
        return parseInt(this.options.quality);
    }

    get sourcepath(): string {
        return this.options.sourcepath;
    }

    get mountpoint(): string {
        return this.options.mountpoint;
    }
}
