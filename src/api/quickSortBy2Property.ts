export function quickSortByCombined<T>(array: T[], property1: keyof T, property2: keyof T, left: number = 0, right: number = array.length - 1): T[] {
    if (left >= right) return array; 

    const pivotIndex = partitionByCombined(array, property1, property2, left, right);
    quickSortByCombined(array, property1, property2, left, pivotIndex - 1);
    quickSortByCombined(array, property1, property2, pivotIndex + 1, right);

    return array; 
}

function partitionByCombined<T>(array: T[], property1: keyof T, property2: keyof T, left: number, right: number): number {
    const pivotSum = (array[right][property1] as unknown as number) + (array[right][property2] as unknown as number); 

    let i = left - 1;

    for (let j = left; j < right; j++) {
        const currentSum = (array[j][property1] as unknown as number) + (array[j][property2] as unknown as number); 

        if (currentSum < pivotSum) {
            i++;
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    [array[i + 1], array[right]] = [array[right], array[i + 1]];
    return i + 1;
}
