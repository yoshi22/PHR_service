describe('PHRApp', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen', async () => {
    await expect(element(by.text('PHRアプリにログイン'))).toBeVisible();
  });

  it('should navigate to signup screen', async () => {
    await element(by.text('アカウントを作成')).tap();
    await expect(element(by.text('アカウント作成'))).toBeVisible();
  });

  it('should show validation errors', async () => {
    await element(by.text('ログイン')).tap();
    await expect(element(by.text('メールアドレスを入力してください'))).toBeVisible();
  });
});
