package com.beviat.location.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.common.domain.UserLocation;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户位置Mapper
 */
@Mapper
public interface UserLocationMapper extends BaseMapper<UserLocation> {
}
