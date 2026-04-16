package com.beviat.product.controller;

import com.beviat.common.result.R;
import com.beviat.common.util.RequestContextHolder;
import com.beviat.product.dto.OrderCreateDTO;
import com.beviat.product.service.OrderService;
import com.beviat.product.vo.OrderVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 订单控制器
 */
@Tag(name = "订单管理", description = "商品购买、支付、订单管理等")
@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "创建订单")
    @PostMapping
    public R<OrderVO> createOrder(@Valid @RequestBody OrderCreateDTO dto) {
        Long userId = getCurrentUserId();
        return R.ok(orderService.createOrder(dto, userId));
    }

    @Operation(summary = "模拟支付")
    @PostMapping("/{id}/pay")
    public R<OrderVO> simulatePay(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return R.ok(orderService.simulatePay(id, userId));
    }

    @Operation(summary = "卖家确认订单")
    @PostMapping("/{id}/confirm")
    public R<OrderVO> confirmOrder(@PathVariable Long id,
                                    @RequestParam(required = false) BigDecimal latitude,
                                    @RequestParam(required = false) BigDecimal longitude,
                                    @RequestParam(required = false) String address) {
        Long userId = getCurrentUserId();
        return R.ok(orderService.confirmOrder(id, userId, latitude, longitude, address));
    }

    @Operation(summary = "卖家发货")
    @PostMapping("/{id}/ship")
    public R<OrderVO> shipOrder(@PathVariable Long id,
                                @RequestParam(required = false) BigDecimal latitude,
                                @RequestParam(required = false) BigDecimal longitude,
                                @RequestParam(required = false) String address) {
        Long userId = getCurrentUserId();
        return R.ok(orderService.shipOrder(id, userId, latitude, longitude, address));
    }

    @Operation(summary = "取消订单")
    @PostMapping("/{id}/cancel")
    public R<OrderVO> cancelOrder(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return R.ok(orderService.cancelOrder(id, userId));
    }

    @Operation(summary = "确认收货")
    @PostMapping("/{id}/complete")
    public R<OrderVO> completeOrder(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return R.ok(orderService.completeOrder(id, userId));
    }

    @Operation(summary = "获取订单详情")
    @GetMapping("/{id}")
    public R<OrderVO> getOrderDetail(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return R.ok(orderService.getOrderDetail(id, userId));
    }

    @Operation(summary = "获取我买到的订单")
    @GetMapping("/buy")
    public R<List<OrderVO>> getMyBuyOrders(@RequestParam(required = false) Integer status) {
        Long userId = getCurrentUserId();
        return R.ok(orderService.getMyBuyOrders(userId, status));
    }

    @Operation(summary = "获取我卖出的订单")
    @GetMapping("/sell")
    public R<List<OrderVO>> getMySellOrders(@RequestParam(required = false) Integer status) {
        Long userId = getCurrentUserId();
        return R.ok(orderService.getMySellOrders(userId, status));
    }

    private Long getCurrentUserId() {
        Long userId = RequestContextHolder.getCurrentUserId();
        if (userId == null) {
            throw new com.beviat.common.exception.BizException(401, "未登录或登录已过期");
        }
        return userId;
    }
}
