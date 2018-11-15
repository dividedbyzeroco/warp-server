export const toCamelCase = (value: string) => {
    return value.replace(/_\w/g, word => word[1].toUpperCase());
};

export const toPascalCase = (value: string) => {
    value = toCamelCase(value);
    value = value[0].toUpperCase() + value.slice(1);
    return value;
};

export const toSnakeCase = (value: string) => {
    return value.replace(/\.?([A-Z]+)/g, word => '_' + word.toLowerCase()).replace(/^_/, '');
}

export const toDatabaseDate = (value: string) => {
    return (new Date(value)).toISOString().slice(0, 19).replace('T', ' ');
};

export const toISODate = (value: string) => {
    return (new Date(value + '+00:00')).toISOString();
};

export const addToDate = (value: string, span: string) => {
    const [duration, unit] = span.split(' ');
    const date = new Date(value);
    const result = new Date(date);
    const unitMap = {
        'minute': () => result.setMinutes(result.getMinutes() + parseFloat(duration)),
        'minutes': () => result.setMinutes(result.getMinutes() + parseFloat(duration)),
        'hour': () => result.setHours(result.getHours() + parseFloat(duration)),
        'hours': () => result.setHours(result.getHours() + parseFloat(duration)),
        'day': () => result.setDate(result.getDate() + parseFloat(duration)),
        'days': () => result.setDate(result.getDate() + parseFloat(duration)),
        'month': () => result.setMonth(result.getMonth() + parseFloat(duration)),
        'months': () => result.setMonth(result.getMonth() + parseFloat(duration)),
        'year': () => result.setFullYear(result.getFullYear() + parseFloat(duration)),
        'years': () => result.setFullYear(result.getFullYear() + parseFloat(duration))
    };
    unitMap[unit]();
    return result;
};

export const toDateTime = (value?: string) => {
    if(!value) return new Date();
    else return new Date(value);
};