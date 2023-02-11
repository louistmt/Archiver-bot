import { md5Signature } from "../build/libs/common.mjs";

const usage = () => console.log("node print-class-version.mjs <module-name> [class-name]");

if (process.argv.length <=2 || process.argv.length > 4) {
    console.error("Expected at least one argument and at most 2");
    usage();
    process.exit(1);
}

const [moduleName, className = undefined] = process.argv.slice(2, 4);
const module = await import(moduleName);
const clazz = className ? module[className] : module.default;

if (clazz === undefined || (typeof clazz !== "function")) {
    console.error("Could not find", className === undefined ? "default exported class is not a function" : `class ${className} is not a function`);
    process.exit(1);
}

const signature = md5Signature(clazz.toString());

console.log(`Signature of class ${className ? className : clazz.name} in module ${moduleName} is ${signature}`);