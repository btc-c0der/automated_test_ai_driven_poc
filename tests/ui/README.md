# UI Tests

UI tests will live here once the API test suite is stable.

## Planned structure

```
tests/ui/
├── pages/          ← Page Object Model classes
│   ├── BasePage.ts
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   └── ProductsPage.ts
├── home.spec.ts
├── auth.spec.ts
└── products.spec.ts
```

## Starting point

Run `playwright test --project=ui` once spec files are added.
The `ui` project is already configured in `playwright.config.ts` with:
- `baseURL`: https://automationexercise.com
- Viewport: 1280×720
- Screenshot on failure
- Video retained on failure
- Trace retained on failure
