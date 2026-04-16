package com.beviat.product.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beviat.common.domain.Category;
import com.beviat.common.domain.Product;
import com.beviat.common.domain.User;
import com.beviat.common.exception.BizException;
import com.beviat.product.dto.ProductCreateDTO;
import com.beviat.product.dto.ProductQueryDTO;
import com.beviat.product.domain.Favorite;
import com.beviat.product.mapper.CategoryMapper;
import com.beviat.product.mapper.FavoriteMapper;
import com.beviat.product.mapper.ProductMapper;
import com.beviat.product.service.ProductService;
import com.beviat.product.service.BrowseHistoryService;
import com.beviat.product.vo.ProductVO;
import com.beviat.system.service.UserService;
import com.beviat.common.result.PageResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 商品服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductMapper productMapper;
    private final CategoryMapper categoryMapper;
    private final FavoriteMapper favoriteMapper;
    private final UserService userService;
    private final StringRedisTemplate redisTemplate;
    private final BrowseHistoryService browseHistoryService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductVO create(ProductCreateDTO dto, Long sellerId) {
        // 1. 验证分类是否存在
        Category category = categoryMapper.selectById(dto.getCategoryId());
        if (category == null || category.getDeleted() == 1) {
            throw new BizException("商品分类不存在");
        }

        // 2. 构建商品实体
        Product product = new Product();
        product.setTitle(dto.getTitle());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setOriginalPrice(dto.getOriginalPrice());
        product.setCategoryId(dto.getCategoryId());
        product.setSellerId(sellerId);
        product.setStatus(0); // 在售
        product.setConditionLevel(dto.getConditionLevel());
        product.setTradeType(dto.getTradeType());

        // 图片列表（JacksonTypeHandler自动处理JSON序列化）
        product.setImages(dto.getImages());
        product.setLocation(dto.getLocation());
        product.setContactQq(dto.getContactQq());
        product.setContactWechat(dto.getContactWechat());
        product.setViewCount(0);
        product.setFavoriteCount(0);
        product.setIsTop(false);

        productMapper.insert(product);
        log.info("商品发布成功: productId={}, title={}, seller={}", product.getId(), dto.getTitle(), sellerId);

        return toVO(product, sellerId);
    }

    @Override
    public ProductVO getDetail(Long id, Long viewerId) {
        Product product = productMapper.selectById(id);
        if (product == null || product.getDeleted() != null && product.getDeleted() == 1) {
            throw new BizException("商品不存在或已下架");
        }

        // 异步增加浏览量（Redis计数 + 定时同步DB）
        incrementViewCount(id);

        // 记录浏览历史到Redis
        if (viewerId != null) {
            browseHistoryService.recordBrowse(viewerId, id);
        }

        return toVOWithSellerInfo(product);
    }

    @Override
    public PageResult<ProductVO> getList(ProductQueryDTO query) {
        Page<Product> page = new Page<>(query.getPage(), query.getSize());
        LambdaQueryWrapper<Product> wrapper = buildQueryWrapper(query);

        Page<Product> resultPage = productMapper.selectPage(page, wrapper);

        List<ProductVO> voList = resultPage.getRecords().stream()
                .map(this::toVOWithSellerInfo)
                .toList();

        return com.beviat.common.result.PageResult.of(
                resultPage.getTotal(),
                voList,
                resultPage.getCurrent(),
                resultPage.getSize()
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductVO update(Long id, ProductCreateDTO dto, Long userId) {
        Product existing = productMapper.selectById(id);
        if (existing == null || existing.getDeleted() != null && existing.getDeleted() == 1) {
            throw new BizException("商品不存在");
        }
        if (!existing.getSellerId().equals(userId)) {
            throw new BizException("无权修改此商品");
        }

        existing.setTitle(dto.getTitle());
        existing.setDescription(dto.getDescription());
        existing.setPrice(dto.getPrice());
        existing.setOriginalPrice(dto.getOriginalPrice());
        existing.setCategoryId(dto.getCategoryId());
        existing.setConditionLevel(dto.getConditionLevel());
        existing.setTradeType(dto.getTradeType());
        existing.setLocation(dto.getLocation());

        if (dto.getImages() != null) {
            existing.setImages(dto.getImages());
        }

        productMapper.updateById(existing);
        return toVOWithSellerInfo(existing);
    }

    @Override
    public void delete(Long id, Long userId) {
        Product product = productMapper.selectById(id);
        if (product == null) throw new BizException("商品不存在");
        if (!product.getSellerId().equals(userId)) {
            throw new BizException("无权删除此商品");
        }

        // 逻辑删除
        product.setDeleted(1);
        productMapper.updateById(product);
    }

    @Override
    public void changeStatus(Long id, Integer status, Long userId) {
        Product product = productMapper.selectById(id);
        if (product == null) throw new BizException("商品不存在");
        if (!product.getSellerId().equals(userId)) {
            throw new BizException("无权操作此商品");
        }

        product.setStatus(status);
        if (status == 1) { // 售出
            product.setSoldAt(java.time.LocalDateTime.now());
        }
        productMapper.updateById(product);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean toggleFavorite(Long userId, Long productId) {
        boolean isFavorited = isFavorited(userId, productId);

        if (isFavorited) {
            // 取消收藏（逻辑删除）
            favoriteMapper.delete(new LambdaQueryWrapper<Favorite>()
                    .eq(Favorite::getUserId, userId)
                    .eq(Favorite::getProductId, productId));
            decrementFavoriteCount(productId);
            return false;
        } else {
            // 添加收藏
            Favorite fav = new Favorite();
            fav.setUserId(userId);
            fav.setProductId(productId);
            fav.setFolderName("默认收藏");
            favoriteMapper.insert(fav);
            incrementFavoriteCount(productId);
            return true;
        }
    }

    @Override
    public boolean isFavorited(Long userId, Long productId) {
        Long count = favoriteMapper.selectCount(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getProductId, productId));
        return count > 0;
    }

    @Override
    public List<ProductVO> getMyProducts(Long userId, Integer status) {
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getDeleted, 0);
        wrapper.eq(Product::getSellerId, userId);
        if (status != null) {
            wrapper.eq(Product::getStatus, status);
        }
        wrapper.orderByDesc(Product::getCreatedAt);
        List<Product> products = productMapper.selectList(wrapper);
        return products.stream().map(p -> toVOWithSellerInfo(p)).toList();
    }

    @Override
    public List<ProductVO> getMyFavorites(Long userId) {
        // 查询用户收藏的productId列表
        List<Favorite> favorites = favoriteMapper.selectList(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .orderByDesc(Favorite::getCreatedAt));
        if (favorites.isEmpty()) return List.of();

        List<Long> productIds = favorites.stream().map(Favorite::getProductId).toList();
        List<Product> products = productMapper.selectBatchIds(productIds);
        return products.stream()
                .filter(p -> p.getDeleted() == null || p.getDeleted() == 0)
                .map(p -> {
                    ProductVO vo = toVOWithSellerInfo(p);
                    vo.setFavorited(true);
                    return vo;
                })
                .toList();
    }

    // ---- 私有方法 ----

    /** 构建查询条件 */
    private LambdaQueryWrapper<Product> buildQueryWrapper(ProductQueryDTO q) {
        LambdaQueryWrapper<Product> w = new LambdaQueryWrapper<>();
        w.eq(Product::getDeleted, 0);

        if (q.getStatus() != null) {
            w.eq(Product::getStatus, q.getStatus());
        }
        if (q.getCategoryId() != null) {
            w.eq(Product::getCategoryId, q.getCategoryId());
        }
        if (q.getCategoryIds() != null && !q.getCategoryIds().isEmpty()) {
            w.in(Product::getCategoryId, q.getCategoryIds());
        }
        if (q.getConditionLevel() != null) {
            w.eq(Product::getConditionLevel, q.getConditionLevel());
        }
        if (q.getMinPrice() != null) {
            w.ge(Product::getPrice, q.getMinPrice());
        }
        if (q.getMaxPrice() != null) {
            w.le(Product::getPrice, q.getMaxPrice());
        }
        if (q.getSellerId() != null) {
            w.eq(Product::getSellerId, q.getSellerId());
        }
        if (Boolean.TRUE.equals(q.getIsTop())) {
            w.eq(Product::getIsTop, true);
        }

        // 排序
        if ("price_asc".equals(q.getSortBy())) {
            w.orderByAsc(Product::getPrice);
        } else if ("price_desc".equals(q.getSortBy())) {
            w.orderByDesc(Product::getPrice);
        } else if ("view_count".equals(q.getSortBy())) {
            w.orderByDesc(Product::getViewCount);
        } else {
            // 默认按时间倒序 + 置顶优先
            w.orderByDesc(Product::getIsTop).orderByDesc(Product::getCreatedAt);
        }

        // 关键词搜索（使用LIKE，生产环境建议用全文检索）
        if (q.getKeyword() != null && !q.getKeyword().isBlank()) {
            String kw = "%" + q.getKeyword() + "%";
            w.and(wrapper -> wrapper.like(Product::getTitle, kw).or().like(Product::getDescription, kw));
        }

        return w;
    }

    /** 实体转VO（含分类名） */
    private ProductVO toVO(Product product, Long currentUserId) {
        ProductVO vo = new ProductVO();
        vo.setId(product.getId());
        vo.setTitle(product.getTitle());
        vo.setDescription(product.getDescription());
        vo.setPrice(product.getPrice());
        vo.setOriginalPrice(product.getOriginalPrice());
        vo.setCategoryId(product.getCategoryId());
        vo.setStatus(product.getStatus());
        vo.setConditionLevel(product.getConditionLevel());
        vo.setConditionLevelText(getConditionText(product.getConditionLevel()));
        vo.setTradeType(product.getTradeType());
        vo.setViewCount(product.getViewCount());
        vo.setFavoriteCount(product.getFavoriteCount());
        vo.setLocation(product.getLocation());
        vo.setIsTop(product.getIsTop());
        vo.setCreatedAt(product.getCreatedAt());

        // 分类名
        Category cat = categoryMapper.selectById(product.getCategoryId());
        vo.setCategoryName(cat != null ? cat.getName() : "");

        // 图片（JacksonTypeHandler自动反序列化为List<String>）
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            vo.setImages(product.getImages().stream().map(this::normalizeImageUrl).toList());
        } else {
            vo.setImages(List.of());
        }

        // 封面图取第一张
        if (vo.getImages() != null && !vo.getImages().isEmpty()) {
            vo.setCoverImage(vo.getImages().get(0));
        }

        // 是否被当前用户收藏
        if (currentUserId != null) {
            vo.setFavorited(isFavorited(currentUserId, product.getId()));
        }

        return vo;
    }

    /** 实体转VO（含卖家信息） */
    private ProductVO toVOWithSellerInfo(Product product) {
        ProductVO vo = toVO(product, null);

        // 卖家信息（通过UserService获取，遵循模块化设计）
        User seller = userService.getById(product.getSellerId());
        if (seller != null) {
            vo.setSellerId(seller.getId());
            vo.setSellerNickname(seller.getNickname());
            vo.setSellerAvatar(normalizeImageUrl(seller.getAvatar()));
            vo.setSellerCreditScore(seller.getCreditScore());
            vo.setSellerSchool(seller.getSchool());
        }
        return vo;
    }

    /** 获取成色文字描述 */
    private String getConditionText(Integer level) {
        if (level == null) return "未标注";
        return switch (level) {
            case 1 -> "全新";
            case 99 -> "几乎全新";
            case 95 -> "轻微使用痕迹";
            case 90 -> "明显使用痕迹";
            case 80 -> "有瑕疵";
            default -> "其他";
        };
    }

    /** 异步增加浏览量（通过Redis） */
    private void incrementViewCount(Long productId) {
        try {
            String key = "beviat:view:" + productId;
            redisTemplate.opsForValue().increment(key);
        } catch (Exception e) {
            log.warn("浏览量计数失败: {}", e.getMessage());
        }
    }

    /** 增加收藏数 */
    private void incrementFavoriteCount(Long productId) {
        productMapper.incrementFavoriteCount(productId);
    }

    /** 减少收藏数 */
    private void decrementFavoriteCount(Long productId) {
        productMapper.decrementFavoriteCount(productId);
    }

    /** 将图片URL转为相对路径，确保前端通过Vite代理访问 */
    private String normalizeImageUrl(String url) {
        if (url == null || url.isBlank()) return url;
        // 如果已经是相对路径（以/开头），直接返回
        if (url.startsWith("/")) return url;
        // 绝对路径：提取 /api/v1/files/... 部分
        int idx = url.indexOf("/api/v1/files/");
        if (idx >= 0) return url.substring(idx);
        // 其他情况：提取路径部分
        try {
            java.net.URI uri = new java.net.URI(url);
            return uri.getPath();
        } catch (Exception e) {
            return url;
        }
    }
}
