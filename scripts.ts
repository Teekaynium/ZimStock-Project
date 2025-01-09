import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";

const rootDir = `${import.meta.dir}/archive`;
const foldersByDate = await readdir(rootDir, { withFileTypes: true });
// const filesByDate: { date: string; files: Dirent[] }[] = [];

const dataTypes = {
	open_price: "open_price.json",
	close_price: "close_price.json",
	vol_traded: "vol_traded.json",
};

namespace Utils {
	export function formatDateString(dateString: string): string {
		const date = new Date(dateString);
		return date.toISOString();
	}
}

// for (const folder of foldersByDate) {
// 	const files = await readdir(`${rootDir}/${folder.name}`, {
// 		withFileTypes: true,
// 	});
// 	filesByDate.push({
// 		date: folder.name,
// 		files,
// 	});
// }

const testFile = await Bun.file(
	`${rootDir}/${foldersByDate[0].name}/${dataTypes.open_price}`,
).json();
console.log("test:", testFile);

// console.log(filesByDate);

// namespace IntegrityValidation {

// }
