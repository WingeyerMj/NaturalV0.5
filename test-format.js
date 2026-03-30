import fs from "fs";
import { parse } from "dotenv";

const data = {
    ha1: 144830,
    ha2: 144.83
};
const fmtDec = (v) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(v);
console.log('144830 => ', fmtDec(data.ha1));
console.log('144.83 => ', fmtDec(data.ha2));
