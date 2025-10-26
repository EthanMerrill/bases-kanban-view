## Obsidian Bases Kanaban Viewer Plugin

This plugin provides a kanban-style viewer for managing tasks stored in Obsidian notes using the Bases plugin. It allows users to visualize and organize their tasks based on their status, priority, and assignee.

### Features

-   Displays tasks in a kanban board format based on their status.
-   Allows users to drag and drop tasks between different status columns to update their status.
-   Integrates with the Bases plugin to fetch and update task data.
-   Customizable status property name for flexibility.

### Usage

Add a "status" property to the frontmatter / properties section of your notes. Set the value to represent the task's current status (e.g., "todo", "in-progress", "done").

## Todo

-   [ ] Publish to the obsidian community plugins repo
-   [ ] Allow Re-ordering of columns
-   [ ] add default statuses in settings
-   [ ] Allow setting of status property at the base level
-   [ ] Improve styling and responsiveness
    -   [ ] Check if we can avoid a complete re-render on every change
