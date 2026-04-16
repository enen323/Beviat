# Beviat 校园二手交易平台 - 数据库表创建指南

## 目录结构
```
sql/
├── create_database_tables.sql    # 完整版SQL脚本（包含外键、索引、详细注释）
├── simple_create_tables.sql      # 简化版SQL脚本（推荐使用）
├── create_tables.bat            # Windows自动执行脚本
└── README.md                    # 本说明文件
```

## 数据库要求
- MySQL 5.7 或更高版本（推荐 MySQL 8.0）
- 字符集：utf8mb4（支持emoji和所有Unicode字符）
- 排序规则：utf8mb4_unicode_ci

## 快速开始

### 方法一：使用Windows批处理脚本（推荐）
1. 确保MySQL已安装并添加到系统PATH
2. 双击运行 `create_tables.bat`
3. 按照提示输入MySQL连接信息
4. 脚本会自动创建数据库和所有表

### 方法二：手动执行SQL文件
1. 打开MySQL命令行客户端或MySQL Workbench
2. 登录MySQL服务器
3. 执行以下命令：

```sql
-- 方法A：使用source命令
mysql> source d:/develop/myJavaProject/Beviat/backend/sql/simple_create_tables.sql

-- 方法B：直接复制粘贴SQL内容
-- 打开simple_create_tables.sql文件，复制全部内容到MySQL命令行执行
```

### 方法三：使用MySQL Workbench
1. 打开MySQL Workbench并连接到服务器
2. 点击菜单 "File" → "Open SQL Script"
3. 选择 `simple_create_tables.sql` 文件
4. 点击 "Execute" 按钮（闪电图标）

## 创建的表结构

### 1. 用户表 (user)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键ID，自增 |
| username | VARCHAR(50) | 用户名，唯一 |
| password | VARCHAR(255) | 加密密码 |
| nickname | VARCHAR(50) | 昵称 |
| email | VARCHAR(100) | 邮箱 |
| phone | VARCHAR(20) | 手机号 |
| student_id | VARCHAR(20) | 学号 |
| avatar | VARCHAR(500) | 头像URL |
| gender | TINYINT | 性别：0-未知，1-男，2-女 |
| ... | ... | 其他字段 |

### 2. 商品表 (product)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键ID，自增 |
| title | VARCHAR(200) | 商品标题 |
| description | TEXT | 商品描述 |
| price | DECIMAL(10,2) | 价格 |
| category_id | BIGINT | 分类ID |
| seller_id | BIGINT | 卖家用户ID |
| status | TINYINT | 状态：0-在售，1-已售出，2-已下架 |
| ... | ... | 其他字段 |

### 3. 商品分类表 (category)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键ID，自增 |
| name | VARCHAR(50) | 分类名称 |
| icon | VARCHAR(100) | 分类图标 |
| parent_id | BIGINT | 父级分类ID |
| ... | ... | 其他字段 |

### 4. 聊天消息表 (chat_message)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键ID，自增 |
| sender_id | BIGINT | 发送者ID |
| receiver_id | BIGINT | 接收者ID |
| content | TEXT | 消息内容 |
| is_read | TINYINT | 是否已读：0-未读，1-已读 |
| ... | ... | 其他字段 |

## 初始数据
脚本执行后会插入以下初始数据：

### 管理员用户
- 用户名：`admin`
- 密码：`admin123`（BCrypt加密）
- 角色：系统管理员

### 商品分类
1. 📚 书籍资料
2. 💻 电子产品
3. 🏠 生活用品
4. 🏀 运动健身
5. 👕 服装饰品

## 测试连接
创建完成后，可以运行以下命令测试数据库连接：

```bash
# 连接到数据库
mysql -uroot -p beviat

# 查看所有表
mysql> SHOW TABLES;

# 查看用户表结构
mysql> DESC user;

# 查询初始数据
mysql> SELECT id, username, nickname FROM user;
mysql> SELECT id, name, icon FROM category;
```

## 故障排除

### 常见问题

#### 1. "Access denied for user"
- 检查用户名密码是否正确
- 确保用户有创建数据库的权限

#### 2. "Can't connect to MySQL server"
- 检查MySQL服务是否运行
- 检查主机地址和端口是否正确
- Windows: 运行 `services.msc` 查看MySQL服务状态

#### 3. "Unknown database 'beviat'"
- 可能是字符集问题，确保使用utf8mb4

#### 4. 表已存在错误
- 如果需要重建数据库，先删除现有数据库：
  ```sql
  DROP DATABASE IF EXISTS beviat;
  ```

## 后续步骤
1. 配置Spring Boot应用的数据库连接（已在application.yml中配置）
2. 启动应用测试数据库连接
3. 使用MyBatis Plus操作数据库

## 相关配置
数据库连接配置位于：`src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/beviat?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: 1234  # 根据实际情况修改
    driver-class-name: com.mysql.cj.jdbc.Driver
```