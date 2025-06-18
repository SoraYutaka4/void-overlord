import { instagram, summer, default as gradient } from "gradient-string";
import figlet from "figlet";
import config from "../../../config.json";

export default () => {
    const {
        name = { en: "PNFM", vi: "PNFM" },
        version = "1.0.0",
        creator = "NPK31"
    } = config;

    const asciiText = figlet.textSync(name.en, { font: "Big" });

    const styledText = gradient(["#ff00ff", "#00ffff", "#ff00ff"]).multiline(asciiText);

    const paddedText = "\n\n" + styledText + "\n\n";
    console.log(paddedText);

    console.log("\n" + instagram(`=> Version: ${version}`));
    console.log("\n" + summer(`=> Created by: ${creator}`));
    console.log("\n");
};

