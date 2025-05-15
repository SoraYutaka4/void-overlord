import { aqiCaculator } from "./aqiCalculator";
import { get_API_Key } from "../key";
import axios from "axios";

function checkProvinceCoordinates(id: number): string {
    switch (id) {
        case 1: return "21.0285, 105.8542";  // Hà Nội
        case 2: return "22.8037, 104.9784";  // Hà Giang
        case 3: return "22.6657, 106.2579";  // Cao Bằng
        case 4: return "22.1477, 105.8342";  // Bắc Kạn
        case 5: return "21.8195, 105.2151";  // Tuyên Quang
        case 6: return "22.3398, 104.1487";  // Lào Cai
        case 7: return "21.3860, 103.0167";  // Điện Biên
        case 8: return "22.4002, 103.4700";  // Lai Châu
        case 9: return "21.3273, 103.9105";  // Sơn La
        case 10: return "21.7229, 104.9113"; // Yên Bái
        case 11: return "20.8465, 105.3272"; // Hòa Bình
        case 12: return "21.5942, 105.8485"; // Thái Nguyên
        case 13: return "21.8528, 106.7568"; // Lạng Sơn
        case 14: return "21.0064, 107.2925"; // Quảng Ninh
        case 15: return "21.2730, 106.1948"; // Bắc Giang
        case 16: return "21.3220, 105.4011"; // Phú Thọ
        case 17: return "21.3080, 105.6049"; // Vĩnh Phúc
        case 18: return "21.1592, 106.0764"; // Bắc Ninh
        case 19: return "20.9409, 106.3308"; // Hải Dương
        case 20: return "20.8449, 106.6881"; // Hải Phòng
        case 21: return "20.6461, 106.0511"; // Hưng Yên
        case 22: return "20.4463, 106.3364"; // Thái Bình
        case 23: return "20.5835, 105.9220"; // Hà Nam
        case 24: return "20.4200, 106.1686"; // Nam Định
        case 25: return "20.2510, 105.9750"; // Ninh Bình
        case 26: return "19.8067, 105.7770"; // Thanh Hóa
        case 27: return "19.2359, 104.9160"; // Nghệ An
        case 28: return "18.3550, 105.8875"; // Hà Tĩnh
        case 29: return "17.4923, 106.5944"; // Quảng Bình
        case 30: return "16.7356, 107.1861"; // Quảng Trị
        case 31: return "16.4637, 107.5905"; // Thừa Thiên Huế
        case 32: return "16.0544, 108.2022"; // Đà Nẵng
        case 33: return "15.5724, 108.4740"; // Quảng Nam
        case 34: return "15.1223, 108.8047"; // Quảng Ngãi
        case 35: return "14.1665, 108.9035"; // Bình Định
        case 36: return "13.0882, 109.3086"; // Phú Yên
        case 37: return "12.2587, 109.0526"; // Khánh Hòa
        case 38: return "11.5640, 109.0233"; // Ninh Thuận
        case 39: return "10.9804, 108.2625"; // Bình Thuận
        case 40: return "14.3489, 107.9875"; // Kon Tum
        case 41: return "13.9816, 108.4856"; // Gia Lai
        case 42: return "12.6865, 108.0382"; // Đắk Lắk
        case 43: return "12.1873, 107.7341"; // Đắk Nông
        case 44: return "11.9327, 108.4450"; // Lâm Đồng
        case 45: return "11.5752, 106.9210"; // Bình Phước
        case 46: return "11.3402, 106.0865"; // Tây Ninh
        case 47: return "11.2114, 106.7129"; // Bình Dương
        case 48: return "10.9457, 106.8342"; // Đồng Nai
        case 49: return "10.3450, 107.0843"; // Bà Rịa - Vũng Tàu
        case 50: return "10.8231, 106.6297"; // Hồ Chí Minh
        case 51: return "10.5260, 106.4137"; // Long An
        case 52: return "10.4489, 106.3429"; // Tiền Giang
        case 53: return "10.2350, 106.3755"; // Bến Tre
        case 54: return "9.8127, 106.2993";  // Trà Vinh
        case 55: return "10.2560, 106.0185"; // Vĩnh Long
        case 56: return "10.4935, 105.6365"; // Đồng Tháp
        case 57: return "10.3771, 105.4235"; // An Giang
        case 58: return "10.0122, 105.0809"; // Kiên Giang
        case 59: return "10.0452, 105.7469"; // Cần Thơ
        case 60: return "9.7848, 105.4711";  // Hậu Giang
        case 61: return "9.6039, 105.9780";  // Sóc Trăng
        case 62: return "9.2857, 105.7241";  // Bạc Liêu
        case 63: return "9.1769, 105.1524";  // Cà Mau
        default: return "0, 0"; // Mã tỉnh không hợp lệ
    }
}

function checkAQI(num: number): string {
    switch (true) {
        case (num >= 0 && num <= 50):
            return "Good";
        case (num >= 51 && num <= 100):
            return "Moderate";
        case (num >= 101 && num <= 200):
            return "Unhealthy";
        case (num >= 201 && num <= 300):
            return "Very Unhealthy";
        case (num >= 301 && num <= 500):
            return "Hazardous";
        default:
            return "Giá trị AQI không hợp lệ.";
    }
}

function checkUV(num: number): string {
    switch (true) {
        case (num >= 0 && num <= 2):
            return "Low";
        case (num >= 3 && num <= 5):
            return "Medium";
        case (num >= 6 && num <= 7):
            return "High";
        case (num >= 8 && num <= 10):
            return "Very High";
        case (num > 11):
            return "Hazardous";
        default:
            return "Giá trị UV không hợp lệ.";
    }
}

export async function weather(id: number) {
    try {
        const apiKeys = get_API_Key("WEATHER_API_KEY");

        if (!apiKeys?.length) {
            console.error("❌[WEATHER_API_KEY] Missing Weather API Keys.");
            return;
        }

        const apiKey = apiKeys[Math.floor(Math.random() * apiKeys?.length)];

        const location = checkProvinceCoordinates(id);
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${location}&aqi=yes`;
        
        const res = await axios.get(url, { timeout: 5000 });
        const data = res.data;
    
        if (data.error) return;
    
        const co = data.current.air_quality.co ?? 0;
        const no2 = data.current.air_quality.no2 ?? 0;
        const o3 = data.current.air_quality.o3 ?? 0;
        const so2 = data.current.air_quality.so2 ?? 0;
        const pm2_5 = data.current.air_quality.pm2_5 ?? 0;
        const pm10 = data.current.air_quality.pm10 ?? 0;

        const aqi = aqiCaculator(co, no2, o3, so2, pm2_5, pm10);

        const aqi_status = checkAQI(aqi);
        const uv_status = checkUV(data.current.uv);
    
        return {
            location: {
                name: data.location.name,
                country: data.location.country
            },
            current: {
                time: data.current.last_updated,
                is_day: data.current.is_day,
                temp_c: Math.round(data.current.temp_c),
                condition: {
                    text: data.current.condition.text,
                    icon: data.current.condition.icon,
                    code: data.current.condition.code,
                },
                feelslike_c: Math.round(data.current.feelslike_c),
                uv: data.current.uv,
                wind_kph: Math.round(data.current.wind_kph),
                wind_dir: data.current.wind_dir,
                gust_kph: Math.round(data.current.gust_kph),
                aqi: Math.round(aqi),
                aqi_status,
                cloud: Math.round(data.current.cloud),
                humidity: Math.round(data.current.humidity),
                uv_status
            }
        }
        
    } catch (error) {
        console.error(error);
    }

}