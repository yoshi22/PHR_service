describe('Dashboard Tests', () => {
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
    // Navigate to Dashboard before each test
    await element(by.text('ダッシュボード')).tap();
  });

  it('should display dashboard screen with chart', async () => {
    await expect(element(by.text('週間ダッシュボード'))).toBeVisible();
  });

  it('should show tooltip when tapping on data point', async () => {
    await element(by.id('chart-area')).tap({ x: 200, y: 100 });
    await expect(element(by.id('tooltip-container'))).toBeVisible();
  });
});
