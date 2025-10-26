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
import {
	BasesKanbanSettings,
	DEFAULT_SETTINGS,
	BasesKanbanSettingTab,
} from "./settings";

export const KanbanViewType = "kanban-view";

export default class BasesKanbanViewPlugin extends Plugin {
	settings: BasesKanbanSettings;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new BasesKanbanSettingTab(this.app, this));

		// Tell Obsidian about the new view type that this plugin provides.
		this.registerBasesView(KanbanViewType, {
			name: "Kanban",
			icon: "lucide-columns",
			factory: (controller, containerEl) => {
				return new MyBasesView(controller, containerEl, this);
			},
			options: () => [
				{
					type: "text",
					displayName: "Status Property",
					key: "statusProperty",
					default: this.settings.defaultStatusProperty,
				},
			],
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

export class MyBasesView extends BasesView implements HoverParent {
	hoverPopover: HoverPopover | null;

	readonly type = KanbanViewType;
	private containerEl: HTMLElement;
	private plugin: BasesKanbanViewPlugin;

	constructor(
		controller: QueryController,
		parentEl: HTMLElement,
		plugin: BasesKanbanViewPlugin
	) {
		super(controller);
		this.containerEl = parentEl.createDiv("bases-kanban-view-container");
		this.plugin = plugin;
	}

	public onDataUpdated(): void {
		const { app } = this;

		// Clear previous content
		this.containerEl.empty();

		const statusProperty = this.plugin.settings.defaultStatusProperty; // Use setting instead of hardcoded value

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

		// If no status values found or only empty strings, use default columns
		const filteredStatusOrder = statusOrder.filter(
			(status) => status.trim() !== ""
		);
		const finalStatusOrder =
			filteredStatusOrder.length > 0
				? filteredStatusOrder
				: this.plugin.settings.defaultColumns;

		// Create columns dynamically based on found statuses or default columns
		const statusColumns = createKanbanColumns(
			finalStatusOrder,
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

			// If using default columns and status is empty, place in first column
			let targetStatus = status;
			if (filteredStatusOrder.length === 0 && status.trim() === "") {
				targetStatus = this.plugin.settings.defaultColumns[0] || "";
			}

			// check if the container exists for the status column first
			const cardsContainer = statusColumns.get(targetStatus);
			if (!cardsContainer) {
				console.log(
					`[KanbanCard] ERROR: No container found for status: "${targetStatus}"`
				);
				return;
			}

			console.log(
				`[KanbanCard] Container found for status: "${targetStatus}", creating card...`
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
					targetStatus, // Current status for drag-and-drop
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
