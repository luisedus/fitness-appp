# Architecture rules

- Keep privacy consent validation shared between registration forms and the auth entry point, so no app signup path bypasses explicit acceptance.
- Keep the supplied privacy notice as source-controlled text and expose it on a public route; open the registration link in another tab to preserve in-progress form data.