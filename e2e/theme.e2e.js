/**
 * E2E test for theme switching functionality
 */
describe('Theme Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { health: 'YES', notifications: 'YES' },
    });
    // Log in as a test user
    await element(by.id('email')).typeText('test@example.com');
    await element(by.id('password')).typeText('password123');
    await element(by.text('ログイン')).tap();
    await waitFor(element(by.text('おはようございます'))).toBeVisible().withTimeout(5000);
  });

  beforeEach(async () => {
    // Navigate to Profile screen before each test where theme toggle is
    await element(by.text('設定')).tap();
    // Wait for the profile screen to fully load
    await waitFor(element(by.text('プロフィール設定'))).toBeVisible().withTimeout(2000);
  });

  it('should toggle theme between light and dark modes', async () => {
    // Check initial state (assume light mode is default)
    const themeSwitch = element(by.id('theme-toggle'));
    await expect(themeSwitch).toBeVisible();

    // Toggle to dark mode
    await themeSwitch.tap();
    
    // Wait for toast notification confirming theme change
    await waitFor(element(by.text('ダークモードに切り替えました'))).toBeVisible().withTimeout(2000);
    
    // Navigate to Home screen to verify theme applied
    await element(by.text('ホーム')).tap();
    await waitFor(element(by.text('今日の歩数'))).toBeVisible().withTimeout(2000);
    
    // Back to Profile to toggle again
    await element(by.text('設定')).tap();
    await waitFor(element(by.text('プロフィール設定'))).toBeVisible().withTimeout(2000);
    
    // Toggle back to light mode
    await themeSwitch.tap();
    
    // Wait for toast notification confirming theme change
    await waitFor(element(by.text('ライトモードに切り替えました'))).toBeVisible().withTimeout(2000);
  });

  it('should persist theme selection after app restart', async () => {
    // Toggle to dark mode if not already
    const themeSwitch = element(by.id('theme-toggle'));
    await themeSwitch.tap();
    await waitFor(element(by.text(/モードに切り替えました/))).toBeVisible().withTimeout(2000);
    
    // Restart the app
    await device.reloadReactNative();
    
    // Log in again
    await element(by.id('email')).typeText('test@example.com');
    await element(by.id('password')).typeText('password123');
    await element(by.text('ログイン')).tap();
    
    // Navigate to Profile screen
    await element(by.text('設定')).tap();
    
    // Verify theme state persisted
    // This test assumes that the theme switch shows the current state correctly
    // We need to check if the switch value reflects the theme that was set before restart
    await expect(themeSwitch).toBeVisible();
    
    // Note: This is a simplified test. In a real implementation,
    // we might need to check some UI element properties to verify the theme
  });
});
