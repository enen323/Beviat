-- 社区帖子表添加 images 列
ALTER TABLE community_post ADD COLUMN images JSON DEFAULT NULL COMMENT '图片URL列表(JSON数组)' AFTER is_essence;
