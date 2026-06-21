package com.beviat.system.service.impl;

import cn.hutool.core.lang.UUID;
import cn.hutool.crypto.digest.BCrypt;
import com.beviat.common.constant.Constants;
import com.beviat.common.domain.User;
import com.beviat.common.exception.BizException;
import com.beviat.common.util.JwtUtils;
import com.beviat.system.dto.*;
import com.beviat.system.mapper.UserMapper;
import com.beviat.system.service.UserService;
import com.beviat.system.vo.UserVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Random;
import java.util.Set;

/**
 * 用户服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final JwtUtils jwtUtils;
    private final StringRedisTemplate redisTemplate;

    @Value("${file.storage.local.path:./uploads}")
    private String uploadPath;

    @Value("${file.storage.local.url-prefix:http://localhost:8080/api/v1/files/}")
    private String urlPrefix;

    /** 图片访问的相对路径前缀（不含协议和域名，走前端代理） */
    private static final String RELATIVE_URL_PREFIX = "/api/v1/files/";

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("jpg", "jpeg", "png", "gif", "bmp", "webp");

    @Override
    public TokenVO login(LoginDTO dto) {
        // 1. 查询用户
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, dto.getUsername())
                        .eq(User::getDeleted, 0)
        );
        if (user == null || !BCrypt.checkpw(dto.getPassword(), user.getPassword())) {
            throw new BizException("用户名或密码错误");
        }

        // 2. 检查状态
        if (Constants.USER_STATUS_DISABLED == user.getStatus()) {
            throw new BizException("账号已被禁用，请联系管理员");
        }
        if (Constants.USER_STATUS_LOCKED == user.getStatus()) {
            throw new BizException("账号已被锁定，请联系管理员");
        }

        // 3. 生成Token
        String accessToken = jwtUtils.generateToken(user.getId(), user.getUsername(), Constants.ACCESS_TOKEN_EXPIRE);
        String refreshToken = jwtUtils.generateToken(user.getId(), user.getUsername(), Constants.REFRESH_TOKEN_EXPIRE);

        // 4. 存储RefreshToken到Redis
        redisTemplate.opsForValue().set(
                Constants.REDIS_TOKEN_PREFIX + "refresh:" + user.getId(),
                refreshToken,
                Duration.ofMillis(Constants.REFRESH_TOKEN_EXPIRE)
        );

        // 5. 更新登录信息
        user.setLastLoginTime(java.time.LocalDateTime.now());
        userMapper.updateById(user);

        log.info("用户登录成功: username={}, userId={}", dto.getUsername(), user.getId());
        return new TokenVO(accessToken, refreshToken);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void register(RegisterDTO dto) {
        // 1. 检查用户名是否已存在
        Long count = userMapper.selectCount(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                        .eq(User::getUsername, dto.getUsername())
                        .eq(User::getDeleted, 0)
        );
        if (count > 0) {
            throw new BizException("用户名已被注册");
        }

        // 2. 检查邮箱（如果提供了）
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            Long emailCount = userMapper.selectCount(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                            .eq(User::getEmail, dto.getEmail())
                            .eq(User::getDeleted, 0)
            );
            if (emailCount > 0) {
                throw new BizException("邮箱已被使用");
            }
        }

        // 3. 创建用户
        User user = new User();
        user.setUsername(dto.getUsername());
        // BCrypt加密存储
        user.setPassword(BCrypt.hashpw(dto.getPassword()));
        // 昵称为空时自动生成随机英文名
        user.setNickname(dto.getNickname() != null && !dto.getNickname().isBlank()
                ? dto.getNickname()
                : generateRandomNickname());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setStudentId(dto.getStudentId());
        user.setSchool(dto.getSchool());
        user.setStatus(Constants.USER_STATUS_NORMAL);
        user.setCreditScore(300); // 初始信用分

        userMapper.insert(user);
        log.info("用户注册成功: username={}, userId={}", dto.getUsername(), user.getId());
    }

    @Override
    public UserVO getUserInfo(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null || user.getDeleted() != null && user.getDeleted() == 1) {
            throw new BizException("用户不存在");
        }
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        // 将头像绝对路径转为相对路径，确保前端通过代理访问
        vo.setAvatar(normalizeImageUrl(vo.getAvatar()));
        return vo;
    }

    @Override
    public void updateUserInfo(Long userId, UserUpdateDTO dto) {
        User existing = userMapper.selectById(userId);
        if (existing == null) {
            throw new BizException("用户不存在");
        }

        BeanUtils.copyProperties(dto, existing);
        userMapper.updateById(existing);
    }

    @Override
    public TokenVO refreshToken(String refreshToken) {
        try {
            Long userId = jwtUtils.getUserId(refreshToken);
            // 验证Redis中是否存在该RefreshToken
            String storedToken = redisTemplate.opsForValue()
                    .get(Constants.REDIS_TOKEN_PREFIX + "refresh:" + userId);
            if (storedToken == null || !storedToken.equals(refreshToken)) {
                throw new BizException("RefreshToken无效或已过期，请重新登录");
            }

            User user = userMapper.selectById(userId);
            String newAccessToken = jwtUtils.generateToken(user.getId(), user.getUsername(), Constants.ACCESS_TOKEN_EXPIRE);
            return new TokenVO(newAccessToken, refreshToken);
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            throw new BizException("Token刷新失败，请重新登录");
        }
    }

    @Override
    public void logout(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) return;
        try {
            Long userId = jwtUtils.getUserId(accessToken);
            long remainingMs = jwtUtils.parseToken(accessToken).getExpiration().getTime()
                    - System.currentTimeMillis();
            if (remainingMs > 0) {
                // 将AccessToken加入黑名单（设置剩余过期时间）
                redisTemplate.opsForValue().set(
                        Constants.REDIS_BLACKLIST_PREFIX + accessToken,
                        "1",
                        Duration.ofMillis(remainingMs + 5000)
                );
            }
            // 删除RefreshToken
            redisTemplate.delete(Constants.REDIS_TOKEN_PREFIX + "refresh:" + userId);
            log.info("用户登出: userId={}", userId);
        } catch (Exception e) {
            log.warn("登出时处理Token异常: {}", e.getMessage());
        }
    }

    @Override
    public User getById(Long userId) {
        return userMapper.selectById(userId);
    }

    @Override
    public String forgotPassword(ForgotPasswordDTO dto) {
        // 1. 根据用户名查询用户
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, dto.getUsername())
                        .eq(User::getDeleted, 0)
        );
        if (user == null) {
            throw new BizException("用户名不存在");
        }

        // 2. 验证手机号是否匹配
        if (!dto.getPhone().equals(user.getPhone())) {
            throw new BizException("手机号与注册手机号不一致");
        }

        // 3. 验证验证码（暂固定为123456，待接入短信服务后改为从Redis中取）
        if (!"123456".equals(dto.getVerifyCode())) {
            throw new BizException("验证码错误");
        }

        // 4. 验证通过，生成重置凭证并存入Redis（5分钟有效）
        String resetToken = UUID.randomUUID().toString(true);
        redisTemplate.opsForValue().set(
                Constants.REDIS_RESET_TOKEN_PREFIX + resetToken,
                String.valueOf(user.getId()),
                Duration.ofMinutes(5)
        );

        log.info("忘记密码验证通过，已生成重置凭证: username={}", dto.getUsername());
        return resetToken;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(ResetPasswordDTO dto) {
        // 1. 验证重置凭证
        String userIdStr = redisTemplate.opsForValue().get(Constants.REDIS_RESET_TOKEN_PREFIX + dto.getResetToken());
        if (userIdStr == null) {
            throw new BizException("重置凭证无效或已过期，请重新验证");
        }

        Long userId = Long.valueOf(userIdStr);

        // 2. 查询用户
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BizException("用户不存在");
        }

        // 3. 更新密码（BCrypt加密）
        user.setPassword(BCrypt.hashpw(dto.getNewPassword()));
        userMapper.updateById(user);

        // 4. 删除已使用的重置凭证
        redisTemplate.delete(Constants.REDIS_RESET_TOKEN_PREFIX + dto.getResetToken());

        log.info("密码重置成功: userId={}", userId);
    }

    @Override
    public String uploadAvatar(Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new BizException("请选择要上传的头像文件");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new BizException("文件名不能为空");
        }

        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex < 0) {
            throw new BizException("无法识别的文件类型");
        }
        String ext = originalName.substring(dotIndex + 1).toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.contains(ext)) {
            throw new BizException("不支持的图片类型: " + ext);
        }

        // 限制文件大小 5MB
        long maxSize = 5L * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new BizException("头像文件大小不能超过5MB");
        }

        try {
            LocalDate today = LocalDate.now();
            Path dirPath = Paths.get(uploadPath,
                    String.valueOf(today.getYear()),
                    String.valueOf(today.getMonthValue()),
                    String.valueOf(today.getDayOfMonth())
            );
            Files.createDirectories(dirPath);

            String fileName = "avatar_" + userId + "_" + UUID.randomUUID() + "." + ext;
            Path filePath = dirPath.resolve(fileName);
            file.transferTo(filePath.toFile());

            String relativePath = Paths.get(
                    String.valueOf(today.getYear()),
                    String.valueOf(today.getMonthValue()),
                    String.valueOf(today.getDayOfMonth()),
                    fileName
            ).toString().replace("\\", "/");

            String avatarUrl = RELATIVE_URL_PREFIX + relativePath;
            log.info("用户头像上传成功: userId={}, path={}", userId, relativePath);
            return avatarUrl;
        } catch (IOException e) {
            log.error("头像上传失败: {}", e.getMessage(), e);
            throw new BizException("头像上传失败: " + e.getMessage());
        }
    }

    /** 将图片URL转为相对路径，确保前端通过代理访问 */
    private String normalizeImageUrl(String url) {
        if (url == null || url.isBlank()) return url;
        if (url.startsWith("/")) return url;
        int idx = url.indexOf("/api/v1/files/");
        if (idx >= 0) return url.substring(idx);
        try {
            java.net.URI uri = new java.net.URI(url);
            return uri.getPath();
        } catch (Exception e) {
            return url;
        }
    }

    private static final String ALPHA = "abcdefghijklmnopqrstuvwxyz";
    private static final String ALPHA_UPPER = ALPHA.toUpperCase();

    /** 生成全英文随机昵称，格式：User + 6位随机字母数字 */
    private String generateRandomNickname() {
        StringBuilder sb = new StringBuilder("User");
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            int type = random.nextInt(3);
            if (type == 0) {
                sb.append(ALPHA.charAt(random.nextInt(ALPHA.length())));
            } else if (type == 1) {
                sb.append(ALPHA_UPPER.charAt(random.nextInt(ALPHA_UPPER.length())));
            } else {
                sb.append(random.nextInt(10));
            }
        }
        return sb.toString();
    }
}
