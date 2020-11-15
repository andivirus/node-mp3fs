import * as Commander from 'commander';
import * as Fuse from 'fuse-native';
import {constants} from 'os';
import {Stats} from "fs";
import OptionsProvider from "./providers/optionsProvider";
import {DataProvider} from "./providers/dataProvider";
import {TranscoderProvider} from "./providers/transcoderProvider";


const optionParser = new OptionsProvider();

const transcoderProvider = new TranscoderProvider({
    bitrate: optionParser.bitrate,
    quality: optionParser.quality
});

const dataProvider = new DataProvider(optionParser.sourcepath, transcoderProvider);

const ops = {
    readdir: async function (path: string, cb): Promise<any> {
        try {
            let files = await dataProvider.readdir(path);
            files = files.map(filename => filename.endsWith('.flac') ?
                filename.replace('.flac', '.flac.mp3') : filename);
            return cb(0, files);
        } catch (e) {
            console.error(e);
            return cb(1, undefined);
        }
    },
    getattr: async function (path: string, cb): Promise<any> {
        try {
            const stat: Stats = await dataProvider.stat(path);
            //TODO: Fix permissions

            return cb(0, stat);
        } catch (e) {
            return cb(-constants.errno.ENOENT, null);
        }
    },
    read: async function (path: string, fd: any, buffer: any, length: number, position: number, cb): Promise<any> {
        let data = Buffer.alloc(0);
        try {
            data = await dataProvider.open(path);
        } catch (e) {
            console.error(e as Error);
        }
        //TODO: move calculations to dataProvider
        if (position >= data.length) {
            return cb(0);
        }
        const bytesToCopy = Math.min(data.length, position + length);
        let part = data.slice(position, bytesToCopy);
        part.copy(buffer);
        return cb(part.length);
    },
    release: async function (path: string, fd: any, cb: any): Promise<any> {
        await dataProvider.releaseFile(path);
        cb(0);
    }
}


const MOUNTPOINT = optionParser.mountpoint;
const fuse = new Fuse(MOUNTPOINT, ops, {autoCache: true, debug: true, force: true, mkdir: true});
mountFuse();

function mountFuse() {
    fuse.mount(err => {
        if (err) {
            throw err;
        }
        process.once('SIGINT', () => {
            console.log('SIGINT received');
            unmountFuse();
        })
        process.on('exit', () => {
            console.log('exit received');
            unmountFuse();
        })
    })
    console.log(`Node-MP3FS mounted at ${fuse.mnt}`)
}

function unmountFuse() {
    fuse.unmount(err => {
        if (err) {
            console.log(`filesystem at ${fuse.mnt} not unmounted: ${err}`)
        } else {
            console.log(`filesystem at ${fuse.mnt} unmounted.`)
        }
    })
}
