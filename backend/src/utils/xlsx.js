import * as xlsxModule from "xlsx";

const XLSX = Reflect.get(xlsxModule, "default") ?? xlsxModule;

export default XLSX;
