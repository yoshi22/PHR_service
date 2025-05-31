describe('AI Chat Tests', () => {
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
    // Navigate to Chat screen before each test
    await element(by.text('AIチャット')).tap();
    // Wait for the chat screen to fully load
    await waitFor(element(by.text('こんにちは！あなたの健康管理AIアシスタントです'))).toBeVisible().withTimeout(5000);
  });

  it('should display welcome message', async () => {
    await expect(element(by.text('こんにちは！あなたの健康管理AIアシスタントです'))).toBeVisible();
  });

  it('should send a message and receive response', async () => {
    // Type a message
    await element(by.id('chat-input')).typeText('今日の調子はどうですか？');
    // Send the message
    await element(by.id('send-button')).tap();
    
    // Check if our message appears in the chat
    await expect(element(by.text('今日の調子はどうですか？'))).toBeVisible();
    
    // Wait for AI response (may take a while if not cached)
    await waitFor(element(by.id('ai-message'))).toBeVisible().withTimeout(15000);
    
    // Verify there's an AI response bubble visible
    await expect(element(by.id('ai-message'))).toBeVisible();
  });

  it('should show loading indicator while waiting for response', async () => {
    // Type a unique message that likely won't be cached
    const uniqueMessage = `健康アドバイスをください${Date.now()}`;
    
    // Type the message
    await element(by.id('chat-input')).typeText(uniqueMessage);
    // Send the message
    await element(by.id('send-button')).tap();
    
    // Check if loading indicator appears
    await expect(element(by.id('loading-indicator'))).toBeVisible();
    
    // Wait for response to finish loading
    await waitFor(element(by.id('ai-message'))).toBeVisible().withTimeout(15000);
  });

  it('should handle keyboard properly', async () => {
    // Tap on input field to show keyboard
    await element(by.id('chat-input')).tap();
    
    // Verify chat input is above keyboard (no direct way to check this in Detox, so we check if input is visible)
    await expect(element(by.id('chat-input'))).toBeVisible();
    
    // Type some text
    await element(by.id('chat-input')).typeText('テストメッセージ');
    
    // Tap outside to dismiss keyboard
    await element(by.id('message-list')).tap();
    
    // Verify keyboard is dismissed (indirectly by checking if we can see everything)
    await expect(element(by.text('こんにちは！あなたの健康管理AIアシスタントです'))).toBeVisible();
  });
});
