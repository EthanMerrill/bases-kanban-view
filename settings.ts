import { App, PluginSettingTab, Setting } from "obsidian";

export interface BasesKanbanSettings {
	defaultStatusProperty: string;
	showCardCount: boolean;
	defaultColumns: string[];
}

export const DEFAULT_SETTINGS: BasesKanbanSettings = {
	defaultStatusProperty: "status",
	showCardCount: true,
	defaultColumns: ["Todo", "In Progress", "Completed"],
};

export class BasesKanbanSettingTab extends PluginSettingTab {
	plugin: any; // We'll type this properly when we import it in main.ts

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Bases Kanban View Settings" });

		new Setting(containerEl)
			.setName("Default Status Property")
			.setDesc("The default property name to use for status tracking")
			.addText((text) =>
				text
					.setPlaceholder("status")
					.setValue(this.plugin.settings.defaultStatusProperty)
					.onChange(async (value) => {
						this.plugin.settings.defaultStatusProperty = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show Card Count")
			.setDesc("Display the number of cards in each column header")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showCardCount)
					.onChange(async (value) => {
						this.plugin.settings.showCardCount = value;
						await this.plugin.saveSettings();
					})
			);

		// Default Columns section
		containerEl.createEl("h3", { text: "Default Columns" });
		
		new Setting(containerEl)
			.setName("Default Column Names")
			.setDesc("Set the default column names that will be used when no status values are found. Enter one column name per line.")
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder("Todo\nIn Progress\nCompleted")
					.setValue(this.plugin.settings.defaultColumns.join("\n"))
					.onChange(async (value) => {
						// Split by newlines and filter out empty strings
						const columns = value
							.split("\n")
							.map(col => col.trim())
							.filter(col => col.length > 0);
						
						this.plugin.settings.defaultColumns = columns;
						await this.plugin.saveSettings();
					});
				
				// Make the text area a bit bigger
				textArea.inputEl.rows = 4;
				textArea.inputEl.style.width = "100%";
			});

		// Show current default columns
		const currentColumnsEl = containerEl.createEl("div", { 
			cls: "setting-item-description" 
		});
		currentColumnsEl.innerHTML = `<strong>Current default columns:</strong> ${this.plugin.settings.defaultColumns.join(", ")}`;
	}
}