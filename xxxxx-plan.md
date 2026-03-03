# Audio Mode Classify Execution Plan

1. Keep Input unchanged.
- Intake remains Upload/Paste/URL.
- No Whisper controls added to Input.

2. Detect source mode on load.
- Use `/api/review/{file}` payload (`media_type` and segment data).
- Set workbench mode to `document` or `audio`.

3. Render source-specific classify cards.
- Document mode: current page card renderer.
- Audio mode: segment card renderer with timestamp range and transcript.

4. Keep one shared decision model.
- Persist shared fields (`status`, `notes`, selections).
- Add audio fields (`segment_id`, `time_start`, `time_end`, `transcript_quality`).

5. Preserve skip/save semantics.
- `Apply & Save` and `Skip` work the same in both modes.
- Skip reason remains required when skipping.

6. Keep entities and export in same loop.
- Entities consumes approved transcript text.
- Export carries audio attribution and segment bounds.

7. UX rules.
- Hide document-only controls in audio mode.
- Hide audio-only controls in document mode.
- Keep tab flow and unlock behavior unchanged.

8. Implementation order.
1. Add mode detection and state flags.
2. Add audio classify card renderer and bindings.
3. Persist/reload audio feedback fields.
4. Validate export payload contains audio fields.
5. Regression-test document mode and API contracts.
