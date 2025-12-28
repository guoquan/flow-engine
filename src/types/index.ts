/**
 * Avatar Configuration Interface
 * 定义数字人的元数据结构，对应资源包中的 config.json
 */
export interface AvatarConfig {
  /** 唯一标识符 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 模型文件路径 (相对于 config.json 或绝对路径) */
  modelSrc: string;
  /** 缩放比例 (默认 1.0) */
  scale?: number;
  /** 初始位置 [x, y, z] */
  initialPosition?: [number, number, number];
  /** 版本号 */
  version?: string;
}
