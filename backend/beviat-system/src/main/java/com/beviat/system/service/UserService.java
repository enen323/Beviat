package com.beviat.system.service;

import com.beviat.common.domain.User;
import com.beviat.system.dto.*;
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

    /** 忘记密码：验证用户身份，返回重置凭证 */
    String forgotPassword(ForgotPasswordDTO dto);

    /** 重置密码：通过重置凭证设置新密码 */
    void resetPassword(ResetPasswordDTO dto);
}
