import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "button-consolidator";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default settings
const defaultSettings = {
    enabled: true,
    buttonSelector: '.extensionsMenu, .extensions-menu, [class*="extension"]', // flexible selector
    dropdownLabel: '📦 Extras'
};

// Track which buttons we've moved
let movedButtons = [];

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    
    // Update UI
    const settings = extension_settings[extensionName];
    $("#consolidator_enabled").prop("checked", settings.enabled);
    $("#consolidator_selector").val(settings.buttonSelector);
    $("#consolidator_label").val(settings.dropdownLabel);
    
    return settings;
}

function saveSettings() {
    const enabled = $("#consolidator_enabled").prop("checked");
    const selector = $("#consolidator_selector").val();
    const label = $("#consolidator_label").val();
    
    extension_settings[extensionName].enabled = enabled;
    extension_settings[extensionName].buttonSelector = selector;
    extension_settings[extensionName].dropdownLabel = label;
    
    saveSettingsDebounced();
    
    // Re-apply consolidation if enabled
    if (enabled) {
        setTimeout(() => consolidateButtons(), 100);
    } else {
        restoreButtons();
    }
}

function findBottomButtons() {
    const selector = extension_settings[extensionName].buttonSelector;
    
    // Look for buttons in the bottom panel area
    const bottomPanel = document.querySelector('.bottom_panel') || 
                       document.querySelector('.bottom-block') ||
                       document.querySelector('[class*="bottom"]');
    
    if (!bottomPanel) {
        console.log(`[${extensionName}] Bottom panel not found`);
        return [];
    }
    
    // Find all button-like elements that might be extension buttons
    const allButtons = bottomPanel.querySelectorAll('button, .menu_button, [role="button"], input[type="submit"]');
    
    // Filter for extension-related buttons (exclude standard ST buttons)
    const extensionButtons = Array.from(allButtons).filter(btn => {
        const text = btn.textContent || btn.value || '';
        const classes = btn.className || '';
        const id = btn.id || '';
        
        // Skip known ST core buttons
        const skipPatterns = ['send', 'save', 'load', 'rename', 'delete', 'export', 'import', 
                             'settings', 'toggle', 'refresh', 'reload', 'stop', 'continue'];
        
        // Include if it looks like an extension button
        const isExtension = !skipPatterns.some(pattern => 
            text.toLowerCase().includes(pattern) || 
            id.toLowerCase().includes(pattern) ||
            classes.toLowerCase().includes(pattern)
        );
        
        // Also include buttons that might be from extensions we recognize
        const extensionPatterns = ['ext', 'plugin', 'mod', 'script', 'tool', 'utility'];
        const hasExtensionPattern = extensionPatterns.some(pattern => 
            text.toLowerCase().includes(pattern) || 
            id.toLowerCase().includes(pattern) ||
            classes.toLowerCase().includes(pattern)
        );
        
        return isExtension || hasExtensionPattern;
    });
    
    return extensionButtons;
}

function consolidateButtons() {
    try {
        // Find buttons to consolidate
        const buttons = findBottomButtons();
        
        if (buttons.length === 0) {
            console.log(`[${extensionName}] No extension buttons found to consolidate`);
            return;
        }
        
        // Create container if it doesn't exist
        let container = document.getElementById('consolidator-container');
        if (!container) {
            container = createContainer();
        }
        
        // Move buttons into container
        buttons.forEach(btn => {
            // Skip if already moved
            if (btn.dataset.consolidated === 'true') return;
            
            btn.dataset.consolidated = 'true';
            movedButtons.push(btn);
            
            // Hide original button
            btn.style.display = 'none';
            
            // Add to container's dropdown
            const dropdown = container.querySelector('.consolidator-dropdown');
            if (dropdown) {
                const item = document.createElement('div');
                item.className = 'consolidator-item';
                item.textContent = btn.textContent || btn.value || 'Unnamed Button';
                item.title = item.textContent;
                
                // Copy click handler
                const originalClick = btn.onclick;
                if (originalClick) {
                    item.onclick = (e) => {
                        e.stopPropagation();
                        originalClick.call(btn, e);
                    };
                }
                
                // Copy event listeners (basic approach)
                const btnClone = btn.cloneNode(true);
                btnClone.style.display = 'block';
                btnClone.className = 'consolidator-item-button';
                btnClone.textContent = btn.textContent || btn.value || 'Unnamed Button';
                
                // Replace with clone to keep functionality
                item.innerHTML = '';
                item.appendChild(btnClone);
                
                // Copy attributes
                Array.from(btn.attributes).forEach(attr => {
                    btnClone.setAttribute(attr.name, attr.value);
                });
                
                dropdown.appendChild(item);
            }
        });
        
        // Show container if it has items
        if (container.querySelector('.consolidator-item')) {
            container.style.display = 'block';
        }
        
        console.log(`[${extensionName}] Consolidated ${buttons.length} buttons`);
        
    } catch (error) {
        console.error(`[${extensionName}] Error consolidating buttons:`, error);
    }
}

