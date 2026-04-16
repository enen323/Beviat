package com.beviat.product.controller;

import com.beviat.common.result.PageResult;
import com.beviat.common.result.R;
import com.beviat.common.util.RequestContextHolder;
import com.beviat.product.dto.ProductCreateDTO;
import com.beviat.product.dto.ProductQueryDTO;
import com.beviat.product.service.ProductService;
import com.beviat.product.vo.ProductVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 商品控制器
 */
@Tag(name = "商品管理", description = "商品的发布、查询、编辑、删除等")
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @Value("${file.storage.local.path:./uploads}")
    private String uploadPath;

    @Value("${file.storage.local.url-prefix:http://localhost:8080/api/v1/files/}")
    private String urlPrefix;

    /** 图片访问的相对路径前缀（不含协议和域名，走前端代理） */
    private static final String RELATIVE_URL_PREFIX = "/api/v1/files/";

    @Operation(summary = "获取推荐商品")
    @GetMapping("/recommendations")
    public R<List<ProductVO>> getRecommendations(@RequestParam(defaultValue = "10") int limit) {
        ProductQueryDTO query = new ProductQueryDTO();
        query.setPage(1);
        query.setSize(limit);
        query.setSortBy("view_count");
        return R.ok(productService.getList(query).getRecords());
    }

    @Operation(summary = "获取附近商品")
    @GetMapping("/nearby")
    public R<List<ProductVO>> getNearby(@RequestParam Double latitude,
                                         @RequestParam Double longitude,
                                         @RequestParam(defaultValue = "10") Double distance) {
        // TODO: 实现基于地理位置的商品推荐，目前返回最新商品
        ProductQueryDTO query = new ProductQueryDTO();
        query.setPage(1);
        query.setSize(20);
        return R.ok(productService.getList(query).getRecords());
    }

    @Operation(summary = "分页查询商品列表")
    @GetMapping
    public R<PageResult<ProductVO>> getList(ProductQueryDTO query) {
        return R.ok(productService.getList(query));
    }

    @Operation(summary = "获取商品详情")
    @GetMapping("/{id}")
    public R<ProductVO> getDetail(@PathVariable Long id) {
        Long userId = (Long) RequestContextHolder.getCurrentUserId();
        return R.ok(productService.getDetail(id, userId));
    }

    @Operation(summary = "发布商品")
    @PostMapping(consumes = "multipart/form-data")
    public R<ProductVO> create(
            @Valid @RequestPart("data") ProductCreateDTO dto,
            @RequestPart(value = "images", required = false) MultipartFile[] imageFiles) {
        Long userId = (Long) RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;

        // 处理图片上传，设置图片URL列表
        if (imageFiles != null && imageFiles.length > 0) {
            List<String> imageUrls = new ArrayList<>();
            for (MultipartFile file : imageFiles) {
                String url = uploadFile(file);
                if (url != null) {
                    imageUrls.add(url);
                }
            }
            dto.setImages(imageUrls);
        }

        return R.ok(productService.create(dto, userId));
    }

    @Operation(summary = "更新商品")
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public R<ProductVO> update(@PathVariable Long id,
                                @Valid @RequestPart("data") ProductCreateDTO dto,
                                @RequestPart(value = "images", required = false) MultipartFile[] imageFiles) {
        Long userId = (Long) RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;

        // 处理图片上传，设置图片URL列表
        if (imageFiles != null && imageFiles.length > 0) {
            List<String> imageUrls = new ArrayList<>();
            for (MultipartFile file : imageFiles) {
                String url = uploadFile(file);
                if (url != null) {
                    imageUrls.add(url);
                }
            }
            dto.setImages(imageUrls);
        }

        return R.ok(productService.update(id, dto, userId));
    }

    /** 上传单个文件并返回访问URL */
    private String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            LocalDate today = LocalDate.now();
            Path dirPath = Paths.get(uploadPath,
                    String.valueOf(today.getYear()),
                    String.valueOf(today.getMonthValue()),
                    String.valueOf(today.getDayOfMonth()));
            Files.createDirectories(dirPath);

            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf('.'));
            }
            String fileName = UUID.randomUUID() + ext;
            Path filePath = dirPath.resolve(fileName);
            file.transferTo(filePath.toFile());

            String relativePath = Paths.get(
                    String.valueOf(today.getYear()),
                    String.valueOf(today.getMonthValue()),
                    String.valueOf(today.getDayOfMonth()),
                    fileName).toString().replace("\\", "/");

            return RELATIVE_URL_PREFIX + relativePath;
        } catch (IOException e) {
            return null;
        }
    }

    @Operation(summary = "删除商品（逻辑删除）")
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        Long userId = (Long) RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        productService.delete(id, userId);
        return R.ok("删除成功", null);
    }

    @Operation(summary = "上/下架商品")
    @PutMapping("/{id}/status")
    public R<Void> changeStatus(@PathVariable Long id,
                                 @RequestParam Integer status) {
        Long userId = (Long) RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        productService.changeStatus(id, status, userId);
        return R.ok("操作成功",null);
    }

    @Operation(summary = "获取当前用户的商品")
    @GetMapping("/me/products")
    public R<List<ProductVO>> getMyProducts(@RequestParam(required = false) String status) {
        Long userId = (Long) RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        Integer statusCode = convertStatus(status);
        return R.ok(productService.getMyProducts(userId, statusCode));
    }

    /** 将前端传入的状态字符串转换为后端数字编码: available->0, sold->1, reserved->2 */
    private Integer convertStatus(String status) {
        if (status == null || status.isBlank()) return null;
        return switch (status.toLowerCase()) {
            case "available" -> 0;
            case "sold" -> 1;
            case "reserved" -> 2;
            default -> {
                try { yield Integer.parseInt(status); } catch (NumberFormatException e) { yield null; }
            }
        };
    }

    @Operation(summary = "获取当前用户的收藏列表")
    @GetMapping("/me/favorites")
    public R<List<ProductVO>> getMyFavorites() {
        Long userId = (Long) RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        return R.ok(productService.getMyFavorites(userId));
    }

    @Operation(summary = "收藏/取消收藏商品")
    @PostMapping("/{id}/favorite")
    public R<Boolean> toggleFavorite(@PathVariable Long id) {
        Long userId = (Long) RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        boolean favorited = productService.toggleFavorite(userId, id);
        return R.ok(favorited);
    }

    @Operation(summary = "取消收藏商品")
    @DeleteMapping("/{id}/favorite")
    public R<Void> removeFavorite(@PathVariable Long id) {
        Long userId = (Long) RequestContextHolder.getCurrentUserId();
        if (userId == null) userId = 1L;
        productService.toggleFavorite(userId, id);
        return R.ok();
    }
}
