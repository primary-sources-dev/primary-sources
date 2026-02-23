# Next Up: Immediate Quick Wins

Based on the [Master Roadmap](./roadmap.md), these three features represent the highest impact for the lowest implementation effort. They leverage existing data structures to provide immediate value to researchers.

---

### 1. Age-at-Event Badge (#25)
*   **Description**: Automatically calculate and display a person's exact age next to their name on any event or document page.
*   **Logic**: `event_date` - `birth_date` = Age.
*   **Value**: Instantly humanizes the data. Seeing that a key witness was only 19 years old qualitatively changes how a researcher views their testimony.
*   **Category**: Assistant / Forensic

### 2. Inflation Converter (#26)
*   **Description**: A toggle or hover interaction on any historical currency value (e.g., in FBI reports or cultural ads) that shows its modern purchasing power.
*   **Logic**: Static CPI (Consumer Price Index) multiplier applied to `assertion_value`.
*   **Value**: Provides a "time-machine" perspective on the 1960s economy, making historical prices (like a $25.00 rifle or a $0.30 gallon of gas) relatable to a 2026 user.
*   **Category**: Assistant / Culture

### 3. "On This Day" (OTD) Dashboard (#24)
*   **Description**: An automated widget on the home page highlighting historical events that occurred on today's month/day in previous years.
*   **Logic**: SQL/JSON filter: `WHERE month = current_month AND day = current_day`.
*   **Value**: Encourages daily engagement and surfaces deep archive content without requiring manual curation.
*   **Category**: Assistant / Engagement

---
*These features will be the primary focus for the next sprint to demonstrate the power of the Atomic Historical Engine.*
