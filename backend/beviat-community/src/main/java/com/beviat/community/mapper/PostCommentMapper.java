package com.beviat.community.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.community.domain.PostComment;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PostCommentMapper extends BaseMapper<PostComment> {
}
