export interface Id3Image {
    mime: string,
    type: {
        id: number,
        name: string
    },
    description: string,
    imageBuffer: Buffer
}
