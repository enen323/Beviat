# Beviat 校园二手交易平台 - 后端功能说明文档

> **版本**: 1.0.0-SNAPSHOT  
> **基础包路径**: `com.beviat`  
> **技术栈**: Spring Boot 3.2.5 + Java 17 + MyBatis Plus 3.5.6 + MySQL 8.0 + Redis + WebSocket (STOMP) + JWT + SpringDoc OpenAPI + Lombok + MapStruct + Hutool  
> **构建工具**: Maven 多模块

---

## 目录

- [一、项目架构概览](#一项目架构概览)
- [二、模块结构与职责划分](#二模块结构与职责划分)
- [三、技术栈详解](#三技术栈详解)
- [四、数据流架构](#四数据流架构)
- [五、功能模块详解](#五功能模块详解)
  - [5.1 认证与用户模块 (beviat-system)](#51-认证与用户模块-beviat-system)
  - [5.2 商品模块 (beviat-product)](#52-商品模块-beviat-product)
  - [5.3 即时通讯模块 (beviat-chat)](#53-即时通讯模块-beviat-chat)
  - [5.4 拍卖模块 (beviat-auction)](#54-拍卖模块-beviat-auction)
  - [5.5 社区模块 (beviat-community)](#55-社区模块-beviat-community)
  - [5.6 评价模块 (beviat-evaluation)](#56-评价模块-beviat-evaluation)
  - [5.7 地理位置模块 (beviat-location)](#57-地理位置模块-beviat-location)
  - [5.8 管理后台模块 (beviat-admin)](#58-管理后台模块-beviat-admin)
- [六、基础设施层详解](#六基础设施层详解)
- [七、核心数据流示例](#七核心数据流示例)

---

## 一、项目架构概览

Beviat 是一个**校园二手交易平台**的后端服务，采用**经典分层架构**（Controller → Service → Mapper）结合 **DDD 模块化拆分**，每个业务领域独立为一个 Maven 模块。

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (React SPA)                          │
│              HTTP REST API / WebSocket STOMP                │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  beviat-admin (启动模块)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           BeviatApplication (Spring Boot 入口)         │  │
│  │    @SpringBootApplication + @MapperScan + @EnableAsync │  │
│  └──────────────────────────────────────────────────────┘  │
│                        │                                     │
│        ┌───────────────┼───────────────┐                    │
│        ▼               ▼               ▼                    │
│  beviat-system   beviat-product   beviat-chat     ...       │
│  (认证/用户)     (商品/分类)      (即时通讯)                 │
│        │               │               │                    │
│        └───────────────┼───────────────┘                    │
│                        ▼                                     │
│                beviat-common (公共层)                         │
│   BaseEntity | JwtUtils | 全局异常 | 统一响应 | 通用配置    │
└─────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
     ┌──────┐      ┌──────┐       ┌────────┐
     │MySQL │      │Redis │       │本地磁盘 │
     │ 8.0  │      │      │       │(文件存储)│
     └──────┘      └──────┘       └────────┘
```

### 模块依赖关系

```
beviat-admin (启动模块，聚合所有模块)
    ├── beviat-common          ← 所有模块的基础依赖
    ├── beviat-system          ← 认证/用户/权限
    │   └── beviat-common
    ├── beviat-product         ← 商品管理/分类/浏览历史
    │   ├── beviat-common
    │   └── beviat-system (获取卖家信息)
    ├── beviat-chat            ← WebSocket 即时通讯
    │   ├── beviat-common
    │   └── beviat-system
    ├── beviat-auction         ← 竞拍管理
    │   ├── beviat-common
    │   ├── beviat-system
    │   └── beviat-product
    ├── beviat-community       ← 帖子/评论/点赞/话题
    │   ├── beviat-common
    │   └── beviat-system
    ├── beviat-evaluation      ← 买卖双方评价/信用分
    │   ├── beviat-common
    │   └── beviat-system
    └── beviat-location        ← LBS 位置服务
        ├── beviat-common
        └── beviat-product
```

---

## 二、模块结构与职责划分

### 2.1 beviat-common（公共基础模块）

**职责**：提供所有模块共用的基础设施，不依赖任何业务模块。

| 类/目录 | 功能 |
|---------|------|
| `domain/BaseEntity.java` | 所有实体基类：`id`(自增主键)、`createdAt`、`updatedAt`、`deleted`(逻辑删除) |
| `domain/*.java` | 所有数据库实体（User, Product, Category, ProductOrder, ChatMessage, PaymentRecord, UserLocation 等） |
| `config/MyBatisPlusConfig.java` | MyBatis Plus 分页插件，扫描所有 `com.beviat.**.mapper` 包下的 Mapper |
| `config/MyMetaObjectHandler.java` | 自动填充 `createdAt`、`updatedAt`、`deleted` 字段（插入/更新时触发） |
| `constant/Constants.java` | 全局常量：JWT 配置、Redis Key 前缀、用户/商品状态枚举 |
| `exception/BizException.java` | 业务异常类，携带 `code` + `message` |
| `exception/GlobalExceptionHandler.java` | `@RestControllerAdvice` 全局异常处理器，统一包装返回 `R.fail()` |
| `util/JwtUtils.java` | JWT Token 生成/解析/校验（基于 jjwt 0.12.x，HMAC-SHA 签名） |
| `util/RequestContextHolder.java` | ThreadLocal 存储当前请求用户ID，避免 Controller 层层传参 |
| `dto/R.java` | 统一 API 响应包装类：`R.ok(data)` / `R.fail(code, msg)` |

### 2.2 模块职责总览

| 模块 | ArtifactId | 职责 |
|------|-----------|------|
| **beviat-system** | `beviat-system` | 用户认证（登录/注册/登出/JWT刷新/忘记密码）、用户资料管理、权限拦截 |
| **beviat-product** | `beviat-product` | 商品 CRUD、分类管理（树形结构）、收藏/取消收藏、浏览历史、商品搜索与推荐 |
| **beviat-chat** | `beviat-chat` | WebSocket 即时通讯、会话列表、消息收发、未读计数 |
| **beviat-auction** | `beviat-auction` | 竞拍商品管理、出价记录、最高出价查询、竞拍结算 |
| **beviat-community** | `beviat-community` | 帖子 CRUD、评论（支持嵌套回复）、点赞、话题标签 |
| **beviat-evaluation** | `beviat-evaluation` | 买卖互评、信用分计算与更新 |
| **beviat-location** | `beviat-location` | 用户位置上报、附近商品查询（基于经纬度）、距离计算 |
| **beviat-admin** | `beviat-admin` | Spring Boot 启动类、聚合所有模块、全局配置 |

---

## 三、技术栈详解

### 3.1 技术选型与用途

| 技术 | 版本 | 用途 |
|------|------|------|
| **Spring Boot** | 3.2.5 | 应用框架，提供 IoC、AOP、自动配置 |
| **Java** | 17 | 运行环境，使用 record、sealed class 等新特性 |
| **MyBatis Plus** | 3.5.6 | ORM 框架，提供 Lambda 查询、分页、自动填充、逻辑删除 |
| **MySQL** | 8.0 | 关系型数据库，HikariCP 连接池（最大20连接） |
| **Redis** | - | 缓存层（Lettuce 连接池），用于 Token 存储、黑名单、浏览历史、会话 |
| **WebSocket (STOMP)** | Spring 内置 | 即时通讯，支持 SockJS 降级为长轮询 |
| **JWT (jjwt)** | 0.12.x | 无状态认证，HMAC-SHA 签名 |
| **BCrypt (Hutool)** | - | 密码加密，单向哈希 |
| **Lombok** | - | 减少样板代码（@Data, @RequiredArgsConstructor 等） |
| **MapStruct** | - | 对象映射（DTO ↔ Entity ↔ VO） |
| **Hutool** | - | 通用工具集（UUID、BCrypt、日期处理等） |
| **SpringDoc OpenAPI** | - | API 文档自动生成（Swagger UI） |
| **Jackson** | - | JSON 序列化（日期格式化、null 值忽略） |

### 3.2 配置文件说明

**主配置** (`application.yml`)：

```yaml
server:
  port: 8080
  servlet:
    context-path: /api/v1          # 所有 API 统一前缀

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/beviat
    hikari:
      maximum-pool-size: 20        # HikariCP 连接池
  data:
    redis:
      host: localhost
      port: 6379
      lettuce:
        pool:
          max-active: 8             # Lettuce 连接池

mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: deleted   # 全局逻辑删除字段
  configuration:
    map-underscore-to-camel-case: true   # 下划线转驼峰

jwt:
  secret: beviat-secret-key-for-jwt-token-generation-2024
  access-token-expire: 900000       # 15分钟 (毫秒)
  refresh-token-expire: 604800000   # 7天 (毫秒)

file:
  storage:
    type: local                     # 本地文件存储
    local:
      path: D:\develop\minio\data\beviat
      url-prefix: http://localhost:8080/api/v1/files/
```

**环境配置**：
- `application-dev.yml`：开发环境，DEBUG 日志，本地数据库
- `application-prod.yml`：生产环境，WARN 日志，环境变量注入数据库/Redis 配置，OSS 文件存储

---

## 四、数据流架构

### 4.1 HTTP 请求完整数据流

```
┌─────────┐   HTTP Request    ┌──────────────┐
│  前端    │ ────────────────▶ │  Interceptor │
│ (React) │                   │ JwtAuthInter-│
└─────────┘                   │   ceptor      │
                              └──────┬───────┘
                                     │
                            ┌────────▼────────┐
                            │ 1. 提取 Bearer   │
                            │    Token         │
                            │ 2. 检查 Redis     │
                            │    黑名单         │
                            │ 3. 解析 JWT      │
                            │    获得 userId    │
                            │ 4. 存入           │
                            │    ThreadLocal    │
                            └────────┬────────┘
                                     │
                              ┌──────▼──────┐
                              │  Controller │
                              │  @ReqMapping│
                              └──────┬──────┘
                                     │
                          ┌──────────▼──────────┐
                          │  Service (业务逻辑)  │
                          │  - 参数校验          │
                          │  - 业务规则          │
                          │  - Redis 缓存操作    │
                          │  - 调用 Mapper       │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  Mapper (数据访问)   │
                          │  MyBatis Plus 封装   │
                          │  - LambdaQueryWrapper│
                          │  - 分页查询          │
                          │  - 自动填充          │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │     Database         │
                          │  (MySQL 8.0)         │
                          └─────────────────────┘
```

### 4.2 认证数据流（JWT + Redis 双令牌机制）

```
┌──────┐                     ┌──────────────┐                    ┌───────┐
│ 前端  │                     │   AuthController │                    │ Redis  │
└──┬───┘                     └───────┬──────────┘                    └───┬───┘
   │                                 │                                   │
   │  POST /auth/login               │                                   │
   │  {username, password}           │                                   │
   │ ──────────────────────────────▶ │                                   │
   │                                 │ 1. BCrypt 校验密码                │
   │                                 │ 2. 检查用户状态                   │
   │                                 │ 3. 生成 JWT:                     │
   │                                 │    accessToken (15min)           │
   │                                 │    refreshToken (7d)             │
   │                                 │ 4. 存储 refreshToken ───────────▶│
   │                                 │    set("beviat:token:refresh:{id}")│
   │                                 │ 5. 更新 lastLoginTime            │
   │                                 │                                   │
   │  {accessToken, refreshToken}    │                                   │
   │ ◀────────────────────────────── │                                   │
   │                                 │                                   │
   │  后续请求: Authorization: Bearer {accessToken}                      │
   │ ──────────────────────────────────────────────────────────────────▶│
   │                          JwtAuthInterceptor                         │
   │                          1. 检查 Redis 黑名单                       │
   │                          2. 解析 JWT → userId                      │
   │                          3. 存入 ThreadLocal                        │
   │                                 │                                   │
   │  accessToken 过期时:           │                                   │
   │  POST /auth/refresh             │                                   │
   │  {refreshToken}                 │                                   │
   │ ──────────────────────────────▶ │                                   │
   │                                 │ 1. 从 Redis 取 refreshToken ────▶│
   │                                 │ 2. 校验是否匹配 ◀────────────────│
   │                                 │ 3. 生成新 accessToken              │
   │                                 │                                   │
   │  {accessToken, refreshToken}    │                                   │
   │ ◀────────────────────────────── │                                   │
   │                                 │                                   │
   │  POST /auth/logout              │                                   │
   │ ──────────────────────────────▶ │                                   │
   │                                 │ 1. accessToken 加入黑名单───────▶│
   │                                 │    set("beviat:blacklist:{token}") │
   │                                 │ 2. 删除 refreshToken ───────────▶│
   │                                 │    del("beviat:token:refresh:{id}")│
```

### 4.3 WebSocket 消息数据流

```
┌─────────────┐                      ┌──────────────────────┐
│  前端 STOMP  │                      │  WebSocket 服务端      │
│   客户端     │                      │                      │
└──────┬──────┘                      └──────────┬───────────┘
       │                                        │
       │  CONNECT /ws                            │
       │  Header: Authorization: Bearer {token}  │
       │ ──────────────────────────────────────▶ │
       │                              ┌─────────▼──────────┐
       │                              │ WebSocketAuthChan-  │
       │                              │ nelInterceptor      │
       │                              │ - 校验 JWT          │
       │                              │ - 检查 Redis 黑名单  │
       │                              │ - 设置 StompPrin-   │
       │                              │   cipal(userId)     │
       │                              └─────────┬──────────┘
       │                                        │
       │  SUBSCRIBE /user/queue/messages        │
       │ ──────────────────────────────────────▶│ 绑定用户队列
       │                                        │
       │  SEND /app/chat.send                  │
       │  {receiverId, content, ...}           │
       │ ──────────────────────────────────────▶│
       │                              ┌─────────▼──────────┐
       │                              │ ChatController     │
       │                              │ @MessageMapping    │
       │                              │ - 保存消息到 DB     │
       │                              │ - 更新会话          │
       │                              └─────────┬──────────┘
       │                                        │
       │                              ┌─────────▼──────────┐
       │                              │ SimpMessagingTemp-  │
       │                              │ late.convertAndSend-│
       │                              │ ToUser()            │
       │                              │ → /user/{id}/queue/ │
       │                              │   messages          │
       │                              └─────────┬──────────┘
       │                                        │
       │  ◀─────────────────────────────────────┘ 推送到接收者
```

---

## 五、功能模块详解

### 5.1 认证与用户模块 (beviat-system)

**核心类**：
- `AuthController.java` — 映射 `/auth`
- `UserController.java` — 映射 `/users`
- `UserServiceImpl.java` — 业务逻辑
- `JwtAuthInterceptor.java` — JWT 拦截器
- `WebMvcConfig.java` — MVC 配置（拦截器注册、CORS）

#### 功能 1：用户登录

| 项目 | 说明 |
|------|------|
| **API** | `POST /api/v1/auth/login` |
| **请求体** | `{username, password}` |
| **响应** | `{accessToken, refreshToken}` |

**实现流程**：
1. 通过 `LambdaQueryWrapper` 按 username 查询用户 → MyBatis Plus 映射到 User 实体
2. `BCrypt.checkpw()` 校验密码（加密存储，不可逆）
3. 检查用户状态：`USER_STATUS_DISABLED(1)` 禁用 / `USER_STATUS_LOCKED(2)` 锁定
4. `JwtUtils.generateToken(userId, username, expire)` 生成 AccessToken（15分钟）和 RefreshToken（7天）
5. RefreshToken 存储到 Redis：`beviat:token:refresh:{userId}`，设置 7 天 TTL
6. 更新 `lastLoginTime`

#### 功能 2：用户注册

| 项目 | 说明 |
|------|------|
| **API** | `POST /api/v1/auth/register` |
| **请求体** | `{username, password, email, phone, nickname, school, ...}` |

**实现流程**：
1. 校验用户名唯一性（查询未删除用户）
2. 校验邮箱唯一性（如果提供了邮箱）
3. 密码用 `BCrypt.hashpw()` 加密后存储
4. 昵称为空时自动生成随机英文昵称（`User` + 6位随机字母/数字）
5. 设置初始信用分 = 300，状态 = 正常(0)
6. `userMapper.insert()` 插入数据库（MyBatis Plus 自动生成主键）

#### 功能 3：JWT 令牌刷新

| 项目 | 说明 |
|------|------|
| **API** | `POST /api/v1/auth/refresh` |
| **参数** | `refreshToken` |

**实现流程**：
1. 从 refreshToken 解析 userId
2. 从 Redis 取 `beviat:token:refresh:{userId}`，校验是否匹配
3. 匹配通过 → 生成新 AccessToken（15分钟）
4. 不匹配 → 抛出业务异常"请重新登录"

#### 功能 4：退出登录

| 项目 | 说明 |
|------|------|
| **API** | `POST /api/v1/auth/logout` |

**实现流程**：
1. 从 Header 提取 `Authorization: Bearer {token}`
2. 将 AccessToken 加入 Redis 黑名单：`beviat:blacklist:{token}` = "1"，TTL = 剩余有效时间 + 5秒
3. 删除 RefreshToken：`del beviat:token:refresh:{userId}`

> **黑名单机制**：退出的 Token 在有效期内仍会被拦截器拦截（查 Redis 黑名单），返回 401。

#### 功能 5：忘记密码 / 重置密码

**两步流程**：
1. **忘记密码验证**（`POST /api/v1/auth/forgot-password`）：
   - 验证用户名存在 → 验证手机号匹配 → 验证验证码（暂固定为 `123456`）
   - 生成 UUID resetToken → Redis `beviat:reset:{resetToken}` = userId（5分钟过期）
2. **重置密码**（`POST /api/v1/auth/reset-password`）：
   - 从 Redis 校验 resetToken → 取出 userId → BCrypt 加密新密码 → 更新数据库 → 删除 Redis 中的 resetToken

#### 功能 6：用户资料管理

| API | 功能 |
|-----|------|
| `GET /api/v1/users/me` | 获取当前用户详情（含头像 URL 标准化处理） |
| `PUT /api/v1/users/me` | JSON 格式更新资料（昵称/邮箱/手机等） |
| `PUT /api/v1/users/me/profile` | FormData 格式更新（含头像文件上传），支持 jpg/png/gif/bmp/webp，最大 5MB |

#### JWT 拦截器工作原理

```java
// JwtAuthInterceptor.preHandle() 的核心逻辑
1. 跳过非 HandlerMethod 请求（静态资源等）
2. 从 Header 提取 "Authorization: Bearer {token}"
3. 检查 Redis 黑名单 "beviat:blacklist:{token}" → 存在则返回 401
4. jwtUtils.getUserId(token) 解析 JWT Claim → 获得 userId
5. RequestContextHolder.setCurrentUserId(userId)  存入 ThreadLocal
6. request.setAttribute("currentUserId", userId)   存入 Request 属性
7. afterCompletion() 中 ThreadLocal.remove() 防内存泄漏
```

**拦截器排除路径**：`/auth/login`、`/auth/register`、`/auth/refresh`、`/auth/forgot-password`、`/auth/reset-password`、`/files/**`、`/swagger-ui/**`、`/api-docs/**`、`/ws/**`、`/error`

---

### 5.2 商品模块 (beviat-product)

**核心类**：
- `ProductController.java` — 映射 `/products`
- `CategoryController.java` — 映射 `/categories`
- `BrowseHistoryController.java` — 映射 `/browse-history`
- `ProductServiceImpl.java` — 商品业务逻辑

#### 商品状态流转

```
    ┌──────────┐     上架     ┌──────────┐
    │  0-在售   │ ◄────────── │  2-已下架  │
    └─────┬────┘              └──────────┘
          │ 售出/下单
          ▼
    ┌──────────┐
    │  1-已售出  │
    └──────────┘
```

#### 功能 1：商品发布

| API | `POST /api/v1/products` |
|-----|------------------------|
| **请求格式** | `multipart/form-data` |
| **参数** | `@RequestPart("data")` JSON元数据 + `@RequestPart("images")` 图片文件数组 |

**实现流程**：
1. 接收两部分数据：`data`（JSON）→ 映射为 `ProductCreateDTO`，`images`（文件数组）
2. 校验分类是否存在
3. 图片存储到本地：`{uploadPath}/{yyyy}/{M}/{d}/{uuid}.ext`
4. 图片 URL 数组以 **JSON 格式**存储到数据库的 `images` 字段（MySQL JSON + JacksonTypeHandler）
5. 构造 Product 实体：`status=0`（在售）→ `productMapper.insert()`

#### 功能 2：商品列表查询

| API | `GET /api/v1/products` |
|-----|------------------------|
| **参数** | `ProductQueryDTO`：分类ID、价格区间、成色（1-80）、交易类型、关键词、排序方式、分页参数 |

**实现流程**：
1. 动态构建 `LambdaQueryWrapper<Product>`：
   - `eq(status, 0)` — 仅查在售商品
   - `eq(categoryId)` — 分类筛选
   - `between(price, minPrice, maxPrice)` — 价格区间
   - `eq(conditionLevel)` — 成色条件
   - `like(title/keyword)` — 关键词模糊搜索
   - `orderByDesc(viewCount)` / `orderByDesc(createdAt)` — 排序
2. MyBatis Plus `Page<Product>` 分页查询
3. 转换为 `ProductVO`（含卖家昵称/头像等）

#### 功能 3：商品详情

| API | `GET /api/v1/products/{id}` |
|-----|-----------------------------|

**实现流程**：
1. `productMapper.selectById(id)` 查商品
2. 校验未删除 → 异步操作：
   - **Redis 浏览量 +1**：`INCR beviat:product:views:{productId}`（用于后续排名/推荐）
   - **记录浏览历史**：`ZADD beviat:browse:{userId} {productId} {timestamp}`，保留最近 100 条
3. 关联查询卖家信息（`userMapper.selectById(sellerId)`）
4. 转换为 VO，标记该用户是否已收藏

#### 功能 4：收藏/取消收藏

| API | 方法 | 功能 |
|-----|------|------|
| `POST /products/{id}/favorite` | `toggleFavorite` | 切换收藏状态 |
| `DELETE /products/{id}/favorite` | `removeFavorite` | 取消收藏 |
| `GET /products/me/favorites` | `getMyFavorites` | 查看我的收藏列表 |

**实现**：
- 收藏关系存储在 `user_favorite` 表（`userId` + `productId` 联合唯一）
- 切换收藏：先查是否存在 → 存在则删除，不存在则插入
- 收藏数同步更新 `product.favoriteCount++/--`

#### 功能 5：商品推荐

| API | `GET /api/v1/products/recommendations` |
|-----|----------------------------------------|

**当前实现**：按浏览量倒序返回前 10 条在售商品。

#### 功能 6：分类管理

| API | 功能 |
|-----|------|
| `GET /categories/tree` | 获取完整分类树（递归嵌套子分类） |
| `GET /categories/top` | 获取顶级分类（parentId=null 且 status=1） |
| `GET /categories/{parentId}/sub` | 获取某分类的子分类 |

**分类表结构**：`parentId` 自关联，形成无限级树形结构，`children` 字段为 `@TableField(exist = false)` 非数据库字段，用于返回时组装子节点。

#### 功能 7：浏览历史

| API | 功能 |
|-----|------|
| `GET /browse-history` | 获取当前用户浏览记录（最近 20 条，按时间倒序） |
| `DELETE /browse-history/{productId}` | 删除指定商品的浏览记录 |
| `DELETE /browse-history` | 清空全部浏览记录 |

**存储方式**：Redis Sorted Set，`beviat:browse:{userId}`，score 为浏览时间戳。

---

### 5.3 即时通讯模块 (beviat-chat)

**核心类**：
- `WebSocketConfig.java` — STOMP 端点注册与消息代理配置
- `WebSocketAuthChannelInterceptor.java` — WebSocket 连接认证
- `WebSocketChannelConfig.java` — 注册认证拦截器
- `ChatController.java` — 消息处理（`@MessageMapping`）
- `ChatServiceImpl.java` — 消息存储与会话管理

#### WebSocket 基础设施

```java
// WebSocketConfig 配置
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    // 消息代理
    config.enableSimpleBroker("/topic", "/queue");   // 内存代理（单机）
    config.setApplicationDestinationPrefixes("/app"); // 客户端发送前缀
    config.setUserDestinationPrefix("/user");         // 用户点对点前缀

    // STOMP 端点
    registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
}
```

**消息路由规则**：
- 客户端**发送**消息 → `/app/chat.send` → 被 `@MessageMapping("/chat.send")` 处理
- 服务端**推送**消息 → `/user/{userId}/queue/messages` → 只有该 userId 的 Principal 能收到
- 广播消息 → `/topic/public`

#### WebSocket 连接认证

```java
// WebSocketAuthChannelInterceptor — CONNECT 时校验
1. 从 StompHeaderAccessor 中取 "Authorization" header
2. 提取 Bearer Token
3. 检查 Redis 黑名单
4. jwtUtils.getUserId(token) 解析用户ID
5. accessor.setUser(new StompPrincipal(userId))   // 绑定用户身份
```

`StompPrincipal` 是一个 `record`，实现 `Principal` 接口：
```java
record StompPrincipal(Long userId) implements Principal {
    @Override
    public String getName() {
        return String.valueOf(userId);  // Spring 用此值路由 /user/{name}/queue/*
    }
}
```

#### 消息收发流程

```
发送方                          服务端                          接收方
  │                              │                              │
  │ SEND /app/chat.send          │                              │
  │ {receiverId, content}        │                              │
  │ ──────────────────────────▶  │                              │
  │                              │ ChatServiceImpl.sendMessage  │
  │                              │  1. 保存 ChatMessage 到 DB   │
  │                              │  2. 更新/创建会话             │
  │                              │  3. 推送给接收方              │
  │                              │ ─────────────────────────▶  │
  │                              │  MESSAGE /user/2/queue/      │
  │                              │       messages               │
  │                              │  {id, senderId, content...}  │
```

#### 会话管理

| API | 说明 |
|-----|------|
| `GET /api/v1/chat/conversations` | 获取当前用户的会话列表（含最后一条消息、未读数） |
| `GET /api/v1/chat/messages/{userId}` | 分页获取与某用户的聊天记录（标记已读） |

**会话表** (`conversation`)：

```
conversation_id | user1_id | user2_id | last_message | last_time | unread_count_user1 | unread_count_user2
```

两个用户之间只有一个会话，`user1_id < user2_id` 确保唯一性。未读计数分别维护。

---

### 5.4 拍卖模块 (beviat-auction)

**核心类**：
- `AuctionController.java` — 映射 `/auctions`
- `AuctionServiceImpl.java` — 竞拍业务逻辑
- `BidRecordServiceImpl.java` — 出价记录管理

#### 功能 1：创建竞拍商品

| API | `POST /api/v1/auctions` |
|-----|--------------------------|

**数据流**：
1. 接收竞拍信息：起始价、加价幅度、开始/结束时间、保证金金额等
2. 关联已有商品（需要先发布商品再关联竞拍）
3. 创建竞拍记录到 `auction` 表

#### 功能 2：出价

| API | `POST /api/v1/bids` |
|-----|----------------------|

**核心校验逻辑**：
1. 检查竞拍是否开始/已结束
2. 检查出价人是否是卖家（卖家不能出价自己的商品）
3. 当前价 + 加价幅度 ≤ 出价金额
4. 检查出价人余额（保证金）
5. 创建出价记录到 `bid_record` 表
6. 更新 `auction.currentPrice` 和 `auction.currentBidderId`

#### 功能 3：查询竞拍列表

| API | `GET /api/v1/auctions` | 支持状态筛选（进行中/已结束/未开始） |
|-----|------------------------|--------------------------------------|

#### 功能 4：最高出价查询

| API | `GET /api/v1/auctions/{id}/bids` | 返回该竞拍的全部出价记录（按价格倒序） |
|-----|----------------------------------|------------------------------------------|

---

### 5.5 社区模块 (beviat-community)

**核心类**：
- `PostController.java` — 映射 `/posts`
- `CommentController.java` — 映射 `/comments`
- `PostServiceImpl.java` — 帖子 CRUD
- `CommentServiceImpl.java` — 评论（支持嵌套回复）

#### 功能 1：帖子管理

| API | 功能 |
|-----|------|
| `GET /posts` | 帖子列表（分页，支持按话题/关键词/排序筛选） |
| `GET /posts/{id}` | 帖子详情（含浏览量+1） |
| `POST /posts` | 发帖（支持图片上传） |
| `PUT /posts/{id}` | 编辑帖子（仅作者可编辑） |
| `DELETE /posts/{id}` | 删除帖子（仅作者或管理员） |

#### 功能 2：评论系统

| API | 功能 |
|-----|------|
| `GET /comments/post/{postId}` | 获取帖子评论（支持嵌套回复，树形结构） |
| `POST /comments` | 发表评论（支持指定 `parentId` 实现回复） |
| `DELETE /comments/{id}` | 删除评论 |

**嵌套评论实现**：
- 评论表设计 `parent_id` 自关联字段
- `parent_id = null` → 一级评论
- `parent_id = 某评论ID` → 对该评论的回复
- 返回时,服务端将评论组装为树形结构：`comment.children = [子评论列表]`

#### 功能 3：点赞

| API | 功能 |
|-----|------|
| `POST /posts/{id}/like` | 点赞/取消点赞帖子（toggle） |
| `POST /comments/{id}/like` | 点赞/取消点赞评论 |

**实现**：点赞记录存储在 `user_like` 表，toggle 逻辑（存在则删，不存在则增），同步更新帖子/评论的 `likeCount`。

---

### 5.6 评价模块 (beviat-evaluation)

**核心类**：
- `EvaluationController.java` — 映射 `/evaluations`
- `EvaluationServiceImpl.java` — 评价与信用分计算

#### 评价流程

```
订单完成后 → 买卖双方互评
  │
  ├── 买方评价卖家：评分(1-5)、评语
  │   └── 影响卖家信用分
  │
  └── 卖方评价买家：评分(1-5)、评语
      └── 影响买家信用分
```

#### 信用分计算规则

| 评价分数 | 信用分变化 |
|----------|-----------|
| 5 分（好评） | +5 |
| 4 分 | +2 |
| 3 分（中评） | +0 |
| 2 分 | -3 |
| 1 分（差评） | -5 |

**实现**：`EvaluationServiceImpl` 在创建评价后会调用 `UserMapper.updateCreditScore(userId, delta)` 更新信用分。

| API | 功能 |
|-----|------|
| `POST /evaluations` | 创建评价 |
| `GET /evaluations/user/{userId}` | 查看用户评价列表 |
| `GET /evaluations/product/{productId}` | 查看商品相关评价 |

---

### 5.7 地理位置模块 (beviat-location)

**核心类**：
- `LocationController.java` — 映射 `/locations`
- `LocationServiceImpl.java` — LBS 查询逻辑

#### 功能 1：用户位置上报

| API | `POST /api/v1/locations/report` |
|-----|---------------------------------|

**数据流**：
1. 接收 `{latitude, longitude, address}`
2. 存入 `user_location` 表（一个用户只保留一条最新记录，`userId` 唯一索引）
3. 如果已存在则更新坐标和时间

#### 功能 2：附近商品查询

| API | `GET /api/v1/locations/nearby-products` |
|-----|----------------------------------------|

**实现**：
1. 从 `user_location` 获取当前用户坐标
2. 从 `product` 表获取所有在售且含坐标信息的商品
3. 使用 **Haversine 公式**计算每个商品与用户的大圆距离
4. 按距离排序，返回最近 N 条商品（含距离信息）

**距离计算公式**（Haversine）：
```java
// 在 LocationServiceImpl 中实现
// d = 2r * asin(sqrt(haversin(Δlat) + cos(lat1)*cos(lat2)*haversin(Δlon)))
// 其中 r = 6371km (地球半径)
```

---

### 5.8 管理后台模块 (beviat-admin)

#### BeviatApplication 启动类

```java
@SpringBootApplication(scanBasePackages = "com.beviat")  // 扫描所有模块
@MapperScan("com.beviat.**.mapper")                       // 扫描所有 Mapper
@EnableAsync                                              // 启用异步处理
@EnableScheduling                                         // 启用定时任务
public class BeviatApplication {
    public static void main(String[] args) {
        SpringApplication.run(BeviatApplication.class, args);
    }
}
```

**`@EnableAsync`**：使 `@Async` 注解生效，用于商品详情页的**异步浏览量计数**等非关键操作。

**`@EnableScheduling`**：使 `@Scheduled` 注解生效，用于定时任务（如竞拍结算、过期商品处理等）。

**管理端功能**（在 Controller 层）：
- 用户管理（禁用/启用/删除）
- 商品审核（违规商品下架）
- 数据统计（订单量、交易额等）
- 系统配置管理

---

## 六、基础设施层详解

### 6.1 统一响应体 `R`

```java
// 成功响应
R.ok(data)    → {"code":200, "message":"success", "data":{...}}

// 失败响应
R.fail(msg)   → {"code":500, "message":"错误信息", "data":null}
R.fail(code, msg) → {"code":code, "message":"错误信息", "data":null}
```

### 6.2 全局异常处理链

```
Controller 抛出异常
    │
    ▼
GlobalExceptionHandler (@RestControllerAdvice)
    ├── BizException → 提取 message 和自定义 code → warn 日志 → return R.fail(code, message)
    ├── MethodArgumentNotValidException → 400 参数校验失败
    ├── BindException → 400 参数绑定失败
    ├── MethodArgumentTypeMismatchException → 400 参数类型错误
    ├── HttpRequestMethodNotSupportedException → 405 请求方法不支持
    └── Exception (兜底) → 500 内部错误 → error 日志(含类.方法(文件:行号))
```

### 6.3 MyBatis Plus 自动功能

| 功能 | 配置 | 说明 |
|------|------|------|
| **自动主键** | `@TableId(type = IdType.AUTO)` | 数据库自增 |
| **逻辑删除** | `logic-delete-field: deleted` | 全局配置，delete 操作自动变 UPDATE |
| **自动填充** | `MyMetaObjectHandler` | `createdAt` / `updatedAt` 自动设值 |
| **分页插件** | `MyBatisPlusConfig.paginationInterceptor` | MySQL 方言 |
| **JSON类型处理** | `JacksonTypeHandler` | Product.images 存储为 JSON 数组 |

### 6.4 Redis 缓存策略

| Key 模式 | 用途 | 数据结构 | TTL |
|----------|------|----------|-----|
| `beviat:token:refresh:{userId}` | RefreshToken 存储 | String | 7天 |
| `beviat:blacklist:{token}` | Token 黑名单 | String | 剩余有效期+5s |
| `beviat:reset:{resetToken}` | 密码重置凭证 | String (userId) | 5分钟 |
| `beviat:verify:{key}` | 短信验证码 | String | 5分钟 |
| `beviat:browse:{userId}` | 浏览历史 | Sorted Set (productId, timestamp) | 永久（限制100条） |
| `beviat:product:views:{productId}` | 商品浏览量 | String (自增) | 异步同步到DB |

### 6.5 文件存储策略

```
存储路径: {uploadPath}/{yyyy}/{M}/{d}/{uuid}.ext
示例:     D:\develop\minio\data\beviat\2025\6\18\abc123.jpg

URL生成:  /api/v1/files/{yyyy}/{M}/{d}/{uuid}.ext
返回:     http://localhost:8080/api/v1/files/2025/6/18/abc123.jpg

前端访问: 通过 Vite/Webpack 代理 /api/v1 到后端，直接访问相对路径
```

**头像上传安全校验**：
- 允许格式：jpg, jpeg, png, gif, bmp, webp
- 大小限制：5MB
- 验证通过后才写入磁盘

### 6.6 CORS 跨域配置

```java
// WebMvcConfig
registry.addMapping("/**")
    .allowedOriginPatterns("*")        // 允许所有来源
    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
    .allowedHeaders("*")               // 允许所有 Header
    .allowCredentials(true)            // 允许携带 Cookie
    .maxAge(3600);                     // 预检请求缓存 1小时
```

### 6.7 ThreadLocal 用户上下文

```
请求进入
    │
    ▼
JwtAuthInterceptor.preHandle()
    │
    ├── 解析 JWT → userId
    ├── RequestContextHolder.setCurrentUserId(userId)   ← ThreadLocal.set()
    └── request.setAttribute("currentUserId", userId)
    │
    ▼
Controller 中调用:
    RequestContextHolder.getCurrentUserId()   ← ThreadLocal.get()
    │
    ▼
JwtAuthInterceptor.afterCompletion()
    └── RequestContextHolder.clear()   ← ThreadLocal.remove() 防内存泄漏
```

---

## 七、核心数据流示例

### 示例：用户浏览商品完整数据流

```
1. 用户选择商品 → 点击查看详情
   ↓
2. GET /api/v1/products/123
   Header: Authorization: Bearer {accessToken}
   ↓
3. JwtAuthInterceptor.preHandle()
   ├── 从 Header 提取 Token → 查 Redis 黑名单 → 解析 JWT → userId=1001
   ├── ThreadLocal.set(1001)
   └── request.setAttribute("currentUserId", 1001)
   ↓
4. ProductController.getDetail(123)
   ├── RequestContextHolder.getCurrentUserId() → 1001
   ↓
5. ProductServiceImpl.getDetail(123, 1001)
   ├── productMapper.selectById(123)     → MySQL: SELECT * FROM product WHERE id=123 AND deleted=0
   ├── Redis: INCR beviat:product:views:123     → 浏览量+1
   ├── Redis: ZADD beviat:browse:1001 123 1687092000  → 记录浏览历史
   ├── userMapper.selectById(product.sellerId)  → 关联卖家信息
   ├── favoriteMapper.exists(1001, 123)         → 查询是否已收藏
   ↓
6. 组装 ProductVO 返回
   ↓
7. JwtAuthInterceptor.afterCompletion()
   └── RequestContextHolder.clear()  → ThreadLocal.remove()
```

### 示例：用户发送聊天消息完整数据流

```
1. 用户A (userId=1001) 向用户B (userId=1002) 发送消息
   ↓
2. STOMP SEND /app/chat.send
   Header: Authorization: Bearer {token}
   Body: {receiverId: 1002, content: "这个商品还在吗？", productId: 123}
   ↓
3. WebSocketAuthChannelInterceptor.preSend()
   ├── CONNECT 时已校验过 Token 并设置 StompPrincipal(1001)
   ├── 通过 principal.getName() 获取 "1001" → 绑定到消息
   ↓
4. ChatController.sendMessage(ChatMessageDTO, Principal)
   ├── Long senderId = Long.valueOf(principal.getName())  // 1001
   ├── chatService.sendMessage(senderId, dto)
   ↓
5. ChatServiceImpl.sendMessage(1001, dto)
   ├── ChatMessage entity = new ChatMessage()
   │   ├── senderId = 1001
   │   ├── receiverId = 1002
   │   ├── productId = 123
   │   ├── content = "这个商品还在吗？"
   │   ├── messageType = 1 (文本)
   │   └── isRead = 0
   ├── chatMessageMapper.insert(entity)    → INSERT INTO chat_message ...
   │
   ├── 更新/创建会话
   │   └── conversationMapper.upsert(1001, 1002, "这个商品还在吗？")
   │       → INSERT ... ON DUPLICATE KEY UPDATE last_message=..., unread_count_user2+1
   │
   ├── 推送给接收者 (ID=1002)
   │   └── messagingTemplate.convertAndSendToUser(
   │           "1002", "/queue/messages", chatMessageVO
   │       )
   │       → 实际路由: /user/1002/queue/messages
   ↓
6. 用户B 的 STOMP 客户端收到消息
   MESSAGE /user/1002/queue/messages
   {id: 999, senderId: 1001, content: "这个商品还在吗？", ...}
```

---

> **文档生成时间**: 2026-06-18  
> **基于代码版本**: Beviat main 分支  
> **项目仓库**: `d:\develop\Project\JavaProject\Beviat\backend\`
