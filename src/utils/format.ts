export const toCamelCase = (value: string) => {
    return value.replace(/_\w/g, (word) => word[1].toUpperCase());
};

export const toPascalCase = (value: string) => {
    value = toCamelCase(value);
    value = value[0].toUpperCase() + value.slice(1);
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
        'minute': () => result.setMinutes(result.getMinutes() + duration),
        'minutes': () => result.setMinutes(result.getMinutes() + duration),
        'hour': () => result.setHours(result.getHours() + duration),
        'hours': () => result.setHours(result.getHours() + duration),
        'day': () => result.setDate(result.getDate() + duration),
        'days': () => result.setDate(result.getDate() + duration),
        'month': () => result.setMonth(result.getMonth() + duration),
        'months': () => result.setMonth(result.getMonth() + duration),
        'year': () => result.setFullYear(result.getFullYear() + duration),
        'years': () => result.setFullYear(result.getFullYear() + duration)
    };
    unitMap[unit]();
    return result;
};

export const toDateTime = (value?: string) => {
    if(!value) return new Date();
    else return new Date(value);
};