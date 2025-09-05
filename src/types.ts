// src/types.ts
export interface TreeNode<T = any> extends Record<string, any> {
  $children?: TreeNode<T>[];
  $level?: number;
  $index?: number;
  $tree_index?: string;
  $is_leaf?: number;
  $sum_weight?: number;
  $weight_percent?: number;
  $parent_weight_percent?: number;
  $root_weight_percent?: number;
  $id?: number;
  $parent_id?: number | null;
}

export interface TreeOptions {
  idKey: string;
  parentKey: string;
  startWith?: any;
  level?: number;
}

export interface WeightOptions extends TreeOptions {
  weightKey: string;
}



