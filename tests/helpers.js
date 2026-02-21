// @ts-check
const { expect } = require('@playwright/test');

/**
 * Expect an element to be visible on the page.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function toBeVisible(page, selector) {
    await expect(page.locator(selector)).toBeVisible();
}

/**
 * Expect an element to be hidden on the page.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function toBeHidden(page, selector) {
    await expect(page.locator(selector)).toBeHidden();
}

/**
 * Expect an element to have a specific value.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} value
 */
async function toHaveValue(page, selector, value) {
    await expect(page.locator(selector)).toHaveValue(value);
}

/**
 * Expect an element to have a specific CSS class.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {RegExp | string} classPattern
 */
async function toHaveClass(page, selector, classPattern) {
    await expect(page.locator(selector)).toHaveClass(classPattern);
}

/**
 * Expect an element to contain text.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} text
 */
async function toContainText(page, selector, text) {
    await expect(page.locator(selector)).toContainText(text);
}

/**
 * Expect an element to be disabled.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function toBeDisabled(page, selector) {
    await expect(page.locator(selector)).toBeDisabled();
}

/**
 * Expect an element to be checked (for checkboxes/radio buttons).
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function toBeChecked(page, selector) {
    await expect(page.locator(selector)).toBeChecked();
}

/**
 * Expect an element to NOT be checked (for checkboxes/radio buttons).
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function notToBeChecked(page, selector) {
    await expect(page.locator(selector)).not.toBeChecked();
}

/**
 * Expect an element to have a specific attribute value.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} attribute
 * @param {string | RegExp} value
 */
async function toHaveAttribute(page, selector, attribute, value) {
    await expect(page.locator(selector)).toHaveAttribute(attribute, value);
}

/**
 * Expect an element to have a specific count in the DOM.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {number} count
 */
async function toHaveCount(page, selector, count) {
    await expect(page.locator(selector)).toHaveCount(count);
}

/**
 * Fill an input element with a value.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} value
 */
async function fill(page, selector, value) {
    await page.locator(selector).fill(value);
}

/**
 * Click an element.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function click(page, selector) {
    await page.locator(selector).click();
}

/**
 * Click the first matching element.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function clickFirst(page, selector) {
    await page.locator(selector).first().click();
}

/**
 * Check a checkbox or radio button.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function check(page, selector) {
    await page.locator(selector).check();
}

/**
 * Uncheck a checkbox.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function uncheck(page, selector) {
    await page.locator(selector).uncheck();
}

/**
 * Select an option from a select element.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} value
 */
async function selectOption(page, selector, value) {
    await page.locator(selector).selectOption(value);
}

/**
 * Get the value of an input element.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @returns {Promise<string>}
 */
async function getValue(page, selector) {
    return await page.locator(selector).inputValue();
}

/**
 * Get all text contents of matching elements.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @returns {Promise<string[]>}
 */
async function getAllTextContents(page, selector) {
    return await page.locator(selector).allTextContents();
}

/**
 * Get an attribute value from an element.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} attribute
 * @returns {Promise<string | null>}
 */
async function getAttribute(page, selector, attribute) {
    return await page.locator(selector).getAttribute(attribute);
}

/**
 * Get the text content of an element.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @returns {Promise<string | null>}
 */
async function getTextContent(page, selector) {
    return await page.locator(selector).textContent();
}

/**
 * Wait for an element to be visible with a specific timeout.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForVisible(page, selector, timeout = 5000) {
    await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Wait for a selector with an optional class modifier.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - Base selector (e.g., '#homePage')
 * @param {string} classModifier - Class to append (e.g., '.active')
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForClass(page, selector, classModifier = '', timeout = 10000) {
    const fullSelector = classModifier ? `${selector}${classModifier}` : selector;
    await page.waitForSelector(fullSelector, { timeout });
}

module.exports = {
    toBeVisible,
    toBeHidden,
    toHaveValue,
    toHaveClass,
    toContainText,
    toBeDisabled,
    toBeChecked,
    notToBeChecked,
    toHaveAttribute,
    toHaveCount,
    fill,
    click,
    clickFirst,
    check,
    uncheck,
    selectOption,
    getValue,
    getAllTextContents,
    getAttribute,
    getTextContent,
    waitForVisible,
    waitForClass,
};
