import { App } from "obsidian";
import { makeColumnDroppable } from "./card";

/**
 * Creates kanban columns dynamically based on found status values
 * @param statusOrder Array of unique status values in order of appearance
 * @param kanbanEl The kanban board container element
 * @param statusProperty The name of the status property
 * @param app The Obsidian app instance
 * @param onDrop Callback function when a card is dropped (to refresh the view)
 * @returns Map of status values to their corresponding card container elements
 */
export function createKanbanColumns(
	statusOrder: string[],
	kanbanEl: HTMLElement,
	statusProperty: string,
	app: App,
	onDrop?: () => void
): Map<string, HTMLElement> {
	const statusColumns = new Map<string, HTMLElement>();

	// Create columns dynamically based on found statuses
	statusOrder.forEach((status, index) => {
		const columnEl = kanbanEl.createDiv("kanban-column");

		// Apply different styles based on common status patterns
		if (
			status.toLowerCase().includes("todo") ||
			status.toLowerCase().includes("pending")
		) {
			columnEl.addClass("kanban-column-todo");
		} else if (
			status.toLowerCase().includes("progress") ||
			status.toLowerCase().includes("doing") ||
			status.toLowerCase().includes("active")
		) {
			columnEl.addClass("kanban-column-inprogress");
		} else if (
			status.toLowerCase().includes("done") ||
			status.toLowerCase().includes("complete") ||
			status.toLowerCase().includes("finished")
		) {
			columnEl.addClass("kanban-column-done");
		} else {
			// For any other status, use a neutral style
			columnEl.addClass("kanban-column-neutral");
		}

		const headerEl = columnEl.createDiv("kanban-column-header");
		headerEl.createEl("h3", { text: status });
		const cardsEl = columnEl.createDiv("kanban-cards-container");

		// Make the column accept drag-and-drop
		makeColumnDroppable(columnEl, status, statusProperty, app, onDrop);

		statusColumns.set(status, cardsEl);
	});

	return statusColumns;
}
