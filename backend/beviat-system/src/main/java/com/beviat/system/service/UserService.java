package com.beviat.system.service;

import com.beviat.common.domain.User;
import com.beviat.system.dto.LoginDTO;
import com.beviat.system.dto.RegisterDTO;
import com.beviat.system.dto.TokenVO;
import com.beviat.system.dto.UserUpdateDTO;
import com.beviat.system.vo.UserVO;
import org.springframework.web.multipart.MultipartFile;

/**
 * 用户服务接口
 */
public interface UserService {

    /** 登录 */
    TokenVO login(LoginDTO dto);

    /** 注册 */
    void register(RegisterDTO dto);

    /** 获取当前登录用户信息 */
    UserVO getUserInfo(Long userId);

    /** 更新用户资料 */
    void updateUserInfo(Long userId, UserUpdateDTO dto);

    /** 刷新Token */
    TokenVO refreshToken(String refreshToken);

    /** 退出登录（将Token加入黑名单） */
    void logout(String accessToken);

    /** 根据ID获取用户实体（供其他模块关联查询使用） */
    User getById(Long userId);

    /** 上传用户头像，返回头像URL */
    String uploadAvatar(Long userId, MultipartFile file);
}
