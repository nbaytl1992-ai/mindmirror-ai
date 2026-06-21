/**
 * Attach MindMirror monthly/yearly subscriptions to App 1.0 (App Store Connect).
 * Win11: run via run-asc-attach.ps1 (WSLg browser) or run-asc-attach-win.ps1 (native Node).
 */
import { chromium } from 'playwright';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, 'asc-auth.json');
const APP_ID = '6770541682';
const VERSION_URL = `https://appstoreconnect.apple.com/apps/${APP_ID}/distribution/ios/version/inflight`;

async function main() {
  console.log('Launching Chromium…');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--start-maximized'],
  });
  const context = await browser.newContext(
    existsSync(AUTH_FILE)
      ? { storageState: AUTH_FILE, viewport: null }
      : { viewport: null }
  );
  const page = await context.newPage();

  console.log('Opening version 1.0 page…');
  await page.goto(VERSION_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

  if (/idmsa\.apple\.com|appleid\.apple\.com/i.test(page.url())) {
    console.log('\n>>> 请在浏览器里登录 Apple ID（含双重认证），最多等待 5 分钟…\n');
    await page.waitForURL(/appstoreconnect\.apple\.com/, { timeout: 300000 });
    await context.storageState({ path: AUTH_FILE });
    console.log('已保存登录状态');
    await page.goto(VERSION_URL, { waitUntil: 'networkidle', timeout: 120000 }).catch(() =>
      page.goto(VERSION_URL, { waitUntil: 'domcontentloaded' })
    );
  }

  await page.waitForTimeout(2000);

  // Scroll to "App 内购买项目和订阅" section
  const section = page.getByText(/App 内购买项目和订阅|In-App Purchases and Subscriptions/i).first();
  if (await section.isVisible({ timeout: 10000 }).catch(() => false)) {
    await section.scrollIntoViewIfNeeded();
  }

  const addSelectors = [
    page.getByRole('button', { name: /^添加$|^Add$/i }),
    page.locator('button:has-text("添加")'),
    page.locator('button:has-text("Add")'),
    page.getByRole('button', { name: /App 内购买|In-App Purchase/i }),
  ];

  let opened = false;
  for (const loc of addSelectors) {
    const btn = loc.first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      opened = true;
      console.log('已点击「添加」');
      break;
    }
  }
  if (!opened) {
    console.log('未自动找到「添加」按钮，请在页面中找到「App 内购买项目和订阅」→ 手动点添加。');
  }

  await page.waitForTimeout(1500);

  const names = [/月度|Monthly/i, /年度|Yearly|Annual/i, /premium\.monthly/i, /premium\.yearly/i];
  for (const re of names) {
    const row = page.getByRole('checkbox', { name: re }).or(page.getByText(re)).first();
    if (await row.isVisible({ timeout: 4000 }).catch(() => false)) {
      try {
        await row.check({ force: true });
        console.log('已勾选:', re.toString());
      } catch {
        await row.click();
        console.log('已点击:', re.toString());
      }
    }
  }

  for (const re of [/完成|Done|好|OK|保存|Save/i]) {
    const ok = page.getByRole('button', { name: re }).first();
    if (await ok.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ok.click();
      console.log('已确认对话框');
      break;
    }
  }

  await context.storageState({ path: AUTH_FILE });
  console.log('\n完成。请在浏览器里确认版本页已显示两个月/年订阅，然后关闭窗口。');
  console.log('（窗口将保持 10 分钟，也可直接关掉浏览器）\n');
  await page.waitForTimeout(600000);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
