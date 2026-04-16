package com.beviat.product.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.common.domain.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

/**
 * 商品Mapper
 */
@Mapper
public interface ProductMapper extends BaseMapper<Product> {

    /** 增加收藏数 */
    @Update("UPDATE product SET favorite_count = favorite_count + 1 WHERE id = #{id} AND deleted = 0")
    void incrementFavoriteCount(Long id);

    /** 减少收藏数 */
    @Update("UPDATE product SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = #{id} AND deleted = 0")
    void decrementFavoriteCount(Long id);

    /** 增加浏览数（定时同步用） */
    @Update("UPDATE product SET view_count = view_count + 1 WHERE id = #{id} AND deleted = 0")
    void incrementViewCount(Long id);
}
