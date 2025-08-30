# E2E Tests – Beckett (Cypress)

This project contains **a single main E2E scenario** that automates the “Card Ordering” process on beckett.com.  
The test covers adding cards with different values, selecting country/state, filling in address data, going through the order summary, and verifying payment (Braintree) elements.

## Requirements

- **Node.js**: ≥ 16.x (recommended: 18.x LTS / 20.x LTS)  
- **npm**: ≥ 8.x  
- **Cypress**: ≥ 13.x

Check versions:
```bash
node -v
npm -v
npx cypress -v
```

---

## Installation & Commands

Install dependencies:
```bash
npm ci     # preferred in CI or clean environments
# or
npm install
```

Run interactive mode (GUI):
```bash
npx cypress open
```

Run headless mode (CLI):
```bash
npx cypress run
```

Run only this specific test file:
```bash
npx cypress run --spec "cypress/e2e/beckett.ordering.cy.js"
```
### Helper Functions
- **`expectedNumberOfCards(expectedDigit)`** – checks the first digit in the first `td.text-nowrap.fw-thicker`.
- **`checkNumberOfOversizedCards(expectedDigit)`** – checks the first digit in the second `td.text-nowrap.fw-thicker`.
- **`selectCardFromDropdownAndType(dropdownIndex, inputValue, inputId, expectedDigit)`** – selects a dropdown entry, types into `#valueX`, and validates count.
- **`selectCountryByCode(code)`** – selects `<option>` in `#country` by JSON `code` (e.g. `"PL"`).
- **Generators:**
  - `getRandomString(len)` – random a–z,
  - `getRandomNumber(len)` – first digit 1–9, rest 0–9,
  - `getRandomEmail()` – simple random email,
  - `getRandomAddressLine()` – format `ul. <name<=9> <house>/<apt>`.
- **`fillAddressData()`** – fills the form and **returns** `addressData` via `cy.wrap(...)`:
  - `firstName (5)`, `lastName (8)`, `email`, `phone (9)`, `line1`, `city (<=5)`, `zipcode (00-000)`, `state`,
  - selects phone prefix: click `.selected-flag` → search “Poland” in `.search-box` → click `span.dial-code` `+48`,
  - result object can be consumed via `.then(data => ...)` or `.as('addressData')`.
- **`assertCardValue(cardId, expectedValue)`** – extracts numeric value from `.tableValue` (after `$` or last number in text).

### Example: using `fillAddressData` later
```js
fillAddressData().as('addressData')

// later in test
cy.get('@addressData').then(data => {
  cy.contains('.osf_paper__mskN0 .title', 'Shipping Details')
    .closest('.osf_paper__mskN0')
    .within(() => {
      cy.get('p.free-text.mb-0').should('contain.text', `${data.firstName} ${data.lastName}`)
      cy.get('p.free-text.mb-0').should('contain.text', data.email)
      cy.get('p.free-text.mb-0').should('contain.text', `+48${data.phone}`)
      cy.get('p.free-text.mb-0').should('contain.text', data.line1)
      cy.get('p.free-text.mb-0').should('contain.text', data.city)
      cy.get('p.free-text.mb-0').should('contain.text', data.state)
      cy.get('p.free-text.mb-0').should('contain.text', data.zipcode)
      cy.get('p.free-text.mb-0').should('contain.text', 'Poland (PL)')
    })
})
```

---

## Selectors & Conventions

- Prefer stable selectors: **`data-test-id`**, **`id`**, attribute selectors (`href`, `role`, `[data-...]`).  
- Examples from the test:
  - `cy.get('[role="toolbar"] a.btn-primary')`
  - `cy.get('a[href="/submit/cards/service"]')`
  - `cy.get('[data-test-id="flip-front-card-1"]')`
  - `cy.get('[data-test-id="bottom-navigation-continue"]')`
  - `cy.get('[data-braintree-id="sheet-container"]')`
  - `cy.get('select#country')`, `cy.get('select#state')`
  - `cy.get('td.text-nowrap.fw-thicker').eq(1)`
- Avoid relying on visible text where possible.

---

## Cypress Config (example)

`cypress.config.js`:
```js
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://beckett.com',
    chromeWebSecurity: false,
    viewportWidth: 1366,
    viewportHeight: 768,
    setupNodeEvents(on, config) {
      // plugin or tasks
    },
  },
})
```

---

## Tips & Troubleshooting

- **Random popup/iframe** – even with intercepts, sometimes appears. Current test:
  - blocks `hs-sites.com`, `google-analytics.com`, `gtag/js`,
  - stubs `win.ga` and `win.gtag`,
  - if needed, you can add conditional iframe closing (look for `#interactive-close-button` inside iframe).
- **Price assertions** – `assertCardValue` extracts numbers after `$` or last number in string, avoiding false matches (e.g. `1500` instead of `500`).
- **Numbers without leading zero** – `getRandomNumber` ensures first digit is 1–9.