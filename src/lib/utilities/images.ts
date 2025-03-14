import sharp from 'sharp';

export const imageExtension = (url: string) => {
    const urlWithoutParams = url.split(/[?#]/)[0];
    const filename = urlWithoutParams?.split('/').pop();
    // @ts-ignore
    const extension = filename.split('.').pop().toLowerCase();

    return extension as string;
};

export const fetchImage = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        return null;
    }

    const blob = await response.blob();
    return Buffer.from(await blob.arrayBuffer());
};

export const rotateImage = (image: Buffer, degrees: number) =>
    sharp(image).rotate(degrees).toBuffer();

export const blackAndWhiteImage = (image: Buffer) =>
    sharp(image).greyscale().toBuffer();
