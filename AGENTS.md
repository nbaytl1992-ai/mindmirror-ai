# MindMirror AI — Multi-Agent 协作架构

## Agent 角色定义

### CEO (Product Owner)
- 职责: 产品决策、优先级排序、盈亏监控
- 触发: 需要方向选择、定价策略、功能取舍
- 不插手: 具体代码实现

### CTO (Tech Lead)
- 职责: 技术选型、架构设计、代码审查、构建排错
- 触发: 技术债务、构建失败、性能问题
- 当前任务: EAS Build 失败排查、Expo 版本兼容性

### Mobile Dev (Full-Stack Engineer)
- 职责: React Native 开发、UI 实现、状态管理
- 触发: 新功能开发、Bug 修复
- 当前任务: 完成日记核心流程、图表组件

### IAP Specialist (Monetization Engineer)
- 职责: RevenueCat 配置、Apple/Google IAP products、支付流程
- 触发: 订阅逻辑、价格调整、上架审核
- 当前任务: 配置 $2.99/month subscription product

### Growth Hacker (ASO & Marketing)
- 职责: 应用商店优化、关键词、截图、推广文案
- 触发: 上架前准备、排名监控、用户获取
- 当前任务: 准备中英文 ASO 素材

## 协作规则
1. CEO 拥有最终决策权，但只在盈亏/方向问题上发声
2. CTO 拥有技术否决权，可以 block 不健康的架构决策
3. Agent 之间通过文件系统通信（写入 task_XX.md 状态文件）
4. 每轮迭代后由 CEO review 进度
5. 并行度: 最多 3 个 Agent 同时工作（delegate_task 限制）
