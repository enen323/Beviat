package com.beviat.product.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.common.domain.Category;
import org.apache.ibatis.annotations.Mapper;

/**
 * 分类Mapper
 */
@Mapper
public interface CategoryMapper extends BaseMapper<Category> {
}
