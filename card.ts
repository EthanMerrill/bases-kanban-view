import {
	App,
	Keymap,
	HoverParent,
	TFile,
	BasesEntry,
	BasesViewConfig,
} from "obsidian";
import { setEntryStatus } from "./status";

/**
 * Simple property ID parser (fallback implementation)
 * @param propertyId The property ID string
 * @returns Object with type and name
 */
function parsePropertyId(propertyId: string): { type: string; name: string } {
	if (propertyId.includes(".")) {
		const [type, name] = propertyId.split(".", 2);
		return { type, name };
	}
	return { type: "note", name: propertyId };
}

/**
 * Updates the status property in a file's frontmatter using the status helper
 * @param app The Obsidian app instance
 * @param file The file to update
 * @param statusProperty The name of the status property
 * @param newStatus The new status value
 */
function updateFileStatus(
	app: App,
	file: TFile,
	statusProperty: string,
	newStatus: string
): void {
	try {
		// Use the helper function from status.ts
		setEntryStatus(file, app, statusProperty, newStatus);
	} catch (error) {
		console.error(`[DragDrop] Error updating file status:`, error);
	}
}

/**
 * Creates a kanban card for a bases entry with drag-and-drop functionality
 * @param entry The bases entry
 * @param cardsContainer The container element to add the card to
 * @param app The Obsidian app instance
 * @param hoverParent The hover parent for link previews
 * @param config The view config for getting property order
 * @param statusProperty The status property name to skip in card content
 * @param currentStatus The current status of this card
 * @param onStatusChange Callback function when status changes
 */
export function createKanbanCard(
	entry: BasesEntry,
	cardsContainer: HTMLElement,
	app: App,
	hoverParent: HoverParent,
	config: BasesViewConfig,
	statusProperty: string,
	currentStatus: string,
	onStatusChange?: () => void
): void {
	try {
		// Create card element
		const cardEl = cardsContainer.createDiv(`kanban-card`);

		// Make card draggable
		cardEl.draggable = true;
		cardEl.setAttribute("data-file-path", entry.file.path);
		cardEl.setAttribute("data-current-status", currentStatus);

		// Add file name as card title
		const titleEl = cardEl.createEl("h4", "kanban-card-title");
		const fileName = entry.file.name;
		const linkEl = titleEl.createEl("a", { text: fileName });

		// Make file name clickable
		linkEl.onClickEvent((evt) => {
			if (evt.button !== 0 && evt.button !== 1) return;
			evt.preventDefault();
			const path = entry.file.path;
			const modEvent = Keymap.isModEvent(evt);
			void app.workspace.openLinkText(path, "", modEvent);
		});

		// Add hover preview
		linkEl.addEventListener("mouseover", (evt) => {
			app.workspace.trigger("hover-link", {
				event: evt,
				source: "bases",
				hoverParent: hoverParent,
				targetEl: linkEl,
				linktext: entry.file.path,
			});
		});

		// Add drag event handlers
		cardEl.addEventListener("dragstart", (e) => {
			e.dataTransfer?.setData("text/plain", entry.file.path);
			e.dataTransfer?.setData(
				"application/json",
				JSON.stringify({
					filePath: entry.file.path,
					currentStatus: currentStatus,
					fileName: fileName,
				})
			);
			cardEl.classList.add("kanban-card-dragging");
		});

		cardEl.addEventListener("dragend", (e) => {
			cardEl.classList.remove("kanban-card-dragging");
		});

		// Add properties as card content
		const contentEl = cardEl.createDiv("kanban-card-content");
		const order = config.getOrder();

		for (const propertyName of order) {
			const { type, name } = parsePropertyId(propertyName);

			// Skip file name since it's already shown as title
			if (name === "name" && type === "file") continue;

			// Skip status since it's already shown as column header
			if (name === statusProperty) continue;

			const value = entry.getValue(propertyName);
			if (value && value.toString()) {
				const propertyEl = contentEl.createDiv("kanban-card-property");
				const nameSpan = propertyEl.createSpan("kanban-property-name");
				nameSpan.textContent = `${name}: `;
				const valueSpan = propertyEl.createSpan(
					"kanban-property-value"
				);
				valueSpan.textContent = value.toString();
			}
		}
	} catch (error) {
		console.error(
			`[CardCreation] Error in createKanbanCard for ${entry.file.name}:`,
			error
		);
		throw error; // Re-throw to be caught by the calling function
	}
}

/**
 * Makes a column accept drag-and-drop operations
 * @param columnElement The column element to make droppable
 * @param targetStatus The status value for this column
 * @param statusProperty The name of the status property
 * @param app The Obsidian app instance
 * @param onDrop Callback function when a card is dropped
 */
export function makeColumnDroppable(
	columnElement: HTMLElement,
	targetStatus: string,
	statusProperty: string,
	app: App,
	onDrop?: () => void
): void {
	const cardsContainer = columnElement.querySelector(
		".kanban-cards-container"
	) as HTMLElement;
	if (!cardsContainer) return;

	cardsContainer.addEventListener("dragover", (e) => {
		e.preventDefault();
		cardsContainer.classList.add("kanban-drop-zone-active");
	});

	cardsContainer.addEventListener("dragleave", (e) => {
		// Only remove the class if we're actually leaving the container
		if (!cardsContainer.contains(e.relatedTarget as Node)) {
			cardsContainer.classList.remove("kanban-drop-zone-active");
		}
	});

	cardsContainer.addEventListener("drop", async (e) => {
		e.preventDefault();
		cardsContainer.classList.remove("kanban-drop-zone-active");

		try {
			const dragData = e.dataTransfer?.getData("application/json");
			if (!dragData) return;

			const { filePath, currentStatus } = JSON.parse(dragData);

			// Don't do anything if dropped in the same column
			if (currentStatus === targetStatus) {
				return;
			}

			// Find the file and update its status
			const file = app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				updateFileStatus(app, file, statusProperty, targetStatus);
				// Call the callback to refresh the view
				if (onDrop) {
					onDrop();
				}
			}
		} catch (error) {
			console.error("[DragDrop] Error handling drop:", error);
		}
	});
}
