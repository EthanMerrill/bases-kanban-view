import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	BasesView,
	HoverParent,
	HoverPopover,
	QueryController,
	Keymap,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { getEntryStatus } from "./status";
import { createKanbanCard } from "./card";
import { createKanbanColumns } from "./column";

// Remember to rename these classes and interfaces!

// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: "default",
// };

export const KanbanViewType = "kanban-view";

export default class MyPlugin extends Plugin {
	async onload() {
		// Tell Obsidian about the new view type that this plugin provides.
		this.registerBasesView(KanbanViewType, {
			name: "Kanban",
			icon: "lucide-columns",
			factory: (controller, containerEl) => {
				return new MyBasesView(controller, containerEl);
			},
			options: () => [
				{
					type: "text",
					displayName: "Status Property",
					key: "statusProperty",
					default: "status",
				},
			],
		});
	}
}

export class MyBasesView extends BasesView implements HoverParent {
	hoverPopover: HoverPopover | null;

	readonly type = KanbanViewType;
	private containerEl: HTMLElement;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = parentEl.createDiv("bases-kanban-view-container");
	}

	public onDataUpdated(): void {
		const { app } = this;

		// Clear previous content
		this.containerEl.empty();

		const statusProperty = "status"; // in the future be able to set this in settings and ideally at the base - level

		// Create kanban board container
		const kanbanEl = this.containerEl.createDiv("kanban-board");

		// First pass: collect all unique status values
		const statusOrder: string[] = [];

		// Collect all entries and their status values
		const allEntries: Array<{ entry: any; status: string }> = [];

		for (const group of this.data.groupedData) {
			for (const entry of group.entries) {
				// Use helper to resolve status from property or frontmatter
				const status = String(
					getEntryStatus(entry, app, statusProperty) || ""
				);

				allEntries.push({ entry, status });
				// Track unique statuses in order of appearance
				if (!statusOrder.includes(status)) {
					statusOrder.push(status);
					console.log(`[KanbanView] Found new status: ${status}`);
				}
			}
		}

		// Create columns dynamically based on found statuses
		const statusColumns = createKanbanColumns(
			statusOrder,
			kanbanEl,
			statusProperty,
			app,
			() => this.onDataUpdated() // Refresh callback when card is dropped
		);

		// Second pass: create cards in appropriate columns
		console.log(
			`[KanbanView] Total entries to process: ${allEntries.length}`
		);
		console.log(
			`[KanbanView] Available status columns:`,
			Array.from(statusColumns.keys())
		);

		allEntries.forEach(({ entry, status }, index) => {
			console.log(
				`[KanbanCard] Processing entry ${index + 1}/${
					allEntries.length
				}: ${entry.file.name} with status: "${status}"`
			);

			// check if the container exists for the status column first
			const cardsContainer = statusColumns.get(status);
			if (!cardsContainer) {
				console.log(
					`[KanbanCard] ERROR: No container found for status: "${status}"`
				);
				return;
			}

			console.log(
				`[KanbanCard] Container found for status: "${status}", creating card...`
			);

			try {
				// Use the card creation helper
				createKanbanCard(
					entry,
					cardsContainer,
					app,
					this,
					this.config,
					statusProperty,
					status, // Current status for drag-and-drop
					() => this.onDataUpdated() // Refresh callback
				);
				console.log(
					`[KanbanCard] Successfully created card for: ${entry.file.name}`
				);
			} catch (error) {
				console.error(
					`[KanbanCard] Error creating card for ${entry.file.name}:`,
					error
				);
			}
		});

		console.log(`[KanbanView] Finished processing all entries`);
	}
}
