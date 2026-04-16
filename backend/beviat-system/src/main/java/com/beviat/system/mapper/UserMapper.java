package com.beviat.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.common.domain.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户 Mapper
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
