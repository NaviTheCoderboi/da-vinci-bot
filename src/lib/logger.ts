interface Color {
    r: number;
    g: number;
    b: number;
}

const getColored = (color: Color, text: string) => {
    const { r, g, b } = color;
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
};

const header = getColored({ r: 251, g: 100, b: 182 }, '[Da Vinci]');
const bar = getColored({ r: 255, g: 255, b: 255 }, '|');

const format = (text: string) => {
    const current = new Date().toLocaleTimeString();

    return `${header} ${bar} ${getColored(
        {
            r: 237,
            g: 107,
            b: 255
        },
        current
    )} ${bar} ${text}`;
};

export const logger = {
    info: (...text: any[]) =>
        console.info(
            format(
                getColored(
                    {
                        r: 0,
                        g: 213,
                        b: 190
                    },
                    text.join(' ')
                )
            )
        ),
    error: (...text: any[]) =>
        console.error(
            format(
                getColored(
                    {
                        r: 255,
                        g: 32,
                        b: 86
                    },
                    text.join(' ')
                )
            )
        ),
    warn: (...text: any[]) =>
        console.warn(
            format(
                getColored(
                    {
                        r: 255,
                        g: 137,
                        b: 4
                    },
                    text.join(' ')
                )
            )
        ),
    critical: (...text: any[]) =>
        console.error(
            format(
                getColored(
                    {
                        r: 251,
                        g: 44,
                        b: 54
                    },
                    text.join(' ')
                )
            )
        ),
    success: (...text: any[]) =>
        console.info(
            format(
                getColored(
                    {
                        r: 5,
                        g: 223,
                        b: 114
                    },
                    text.join(' ')
                )
            )
        )
};
