-- Beviat数据库连接测试脚本
-- 在执行完整SQL之前，先使用此脚本测试连接和权限

-- 1. 测试连接（不指定数据库）
SELECT 'MySQL连接测试成功！' AS message, 
       VERSION() AS mysql_version,
       CURRENT_TIMESTAMP AS current_time;

-- 2. 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS beviat 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- 3. 切换到beviat数据库
USE beviat;

-- 4. 测试当前用户权限
SHOW GRANTS;

-- 5. 查看当前数据库
SELECT DATABASE() AS current_database;

-- 6. 查看字符集设置
SHOW VARIABLES LIKE 'character_set_%';
SHOW VARIABLES LIKE 'collation_%';

-- 7. 如果已有表，显示现有表
SHOW TABLES;

-- 8. 如果测试通过，显示成功信息
SELECT '数据库连接测试完成，可以执行创建表的SQL脚本！' AS result;