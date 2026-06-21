# MindMirror AI — IAP 配置指南

## Apple App Store

### 1. 创建 Subscription Group
- 登录 App Store Connect
- 进入 "My Apps" → 选择 MindMirror AI → "Subscriptions"
- 点击 "Create Subscription Group"
- 名称: "MindMirror Premium"
- 参考名: "mindmirror_premium"

### 2. 创建 Subscription Product
- 在 Group 内点击 "Create Subscription"
- 参考名: `mindmirror_monthly`
- 产品ID: `com.yantenglong.mindmirror.premium.monthly`
- 订阅周期: 1 Month
- 价格层级: Tier 3 ($2.99 USD)
- 订阅群组: "MindMirror Premium"
- 审查信息:
  - 显示名: "MindMirror Premium"
  - 描述: "Unlimited journals, weekly AI insights, deep emotion analysis"
  - 审查截图: 付费墙页面截图

### 3. 创建年度订阅（可选）
- 参考名: `mindmirror_yearly`
- 产品ID: `com.yantenglong.mindmirror.premium.yearly`
- 订阅周期: 1 Year
- 价格层级: Tier 18 ($19.99 USD)
- 引入价: $2.99/month → 约 $0.58/week 省 67%

### 4. 配置 Sandbox 测试
- App Store Connect → Users and Access → Sandbox
- 添加测试用户邮箱
- 在设备上登录 Sandbox 账户测试购买

## Google Play

### 1. 创建 Subscription
- 登录 Google Play Console
- 进入 "Monetize" → "Products" → "Subscriptions"
- 点击 "Create subscription"
- 产品ID: `mindmirror_premium_monthly`
- 名称: "MindMirror Premium Monthly"
- 描述: "Unlimited journals, weekly AI insights"
- 订阅周期: 1 month
- 默认价格: $2.99 USD
- 同步推出: 全国家/地区

### 2. 基础计划
- 基础计划: "Monthly Premium"
- 自动续订: 开启
- 免费试用期: 7 天（建议）
- 引入价: "Unlock unlimited journaling"

### 3. 配置年度订阅（可选）
- 产品ID: `mindmirror_premium_yearly`
- 订阅周期: 1 year
- 默认价格: $19.99 USD
- 免费试用期: 7 天

### 4. 配置测试账户
- Google Play Console → "License testing"
- 添加测试用户 Gmail
- 购买会显示测试卡片，不扣费
