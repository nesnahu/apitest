Always create Excel-ready test output without header row.

Format:
Test-ID	Bereich	Endpoint	Parameter	Erwartung	Ergebnis	Status	Jira?

Rules:
- Valid year/month should return 200 or 204.
- year=1900 should return 422.
- month=13 should return 422.
- Missing authorization should return 401.

Plants:
- brave_bienvenida
- vivid_vockerode
