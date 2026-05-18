# KRC College — Playwright TypeScript Automation Suite

> End-to-end automation for [https://www.krccollege.com](https://www.krccollege.com)  
> Built with **Playwright** + **TypeScript** using the **Page Object Model (POM)** pattern.

---

## 📁 Project Structure

```
krc-playwright/
├── playwright.config.ts          # Multi-browser config (Chrome, Firefox, Mobile)
├── package.json
├── tsconfig.json
│
├── pages/                        # Page Object Model classes
│   ├── BasePage.ts               # Shared nav, footer, logo locators + helpers
│   ├── HomePage.ts
│   ├── AboutPage.ts
│   ├── IITJEEAcademyPage.ts
│   ├── ResultsPage.ts
│   ├── FacilitiesPage.ts
│   ├── AdmissionsPage.ts
│   ├── BlogPage.ts
│   └── ContactPage.ts
│
├── tests/                        # Test specs
│   ├── navigation.spec.ts        # TC_NAV_001–010
│   ├── home.spec.ts              # TC_HOME_001–005
│   ├── about.spec.ts             # TC_ABOUT_001–007
│   ├── iitjee.spec.ts            # TC_IITJEE_001–008
│   ├── results.spec.ts           # TC_RESULTS_001–008
│   ├── facilities.spec.ts        # TC_FAC_001–008
│   ├── admissions.spec.ts        # TC_ADM_001–007
│   ├── blog.spec.ts              # TC_BLOG_001–008
│   ├── contact.spec.ts           # TC_CONTACT_001–006
│   ├── seo-http.spec.ts          # TC_HTTP & TC_SEO checks
│   └── responsive.spec.ts        # TC_RESP_001–005
│
└── utils/
    ├── testData.ts               # Centralised test data & URLs
    └── helpers.ts                # Reusable utility functions
```

---

## 🚀 Setup

### Prerequisites
- Node.js >= 18
- npm >= 9

### Install dependencies
```bash
npm install
npx playwright install
```

---

## ▶️ Running Tests

| Command | Description |
|---|---|
| `npm test` | Run all tests headlessly |
| `npm run test:headed` | Run with visible browser |
| `npm run test:ui` | Open Playwright UI Mode |
| `npm run test:report` | Open last HTML report |
| `npm run test:chromium` | Run only on Chromium |
| `npm run test:mobile` | Run only on Mobile Chrome |

### Run a specific spec file
```bash
npx playwright test tests/contact.spec.ts
```

### Run a specific test by name
```bash
npx playwright test --grep "TC_CONTACT_002"
```

---

## 🧩 Page Coverage

| Page | URL | POM Class | Tests |
|---|---|---|---|
| Home | `/` | `HomePage` | `home.spec.ts` |
| About Us | `/about` | `AboutPage` | `about.spec.ts` |
| IIT-JEE Academy | `/iit-jee-academy` | `IITJEEAcademyPage` | `iitjee.spec.ts` |
| Results | `/results` | `ResultsPage` | `results.spec.ts` |
| Facilities | `/facilities` | `FacilitiesPage` | `facilities.spec.ts` |
| Admissions | `/admissions` | `AdmissionsPage` | `admissions.spec.ts` |
| Blog | `/blog` | `BlogPage` | `blog.spec.ts` |
| Contact Us | `/Contact-us` | `ContactPage` | `contact.spec.ts` |

---

## 📋 Test Case Summary

| Spec | Test IDs | Count |
|---|---|---|
| Navigation | TC_NAV_001–010 | 10 |
| Home | TC_HOME_001–005 | 5 |
| About | TC_ABOUT_001–007 | 7 |
| IIT-JEE | TC_IITJEE_001–008 | 8 |
| Results | TC_RESULTS_001–008 | 8 |
| Facilities | TC_FAC_001–008 | 8 |
| Admissions | TC_ADM_001–007 | 7 |
| Blog | TC_BLOG_001–008 | 8 |
| Contact Us | TC_CONTACT_001–006 | 6 |
| SEO & HTTP | TC_HTTP + TC_SEO | 13 |
| Responsive | TC_RESP_001–005 | 5 |
| **Total** | | **85** |

---

## 🏗️ POM Design Principles

- **`BasePage`** holds all shared locators (nav, footer, logo) and common assertions.
- Every page class extends `BasePage`, inheriting shared logic.
- Test specs import only the page class they need — no raw `page` calls in tests.
- `testData.ts` centralises all test input data (valid, invalid, boundary).
- `helpers.ts` provides reusable utilities (scroll, screenshot, broken image check).

---

## 👥 Team Module Ownership (Suggested)

| Module | Pages | Owner |
|---|---|---|
| Navigation & Layout | All pages — nav + footer | QA Lead |
| Marketing Pages | Home, About Us, Facilities | QA Engineer 1 |
| Academic Pages | IIT-JEE Academy, Results | QA Engineer 2 |
| Lead Generation | Admissions, Contact Us | QA Engineer 3 |
| Content | Blog | QA Engineer 1 |
| Cross-cutting | SEO, HTTP status, Responsive | QA Lead |

---

## 📊 CI Integration (GitHub Actions example)

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```
