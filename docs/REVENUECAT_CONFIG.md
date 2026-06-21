# MindMirror AI — RevenueCat 配置指南

## 1. 创建 RevenueCat 账号
- 访问 https://www.revenuecat.com
- 注册账号（可以用 Google/GitHub 快速登录）
- 免费版支持 $2.5k MTR 以内（足够用到盈利）

## 2. 创建 Project
- 点击 "Create project"
- 名称: "MindMirror AI"
- App name: "MindMirror AI"
- Bundle ID (iOS): `com.yantenglong.mindmirror`
- Package name (Android): `com.yantenglong.mindmirror`

## 3. 配置 API Key
- 进入 Project Settings → API Keys
- 复制 Public SDK Key（用于 App）
- 复制 Secret API Key（用于后端）
- 更新 `lib/revenuecat.ts` 中的 API key

## 4. 配置 Entitlements
- 进入 "Products" → "Entitlements"
- 点击 "Create entitlement"
- 标识符: `premium`
- 描述: "Premium subscription with unlimited features"

## 5. 配置 Offerings
- 进入 "Products" → "Offerings"
- 点击 "Create offering"
- 标识符: `default`
- 描述: "Default offering"
- 添加 packages:
  - Monthly: 关联 `mindmirror_monthly` (Apple) 和 `mindmirror_premium_monthly` (Google)
  - Yearly: 关联 `mindmirror_yearly` (Apple) 和 `mindmirror_premium_yearly` (Google)

## 6. 配置 App Store Connect API
- 在 RevenueCat 中进入 "Projects settings" → "App Store Connect"
- 使用 App Store Connect API Key 或 App-Specific Shared Secret
- 如果没有 API Key，可以使用 Shared Secret（先临时用，后续建议切换 API Key）

## 7. 配置 Google Play Service Account
- 在 RevenueCat 中进入 "Projects settings" → "Google Play"
- 需要创建 Google Cloud Service Account
- 步骤:
  1. Google Cloud Console → IAM → Service Accounts → 创建
  2. 角色: "Pub/Sub Editor" 和 "Monitoring Viewer"
  3. 创建 JSON key 并下载
  4. 上传到 RevenueCat
  5. 在 Google Play Console → API Access → 添加 Service Account

## 8. 代码集成
已在 `lib/revenuecat.ts` 中实现了基本框架，需要更新 API Key:

```typescript
const API_KEYS = {
  apple: "你的RevenueCat_Public_SDK_Key",
  google: "你的RevenueCat_Public_SDK_Key",
};
```

## 9. 测试购买
- iOS: 使用 Sandbox 测试账户
- Android: 使用 Google Play 测诖账户
- 确认购买流程正常
- 确认订阅状态同步正常

## 10. 生产环境检查表
- [ ] RevenueCat Project 创建完成
- [ ] API Key 更新到代码
- [ ] Entitlement `premium` 配置完成
- [ ] Offering `default` 配置完成
- [ ] Apple products 关联完成
- [ ] Google products 关联完成
- [ ] App Store Connect 连接完成
- [ ] Google Play 连接完成
- [ ] 测试购买通过
