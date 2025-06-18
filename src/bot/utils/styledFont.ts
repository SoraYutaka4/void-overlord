const validStyles = [
    "boldSerif",
    "boldSansSerif",
    "italicSerif",
    "italicSansSerif",
    "boldItalicSerif",
    "boldItalicSansSerif",
    "handwrittenBold",
    "monospace"
];

export type style =
    "boldSerif" |
    "boldSansSerif" |
    "italicSerif" |
    "italicSansSerif" |
    "boldItalicSerif" |
    "boldItalicSansSerif" |
    "handwrittenBold" |
    "monospace"



const styles = {
    boldSerif: {
        a: "𝐚", A: "𝐀", b: "𝐛", B: "𝐁", c: "𝐜", C: "𝐂", d: "𝐝", D: "𝐃", 
        e: "𝐞", E: "𝐄", f: "𝐟", F: "𝐅", g: "𝐠", G: "𝐆", h: "𝐡", H: "𝐇", 
        i: "𝐢", I: "𝐈", j: "𝐣", J: "𝐉", k: "𝐤", K: "𝐊", l: "𝐥", L: "𝐋", 
        m: "𝐦", M: "𝐌", n: "𝐧", N: "𝐍", o: "𝐨", O: "𝐎", p: "𝐩", P: "𝐏", 
        q: "𝐪", Q: "𝐐", r: "𝐫", R: "𝐑", s: "𝐬", S: "𝐒", t: "𝐭", T: "𝐓", 
        u: "𝐮", U: "𝐔", v: "𝐯", V: "𝐕", w: "𝐰", W: "𝐖", x: "𝐱", X: "𝐗", 
        y: "𝐲", Y: "𝐘", z: "𝐳", Z: "𝐙"
    },

    boldSansSerif: {
        a: "𝗮", A: "𝗔", b: "𝗯", B: "𝗕", c: "𝗰", C: "𝗖", d: "𝗱", D: "𝗗", 
        e: "𝗲", E: "𝗘", f: "𝗳", F: "𝗙", g: "𝗴", G: "𝗚", h: "𝗵", H: "𝗛", 
        i: "𝗶", I: "𝗜", j: "𝗷", J: "𝗝", k: "𝗸", K: "𝗞", l: "𝗹", L: "𝗟", 
        m: "𝗺", M: "𝗠", n: "𝗻", N: "𝗡", o: "𝗼", O: "𝗢", p: "𝗽", P: "𝗣", 
        q: "𝗾", Q: "𝗤", r: "𝗿", R: "𝗥", s: "𝘀", S: "𝗦", t: "𝘁", T: "𝗧", 
        u: "𝘂", U: "𝗨", v: "𝘃", V: "𝗩", w: "𝘄", W: "𝗪", x: "𝘅", X: "𝗫", 
        y: "𝘆", Y: "𝗬", z: "𝘇", Z: "𝗭"
    },

    italicSerif: {
        a: "𝑎", A: "𝐴", b: "𝑏", B: "𝐵", c: "𝑐", C: "𝐶", d: "𝑑", D: "𝐷", 
        e: "𝑒", E: "𝐸", f: "𝑓", F: "𝐹", g: "𝑔", G: "𝐺", h: "ℎ", H: "𝐻", 
        i: "𝑖", I: "𝐼", j: "𝑗", J: "𝐽", k: "𝑘", K: "𝐾", l: "𝑙", L: "𝐿", 
        m: "𝑚", M: "𝑀", n: "𝑛", N: "𝑁", o: "𝑜", O: "𝑂", p: "𝑝", P: "𝑃", 
        q: "𝑞", Q: "𝑄", r: "𝑟", R: "𝑅", s: "𝑠", S: "𝑆", t: "𝑡", T: "𝑇", 
        u: "𝑢", U: "𝑈", v: "𝑣", V: "𝑉", w: "𝑤", W: "𝑊", x: "𝑥", X: "𝑋", 
        y: "𝑦", Y: "𝑌", z: "𝑧", Z: "𝑍"
    },

    italicSansSerif: {
        a: "𝘢", A: "𝘈", b: "𝘣", B: "𝘉", c: "𝘤", C: "𝘊", d: "𝘥", D: "𝘋", 
        e: "𝘦", E: "𝘌", f: "𝘧", F: "𝘍", g: "𝘨", G: "𝘎", h: "𝘩", H: "𝘏", 
        i: "𝘪", I: "𝘐", j: "𝘫", J: "𝘑", k: "𝘬", K: "𝘒", l: "𝘭", L: "𝘓", 
        m: "𝘮", M: "𝘔", n: "𝘯", N: "𝘕", o: "𝘰", O: "𝘖", p: "𝘱", P: "𝘗", 
        q: "𝘲", Q: "𝘘", r: "𝘳", R: "𝘙", s: "𝘴", S: "𝘚", t: "𝘵", T: "𝘛", 
        u: "𝘶", U: "𝘜", v: "𝘷", V: "𝘝", w: "𝘸", W: "𝘞", x: "𝘹", X: "𝘟", 
        y: "𝘺", Y: "𝘠", z: "𝘻", Z: "𝘡"
    },

    boldItalicSerif: {
        a: "𝒂", A: "𝑨", b: "𝒃", B: "𝑩", c: "𝒄", C: "𝑪", d: "𝒅", D: "𝑫", 
        e: "𝒆", E: "𝑬", f: "𝒇", F: "𝑭", g: "𝒈", G: "𝑮", h: "𝒉", H: "𝑯", 
        i: "𝒊", I: "𝑰", j: "𝒋", J: "𝑱", k: "𝒌", K: "𝑲", l: "𝒍", L: "𝑳", 
        m: "𝒎", M: "𝑴", n: "𝒏", N: "𝑵", o: "𝒐", O: "𝑶", p: "𝒑", P: "𝑷", 
        q: "𝒒", Q: "𝑸", r: "𝒓", R: "𝑹", s: "𝒔", S: "𝑺", t: "𝒕", T: "𝑻", 
        u: "𝒖", U: "𝑼", v: "𝒗", V: "𝑽", w: "𝒘", W: "𝑾", x: "𝒙", X: "𝑿", 
        y: "𝒚", Y: "𝒀", z: "𝒛", Z: "𝒁"
    },
    
    boldItalicSansSerif: {
        a: "𝙖", A: "𝘼", b: "𝙗", B: "𝘽", c: "𝙘", C: "𝘾", d: "𝙙", D: "𝘿", 
        e: "𝙚", E: "𝙀", f: "𝙛", F: "𝙁", g: "𝙜", G: "𝙂", h: "𝙝", H: "𝙃", 
        i: "𝙞", I: "𝙄", j: "𝙟", J: "𝙅", k: "𝙠", K: "𝙆", l: "𝙡", L: "𝙇", 
        m: "𝙢", M: "𝙈", n: "𝙣", N: "𝙉", o: "𝙤", O: "𝙊", p: "𝙥", P: "𝙋", 
        q: "𝙦", Q: "𝙌", r: "𝙧", R: "𝙍", s: "𝙨", S: "𝙎", t: "𝙩", T: "𝙏", 
        u: "𝙪", U: "𝙐", v: "𝙫", V: "𝙑", w: "𝙬", W: "𝙒", x: "𝙭", X: "𝙓", 
        y: "𝙮", Y: "𝙔", z: "𝙯", Z: "𝙕"
    },
    
    handwrittenBold: {
        a: "𝓪", A: "𝓐", b: "𝓫", B: "𝓑", c: "𝓬", C: "𝓒", d: "𝓭", D: "𝓓", 
        e: "𝓮", E: "𝓔", f: "𝓯", F: "𝓕", g: "𝓰", G: "𝓖", h: "𝓱", H: "𝓗", 
        i: "𝓲", I: "𝓘", j: "𝓳", J: "𝓙", k: "𝓴", K: "𝓚", l: "𝓵", L: "𝓛", 
        m: "𝓶", M: "𝓜", n: "𝓷", N: "𝓝", o: "𝓸", O: "𝓞", p: "𝓹", P: "𝓟", 
        q: "𝓺", Q: "𝓠", r: "𝓻", R: "𝓡", s: "𝓼", S: "𝓢", t: "𝓽", T: "𝓣", 
        u: "𝓾", U: "𝓤", v: "𝓿", V: "𝓥", w: "𝔀", W: "𝓦", x: "𝔁", X: "𝓧", 
        y: "𝔂", Y: "𝓨", z: "𝔃", Z: "𝓩"
    },

    monospace: {
        a: "𝚊", A: "𝙰", b: "𝚋", B: "𝙱", c: "𝚌", C: "𝙲", d: "𝚍", D: "𝙳", 
        e: "𝚎", E: "𝙴", f: "𝚏", F: "𝙵", g: "𝚐", G: "𝙶", h: "𝚑", H: "𝙷", 
        i: "𝚒", I: "𝙸", j: "𝚓", J: "𝙹", k: "𝚔", K: "𝙺", l: "𝚕", L: "𝙻", 
        m: "𝚖", M: "𝙼", n: "𝚗", N: "𝙽", o: "𝚘", O: "𝙾", p: "𝚙", P: "𝙿", 
        q: "𝚚", Q: "𝚀", r: "𝚛", R: "𝚁", s: "𝚜", S: "𝚂", t: "𝚝", T: "𝚃", 
        u: "𝚞", U: "𝚄", v: "𝚟", V: "𝚅", w: "𝚠", W: "𝚆", x: "𝚡", X: "𝚇", 
        y: "𝚢", Y: "𝚈", z: "𝚣", Z: "𝚉",
    },

};


export function transformTextWithStyle(input: string, style: style): string | null {
    if (!validStyles.includes(style)) {
        console.error("Font style not found!");
        return null;
    }

    const font = styles[style];
    let content = "";

    for (const letter of input) {
        if (/[a-zA-Z]/.test(letter)) {
            content += font[letter as keyof typeof font] || letter;
        } else {
            content += letter;
        }
    }

    return content;
}


