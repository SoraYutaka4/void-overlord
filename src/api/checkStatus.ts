export const checkApiStatus = (statusCodeOrFn: number | (() => number)): boolean => {
    const statusCode = typeof statusCodeOrFn === "function" ? statusCodeOrFn() : statusCodeOrFn;
    return statusCode >= 200 && statusCode < 300;
}