function createContainer() {
    const container = document.createElement('div');
    container.id = 'consolidator-container';
    container.className = 'consolidator-container';
    
    const label = extension_settings[extensionName].dropdownLabel || '📦 Extras';
    
    container.innerHTML = `
        <div class="consolidator-toggle" id="consolidator-toggle">
            <span class="consolidator-label">${label}</span>
            <span class="consolidator-arrow">▼</span>
        </div>
        <div class="consolidator-dropdown" id="consolidator-dropdown" style="display:none;">
            <div class="consolidator-empty">No buttons to show</div>
        </div>
    `;
    
    // Find bottom panel and insert container
    const bottomPanel = document.querySelector('.bottom_panel') || 
                       document.querySelector('.bottom-block') ||
                       document.querySelector('[class*="bottom"]');
    
    if (bottomPanel) {
        bottomPanel.appendChild(container);
    } else {
        document.body.appendChild(container);
    }
    
    // Add toggle functionality
    const toggle = container.querySelector('#consolidator-toggle');
    const dropdown = container.querySelector('#consolidator-dropdown');
    
    toggle.addEventListener('click', (e) => {
        const isOpen = dropdown.style.display === 'block';
        dropdown.style.display = isOpen ? 'none' : 'block';
        toggle.querySelector('.consolidator-arrow').textContent = isOpen ? '▼' : '▲';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdown.style.display = 'none';
            toggle.querySelector('.consolidator-arrow').textContent = '▼';
        }
    });
    
    return container;
}

function restoreButtons() {
    // Restore hidden buttons
    movedButtons.forEach(btn => {
        btn.style.display = '';
        btn.dataset.consolidated = 'false';
    });
    movedButtons = [];
    
    // Remove container
    const container = document.getElementById('consolidator-container');
    if (container) {
        container.remove();
    }
}

function initUI() {
    // Check if settings panel already has our HTML
    if ($('#consolidator-settings').length === 0) {
        // Load settings HTML and append
        $.get(`${extensionFolderPath}/settings.html`)
            .then(html => {
                const $settings = $(html);
                $('#extensions_settings2').append($settings);
                
                // Load settings after UI is appended
                loadSettings();
                
                // Bind events
                $('#consolidator_enabled').on('change', saveSettings);
                $('#consolidator_selector').on('input', saveSettings);
                $('#consolidator_label').on('input', saveSettings);
                $('#consolidator_apply').on('click', () => {
                    if ($('#consolidator_enabled').prop('checked')) {
                        // Reset and re-consolidate
                        restoreButtons();
                        setTimeout(() => {
                            consolidateButtons();
                            toastr.success('Buttons consolidated', 'Button Consolidator');
                        }, 100);
                    }
                });
                
                // Initial consolidation if enabled
                const settings = extension_settings[extensionName];
                if (settings && settings.enabled) {
                    setTimeout(() => consolidateButtons(), 500);
                }
            })
            .catch(error => {
                console.error(`[${extensionName}] Failed to load settings HTML:`, error);
            });
    } else {
        // Settings already loaded, just load settings
        loadSettings();
    }
}

// Watch for DOM changes - extension buttons might be added dynamically
function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        // Only process if enabled
        if (extension_settings[extensionName]?.enabled) {
            // Check if new extension buttons were added
            const hasNewButtons = mutations.some(m => 
                m.addedNodes.length > 0 && 
                m.addedNodes[0].tagName === 'BUTTON'
            );
            
            if (hasNewButtons) {
                setTimeout(() => consolidateButtons(), 100);
            }
        }
    });
    
    // Start observing
    const target = document.querySelector('.bottom_panel') || 
                  document.querySelector('.bottom-block') ||
                  document.body;
    
    observer.observe(target, {
        childList: true,
        subtree: true
    });
}

// Main initialization
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
    
    try {
        // Initialize settings
        await loadSettings();
        
        // Initialize UI (settings panel)
        initUI();
        
        // Setup mutation observer for dynamic buttons
        setupMutationObserver();
        
        // Initial consolidation after page load
        const settings = extension_settings[extensionName];
        if (settings && settings.enabled) {
            setTimeout(() => consolidateButtons(), 1000);
        }
        
        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
