package com.beviat.product.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.beviat.common.domain.PaymentRecord;
import com.beviat.common.domain.Product;
import com.beviat.common.domain.ProductOrder;
import com.beviat.common.domain.User;
import com.beviat.common.exception.BizException;
import com.beviat.product.dto.OrderCreateDTO;
import com.beviat.product.mapper.PaymentRecordMapper;
import com.beviat.product.mapper.ProductMapper;
import com.beviat.product.mapper.ProductOrderMapper;
import com.beviat.product.service.OrderService;
import com.beviat.product.vo.OrderVO;
import com.beviat.system.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 订单服务实现
 * 订单状态流转: 0-待支付 → 1-待卖家确认(已支付) → 2-卖家已确认/待发货 → 3-已发货 → 4-已完成
 *                                            ↘ 5-已取消                    ↘ 5-已取消
 *                                                                           ↘ 6-已退款
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final ProductOrderMapper orderMapper;
    private final PaymentRecordMapper paymentMapper;
    private final ProductMapper productMapper;
    private final UserService userService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO createOrder(OrderCreateDTO dto, Long buyerId) {
        // 1. 查询商品
        Product product = productMapper.selectById(dto.getProductId());
        if (product == null || (product.getDeleted() != null && product.getDeleted() == 1)) {
            throw new BizException("商品不存在或已下架");
        }
        if (product.getStatus() != 0) {
            throw new BizException("商品已售出或已下架，无法购买");
        }
        if (product.getSellerId().equals(buyerId)) {
            throw new BizException("不能购买自己的商品");
        }

        // 2. 检查是否已有待支付订单
        Long existCount = orderMapper.selectCount(new LambdaQueryWrapper<ProductOrder>()
                .eq(ProductOrder::getBuyerId, buyerId)
                .eq(ProductOrder::getProductId, dto.getProductId())
                .in(ProductOrder::getStatus, 0, 1, 2, 3) // 待支付、待确认、待发货、已发货的都不能重复下单
                .eq(ProductOrder::getDeleted, 0));
        if (existCount > 0) {
            throw new BizException("您已有一个进行中的订单，请先处理");
        }

        // 3. 创建订单
        ProductOrder order = new ProductOrder();
        order.setOrderNo(generateOrderNo());
        order.setBuyerId(buyerId);
        order.setSellerId(product.getSellerId());
        order.setProductId(product.getId());
        order.setProductTitle(product.getTitle());
        // 封面图取第一张
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            order.setProductImage(product.getImages().get(0));
        }
        order.setProductPrice(product.getPrice());
        order.setOrderAmount(product.getPrice());
        order.setStatus(0); // 待支付
        order.setTradeType(product.getTradeType());
        order.setReceiverName(dto.getReceiverName());
        order.setReceiverPhone(dto.getReceiverPhone());
        order.setReceiverAddress(dto.getReceiverAddress());
        order.setRemark(dto.getRemark());
        // 买家位置
        order.setBuyerLatitude(dto.getBuyerLatitude());
        order.setBuyerLongitude(dto.getBuyerLongitude());
        order.setBuyerAddress(dto.getBuyerAddress());

        orderMapper.insert(order);
        log.info("订单创建成功: orderNo={}, buyer={}, product={}", order.getOrderNo(), buyerId, product.getId());

        return toVO(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO simulatePay(Long orderId, Long buyerId) {
        // 1. 查询订单
        ProductOrder order = orderMapper.selectById(orderId);
        if (order == null || (order.getDeleted() != null && order.getDeleted() == 1)) {
            throw new BizException("订单不存在");
        }
        if (!order.getBuyerId().equals(buyerId)) {
            throw new BizException("无权操作此订单");
        }
        if (order.getStatus() != 0) {
            throw new BizException("订单状态异常，无法支付");
        }

        // 2. 再次检查商品状态
        Product product = productMapper.selectById(order.getProductId());
        if (product == null || product.getStatus() != 0) {
            // 商品已售出，自动取消订单
            order.setStatus(5);
            order.setCancelledAt(LocalDateTime.now());
            order.setCancelReason("商品已被他人购买");
            orderMapper.updateById(order);
            throw new BizException("商品已被他人购买，订单已自动取消");
        }

        // 3. 模拟支付 - 创建支付记录
        PaymentRecord payment = new PaymentRecord();
        payment.setPaymentNo(generatePaymentNo());
        payment.setOrderId(order.getId());
        payment.setOrderNo(order.getOrderNo());
        payment.setPayerId(buyerId);
        payment.setPayeeId(order.getSellerId());
        payment.setAmount(order.getOrderAmount());
        payment.setPaymentMethod(0); // 模拟支付
        payment.setStatus(1); // 支付成功
        payment.setTransactionId("SIM_" + System.currentTimeMillis() + "_" + ThreadLocalRandom.current().nextInt(1000, 9999));
        payment.setPaidAt(LocalDateTime.now());

        paymentMapper.insert(payment);

        // 4. 更新订单状态为待卖家确认
        order.setStatus(1); // 待卖家确认
        order.setPaidAt(LocalDateTime.now());
        orderMapper.updateById(order);

        // 5. 更新商品状态为已售出
        product.setStatus(1);
        product.setSoldAt(LocalDateTime.now());
        productMapper.updateById(product);

        log.info("模拟支付成功: orderNo={}, paymentNo={}", order.getOrderNo(), payment.getPaymentNo());

        return toVO(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO confirmOrder(Long orderId, Long sellerId, BigDecimal latitude, BigDecimal longitude, String address) {
        ProductOrder order = orderMapper.selectById(orderId);
        if (order == null || (order.getDeleted() != null && order.getDeleted() == 1)) {
            throw new BizException("订单不存在");
        }
        if (!order.getSellerId().equals(sellerId)) {
            throw new BizException("无权操作此订单");
        }
        if (order.getStatus() != 1) {
            throw new BizException("只有待确认的订单可以确认");
        }

        order.setStatus(2); // 卖家已确认/待发货
        order.setConfirmedAt(LocalDateTime.now());
        // 卖家确认时附带位置信息
        if (latitude != null && longitude != null) {
            order.setSellerLatitude(latitude);
            order.setSellerLongitude(longitude);
            order.setSellerAddress(address);
        }
        orderMapper.updateById(order);

        log.info("卖家确认订单: orderNo={}", order.getOrderNo());
        return toVO(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO shipOrder(Long orderId, Long sellerId, BigDecimal latitude, BigDecimal longitude, String address) {
        ProductOrder order = orderMapper.selectById(orderId);
        if (order == null || (order.getDeleted() != null && order.getDeleted() == 1)) {
            throw new BizException("订单不存在");
        }
        if (!order.getSellerId().equals(sellerId)) {
            throw new BizException("无权操作此订单");
        }
        if (order.getStatus() != 2) {
            throw new BizException("只有待发货的订单可以发货");
        }

        order.setStatus(3); // 已发货
        order.setShippedAt(LocalDateTime.now());
        // 卖家发货时的位置
        if (latitude != null && longitude != null) {
            order.setSellerLatitude(latitude);
            order.setSellerLongitude(longitude);
            order.setSellerAddress(address);
        }
        orderMapper.updateById(order);

        log.info("卖家发货: orderNo={}", order.getOrderNo());
        return toVO(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO cancelOrder(Long orderId, Long userId) {
        ProductOrder order = orderMapper.selectById(orderId);
        if (order == null || (order.getDeleted() != null && order.getDeleted() == 1)) {
            throw new BizException("订单不存在");
        }
        // 买家和卖家都可以取消（但只能取消不同状态的订单）
        boolean isBuyer = order.getBuyerId().equals(userId);
        boolean isSeller = order.getSellerId().equals(userId);
        if (!isBuyer && !isSeller) {
            throw new BizException("无权操作此订单");
        }

        // 买家只能取消待支付的订单
        if (isBuyer && order.getStatus() != 0) {
            throw new BizException("买家只能取消待支付的订单");
        }
        // 卖家可以拒绝待确认的订单
        if (isSeller && order.getStatus() != 1) {
            throw new BizException("卖家只能拒绝待确认的订单");
        }

        order.setStatus(5); // 已取消
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelReason(isBuyer ? "买家主动取消" : "卖家拒绝订单");
        orderMapper.updateById(order);

        // 如果卖家拒绝已支付的订单，需要恢复商品状态
        if (isSeller && order.getStatus() == 5 && order.getPaidAt() != null) {
            Product product = productMapper.selectById(order.getProductId());
            if (product != null && product.getStatus() == 1) {
                product.setStatus(0); // 恢复在售
                product.setSoldAt(null);
                productMapper.updateById(product);
            }
        }

        log.info("订单取消成功: orderNo={}", order.getOrderNo());
        return toVO(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO completeOrder(Long orderId, Long userId) {
        ProductOrder order = orderMapper.selectById(orderId);
        if (order == null || (order.getDeleted() != null && order.getDeleted() == 1)) {
            throw new BizException("订单不存在");
        }
        // 只有买家可以确认收货
        if (!order.getBuyerId().equals(userId)) {
            throw new BizException("只有买家可以确认收货");
        }
        if (order.getStatus() != 3) {
            throw new BizException("只有已发货的订单可以确认收货");
        }

        order.setStatus(4); // 已完成
        order.setCompletedAt(LocalDateTime.now());
        orderMapper.updateById(order);

        log.info("订单完成: orderNo={}", order.getOrderNo());
        return toVO(order);
    }

    @Override
    public OrderVO getOrderDetail(Long orderId, Long userId) {
        ProductOrder order = orderMapper.selectById(orderId);
        if (order == null || (order.getDeleted() != null && order.getDeleted() == 1)) {
            throw new BizException("订单不存在");
        }
        if (!order.getBuyerId().equals(userId) && !order.getSellerId().equals(userId)) {
            throw new BizException("无权查看此订单");
        }
        return toVO(order);
    }

    @Override
    public List<OrderVO> getMyBuyOrders(Long buyerId, Integer status) {
        LambdaQueryWrapper<ProductOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductOrder::getBuyerId, buyerId);
        wrapper.eq(ProductOrder::getDeleted, 0);
        if (status != null) {
            wrapper.eq(ProductOrder::getStatus, status);
        }
        wrapper.orderByDesc(ProductOrder::getCreatedAt);
        List<ProductOrder> orders = orderMapper.selectList(wrapper);
        return orders.stream().map(this::toVO).toList();
    }

    @Override
    public List<OrderVO> getMySellOrders(Long sellerId, Integer status) {
        LambdaQueryWrapper<ProductOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductOrder::getSellerId, sellerId);
        wrapper.eq(ProductOrder::getDeleted, 0);
        if (status != null) {
            wrapper.eq(ProductOrder::getStatus, status);
        }
        wrapper.orderByDesc(ProductOrder::getCreatedAt);
        List<ProductOrder> orders = orderMapper.selectList(wrapper);
        return orders.stream().map(this::toVO).toList();
    }

    // ---- 私有方法 ----

    /** 生成订单号: yyyyMMddHHmmss + 6位随机数 */
    private String generateOrderNo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
        return "ORD" + timestamp + random;
    }

    /** 生成支付流水号 */
    private String generatePaymentNo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
        return "PAY" + timestamp + random;
    }

    /** 实体转VO */
    private OrderVO toVO(ProductOrder order) {
        OrderVO vo = new OrderVO();
        vo.setId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        vo.setBuyerId(order.getBuyerId());
        vo.setSellerId(order.getSellerId());
        vo.setProductId(order.getProductId());
        vo.setProductTitle(order.getProductTitle());
        vo.setProductImage(order.getProductImage());
        vo.setProductPrice(order.getProductPrice());
        vo.setOrderAmount(order.getOrderAmount());
        vo.setStatus(order.getStatus());
        vo.setStatusText(getStatusText(order.getStatus()));
        vo.setTradeType(order.getTradeType());
        vo.setReceiverName(order.getReceiverName());
        vo.setReceiverPhone(order.getReceiverPhone());
        vo.setReceiverAddress(order.getReceiverAddress());
        vo.setRemark(order.getRemark());
        vo.setPaidAt(order.getPaidAt());
        vo.setConfirmedAt(order.getConfirmedAt());
        vo.setShippedAt(order.getShippedAt());
        vo.setCompletedAt(order.getCompletedAt());
        vo.setCancelledAt(order.getCancelledAt());
        vo.setCancelReason(order.getCancelReason());
        vo.setCreatedAt(order.getCreatedAt());
        // 位置信息
        vo.setBuyerLatitude(order.getBuyerLatitude());
        vo.setBuyerLongitude(order.getBuyerLongitude());
        vo.setBuyerAddress(order.getBuyerAddress());
        vo.setSellerLatitude(order.getSellerLatitude());
        vo.setSellerLongitude(order.getSellerLongitude());
        vo.setSellerAddress(order.getSellerAddress());

        // 填充买家信息
        try {
            User buyer = userService.getById(order.getBuyerId());
            if (buyer != null) {
                vo.setBuyerName(buyer.getNickname());
                vo.setBuyerAvatar(buyer.getAvatar());
            }
        } catch (Exception e) {
            log.warn("获取买家信息失败: {}", e.getMessage());
        }

        // 填充卖家信息
        try {
            User seller = userService.getById(order.getSellerId());
            if (seller != null) {
                vo.setSellerName(seller.getNickname());
                vo.setSellerAvatar(seller.getAvatar());
            }
        } catch (Exception e) {
            log.warn("获取卖家信息失败: {}", e.getMessage());
        }

        // 已支付时返回支付流水号
        if (order.getStatus() >= 1) {
            PaymentRecord payment = paymentMapper.selectOne(new LambdaQueryWrapper<PaymentRecord>()
                    .eq(PaymentRecord::getOrderId, order.getId())
                    .eq(PaymentRecord::getStatus, 1)
                    .last("LIMIT 1"));
            if (payment != null) {
                vo.setPaymentNo(payment.getPaymentNo());
            }
        }

        return vo;
    }

    private String getStatusText(Integer status) {
        if (status == null) return "未知";
        return switch (status) {
            case 0 -> "待支付";
            case 1 -> "待卖家确认";
            case 2 -> "待发货";
            case 3 -> "已发货";
            case 4 -> "已完成";
            case 5 -> "已取消";
            case 6 -> "已退款";
            default -> "未知";
        };
    }
}
