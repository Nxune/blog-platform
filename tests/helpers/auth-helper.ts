/**
 * 认证测试辅助工具
 *
 * 提供获取测试 token、创建测试用户等辅助函数。
 * 待 API 就绪后实现具体逻辑。
 */

export class AuthHelper {
  /**
   * 注册并登录测试用户，返回 JWT token
   */
  static async getToken(user: { username: string; email: string; password: string }): Promise<string> {
    // TODO: 实现 - 先注册，再登录获取 token
    return 'test-token-placeholder';
  }

  /**
   * 创建认证请求头
   */
  static authHeader(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * 获取管理员 token
   */
  static async getAdminToken(): Promise<string> {
    // TODO: 实现
    return 'admin-token-placeholder';
  }

  /**
   * 清理测试用户
   */
  static async cleanupUsers(): Promise<void> {
    // TODO: 实现
  }
}
