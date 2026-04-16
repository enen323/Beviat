package com.beviat.product.service;

import com.beviat.product.dto.OrderCreateDTO;
import com.beviat.product.vo.OrderVO;

import java.math.BigDecimal;
import java.util.List;

/**
 * 订单服务
 */
public interface OrderService {

    /** 创建订单（待支付） */
    OrderVO createOrder(OrderCreateDTO dto, Long buyerId);

    /** 模拟支付（将订单状态改为待卖家确认） */
    OrderVO simulatePay(Long orderId, Long buyerId);

    /** 卖家确认订单（将订单状态改为待发货，可附带卖家位置） */
    OrderVO confirmOrder(Long orderId, Long sellerId, BigDecimal latitude, BigDecimal longitude, String address);

    /** 卖家发货（将订单状态改为已发货，可附带卖家位置） */
    OrderVO shipOrder(Long orderId, Long sellerId, BigDecimal latitude, BigDecimal longitude, String address);

    /** 取消订单 */
    OrderVO cancelOrder(Long orderId, Long userId);

    /** 确认收货/完成订单 */
    OrderVO completeOrder(Long orderId, Long userId);

    /** 获取订单详情 */
    OrderVO getOrderDetail(Long orderId, Long userId);

    /** 获取我买到的订单 */
    List<OrderVO> getMyBuyOrders(Long buyerId, Integer status);

    /** 获取我卖出的订单 */
    List<OrderVO> getMySellOrders(Long sellerId, Integer status);
}
