import { App, Keymap, parsePropertyId, HoverParent } from "obsidian";

/**
 * Creates a kanban card for a bases entry
 * @param entry The bases entry
 * @param cardsContainer The container element to add the card to
 * @param app The Obsidian app instance
 * @param hoverParent The hover parent for link previews
 * @param config The view config for getting property order
 * @param statusProperty The status property name to skip in card content
 */
export function createKanbanCard(
	entry: any,
	cardsContainer: HTMLElement,
	app: App,
	hoverParent: HoverParent,
	config: any,
	statusProperty: string
): void {
	console.log(
		`[CardCreation] Starting card creation for: ${entry.file.name}`
	);

	try {
		// Create card element
		const cardEl = cardsContainer.createDiv(`kanban-card`);
		console.log(`[CardCreation] Created card element`);

		// Add file name as card title
		const titleEl = cardEl.createEl("h4", "kanban-card-title");
		const fileName = entry.file.name;
		const linkEl = titleEl.createEl("a", { text: fileName });
		console.log(`[CardCreation] Added title and link for: ${fileName}`);

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
		console.log(`[CardCreation] Added click and hover handlers`);

		// Add properties as card content
		const contentEl = cardEl.createDiv("kanban-card-content");
		const order = config.getOrder();
		console.log(`[CardCreation] Property order:`, order);

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
				console.log(
					`[CardCreation] Added property: ${name} = ${value}`
				);
			}
		}

		console.log(
			`[CardCreation] Successfully completed card creation for: ${fileName}`
		);
	} catch (error) {
		console.error(
			`[CardCreation] Error in createKanbanCard for ${entry.file.name}:`,
			error
		);
		throw error; // Re-throw to be caught by the calling function
	}
}
