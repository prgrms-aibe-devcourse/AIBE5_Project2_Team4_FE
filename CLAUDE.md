# CLAUDE.md

## Project Context

This is a TypeScript frontend project using React and Svelte (hybrid). When editing CSS, always check both component-scoped styles AND global stylesheets (e.g., index.css, app.css) to find the actual source of a style before modifying it.

## General Rules

Before deleting or cleaning up any project files, list the files to be removed and get explicit user confirmation. Never batch-delete files without approval.

## CSS & Styling

When making CSS positioning changes (margins, transforms, translate), use small incremental values. Never apply aggressive values like `margin-top: -150px` or `translateY(-40%)` without confirming with the user first.

## Video / Media

For video encoding tasks: use FFmpeg with all-keyframe encoding (`-g 1`) for mouse-synced scrubbing. Verify FFmpeg is in PATH before starting. Expect iterative optimization.
