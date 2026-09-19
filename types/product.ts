export type ProductType =
  | 'GAS'
  | 'ENGINE_OIL'
  | 'BRAKE_OIL'
  | 'CYLINDER'
  | 'OTHER';


export interface ProductBranchSummary {
  id: string;
  name: string;
  code: string;
}


export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  storageKey: string | null;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}


export interface ProductCategorySummary {
  id: string;
  branchId: string;
  name: string;
}


export interface ProductCategory {
  id: string;
  branchId: string;
  name: string;
  description: string | null;
  isActive: boolean;

  branch: ProductBranchSummary;

  createdAt: string;
  updatedAt: string;
}


export interface Product {
  id: string;

  branchId: string;

  name: string;
  description: string | null;

  type: ProductType;
  sku: string;
  unit: string;

  pricePerUnit: number;

  isActive: boolean;

  categoryId: string;

  branch: ProductBranchSummary;
  category: ProductCategorySummary;

  images: ProductImage[];

  createdAt: string;
  updatedAt: string;
}


export interface ProductManagementFilters {
  branchId?: string;
}


export interface CreateCategoryInput {
  branchId?: string;
  name: string;
  description?: string;
}


export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}


export interface CreateProductInput {
  branchId?: string;

  name: string;
  description?: string;

  type: ProductType;

  sku: string;
  unit: string;

  pricePerUnit: number;

  categoryId: string;

  isActive?: boolean;
}


export interface UpdateProductInput {
  name?: string;
  description?: string | null;

  type?: ProductType;

  sku?: string;
  unit?: string;

  pricePerUnit?: number;

  categoryId?: string;

  isActive?: boolean;
}


export interface ProductListResponse {
  success: true;
  message: string;

  data: {
    products: Product[];
  };
}


export interface ProductResponse {
  success: true;
  message: string;

  data: {
    product: Product;
  };
}


export interface CategoryListResponse {
  success: true;
  message: string;

  data: {
    categories: ProductCategory[];
  };
}


export interface CategoryResponse {
  success: true;
  message: string;

  data: {
    category: ProductCategory;
  };
}


export interface ProductImageListResponse {
  success: true;
  message: string;

  data: {
    images: ProductImage[];
  };
}


export interface ProductImageResponse {
  success: true;
  message: string;

  data: {
    image: ProductImage;
  };
}


export interface ProductImageDeleteResponse {
  success: true;
  message: string;

  data: {
    deletedImageId: string;
    promotedImageId: string | null;
  };
}
