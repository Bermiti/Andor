# Andor Mobile Safari QA

Test matrix:

| Device | Browser | Priority |
| --- | --- | --- |
| iPhone 13 | Safari | Required |
| iPhone SE | Safari | Recommended |
| Android phone | Chrome | Recommended |

| Flow | Expected behavior | Capture if broken | Severity |
| --- | --- | --- | --- |
| Homepage search | Hero reads cleanly, fields stack, autocomplete is thumb usable, CTA opens wizard. | Full-screen screenshot plus horizontal-scroll video. | Blocker if overflow or CTA hidden |
| Wizard keyboard | Destination keyboard does not cover primary action; steps 1-4 remain scrollable. | Screen recording with keyboard open. | Blocker if stuck |
| Generate Tokyo itinerary | Loading is clear; success opens itinerary; failure shows friendly retry. | Network/error screenshot and request time. | High |
| Switch days | Tabs scroll horizontally, active tab stays visible, progress updates. | Video of tab switch. | High |
| Expand activity | Card opens smoothly, booking/save/map actions remain reachable. | Screenshot before/after. | High |
| Map popup | Marker tap opens popup within viewport; close button is tappable. | Video including pinch/scroll. | High |
| Chat | Opens above content, input remains above keyboard, send disabled when empty. | Video with keyboard and one sent message. | High |
| Export PDF | Generating toast appears; PDF downloads or Safari fallback is understandable. | Screenshot of toast/download sheet. | Medium |
| Share itinerary | Copy, WhatsApp, and email actions work; local-only limitation is visible. | Screenshot of share sheet/modal. | High |
| Destination page | Hero image/fallback, best-time calendar, skip list, CTA render without overflow. | Screenshot at top and calendar. | Medium |
| Light/dark mode | Text, cards, inputs, and gold accents stay readable. | Paired screenshots. | Medium |
| Bad network/offline | Generation/chat show useful error and app state is preserved. | Network throttle/offline video. | Blocker if crash/data loss |

Ship/no-ship:

| Level | Definition | Decision |
| --- | --- | --- |
| Blocker | Crash, hidden primary action, data loss, broken generation, horizontal page overflow. | No ship |
| High | Core itinerary/chat/map/share flow degraded but recoverable. | Fix before launch unless explicitly accepted |
| Medium | Polish/accessibility/performance issue with workaround. | Can ship with owner and date |
| Low | Copy or minor visual defect. | Can ship |

