export function quickSortByProperty<T>(array: T[], property: keyof T, left: number = 0, right: number = array.length - 1): T[] {
    if (left >= right) return array; 

    const pivotIndex = partition(array, property, left, right); 
    quickSortByProperty(array, property, left, pivotIndex - 1); 
    quickSortByProperty(array, property, pivotIndex + 1, right); 

    return array; 
}

function partition<T>(array: T[], property: keyof T, left: number, right: number): number {
    const pivot = array[right][property]; 
    let i = left - 1;

    for (let j = left; j < right; j++) {
        if (array[j][property] <= pivot) { 
            i++;
            [array[i], array[j]] = [array[j], array[i]]; 
        }
    }

    [array[i + 1], array[right]] = [array[right], array[i + 1]]; 
    return i + 1; 
}
