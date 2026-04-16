# Beviat - 校园二手交易平台

> 发现身边好物，让闲置流动起来

## 技术架构

| 层级 | 技术 |
|------|------|
| **后端** | Spring Boot 3.2 + Java 17 + MyBatis Plus + MySQL 8.0 + Redis |
| **前端** | Vue 3.4 + TypeScript + Vite 5 + Pinia + Element Plus (PC) + Vant 4 (移动端) |
| **实时通信** | WebSocket (STOMP over SockJS) |
| **CSS方案** | UnoCSS 原子化 + SCSS 变量系统 |

## 项目结构

```
Beviat/
├── backend/                    # 后端（Spring Boot 多模块）
│   ├── beviat-common/          # 公共模块
│   ├── beviat-system/          # 系统认证模块
│   ├── beviat-product/         # 商品核心模块
│   ├── beviat-chat/            # 聊天模块
│   ├── beviat-auction/         # 拍卖模块
│   ├── beviat-community/       # 社区论坛模块
│   ├── beviat-evaluation/      # 评价模块
│   ├── beviat-location/        # 地理定位模块
│   └── beviat-admin/           # 管理后台（含启动类）
│       └── src/main/resources/
│           ├── application.yml     # 主配置
│           ├── application-dev.yml # 开发环境
│           └── application-prod.yml# 生产环境
├── frontend/                   # 前端（Vue3 SPA）
│   ├── src/
│   │   ├── api/                # API请求层
│   │   ├── components/         # 公共组件
│   │   ├── layouts/            # 布局组件
│   │   ├── router/             # 路由配置
│   │   ├── stores/             # Pinia状态管理
│   │   ├── styles/             # 全局样式 & 设计令牌
│   │   ├── types/              # TS类型定义
│   │   └── views/              # 页面视图
│   │       ├── auth/           # 登录/注册
│   │       ├── home/           # 首页
│   │       ├── product/        # 商品相关
│   │       ├── chat/           # 聊天
│   │       ├── auction/        # 拍卖
│   │       ├── community/      # 社区
│   │       ├── user/           # 个人中心
│   │       ├── admin/          # 管理后台
│   │       └── error/          # 错误页
│   └── package.json
├── sql/                        # 数据库脚本
└── settings.xml                 # Maven 配置
```

## 核心功能

- 用户系统（JWT认证 / 注册登录 / 资料管理 / 校园身份认证）
- 商品中心（发布 / 浏览 / 搜索 / 收藏 / 瀑布流展示）
- 实时聊天（WebSocket即时通讯 / 消息持久化）
- 拍卖竞价（竞拍 / 出价 / 倒计时 / 自动成交）
- 信用评价（双向评价 / 信用分算法）
- 智能推荐（基于浏览历史的个性化推荐）
- 地图定位（LBS附近商品 / 距离筛选）
- 社区论坛（帖子 / 评论 / 点赞 / 话题标签）
- 管理后台（数据统计 / 审核 / 运营）

## 快速开始

### 前置要求
- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 6+

### 1. 初始化数据库
```bash
# 使用已有脚本初始化数据库
cd sql
mysql -uroot -p < simple_create_tables.sql
```

### 2. 启动后端
```bash
cd backend
mvn clean install -DskipTests
cd beviat-admin
mvn spring-boot:run
```
后端启动在 `http://localhost:8080/api/v1`  
Swagger文档: `http://localhost:8080/swagger-ui.html`

### 3. 启动前端
```bash
cd frontend
npm install
npm run dev
```
前端开发服务器: `http://localhost:5173`

## 设计理念

Beviat 采用「温暖活力」的设计语言：
- **玻璃拟态 (Glassmorphism)** 卡片式布局
- **渐变色彩** 营造年轻、活力的视觉氛围
- **响应式断点** 1024px 自动切换 PC(Element Plus) / 移动端(Vant 4)
- **微交互动效** 流畅的过渡动画增强体验感

## 默认账号

- 管理员: admin / admin123
