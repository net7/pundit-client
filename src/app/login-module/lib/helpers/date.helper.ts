export const getDateFromTimestamp = (expiresIn: number): string => {
    if (!expiresIn || typeof expiresIn !== 'number' || expiresIn < 0) {
        return new Date().toISOString();
    }
    return new Date(Date.now() + ((expiresIn) * 1000)).toISOString();
};
