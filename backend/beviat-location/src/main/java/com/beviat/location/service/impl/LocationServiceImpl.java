package com.beviat.location.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.beviat.common.domain.Product;
import com.beviat.common.domain.UserLocation;
import com.beviat.location.mapper.UserLocationMapper;
import com.beviat.location.service.LocationService;
import com.beviat.product.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 地理定位服务实现
 * - 使用 Haversine 公式计算球面距离
 * - 支持腾讯地图API集成（需配置key）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {

    private final ProductMapper productMapper;
    private final UserLocationMapper userLocationMapper;

    @Value("${tencent.map.key:}")
    private String tencentMapKey;

    @Override
    public List<Product> getNearbyProducts(double lat, double lng, double radiusKm, int limit) {
        // 1. 获取所有在售商品（含位置信息）
        List<Product> allProducts = productMapper.selectList(
                new LambdaQueryWrapper<Product>()
                        .eq(Product::getDeleted, 0).eq(Product::getStatus, 0)
                        .isNotNull(Product::getLocation)
                        .ne(Product::getLocation, "")
                        .last("LIMIT 200") // 先取前200条做粗筛，避免全表扫描
        );

        // 2. 解析商品位置坐标并计算距离（简化：实际应使用Geo索引或空间数据库）
        // TODO: 生产环境建议使用 MySQL Spatial Index 或 PostGIS
        return allProducts.stream()
                .map(p -> {
                    double[] coords = parseLocation(p.getLocation());
                    if (coords == null) return null;
                    double dist = calculateDistance(lat, lng, coords[0], coords[1]);
                    p.setDistance(dist);
                    return p;
                })
                .filter(p -> p.getDistance() != null && p.getDistance() <= radiusKm)
                .sorted((a, b) -> Double.compare(a.getDistance(), b.getDistance()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Haversine公式计算两点间球面距离(km)
     */
    @Override
    public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371; // 地球半径 km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /** 简化版地址解析（实际调用腾讯地图API） */
    @Override
    public Object geocode(String address) {
        if (tencentMapKey == null || tencentMapKey.isBlank()) {
            log.warn("腾讯地图Key未配置");
            return null;
        }
        // TODO: HTTP调用腾讯地图地理编码API
        log.info("地理编码: address={}", address);
        return null;
    }

    @Override
    public Object reverseGeocode(double lat, double lng) {
        if (tencentMapKey == null || tencentMapKey.isBlank()) {
            log.warn("腾讯地图Key未配置");
            return null;
        }
        // TODO: HTTP调用腾讯地图逆地理编码API
        log.info("逆地理编码: {},{}", lat, lng);
        return null;
    }

    /** 解析位置字符串为 [lat, lng]（格式："lat,lng" 或 "地址"）*/
    private double[] parseLocation(String location) {
        if (location == null || location.isBlank()) return null;
        try {
            String[] parts = location.split(",");
            if (parts.length == 2) {
                return new double[]{Double.parseDouble(parts[0].trim()), Double.parseDouble(parts[1].trim())};
            }
        } catch (NumberFormatException e) {
            // 非坐标格式的地址文本，无法计算距离
        }
        return null; // 无法解析为坐标
    }

    @Override
    public void updateUserLocation(Long userId, BigDecimal latitude, BigDecimal longitude, String address) {
        UserLocation existing = userLocationMapper.selectOne(
                new LambdaQueryWrapper<UserLocation>().eq(UserLocation::getUserId, userId));
        if (existing != null) {
            existing.setLatitude(latitude);
            existing.setLongitude(longitude);
            existing.setAddress(address);
            userLocationMapper.updateById(existing);
        } else {
            UserLocation newLocation = new UserLocation();
            newLocation.setUserId(userId);
            newLocation.setLatitude(latitude);
            newLocation.setLongitude(longitude);
            newLocation.setAddress(address);
            userLocationMapper.insert(newLocation);
        }
        log.info("用户位置更新: userId={}, lat={}, lng={}, address={}", userId, latitude, longitude, address);
    }

    @Override
    public UserLocation getUserLocation(Long userId) {
        return userLocationMapper.selectOne(
                new LambdaQueryWrapper<UserLocation>().eq(UserLocation::getUserId, userId));
    }
}
