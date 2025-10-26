import { App } from "obsidian";

/**
 * Extracts the status value from a bases entry using multiple fallback strategies
 * @param entry The bases entry object
 * @param app The Obsidian app instance
 * @param statusProperty The name of the status property to look for (default: "status")
 * @returns The status string or "No Status" if not found
 */
export function getEntryStatus(
	entry: any,
	app: App,
	statusProperty: string = "status"
): string {
	let status =
		app.metadataCache.getFileCache(entry.file)?.frontmatter?.status ??
		"No Status";

	return status;
}
