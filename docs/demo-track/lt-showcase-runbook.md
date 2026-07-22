# 15-minute LT showcase runbook

## Goal

Show that slides, 2D images, Live2D, 3D stage, semantic effects, dialogue, and credits can run on one cue-driven presentation runtime.

## Demo Order

| Step | Layer profile | What to show | Target |
| --- | --- | --- | --- |
| 1 | `slide_only` | Start as a normal slide deck. | 60s |
| 2 | `slide_with_manju + subtitle` | Add commentary subtitles and a manju presenter. | 150s |
| 3 | `slide_with_character` | Swap to static illustration without changing cue flow. | 240s |
| 4 | `stage_with_overlay` | Add object explanation and branchable supplement. | 360s |
| 5 | `stage_full` | Show 3D stage, character layers, and semantic effects. | 480s |
| 6 | `dialogue_split` | Show multi-character dialogue. | 600s |
| 7 | `stage_with_overlay` | Use QA and semantic effects. | 720s |
| 8 | `stage_with_overlay` | Transition into credits. | 820s |
| 9 | `ending_credits` | Start the spiral credits from the final cue. | 900s |

The current cue dataset is deliberately short. Use Manual Mode for the talk, or press `D` to run Demo Script Mode for a timed rehearsal.

## Controls

- `Space` / `ArrowRight`: next cue
- `ArrowLeft`: back
- `D`: Demo Script Mode
- `P`: pause/resume timed progression
- `S`: skip toward the summary path
- `Q`: QA mode
- `4`: summary shortcut
- `C`: credits crawl
- `V`: credits spiral
- `T`: subtitles on/off
- `N`: speaker note on/off
- `R`: reset

## Fallback Levels

| Level | Use when | Behavior |
| --- | --- | --- |
| `full` | Everything works. | Uses all configured layers. |
| `no-live2d` | Cubism Core/model fails. | Keeps stage, manju, static illustration, subtitles. |
| `no-3d-model` | GLB/VRM is not ready. | Uses slide/manju commentary for stage-heavy cues. |
| `offline` | No AI/network dependency desired. | Uses local cue data and local assets only. |
| `static` | GPU, model, or asset risk is too high. | Keeps slide/subtitle focused presentation. |

Change fallback level from the control panel before or during the talk. The status panel shows the active fallback and whether a cue used fallback composition.

## Preflight

1. Run `npm run build`.
2. Start local preview and open `http://localhost:5174/`.
3. Confirm `public/assets-local/**` exists for the local characters you want to show.
4. Verify the browser uses WebGL2 and the 3D stage renders.
5. Check the room resolution and fullscreen behavior.
6. Confirm subtitles are readable from the back of the room.
7. Rehearse once in Manual Mode and once with `D` Demo Script Mode.
8. Test fallback `static` and credits `V`.

## Recovery

- If Live2D fails, choose `no-live2d`.
- If 3D rendering stutters, choose `static`.
- If timing drifts, stay in Manual Mode and use `S` or `4`.
- If credits block controls, press `Escape` or the credits close button.
- If the app state becomes confusing, press `R` and continue from the first cue.
