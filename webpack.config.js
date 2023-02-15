import WebpackObfuscator from "webpack-obfuscator"
import path from 'path';
import {
    fileURLToPath
} from 'url';
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '/src/js/');

export default {

    // production mode
    mode: "production",

    // input file
    entry: "./src/js/main.js",

    plugins: [
        new WebpackObfuscator({
            rotateStringArray: true
        }, [])
    ],

    // output file
    output: {
        // file name
        filename: "bundle.js",

        // complete path
        path: DIST_DIR

    }
}
