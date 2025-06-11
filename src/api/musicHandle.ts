import Jimp from "jimp";
import path from "path";
import axios from "axios";
import qs from "qs";
import * as cheerio from 'cheerio';
import JSON5 from 'json5';
import { get_API_Key } from "../key";
import fs from "fs";

interface Track {
    id: number;
    name: string;
    preview_url: string;
    album_img_url: string;
    artists: string;
}

async function getSpotifyPreviewUrl(spotifyTrackId: string): Promise<string | null> {
    try {
        const embedUrl = `https://open.spotify.com/embed/track/${spotifyTrackId}`;
        const response = await fetch(embedUrl);
        const html = await response.text();
        const matches = html.match(/"audioPreview":\s*{\s*"url":\s*"([^"]+)"/);
        return matches ? matches[1] : null;
    } catch (error) {
        console.error("❌ Failed to fetch Spotify preview URL:", error);
        return null;
    }
}

async function filterTracks(tracks: any[]): Promise<Track[]> {
    if (!tracks.length) return [];

    const uniqueTracksMap = new Map();
    for (const track of tracks) {
        if (!uniqueTracksMap.has(track.name)) {
            uniqueTracksMap.set(track.name, track);
        }
    }

    const uniqueTracks = Array.from(uniqueTracksMap.values()).filter(track => track.album.images.length > 0).slice(0, 10);

    const previewUrls = await Promise.all(
        uniqueTracks.map(track => getSpotifyPreviewUrl(track.id))
    );

    return uniqueTracks.map((track, index) => ({
        id: index + 1,
        name: track.name,
        preview_url: previewUrls[index] || "",
        album_img_url: track.album.images[0].url,
        artists: track.artists.map((artist: { name: string }) => artist.name).join(', ')
    }));
}

async function fetchImgURL(url: string): Promise<Jimp> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Jimp.read(Buffer.from(response.data, 'binary'));
}

async function getAccessToken(): Promise<string | null> {
    try {
        const clientIdArray = get_API_Key("SPOTIFY_CLIENT_ID");
        const clientSecretArray = get_API_Key("SPOTIFY_CLIENT_SECRET");

        if (!clientIdArray?.length || !clientSecretArray?.length) {
            console.error("[ SPOTIFY_CLIENT_ID | SPOTIFY_CLIENT_SECRET ] Missing Spotify API keys.");
            return null;
        }

        const clientId = clientIdArray[0];
        const clientSecret = clientSecretArray[0];

        const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
            grant_type: 'client_credentials'
        }), {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error("❌ Error getting Spotify access token:", error);
        return null;
    }
}

async function createImage(content: string) {
    try {
        const res = await axios.get("http://localhost:8000/api/tracks");
        const tracks: Track[] = res.data;

        if (!tracks?.length) return;

        const limitedTracks = tracks.slice(0, 12);
        const baseImg = await Jimp.read(path.join(__dirname, "..", "public", "img", "music.png"));

        const [font1, font2, font4, font5] = await Promise.all([
            Jimp.loadFont(path.join(__dirname, "..", 'public', "font", 'Roboto_52_ExtraBold.fnt')),
            Jimp.loadFont(path.join(__dirname, "..", 'public', "font", 'DejaVuSansMono_74_Bold.fnt')),
            Jimp.loadFont(path.join(__dirname, "..", 'public', "font", 'Roboto_74_ExtraBold_Black.fnt')),
            Jimp.loadFont(path.join(__dirname, "..", 'public', "font", 'Roboto_42_Black.fnt'))
        ]);

        let y = 395;
        const albumImages = await Promise.all(limitedTracks.map(track => fetchImgURL(track.album_img_url)));

        for (let i = 0; i < limitedTracks.length; i++) {
            const track = limitedTracks[i];
            baseImg.print(font2, 130, y, track.id);
            albumImages[i].resize(228, 195);
            baseImg.composite(albumImages[i], 270, y - 60);
            baseImg.print(font1, 525, y - 20, track.name.length > 30 ? track.name.slice(0, 27) + "..." : track.name);
            baseImg.print(font5, 525, y + 40, track.artists);
            y += 195;
        }

        baseImg.print(font4, 200, 120, content.length > 28 ? content.slice(0, 23) + "..." : content);

        const musicPath = path.join(__dirname, "..", "public", "music");
        if (!fs.existsSync(musicPath)) fs.mkdirSync(musicPath, { recursive: true });

        await baseImg.writeAsync(path.join(musicPath, "musicList.png"));

        console.log("✅ Image saved successfully!");

    } catch (error) {
        console.error("❌ Error creating image:", error);
    }
}

export async function musicHandle(search: string): Promise<boolean> {
    try {
        const token = await getAccessToken();
        if (!token) return false;

        const { data } = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(search)}&type=track&limit=15`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const items = await filterTracks(data.tracks.items);
        if (!items.length) return false;

        const res2 = await axios.put("http://localhost:8000/api/tracks", items);
        if (res2.status !== 200) return false;

        await createImage(search);
        return true;

    } catch (error) {
        console.error("❌ Error in musicHandle:", error);
        return false;
    }
}






interface LyricsData {
    songPage: {
        lyricsData: {
            body: {
                html: string;
            };
        };
    };
}

interface ERROR {
    error: boolean;
    code: number;
    message: string;
}

export async function fetchLyricsGenius(url: string): Promise<string | ERROR> {
    try {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const $ = cheerio.load(html);

        const preloadedScript = $('script')
            .map((i, el) => $(el).html())
            .get()
            .find(scriptContent => scriptContent?.includes('window.__PRELOADED_STATE__'));

        if (!preloadedScript) {
            throw new Error('PRELOADED_STATE script not found');
        }

        const regex = /window\.__PRELOADED_STATE__\s*=\s*JSON\.parse\(\s*'(.+?)'\s*\)/s;
        const match = preloadedScript.match(regex);

        if (!match || !match[1]) {
            throw new Error('Failed to match JSON string');
        }

        const jsonStr = JSON5.parse(`'${match[1]}'`);
        const preloadedState: LyricsData = JSON.parse(jsonStr);

        const lyricsHtml = preloadedState.songPage?.lyricsData?.body?.html;
        if (!lyricsHtml) {
            throw new Error('Lyrics HTML not found in JSON');
        }

        const $$ = cheerio.load(lyricsHtml);
        let lyrics = '';
        const seen = new Set<string>(); 

        $$('p').each((_, el) => {
            const text = $$(el).text().trim();

            if (text && !seen.has(text)) {
                lyrics += text + '\n';
                seen.add(text);
            }
        });

        lyrics = lyrics.replace(/\n{3,}/g, '\n\n').trim();

        return lyrics;
    } catch (error) {
        const errorResponse: ERROR = {
            error: true,
            code: 500,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
        return errorResponse;
    }
}

export async function geniusSearch(query: string): Promise<any[] | null> {
    try {
        const tokens = get_API_Key("genius");
        if (!tokens || !tokens.length) {
            console.error("[genius] Missing Genius API Key.")
            return [];
        }

        const token = tokens[Math.floor(Math.random() * tokens.length)];

        const response = await axios.get(`https://api.genius.com/search`, {
            params: { q: query },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.response.hits;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("❌ Genius API Error:", error.response?.data || error.message);
        } else {
            console.error("❌ Unknown Error:", error);
        }
        return [];
    }
}
