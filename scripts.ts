import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";

const rootDir = `${import.meta.dir}/archive`;
const foldersByDate = await readdir(rootDir);

namespace Utils {
	export function formatDateString(dateString: string): string {
		const date = new Date(dateString);
		return date.toISOString();
	}
}

namespace Types {
	export const dataTypes = {
		open_price: "open_price.json",
		close_price: "close_price.json",
		vol_traded: "vol_traded.json",
	};

	export type FileStats = {
		fileType: keyof typeof dataTypes;
		stats: {
			numberOfCompanies: number;
		};
	};

	export type JSONFile = {
		columns: string[];
		data: Array<string[]>;
		index: string[];
	};
}

namespace IntegrityValidation {
	export async function ObtainGenericStats() {
		const Stats: Record<string, Types.FileStats[]> = {};

		for (const folder of foldersByDate) {
			const formattedDate = Utils.formatDateString(folder);

			const openPriceFilePath = `${rootDir}/${folder}/${Types.dataTypes.open_price}`;
			const openPriceFileContents = await readFile(openPriceFilePath);

			const closePriceFilePath = `${rootDir}/${folder}/${Types.dataTypes.close_price}`;
			const closePriceFileContents = await readFile(closePriceFilePath);

			const volTradedFilePath = `${rootDir}/${folder}/${Types.dataTypes.vol_traded}`;
			const volTradedFileContents = await readFile(volTradedFilePath);

			Stats[formattedDate] = [
				{
					fileType: "open_price",
					stats: {
						numberOfCompanies: openPriceFileContents.columns.length,
					},
				},
				{
					fileType: "close_price",
					stats: {
						numberOfCompanies: closePriceFileContents.columns.length,
					},
				},
				{
					fileType: "vol_traded",
					stats: {
						numberOfCompanies: volTradedFileContents.columns.length,
					},
				},
			];
		}

		return Stats;
	}

	const readFile = async (filePath: string): Promise<Types.JSONFile> => {
		const fileContents = await Bun.file(filePath).json();
		return fileContents;
	};
}

const genericStats = await IntegrityValidation.ObtainGenericStats();

const writeStatsToFile = async (stats: Record<string, Types.FileStats[]>) => {
	await Bun.write("stats.json", JSON.stringify(stats));
};

writeStatsToFile(genericStats);
