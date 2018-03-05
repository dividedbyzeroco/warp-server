export const toCamelCase = value => {
    return value.replace(/_\w/g, (word) => word[1].toUpperCase());
};

export const toPascalCase = value => {
    value = toCamelCase(value);
    value[0] = value[0].toUpperCase();
    return value;
};