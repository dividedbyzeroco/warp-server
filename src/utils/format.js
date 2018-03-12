// @flow
export const toCamelCase = (value: string) => {
    return value.replace(/_\w/g, (word) => word[1].toUpperCase());
};

export const toPascalCase = (value: string) => {
    value = toCamelCase(value);
    // $FlowFixMe
    value[0] = value[0].toUpperCase();
    return value;
};

export const toDatabaseDate = (value: string) => {
    return (new Date(value)).toISOString().slice(0, 19).replace('T', ' ');
};

export const toISODate = (value: string) => {
    return (new Date(value + '+00:00')).toISOString();
};

export const addToDate = (value: string, duration: number, unit: string) => {
    const date = new Date(value);
    const result = new Date(date);
    const unitMap = {
        'minutes': () => result.setMinutes(result.getMinutes() + duration),
        'hours': () => result.setHours(result.getHours() + duration),
        'days': () => result.setDate(result.getDate() + duration),
        'months': () => result.setMonth(result.getMonth() + duration),
        'years': () => result.setFullYear(result.getFullYear() + duration)
    };
    unitMap[unit]();
    return result;
};