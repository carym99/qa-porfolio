// SamplePay Wallet - Appium login tests (WebdriverIO style)

describe('SamplePay Mobile App - Login', () => {
  beforeEach(async () => {
    // Ensure app is on login screen
    await driver.reset();
  });

  it('ML-001: Successful login with valid credentials', async () => {
    const emailField = await $('~login-email-input');
    const passwordField = await $('~login-password-input');
    const loginButton = await $('~login-submit-button');

    await emailField.setValue('customer.qa+login@samplepay.com');
    await passwordField.setValue('Password123!');
    await loginButton.click();

    const dashboardTitle = await $('~dashboard-title');
    await expect(dashboardTitle).toBeDisplayed();

    const balanceLabel = await $('~wallet-balance-label');
    await expect(balanceLabel).toBeDisplayed();
  });

  it('ML-002: Invalid password shows error', async () => {
    const emailField = await $('~login-email-input');
    const passwordField = await $('~login-password-input');
    const loginButton = await $('~login-submit-button');

    await emailField.setValue('customer.qa+login@samplepay.com');
    await passwordField.setValue('WrongPassword!');
    await loginButton.click();

    const errorToast = await $('~login-error-toast');
    await expect(errorToast).toBeDisplayed();
    await expect(errorToast).toHaveTextContaining('Invalid email or password');
  });
});

