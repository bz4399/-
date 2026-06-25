# 学习打卡记录微信小程序 - 第三次课升级方案

## Why

按照"通用技术要求 — 第三次课要求"验收标准，项目需要补齐以下能力：用户登录与身份识别、云存储使用、加载状态与错误处理、新增第3个页面（个人中心）。当前项目已有4个页面和云数据库功能，但缺少用户体系、云存储和完善的加载反馈。

## What Changes

### 必须完成（课前验收）
- **用户登录**：调用 `wx.login` 获取用户信息，首页显示用户昵称/头像
- **云存储**：打卡时支持上传学习相关图片（如笔记截图），使用 `wx.cloud.uploadFile` 上传到云存储
- **加载状态**：所有数据加载显示 loading，失败有错误提示，提交有成功反馈
- **新增页面**：新增「个人中心」页面（第5个页面），展示用户信息和我的打卡数据

### 加分项（可选）
- 个人中心展示个人统计数据（总打卡天数、总学习时长）
- 支持分享给微信好友（`wx.shareAppMessage`）

## Impact

- **Affected specs**: 微信小程序用户登录规范、云存储规范
- **Affected code**: `app.js`（用户登录）、`pages/index/index.js`（显示用户信息）、`pages/edit/edit.js`（图片上传）、新增 `pages/profile/profile.js`

---

## ADDED Requirements

### Requirement: 用户登录与身份识别

系统 SHALL 在小程序启动时调用 `wx.login` 获取用户 openid，并在首页显示当前用户信息。

#### Scenario: 小程序启动
- **WHEN** 用户打开小程序
- **THEN** 系统调用 `wx.login` 获取 code，通过云函数获取用户 openid，存储到 globalData

#### Scenario: 首页显示用户信息
- **WHEN** 用户进入首页
- **THEN** 首页顶部显示用户昵称（或"同学"）和头像

### Requirement: 云存储使用

系统 SHALL 支持用户在打卡时上传学习相关图片（如笔记截图、书本照片）。

#### Scenario: 上传图片
- **WHEN** 用户在新增打卡页点击"添加图片"
- **THEN** 系统调用 `wx.chooseMedia` 选择图片，使用 `wx.cloud.uploadFile` 上传到云存储，返回 fileID

#### Scenario: 查看图片
- **WHEN** 用户在详情页查看打卡记录
- **THEN** 系统使用 `cloud://` 协议或 `wx.cloud.getTempFileURL` 显示图片

### Requirement: 加载状态与错误处理

系统 SHALL 在所有数据加载时显示 loading 提示，失败时显示错误提示。

#### Scenario: 加载数据
- **WHEN** 页面加载数据时
- **THEN** 显示"加载中..."提示，加载完成后隐藏

#### Scenario: 加载失败
- **WHEN** 网络请求失败
- **THEN** 显示"加载失败，请重试"提示

#### Scenario: 提交成功
- **WHEN** 表单提交成功
- **THEN** 显示"提交成功"toast 提示

### Requirement: 个人中心页面

系统 SHALL 提供「个人中心」页面，展示用户信息和打卡统计。

#### Scenario: 查看个人中心
- **WHEN** 用户点击 tabBar 的"我的"标签
- **THEN** 显示用户头像、昵称、总打卡天数、总学习时长、连续打卡天数

---

## MODIFIED Requirements

### Requirement: 首页用户信息展示

**原实现**：首页只显示统计数据。

**修改后**：首页顶部新增用户信息区域，显示头像和昵称。

### Requirement: 打卡记录增加图片字段

**原实现**：打卡记录只有文字内容。

**修改后**：打卡记录增加 `images` 字段（数组），存储云存储 fileID 列表。

---

## 数据库设计变更

### checkins 集合新增字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `images` | Array | 云存储图片 fileID 列表（可选） |

---

## 云函数设计

### 新增云函数：`getUserInfo`（可选）

**用途**：获取用户 openid 和基本信息。

**入参**：无（从云上下文获取 openid）

**出参**：
```json
{
  "code": 0,
  "data": {
    "openid": "xxx",
    "nickname": "同学"
  }
}
```

---

## 新增页面：个人中心（pages/profile/profile）

**布局**：
- 顶部：用户头像 + 昵称卡片
- 统计卡片：总打卡天数、总学习时长、连续打卡天数
- 功能列表：我的打卡记录、设置、关于

---

## 开发指引

### 第一步：修改 app.js 添加用户登录

在 `onLaunch` 中调用 `wx.login` 获取 code，通过云函数获取 openid。

### 第二步：修改首页显示用户信息

在首页顶部添加用户信息区域，从 globalData 读取用户信息。

### 第三步：修改编辑页添加图片上传

在 `pages/edit/edit.wxml` 中添加图片选择器，使用 `wx.chooseMedia` + `wx.cloud.uploadFile`。

### 第四步：修改详情页显示图片

在 `pages/detail/detail.wxml` 中显示打卡记录的图片。

### 第五步：创建个人中心页面

创建 `pages/profile/profile.js/wxml/wxss/json`，展示用户信息和统计。

### 第六步：修改 app.json 添加个人中心到 tabBar

将 tabBar 从2个改为3个：首页、统计、我的。

### 第七步：完善加载状态和错误处理

在所有页面添加 loading 提示和错误处理。

### 参考文档

- 微信登录：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- 云存储：https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/guide/storage/
- 用户信息：https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html
