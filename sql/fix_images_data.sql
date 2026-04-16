-- 修复 product 表中双重序列化的 images 数据
-- 问题：images 字段存储的是被双重JSON序列化的值，如 "[\"...\"]" 而非 ["..."]
-- 需要去掉最外层引号和内部转义反斜杠

-- 先查看当前数据
SELECT id, images FROM product WHERE images IS NOT NULL AND images != '' AND deleted = 0;

-- 方案：使用 JSON_UNQUOTE 和 JSON_VALID 来处理
-- 对于双重序列化的数据，先 JSON_UNQUOTE 去掉外层引号和转义
UPDATE product 
SET images = JSON_UNQUOTE(images) 
WHERE images IS NOT NULL 
  AND images != '' 
  AND LEFT(images, 1) = '"' 
  AND deleted = 0;

-- 验证修复结果
SELECT id, images FROM product WHERE images IS NOT NULL AND images != '' AND deleted = 0;
