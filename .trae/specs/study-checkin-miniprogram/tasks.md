# 学习打卡记录小程序 - 第三次课升级任务

## 项目信息
- **APPID**: `wx1b444b0e8b3c3cbb`
- **云环境ID**: `cloudbase-d6g1dma280c0af9c3`

---

# Tasks

- [ ] Task 1: 用户登录与身份识别
  - [ ] Task 1.1: 修改 `app.js`，在 onLaunch 中调用 `wx.login` 获取用户信息
  - [ ] Task 1.2: 创建云函数 `getUserInfo`（可选，可直接用 openid）
  - [ ] Task 1.3: 修改首页显示用户昵称/头像

- [ ] Task 2: 云存储 - 打卡图片上传
  - [ ] Task 2.1: 修改 `pages/edit/edit.wxml` 添加图片选择器
  - [ ] Task 2.2: 修改 `pages/edit/edit.js` 实现图片上传逻辑（wx.chooseMedia + wx.cloud.uploadFile）
  - [ ] Task 2.3: 修改打卡记录数据结构，增加 images 字段
  - [ ] Task 2.4: 修改 `pages/detail/detail.wxml` 显示打卡图片

- [ ] Task 3: 加载状态与错误处理
  - [ ] Task 3.1: 首页添加 loading 提示和错误处理
  - [ ] Task 3.2: 编辑页完善提交反馈
  - [ ] Task 3.3: 详情页添加加载状态
  - [ ] Task 3.4: 统计页添加加载状态

- [ ] Task 4: 新增个人中心页面
  - [ ] Task 4.1: 创建 `pages/profile/profile.js`（用户信息 + 统计数据）
  - [ ] Task 4.2: 创建 `pages/profile/profile.wxml`（布局）
  - [ ] Task 4.3: 创建 `pages/profile/profile.wxss`（样式）
  - [ ] Task 4.4: 创建 `pages/profile/profile.json`（配置）

- [ ] Task 5: 修改 app.json 添加个人中心到 tabBar
  - [ ] Task 5.1: 修改 tabBar 为3个标签：首页、统计、我的
  - [ ] Task 5.2: 创建 tabBar 图标（或使用文字标签）

- [ ] Task 6: 创建云存储集合（需在微信开发者工具云开发控制台手动操作）
  - [ ] Task 6.1: 在云开发控制台开通云存储功能
  - [ ] Task 6.2: 配置云存储权限（默认权限即可）

- [ ] Task 7: 测试验证
  - [ ] Task 7.1: 测试用户登录流程
  - [ ] Task 7.2: 测试图片上传和显示
  - [ ] Task 7.3: 测试个人中心页面
  - [ ] Task 7.4: 验证加载状态和错误提示

---

# Task Dependencies

- Task 1 无依赖
- Task 2 无依赖（可与 Task 1 并行）
- Task 3 无依赖（可与 Task 1、2 并行）
- Task 4 无依赖（可与 Task 1、2、3 并行）
- Task 5 依赖 Task 4（需要个人中心页面创建完成）
- Task 6 无依赖（手动操作）
- Task 7 依赖 Task 1-6
