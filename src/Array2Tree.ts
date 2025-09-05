// src/Array2Tree.ts
import { TreeNode } from './types';

export class Array2Tree {
  private myId: number = 0;

  /**
   * Convert array to tree structure with $children property
   * @param arrIn Array of objects with id and parent relationship
   * @param idKey Primary key field name
   * @param parentKey Foreign key field name that links to primary key
   * @param startWith Starting value for tree calculation
   * @param level Current level of tree structure
   * @returns Tree array with $children, $level, and $is_leaf properties
   * 
   * @example
   * const tree = new Array2Tree();
   * const result = tree.array2Tree(arr, "id", "parent_id", null);
   */
  array2Tree<T extends Record<string, any>>(
    arrIn: T[],
    idKey: string,
    parentKey: string,
    startWith: any = null,
    level: number = 1
  ): TreeNode<T>[] | undefined {
    const myLevel = level;
    
    const roots = arrIn.filter(x =>
      (x[parentKey] === startWith) ||
      (startWith == null && x[parentKey] == undefined) ||
      (startWith == undefined && x[parentKey] == null) ||
      (startWith == undefined && x[parentKey] == '')
    );

    if (roots && roots.length > 0) {
      roots.forEach(el => {
        (el as TreeNode<T>).$level = myLevel;
        (el as TreeNode<T>).$children = this.array2Tree(arrIn, idKey, parentKey, el[idKey], myLevel + 1) || [];
      });
      return roots as TreeNode<T>[];
    } else {
      const leafChildren = arrIn.find(x => x[idKey] === startWith);
      if (leafChildren) {
        (leafChildren as TreeNode<T>).$is_leaf = 1;
      }
      return undefined;
    }
  }

  /**
   * Create tree with Oracle-like sorting order
   * Returns tree order from root, branch, leaf
   * @param arrIn Input array with id and parent_id structure
   * @param idKey ID key field name
   * @param parentKey Parent key field name
   * @param startWith Starting value (optional)
   * @param level Tree depth (auto-generated, optional)
   * @param arrOut Output array (auto-generated)
   * @param parentIndex Parent index (auto-generated)
   * @returns New array sorted in tree order like Oracle's CONNECT BY
   * 
   * @example
   * const tree = new Array2Tree();
   * const result = tree.array2SortByTree(arr, "id", "parent_id", null);
   */
  array2SortByTree<T extends Record<string, any>>(
    arrIn: T[],
    idKey: string,
    parentKey: string,
    startWith: any = null,
    level: number = 1,
    arrOut: TreeNode<T>[] = [],
    parentIndex?: string
  ): TreeNode<T>[] {
    const arrReturns = arrOut;
    const myLevel = level;

    if (arrIn && arrIn.length >= arrReturns.length && idKey && parentKey) {
      const parents = arrIn.filter(obj =>
        (obj[parentKey] === startWith) ||
        (startWith == null && obj[parentKey] == undefined) ||
        (startWith == undefined && obj[parentKey] == null) ||
        (startWith == undefined && obj[parentKey] == '')
      );

      if (parents && parents.length > 0) {
        parents.forEach((el, idx) => {
          const node = el as TreeNode<T>;
          node.$level = myLevel;
          node.$index = idx + 1;
          node.$tree_index = (parentIndex ? parentIndex + '.' : '') + node.$index;
          arrReturns.push(node);
          
          this.array2SortByTree(arrIn, idKey, parentKey, el[idKey], myLevel + 1, arrReturns, node.$tree_index);
        });
      } else {
        // This is a leaf node
        const objCur = arrReturns.find(obj => (obj[idKey] === startWith));
        if (objCur) objCur.$is_leaf = 1;
      }
    }

    return arrReturns;
  }

