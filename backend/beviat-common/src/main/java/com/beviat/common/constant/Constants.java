package com.beviat.common.constant;

/**
 * 全局常量
 */
public class Constants {

    /** JWT相关 */
    public static final String JWT_HEADER = "Authorization";
    public static final String JWT_PREFIX = "Bearer ";
    public static final long ACCESS_TOKEN_EXPIRE = 15 * 60 * 1000; // 15分钟
    public static final long REFRESH_TOKEN_EXPIRE = 7 * 24 * 60 * 60 * 1000L; // 7天

    /** Redis Key前缀 */
    public static final String REDIS_USER_PREFIX = "beviat:user:";
    public static final String REDIS_TOKEN_PREFIX = "beviat:token:";
    public static final String REDIS_BLACKLIST_PREFIX = "beviat:blacklist:";
    public static final String REDIS_BROWSE_HISTORY_PREFIX = "beviat:browse:";
    public static final String REDIS_VERIFY_CODE_PREFIX = "beviat:verify:";
    public static final String REDIS_RESET_TOKEN_PREFIX = "beviat:reset:";

    /** 用户状态 */
    public static final int USER_STATUS_NORMAL = 0;
    public static final int USER_STATUS_DISABLED = 1;
    public static final int USER_STATUS_LOCKED = 2;

    /** 商品状态 */
    public static final int PRODUCT_STATUS_ON_SALE = 0;
    public static final int PRODUCT_STATUS_SOLD = 1;
    public static final int PRODUCT_STATUS_OFFLINE = 2;
}
