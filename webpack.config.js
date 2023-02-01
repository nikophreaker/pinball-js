import WebpackObfuscator from "webpack-obfuscator"

export default {

    // production mode
    mode: "production",

    // input file
    entry: "./src/js/main.js",

    plugins: [
        new WebpackObfuscator({
            rotateStringArray: true
        }, ['./src/js/bundle.js'])
    ],

    // output file
    output: {

        // file name
        filename: "bundle.js",

        // complete path
        // path: __dirname
    }
}
