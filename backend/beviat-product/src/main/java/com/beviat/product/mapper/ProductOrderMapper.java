package com.beviat.product.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.common.domain.ProductOrder;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单Mapper
 */
@Mapper
public interface ProductOrderMapper extends BaseMapper<ProductOrder> {
}
