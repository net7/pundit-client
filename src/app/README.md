## "App" folder structure

### Components
Components is a collection of angular components that are being used all around the client's frontend.

- **Annotation**: The element in the sidebar that displays the web annotation information.
- **Delete Modal**: This is the "Please confirm" modal, to make sure the user wants to remove their annotation.
- **Edit Modal**: This is a form that lets the user input the data for a complex annotation or to edit an existing annotation.
- **ook Panel**: The first portion of the sidebar that lets the user manage their notebooks, like naming, privacy settings, default notebook.
- **Notebook Selector**: A shared component used to pick a notebook out of the user's notebooks or to create a new notebook.
- **SVG Icon**: All svg icons for the UI.
- **Toast**: Used for the internal notification system.
- **Tooltip**: The options that appear when the user makes a text selection on the web page / pdf.

### Config
Only contains files to translate the UI labels in various languages.

### Data Sources
These files contain the logic for the components described above.

### Event Handlers
These files handle the (event-based) communication between components and layouts.

### Event Types
The event types are Typescript "Enums" that allow for better readability of the event handler files.

### Helpers
Helpers are small functions that might be useful in various parts of the code-base, and are included here as tools.

### Layouts
The layouts are the parent structure to the components and are separated based on the UI. They are high-level components that have many "basic" components inside.
Each layout is responsible of using the communication module to make network requests to the back-end.

- **Main Layout**: This is the container of the whole application.
- **Sidebar Layout**: This contains everything related to the side-panel.

### Login Module
Module responsible of handling the user authentication process.

### Models
This folders contains the internal logic responsible for creating the highlight metadata, anchoring the annotation to the web-page and creating the annotation metadata.

"Highlighter" and "Anchoring" were originally based on some of Hypothesis's anchoring code.

### Pipes
Custom Angular pipes used in this project.

### Services
Each service is responsible of handling both the logic and the state of some modules of the app.
