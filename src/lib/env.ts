type EnvKeys = 'TOKEN' | 'CLIENT_ID' | 'IMGBB_API_KEY';

/**
 * Get the value of an environment variable.
 */
export const $e = (key: EnvKeys | (string & {})) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
};
