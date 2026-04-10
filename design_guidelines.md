{
  "product": {
    "name": "Lead Qualification Engine",
    "type": "internal-dashboard",
    "design_personality": [
      "minimal",
      "professional",
      "data-dense",
      "fast-scanning",
      "reliable",
      "quietly-premium (enterprise)"
    ],
    "north_star": "Make the table the hero: scannable rows, predictable controls, and a frictionless side-panel workflow."
  },

  "brand_attributes": {
    "tone": ["trustworthy", "precise", "calm", "efficient"],
    "visual_metaphor": "Blueprint + ledger: ink accents on off-white paper with subtle gridlines.",
    "avoid": [
      "flashy marketing sections",
      "oversized gradients",
      "centered hero layouts",
      "purple-heavy AI aesthetics",
      "over-rounded playful UI"
    ]
  },

  "typography": {
    "font_pairing": {
      "display": {
        "name": "Space Grotesk",
        "google_fonts": "https://fonts.google.com/specimen/Space+Grotesk",
        "usage": "Page titles, section headers, KPI numbers",
        "tailwind": "font-display"
      },
      "body": {
        "name": "Inter",
        "google_fonts": "https://fonts.google.com/specimen/Inter",
        "usage": "Tables, forms, helper text",
        "tailwind": "font-sans"
      },
      "mono": {
        "name": "IBM Plex Mono",
        "google_fonts": "https://fonts.google.com/specimen/IBM+Plex+Mono",
        "usage": "IDs, domains, CSV column names, technical tokens",
        "tailwind": "font-mono"
      }
    },
    "text_size_hierarchy": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl",
      "h2": "text-base md:text-lg",
      "body": "text-sm md:text-base",
      "small": "text-xs text-muted-foreground",
      "table": {
        "header": "text-xs font-medium tracking-wide",
        "cell": "text-sm",
        "dense_mode": "text-[13px] leading-5"
      }
    },
    "numeric_style": {
      "kpi": "tabular-nums",
      "score": "tabular-nums font-semibold"
    }
  },

  "color_system": {
    "notes": [
      "White/neutral theme with ink-blue accent.",
      "Use semantic colors for Fit/Partial/Not Fit and Score bands.",
      "Keep gradients decorative only (<=20% viewport)."
    ],
    "tokens_css_variables": {
      "how_to_apply": "Update /app/frontend/src/index.css :root tokens to match below. Keep shadcn token names; only change values.",
      "css": ":root {\n  /* Canvas */\n  --background: 210 33% 99%; /* #F8FAFC */\n  --foreground: 222 47% 11%; /* #111827 */\n\n  /* Surfaces */\n  --card: 0 0% 100%;\n  --card-foreground: 222 47% 11%;\n  --popover: 0 0% 100%;\n  --popover-foreground: 222 47% 11%;\n\n  /* Brand ink (primary) */\n  --primary: 215 28% 17%; /* #1F2A37 ink-slate */\n  --primary-foreground: 210 40% 98%;\n\n  /* Secondary surfaces */\n  --secondary: 210 40% 96%; /* #F1F5F9 */\n  --secondary-foreground: 215 28% 17%;\n\n  /* Muted */\n  --muted: 210 40% 96%;\n  --muted-foreground: 215 16% 47%; /* #64748B */\n\n  /* Accent (links, focus accents) */\n  --accent: 210 40% 96%;\n  --accent-foreground: 215 28% 17%;\n\n  /* Borders/inputs */\n  --border: 214 20% 90%; /* #E2E8F0 */\n  --input: 214 20% 90%;\n  --ring: 206 90% 40%; /* ink-blue focus ring #0EA5E9-ish but slightly muted */\n\n  /* Destructive */\n  --destructive: 0 72% 51%; /* #DC2626 */\n  --destructive-foreground: 210 40% 98%;\n\n  --radius: 0.6rem;\n}\n\n/* Extra semantic tokens (add under @layer base if desired) */\n:root {\n  --ink: 215 28% 17%;\n  --ink-2: 215 19% 27%;\n  --canvas: 210 33% 99%;\n  --gridline: 214 20% 92%;\n\n  --fit: 142 71% 35%;      /* green */\n  --partial: 32 94% 44%;   /* amber */\n  --notfit: 0 72% 51%;     /* red */\n\n  --score-low: 0 72% 51%;\n  --score-mid: 32 94% 44%;\n  --score-high: 142 71% 35%;\n\n  --shadow-soft: 0 1px 0 hsl(214 20% 90%), 0 10px 30px -20px rgba(15, 23, 42, 0.25);\n  --shadow-card: 0 1px 2px rgba(15, 23, 42, 0.06);\n}\n"
    },
    "component_color_usage": {
      "links": "Use ink-blue via text-sky-700 hover:text-sky-800; underline-offset-4 on hover only.",
      "table_header": "bg-secondary/70 text-muted-foreground",
      "row_hover": "hover:bg-slate-50",
      "selected_row": "bg-sky-50 ring-1 ring-sky-200",
      "focus": "focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
    },
    "status_mapping": {
      "icp_fit": {
        "fit": {"badge": "bg-emerald-50 text-emerald-800 border-emerald-200", "dot": "bg-emerald-500"},
        "partial": {"badge": "bg-amber-50 text-amber-900 border-amber-200", "dot": "bg-amber-500"},
        "not_fit": {"badge": "bg-rose-50 text-rose-800 border-rose-200", "dot": "bg-rose-500"}
      },
      "email_status": {
        "verified": "bg-emerald-50 text-emerald-800 border-emerald-200",
        "unverified": "bg-slate-50 text-slate-700 border-slate-200",
        "missing": "bg-rose-50 text-rose-800 border-rose-200"
      }
    }
  },

  "layout_and_grid": {
    "page_shell": {
      "structure": "Top app header + content area. Dashboard uses 2-column mental model: table (primary) + details drawer (secondary).",
      "max_width": "Use max-w-[1400px] only for settings/import pages; dashboard table should be full-width for density.",
      "padding": "px-3 sm:px-4 lg:px-6",
      "vertical_rhythm": "space-y-4 on pages; space-y-3 inside cards"
    },
    "dashboard_layout": {
      "top_bar": "Sticky top bar with search + filters + bulk actions. Keep height 56-64px.",
      "table_region": "Table inside Card with ScrollArea; sticky header; optional sticky first column for Company.",
      "details_panel": "Use Sheet (right side) for lead details; width: w-[420px] sm:w-[520px] lg:w-[640px]."
    },
    "import_wizard_layout": {
      "pattern": "Step-by-step wizard with progress indicator (Tabs or custom stepper).",
      "steps": ["Upload", "Map Columns", "Preview", "Confirm"],
      "content": "Left: instructions + validations; Right: preview table (ScrollArea)."
    }
  },

  "components": {
    "component_path": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "dropdown_menu": "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "table": "/app/frontend/src/components/ui/table.jsx",
      "checkbox": "/app/frontend/src/components/ui/checkbox.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
      "popover": "/app/frontend/src/components/ui/popover.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx",
      "sonner_toast": "/app/frontend/src/components/ui/sonner.jsx"
    },
    "table_spec": {
      "density": {
        "row_height": "h-11 (default), dense mode h-9",
        "cell_padding": "py-2 px-3",
        "header_padding": "py-2 px-3",
        "truncate": "Use max-w + truncate for long fields (company, title). Provide Tooltip on hover for full value."
      },
      "sticky_header": {
        "tailwind": "sticky top-0 z-10 bg-secondary/80 backdrop-blur supports-[backdrop-filter]:bg-secondary/60",
        "shadow": "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border"
      },
      "row_interactions": {
        "hover": "hover:bg-slate-50",
        "selected": "data-[selected=true]:bg-sky-50 data-[selected=true]:ring-1 data-[selected=true]:ring-sky-200",
        "click_target": "Make entire row clickable except checkbox; cursor-pointer"
      },
      "columns_recommended": [
        "Select (checkbox)",
        "Company (sticky optional)",
        "ICP Fit (badge)",
        "Score (prominent)",
        "Decision Maker (name + role)",
        "Email Status",
        "Country",
        "Industry",
        "Growth Signals (badges)",
        "Last Updated"
      ]
    },
    "lead_score_display": {
      "in_table": {
        "pattern": "Score pill + mini bar",
        "pill": "rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
        "bar": "Progress component with h-1.5 rounded-full bg-slate-200; indicator color based on band",
        "bands": [
          {"range": "0-39", "class": "text-rose-800 bg-rose-50 border border-rose-200"},
          {"range": "40-69", "class": "text-amber-900 bg-amber-50 border border-amber-200"},
          {"range": "70-100", "class": "text-emerald-800 bg-emerald-50 border border-emerald-200"}
        ]
      },
      "in_side_panel": {
        "pattern": "Large numeric + breakdown list",
        "layout": "Top: score + ICP fit; Middle: breakdown (criteria rows); Bottom: 'Why this lead' narrative",
        "breakdown_row": "flex items-center justify-between py-2 text-sm",
        "criterion_chip": "Badge variant=secondary with subtle border"
      }
    },
    "growth_signals": {
      "badge_style": "Use Badge with variant=secondary + custom classes: bg-slate-50 text-slate-700 border border-slate-200",
      "examples": ["Hiring", "New funding", "Tech stack change", "Leadership change"],
      "overflow": "Show max 3 badges + '+N' ghost badge with Tooltip listing the rest"
    },
    "filters_and_bulk_actions": {
      "search": "Input with left icon (lucide Search). Debounce 250ms.",
      "filters": "DropdownMenu or Popover with Selects + Sliders. Provide 'Clear' and 'Apply'.",
      "bulk_bar": "When rows selected, show inline bulk action bar above table (not modal).",
      "export": "Primary button 'Export CSV' + secondary 'Copy emails' (if exists)."
    },
    "csv_import_mapping": {
      "mapping_ui": "Two-column mapping list: left = required fields, right = Select of CSV columns. Show validation badges.",
      "preview": "Table preview with highlighted unmapped columns (bg-amber-50).",
      "confirm": "AlertDialog for final import confirmation with counts."
    },
    "lead_details_sheet": {
      "container": "SheetContent side=right with ScrollArea; header has company + actions.",
      "actions": ["Enrich Email (placeholder)", "Verify Email (placeholder)", "Save"],
      "editable_fields": "Use Form + Input/Select/Textarea; group into sections with Separator.",
      "notes": "Textarea with autosize feel (min-h-[120px])"
    },
    "icp_settings_panel": {
      "pattern": "Card-based form with sections: Geography, Industry, Company Size, Roles, Exclusions, Thresholds.",
      "controls": ["Select", "Checkbox", "Slider", "Textarea"],
      "save": "Sticky footer inside panel with Save/Cancel"
    }
  },

  "motion_and_microinteractions": {
    "principles": [
      "Motion should confirm actions and preserve orientation (no flashy transitions).",
      "Prefer 120–180ms for hover/focus, 180–240ms for panel open/close.",
      "Use subtle translateY (1-2px) and shadow changes; avoid scale on dense tables."
    ],
    "recommended_library": {
      "name": "framer-motion",
      "why": "Smooth Sheet/Drawer content entrance, filter popovers, empty states.",
      "install": "npm i framer-motion",
      "usage_snippet_js": "import { motion } from 'framer-motion';\n\nexport function FadeIn({ children }) {\n  return (\n    <motion.div\n      initial={{ opacity: 0, y: 6 }}\n      animate={{ opacity: 1, y: 0 }}\n      transition={{ duration: 0.18, ease: 'easeOut' }}\n    >\n      {children}\n    </motion.div>\n  );\n}\n"
    },
    "interaction_specs": {
      "buttons": "hover:bg + shadow-sm; active: translate-y-[1px] (only on primary CTAs)",
      "table_rows": "hover highlight only; selected state persistent",
      "sheet_open": "Backdrop fade + panel slide from right",
      "loading": "Skeleton rows in table; progress indicator in import wizard"
    }
  },

  "data_density_controls": {
    "density_toggle": {
      "component": "ToggleGroup",
      "options": ["Comfortable", "Compact"],
      "effect": "Switch table row height + font size + padding",
      "data-testid": "table-density-toggle"
    },
    "column_visibility": {
      "component": "DropdownMenu with Checkbox items",
      "data-testid": "table-column-visibility-menu"
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text and badges.",
      "Visible focus rings on all interactive elements.",
      "Keyboard navigation: table row focus, checkbox selection, sheet close via Esc.",
      "Use aria-labels for icon-only buttons.",
      "Respect prefers-reduced-motion (reduce framer-motion transitions)."
    ],
    "table_a11y": {
      "sticky_header": "Ensure header cells are <th> with scope='col'.",
      "row_selection": "Checkbox has accessible label 'Select lead'.",
      "sorting": "Sortable headers are buttons with aria-sort state"
    }
  },

  "testing_attributes": {
    "rule": "All interactive and key informational elements MUST include data-testid (kebab-case).",
    "required_testids": {
      "import": [
        "csv-import-upload-input",
        "csv-import-next-button",
        "csv-import-mapping-table",
        "csv-import-confirm-button"
      ],
      "dashboard": [
        "lead-search-input",
        "lead-filters-button",
        "lead-table",
        "lead-table-header",
        "lead-row",
        "bulk-export-csv-button",
        "bulk-select-all-checkbox"
      ],
      "details_sheet": [
        "lead-details-sheet",
        "lead-details-save-button",
        "lead-details-enrich-email-button",
        "lead-details-verify-email-button",
        "lead-details-notes-textarea"
      ],
      "icp_settings": [
        "icp-settings-panel",
        "icp-settings-save-button",
        "icp-settings-min-score-slider"
      ]
    }
  },

  "image_urls": {
    "usage_note": "Internal tool: keep imagery minimal. Use subtle texture only as a background overlay (low opacity).",
    "background_textures": [
      {
        "category": "app-canvas-noise",
        "description": "Very subtle paper/noise texture for the overall app background (opacity 0.04–0.07).",
        "url": "https://images.unsplash.com/photo-1509624776920-0fac24a9dfda?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMHN1YnRsZSUyMHBhcGVyJTIwdGV4dHVyZSUyMGxpZ2h0JTIwbmV1dHJhbCUyMGJhY2tncm91bmR8ZW58MHx8fGJsdWV8MTc3NTgyMTYyOHww&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "instructions_to_main_agent": {
    "global_css_cleanup": [
      "Remove or stop using /app/frontend/src/App.css default CRA styles (App-header etc). Do NOT center the app container.",
      "Implement the token overrides in /app/frontend/src/index.css :root as specified above.",
      "Add font imports in index.html (Google Fonts) and set Tailwind font families (font-display, font-sans, font-mono)."
    ],
    "dashboard_build_notes": [
      "Make the table full-width and the primary focus; keep filters/actions in a sticky top bar.",
      "Use Sheet for lead details (right side) with ScrollArea; keep Save action always visible (sticky footer inside sheet).",
      "Use Badge for ICP fit + growth signals; use Progress for score bar.",
      "Implement compact density toggle and column visibility menu for power users.",
      "All interactive elements must include data-testid attributes (kebab-case)."
    ],
    "import_flow_notes": [
      "Wizard-like steps with clear validation and preview.",
      "Column mapping should highlight required fields and show missing mappings before allowing Next.",
      "Use Skeleton rows while parsing CSV and during import API call."
    ],
    "do_not_do": [
      "Do not use transition: all.",
      "Do not apply gradients to tables/cards.",
      "Do not use purple.",
      "Do not rely on native HTML dropdowns; use shadcn components."
    ]
  },

  "appendix_general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>\n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
