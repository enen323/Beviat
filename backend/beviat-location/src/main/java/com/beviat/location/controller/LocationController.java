package com.beviat.location.controller;

import com.beviat.common.domain.Product;
import com.beviat.common.domain.UserLocation;
import com.beviat.common.exception.BizException;
import com.beviat.common.result.R;
import com.beviat.common.util.RequestContextHolder;
import com.beviat.location.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@Tag(name = "地理定位")
@RestController
@RequestMapping("/location")
@RequiredArgsConstructor
public class LocationController {
    private final LocationService locationService;

    @Operation(summary = "获取附近商品")
    @GetMapping("/nearby")
    public R<List<Product>> getNearby(@RequestParam double lat, @RequestParam double lng,
                                       @RequestParam(defaultValue = "10.0") double radiusKm,
                                       @RequestParam(defaultValue = "20") int limit) {
        return R.ok(locationService.getNearbyProducts(lat, lng, radiusKm, limit));
    }

    @Operation(summary = "计算两点距离")
    @GetMapping("/distance")
    public R<Double> distance(@RequestParam double lat1, @RequestParam double lng1,
                              @RequestParam double lat2, @RequestParam double lng2) {
        return R.ok(locationService.calculateDistance(lat1, lng1, lat2, lng2));
    }

    @Operation(summary = "地理编码(地址->坐标)")
    @GetMapping("/geocode")
    public R<Object> geocode(@RequestParam String address) {
        return R.ok(locationService.geocode(address));
    }

    @Operation(summary = "更新我的位置")
    @PostMapping("/update")
    public R<Void> updateMyLocation(@RequestParam BigDecimal latitude,
                                    @RequestParam BigDecimal longitude,
                                    @RequestParam(required = false) String address) {
        Long userId = getCurrentUserId();
        locationService.updateUserLocation(userId, latitude, longitude, address);
        return R.ok("位置更新成功", null);
    }

    @Operation(summary = "获取用户位置")
    @GetMapping("/user/{userId}")
    public R<UserLocation> getUserLocation(@PathVariable Long userId) {
        return R.ok(locationService.getUserLocation(userId));
    }

    private Long getCurrentUserId() {
        Long userId = RequestContextHolder.getCurrentUserId();
        if (userId == null) {
            throw new BizException(401, "未登录或登录已过期");
        }
        return userId;
    }
}
