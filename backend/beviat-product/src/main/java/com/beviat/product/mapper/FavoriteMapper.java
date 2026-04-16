package com.beviat.product.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.product.domain.Favorite;
import org.apache.ibatis.annotations.Mapper;

/**
 * 收藏Mapper
 */
@Mapper
public interface FavoriteMapper extends BaseMapper<Favorite> {
}
