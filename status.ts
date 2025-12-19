import { App, BasesEntry, TFile } from "obsidian";

/**
 * Extracts the status value from a bases entry using multiple fallback strategies
 * @param entry The bases entry object
 * @param app The Obsidian app instance
 * @param statusProperty The name of the status property to look for (default: "status")
 * @returns The status string or "No Status" if not found
 */
export function getEntryStatus(
	entry: BasesEntry,
	app: App,
	statusProperty: string = "status"
): string {
	let status =
		app.metadataCache.getFileCache(entry.file)?.frontmatter?.[
			statusProperty
		] ?? "No Status";

	return status;
}

/**
 * Sets the status value in a bases entry's frontmatter
 * @param entry The bases entry file object
 * @param app The Obsidian app instance
 * @param statusProperty The name of the status property to set (default: "status")
 * @param newStatus The new status value to set
 * @returns The updated TFile object
 */

export function setEntryStatus(
	entry: TFile,
	app: App,
	statusProperty: string = "status",
	newStatus: string
): TFile {
	app.fileManager.processFrontMatter(entry, (frontmatter) => {
		frontmatter[statusProperty] = newStatus;
	});
	return entry;
}
