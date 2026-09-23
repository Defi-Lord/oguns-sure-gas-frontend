import {
  api,
} from '@/lib/api/client';

import type {
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryInput,
  CreateProductInput,
  Product,
  ProductCategory,
  ProductImage,
  ProductImageDeleteResponse,
  ProductImageListResponse,
  ProductImageResponse,
  ProductListResponse,
  ProductManagementFilters,
  ProductResponse,
  UpdateCategoryInput,
  UpdateProductInput,
} from '@/types/product';


const buildManagementParams =
  (
    filters:
      ProductManagementFilters = {},
  ) => {
    if (!filters.branchId) {
      return undefined;
    }

    return {
      branchId:
        filters.branchId,
    };
  };


export const getManagementProducts =
  async (
    filters:
      ProductManagementFilters = {},
  ): Promise<Product[]> => {
    const response =
      await api.get<ProductListResponse>(
        '/products/management',
        {
          params:
            buildManagementParams(
              filters,
            ),
        },
      );

    return response.data.data.products;
  };


export const getManagementCategories =
  async (
    filters:
      ProductManagementFilters = {},
  ): Promise<ProductCategory[]> => {
    const response =
      await api.get<CategoryListResponse>(
        '/products/categories/management',
        {
          params:
            buildManagementParams(
              filters,
            ),
        },
      );

    return response.data.data.categories;
  };


export const createCategory =
  async (
    input:
      CreateCategoryInput,
  ): Promise<ProductCategory> => {
    const response =
      await api.post<CategoryResponse>(
        '/products/categories',
        input,
      );

    return response.data.data.category;
  };


export const updateCategory =
  async (
    categoryId: string,
    input:
      UpdateCategoryInput,
  ): Promise<ProductCategory> => {
    const response =
      await api.patch<CategoryResponse>(
        `/products/categories/${categoryId}`,
        input,
      );

    return response.data.data.category;
  };


export const createProduct =
  async (
    input:
      CreateProductInput,
  ): Promise<Product> => {
    const response =
      await api.post<ProductResponse>(
        '/products',
        input,
      );

    return response.data.data.product;
  };


export const updateProduct =
  async (
    productId: string,
    input:
      UpdateProductInput,
  ): Promise<Product> => {
    const response =
      await api.patch<ProductResponse>(
        `/products/${productId}`,
        input,
      );

    return response.data.data.product;
  };


/*
 * ============================================================
 * PRODUCT MEDIA
 * ============================================================
 */


export const getProductImages =
  async (
    productId: string,
  ): Promise<ProductImage[]> => {
    const response =
      await api.get<ProductImageListResponse>(
        `/products/${productId}/images`,
      );

    return response.data.data.images;
  };


export const uploadProductImages =
  async (
    productId: string,
    files: File[],
  ): Promise<ProductImage[]> => {
    const formData =
      new FormData();

    for (
      const file of files
    ) {
      formData.append(
        'images',
        file,
      );
    }

    const response =
      await api.post<ProductImageListResponse>(
        `/products/${productId}/images`,
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
          timeout: 120_000,
        },
      );

    return response.data.data.images;
  };


export const setPrimaryProductImage =
  async (
    productId: string,
    imageId: string,
  ): Promise<ProductImage> => {
    const response =
      await api.patch<ProductImageResponse>(
        `/products/${productId}/images/${imageId}/primary`,
      );

    return response.data.data.image;
  };


export const deleteProductImage =
  async (
    productId: string,
    imageId: string,
  ): Promise<{
    deletedImageId: string;
    promotedImageId: string | null;
  }> => {
    const response =
      await api.delete<ProductImageDeleteResponse>(
        `/products/${productId}/images/${imageId}`,
      );

    return response.data.data;
  };


export const reorderProductImages =
  async (
    productId: string,
    imageIds: string[],
  ): Promise<ProductImage[]> => {
    const response =
      await api.patch<ProductImageListResponse>(
        `/products/${productId}/images/order`,
        {
          imageIds,
        },
      );

    return response.data.data.images;
  };