  /**
   * Auto-sum weights (used for summing from child level to parent level in tree structure)
   * @param arrIn Array with id and parent structure
   * @param idKey Primary key field name
   * @param parentKey Parent key field name
   * @param weightKey Weight field name for summing from leaf to root
   * @param startWith Starting value for tree creation
   * @param level Starting level for tree
   * @param rootWeight Sum for root from leaf
   * @param arrOut Output array
   * @param parentIndex Output index like tree format 1.1.1, 1.2.1...
   * @returns New array sorted in tree order with weight calculations
   * 
   * @example
   * const tree = new Array2Tree();
   * const result = tree.array2SortAndWeight(arr, "id", "parent_id", "weight", null);
   */
  array2SortAndWeight<T extends Record<string, any>>(
    arrIn: T[],
    idKey: string,
    parentKey: string,
    weightKey: string,
    startWith: any = null,
    level: number = 1,
    rootWeight: number = 1,
    arrOut: TreeNode<T>[] = [],
    parentIndex?: string
  ): TreeNode<T>[] {
    const arrReturns = arrOut;
    const myLevel = level;

    if (arrIn && arrIn.length >= arrReturns.length) {
      const parents = arrIn.filter(obj =>
        (obj[parentKey] === startWith) ||
        (startWith == null && obj[parentKey] == undefined) ||
        (startWith == undefined && obj[parentKey] == null)
      );

      if (parents && parents.length > 0) {
        // Calculate sum of weights for same level
        const sumWeight = parents.reduce((sum, obj) => sum + (obj[weightKey] || 0), 0);
        
        parents.forEach((el, idx) => {
          const node = el as TreeNode<T>;
          
          // Record total weight of same level components
          node.$sum_weight = sumWeight;
          // Component weight percentage
          node.$weight_percent = (el[weightKey] || 0) / sumWeight;
          // Parent weight percentage
          node.$parent_weight_percent = rootWeight;
          // Root weight percentage
          node.$root_weight_percent = node.$parent_weight_percent * node.$weight_percent;
          
          node.$level = myLevel;
          node.$index = idx + 1;
          node.$tree_index = (parentIndex ? parentIndex + '.' : '') + node.$index;
          
          arrReturns.push(node);
          
          this.array2SortAndWeight(
            arrIn, idKey, parentKey, weightKey, el[idKey], 
            myLevel + 1, node.$root_weight_percent, arrReturns, node.$tree_index
          );
        });
      } else {
        // This is a leaf node
        const objCur = arrReturns.find(obj => (obj[idKey] === startWith));
        if (objCur) objCur.$is_leaf = 1;
      }
    }

    return arrReturns;
  }

  /**
   * Convert tree structure to flat array with parent-child relationship
   * @param treeIn Tree structure array
   * @param keyNameOfSubs Key name for children field (e.g., "subs" or "children")
   * @param parentValue Initial value for $parent_id field
   * @param level Starting level
   * @returns Flat array with $id and $parent_id fields
   * 
   * @example
   * const tree = new Array2Tree();
   * const result = tree.tree2Array(treeIn, "children");
   */
  tree2Array<T extends Record<string, any>>(
    treeIn: T[],
    keyNameOfSubs: string,
    parentValue: number | null = null,
    level: number = 1
  ): TreeNode<T>[] {
    const myLevel = level;
    let roots: TreeNode<T>[] = [];

    treeIn.forEach((el) => {
      const node = { ...el } as TreeNode<T>;
      node.$id = ++this.myId;
      node.$parent_id = parentValue;
      roots.push(node);
      
      if (el[keyNameOfSubs]) {
        const subs = JSON.parse(JSON.stringify(el[keyNameOfSubs]));
        delete node[keyNameOfSubs];
        const subTree = this.tree2Array(subs, keyNameOfSubs, this.myId, myLevel + 1);
        roots = roots.concat(subTree);
      }
    });

    return roots;
  }

  /**
   * Reset internal ID counter
   */
  resetIdCounter(): void {
    this.myId = 0;
  }
}