# Button Consolidator

Consolidates extra extension buttons on the bottom panel into a single dropdown menu.

## Features

- Automatically detects extension buttons on the bottom panel
- Groups them into a single dropdown menu
- Customizable selector and label
- Toggle on/off as needed
- Dynamic - detects new buttons added after page load

## Installation

1. Open SillyTavern
2. Extensions → Install Extension
3. Paste: `Ellii7076`
4. Refresh the page

## Usage

1. After installation, go to Extensions settings
2. Find "Button Consolidator"
3. Toggle "Enable Consolidation" to activate
4. The bottom panel will show a button with dropdown
5. Click it to see all consolidated extension buttons

## Configuration

- **Enable Consolidation**: Turn the feature on/off
- **Button Selector**: CSS selector to find extension buttons (advanced)
- **Dropdown Label**: Custom text for the dropdown button

## How It Works

1. Scans the bottom panel for extension buttons
2. Hides them from view
3. Creates a dropdown menu containing all hidden buttons
4. Preserves original button functionality
5. Updates dynamically when new extension buttons appear

## Troubleshooting

If buttons aren't being detected:
- Check the console for errors (F12)
- Try adjusting the "Button Selector" in settings
- Click "Apply Consolidation" to refresh
- Disable and re-enable the extension

## Support

Please report issues on GitHub.
