package com.beviat.location.service;

import com.beviat.common.domain.Product;
import com.beviat.common.domain.UserLocation;
import java.util.List;
import java.math.BigDecimal;

/**
 * 地理定位服务
 */
public interface LocationService {
    /** 获取附近商品（按距离排序） */
    List<Product> getNearbyProducts(double lat, double lng, double radiusKm, int limit);

    /** 计算两个坐标之间的距离(km) */
    double calculateDistance(double lat1, double lng1, double lat2, double lng2);

    /** 地理编码：地址 -> 经纬度 */
    Object geocode(String address);

    /** 逆地理编码：经纬度 -> 地址信息 */
    Object reverseGeocode(double lat, double lng);

    /** 更新用户位置 */
    void updateUserLocation(Long userId, BigDecimal latitude, BigDecimal longitude, String address);

    /** 获取用户位置 */
    UserLocation getUserLocation(Long userId);
}
