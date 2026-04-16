package com.beviat.product.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.beviat.common.domain.PaymentRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 支付记录Mapper
 */
@Mapper
public interface PaymentRecordMapper extends BaseMapper<PaymentRecord> {
}
