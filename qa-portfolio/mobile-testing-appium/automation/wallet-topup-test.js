// SamplePay Wallet - Appium wallet top-up tests (WebdriverIO style)

describe('SamplePay Mobile App - Wallet Top-up', () => {
  beforeEach(async () => {
    await driver.reset();

    const emailField = await $('~login-email-input');
    const passwordField = await $('~login-password-input');
    const loginButton = await $('~login-submit-button');

    await emailField.setValue('customer.qa+topup@samplepay.com');
    await passwordField.setValue('Password123!');
    await loginButton.click();

    const dashboardTitle = await $('~dashboard-title');
    await expect(dashboardTitle).toBeDisplayed();
  });

  it('WTU-001: Successful wallet top-up via card', async () => {
    const topupButton = await $('~action-topup-wallet');
    await topupButton.click();

    const amountField = await $('~topup-amount-input');
    await amountField.setValue('50.00');

    const cardOption = await $('~topup-method-card');
    await cardOption.click();

    const confirmButton = await $('~topup-confirm-button');
    await confirmButton.click();

    const successBanner = await $('~topup-success-banner');
    await expect(successBanner).toBeDisplayed();
    await expect(successBanner).toHaveTextContaining('Top-up successful');
  });
});

