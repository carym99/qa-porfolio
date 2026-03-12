// SamplePay Wallet - Appium payment flow tests (WebdriverIO style)

describe('SamplePay Mobile App - Payment Flows', () => {
  beforeEach(async () => {
    await driver.reset();

    // Perform login via helper
    const emailField = await $('~login-email-input');
    const passwordField = await $('~login-password-input');
    const loginButton = await $('~login-submit-button');

    await emailField.setValue('customer.qa+payments@samplepay.com');
    await passwordField.setValue('Password123!');
    await loginButton.click();

    const dashboardTitle = await $('~dashboard-title');
    await expect(dashboardTitle).toBeDisplayed();
  });

  it('MP-001: Successful payment from wallet balance', async () => {
    const payMerchantButton = await $('~action-pay-merchant');
    await payMerchantButton.click();

    const merchantItem = await $('~merchant-MRC-10001');
    await merchantItem.click();

    const amountField = await $('~payment-amount-input');
    await amountField.setValue('15.00');

    const confirmButton = await $('~payment-confirm-button');
    await confirmButton.click();

    const successBanner = await $('~payment-success-banner');
    await expect(successBanner).toBeDisplayed();
    await expect(successBanner).toHaveTextContaining('Payment successful');
  });
});

