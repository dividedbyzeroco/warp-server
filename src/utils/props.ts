export const getPropertyDescriptor = (obj: any, prop: string) : PropertyDescriptor => {
    let desc;
    do {
        desc = Object.getOwnPropertyDescriptor(obj, prop);
    } 
    while (!desc && (obj = Object.getPrototypeOf(obj)));
    return desc;
}