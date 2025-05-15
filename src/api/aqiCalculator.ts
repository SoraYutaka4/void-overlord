interface AirQuality {
    pm2_5?: number;
    pm10?: number;
    co?: number;
    no2?: number;
    o3?: number;
    so2?: number;
    [key: string]: number | undefined; 
}

interface Thresholds {
    C_min: number;
    C_max: number;
    I_low: number;
    I_high: number;
}

function calculateAQI(concentration: number, thresholds: Thresholds): number {
    const { C_min, C_max, I_low, I_high } = thresholds;
    const AQI = ((concentration - C_min) / (C_max - C_min)) * (I_high - I_low) + I_low;
    return Math.round(AQI); 
}


function getMaxAQI(airQuality: AirQuality): number {
    const thresholds: { [key: string]: Thresholds } = {
        pm2_5: { C_min: 35.5, C_max: 55.4, I_low: 101, I_high: 150 },
        pm10: { C_min: 154, C_max: 254, I_low: 101, I_high: 150 },
    };

    let maxAQI = 0;

    for (const key in airQuality) {
        if (Object.prototype.hasOwnProperty.call(thresholds, key)) {
            const thresholdsForKey = thresholds[key as keyof typeof thresholds];
            if (thresholdsForKey) {
                const concentration = airQuality[key]!;
                const aqi = calculateAQI(concentration, thresholdsForKey);
                maxAQI = Math.max(maxAQI, aqi);
            }
        }
    }

    return maxAQI;
}

export function aqiCaculator(co: number, no2: number, o3: number, so2: number, pm2_5: number, pm10: number){
    const airQuality: AirQuality = {
        co,
        no2,
        o3,
        so2,
        pm2_5,
        pm10
    };

    const maxAQI = getMaxAQI(airQuality);

    return maxAQI;
}


