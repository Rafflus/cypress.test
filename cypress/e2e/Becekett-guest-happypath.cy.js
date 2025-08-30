
describe('Beckett card orderding ', () => {
   const searchStrings = {
    firstCardString: 'Franco',
    secondCardString: 'Massey',
    thirdCardString: 'Moore',
    fourthCardString: 'Bowen',
    fifthCardString: 'Holman'
   }
  
function expectedNumberOfCards(expectedDigit) {
  cy.get('td.text-nowrap.fw-thicker') 
    .invoke('text')
    .then(text => {
      expect(text.trim().charAt(0)).to.equal(String(expectedDigit))
    })
}

function checkNumberOfOversizedCards(expectedDigit) {
  cy.get('td.text-nowrap.fw-thicker')
    .eq(1)       
    .invoke('text')
    .then(text => {
      expect(text.trim().charAt(0)).to.equal(String(expectedDigit))
    })
}

function selectCardFromDropdownAndType(dropdownIndex, inputValue, inputId, expectedDigit) {
  cy.get('.left .input').find('.form-control').first().click()
  cy.get('.dropdown-menu').should('be.visible')
  cy.get('.dropdown-item').eq(dropdownIndex).click()
  cy.get(`#${inputId}`).type(inputValue)
  expectedNumberOfCards(expectedDigit)
}

function selectCountryByCode(code) {
  cy.get('select#country option').then($options => {
    const optionToSelect = [...$options].find(
      o => JSON.parse(o.value).code === code
    )
    if (optionToSelect) {
      cy.get('select#country').select(optionToSelect.value)
    } else {
      throw new Error(`no country with such code=${code}`)
    }
  })
}

function getRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRandomNumber(length) {
  if (length <= 0) return '';
  let result = '';
  result += Math.floor(Math.random() * 9) + 1;
  for (let i = 1; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

function getRandomEmail() {
  return `${getRandomString(5)}@${getRandomString(5)}.com`;
}

function getRandomAddressLine() {
  const streetName = getRandomString(Math.floor(Math.random() * 9) + 1); // max 9 znaków
  const houseNumber = getRandomNumber(1 + Math.floor(Math.random() * 2)); // 1-2 cyfry
  const apartmentNumber = getRandomNumber(1 + Math.floor(Math.random() * 2)); // 1-2 cyfry
  return `ul. ${streetName} ${houseNumber}/${apartmentNumber}`;
}

function fillAddressData() {
  const addressData = {
    firstName: getRandomString(5),
    lastName: getRandomString(8),
    email: getRandomEmail(),
    phone: getRandomNumber(9),
    line1: getRandomAddressLine(),
    city: getRandomString(5),
    zipcode: `${getRandomNumber(2)}-${getRandomNumber(3)}`
  };
  cy.get('#firstName').type(addressData.firstName);
  cy.get('#lastName').type(addressData.lastName);
  cy.get('#email').type(addressData.email);
  cy.get('.selected-flag').click()
  cy.get('.search-box').type('Poland', {force: true})
  cy.get('span.dial-code').contains('+48').click()
  cy.get('#phone').type(addressData.phone);
  cy.get('#line1').type(addressData.line1);
  cy.get('#city').type(addressData.city);
  cy.get('#zipcode').type(addressData.zipcode);
  cy.get('select#state option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const randomValue = $options[randomIndex].value;
    cy.get('select#state').select(randomValue);
    addressData.state = randomValue; 
  });
  return cy.wrap(addressData); 
}

function assertCardValue(cardId, expectedValue) {
  cy.get(`[data-test-id="${cardId}"] .tableValue`)
    .invoke('text')
    .then(raw => {
      const text = raw.replace(/\s+/g, ' ').trim();
      const afterDollar = text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
      const lastNumber = afterDollar
        ? afterDollar[1]
        : (text.match(/(\d[\d,]*(?:\.\d{1,2})?)(?!.*\d)/) || [])[1];

      const normalized = (lastNumber || '').replace(/,/g, '');

      expect(normalized).to.equal(String(expectedValue));
    });
}  
  beforeEach(() => {
    cy.visit('https://beckett.com/' , {
        onBeforeLoad: (win) => {
        // blokujemy Google Analytics
        win.ga = () => {};
      win.gtag = () => {};
  }
    })
    cy.get('#onetrust-accept-btn-handler').click() 
    cy.intercept('GET', '**/hs-sites.com/**', { statusCode: 200 })
    cy.intercept('POST', '**/hs-sites.com/**', { statusCode: 200 })
    cy.intercept('**/google-analytics.com/**', { statusCode: 200 }) // block analitics as there is modal which showns in random moments of test and test becomes flaky
    cy.intercept('**/gtag/js**', { statusCode: 200 })
 
  })

  it('Should make order for Cards', () => {
    cy.get('[role="toolbar"] a.btn-primary').click()
    cy.get('.principal-title').should('be.visible')
    cy.get('a[href="/submit/cards/service"]').should('be.visible')
    cy.get('a[href="/submit/cards/service"]').click()
    cy.get('.modal-dialog').should('be.visible')
    cy.get('.modal-dialog .btn-outline-primary').click()
    cy.get('.list').should('be.visible')
    cy.get('.list .item').eq(0).should('have.class', 'selected')
    cy.get('.list .item').eq(1).should('have.class', 'current')
    cy.get('[data-test-id="flip-front-card-1"]').should('be.visible')
    cy.get('[data-test-id="flip-front-card-1"] .btn-primary').click()
    cy.get('.list .item').eq(0).should('have.class', 'selected')
    cy.get('.list .item').eq(1).should('have.class', 'selected')
    cy.get('.list .item').eq(2).should('have.class', 'current')
    cy.get('.left .input').find('.form-control').first().type(searchStrings.firstCardString)
    cy.get('.dropdown-menu').should('be.visible')
    cy.get('.dropdown-item').first().click()
    cy.get('#value1').type('100')
    cy.get('[data-test-id="0-oversized"]').click()
    expectedNumberOfCards(1)
    selectCardFromDropdownAndType(1, 200, 'value2', 2)
    selectCardFromDropdownAndType(2, 300, 'value3', 3)
    selectCardFromDropdownAndType(3, 400, 'value4', 4)
    selectCardFromDropdownAndType(4, 500, 'value5', 5)
    checkNumberOfOversizedCards(1)
    cy.get('[data-test-id="bottom-navigation-continue"]').click()
    cy.get('.list .item').eq(2).should('have.class', 'selected')
    cy.get('.list .item').eq(3).should('have.class', 'current')
    selectCountryByCode('PL')
    fillAddressData().then(data => {
    cy.log('Generated address: ' + JSON.stringify(data))
      }).as('addressData')
    cy.get('#shipping-International').click()
    cy.get('.osf_shippingAlert__j8kBw').should('be.visible')
    cy.get('[data-test-id="order-summary"]').find('#summary-button').click()
    cy.get('.list .item').eq(3).should('have.class', 'selected')
    cy.get('.list .item').eq(4).should('have.class', 'current')
    assertCardValue('card-1', '500')
    assertCardValue('card-2', '400')
    assertCardValue('card-3', '300')
    assertCardValue('card-4', '200')
    assertCardValue('card-5', '100')
    cy.get('#checked-tos').click()
    cy.get('#checked-expiration').click()
    cy.get('.text-danger mb-0').should('not.exist')
    cy.get('[data-test-id="order-summary"]').find('#summary-button').click()
    cy.get('.list .item').eq(4).should('have.class', 'selected')
    cy.get('.list .item').eq(5).should('have.class', 'current')
    cy.get('[data-braintree-id="sheet-container"]').should('be.visible')
    
  })
})